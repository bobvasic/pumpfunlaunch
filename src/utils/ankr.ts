// Ankr RPC Utilities for Solana
// Documentation: https://www.ankr.com/docs/rpc-service/chains/chains-list/solana/

import { Connection, PublicKey, Commitment } from '@solana/web3.js'

// Ankr API Key - MUST be set in environment variables
// Get your own at: https://www.ankr.com/rpc/
const ANKR_API_KEY = import.meta.env.VITE_ANKR_API_KEY

if (!ANKR_API_KEY) {
  console.warn('⚠️  VITE_ANKR_API_KEY not set. Using public Solana RPC.')
}

// Build Ankr Solana RPC Endpoint (fallback to public RPC if no API key)
export const ANKR_RPC_URL = ANKR_API_KEY 
  ? `https://rpc.ankr.com/solana/${ANKR_API_KEY}`
  : 'https://api.mainnet-beta.solana.com'

// Alias for compatibility
export const ANKR_SOLANA_RPC = ANKR_RPC_URL

// Create connection with Ankr RPC
export function createAnkrConnection(commitment: Commitment = 'confirmed'): Connection {
  return new Connection(ANKR_RPC_URL, {
    commitment,
    wsEndpoint: undefined, // Ankr doesn't support WebSocket on free tier
    httpHeaders: {
      'Content-Type': 'application/json',
    },
  })
}

// Ankr Advanced APIs - Batch requests for better performance
export interface BatchRequest {
  method: string
  params?: any[]
}

export interface BatchResponse {
  result?: any
  error?: {
    code: number
    message: string
  }
}

// Send batch RPC request to Ankr
export async function sendBatchRequest(
  requests: BatchRequest[]
): Promise<BatchResponse[]> {
  const response = await fetch(ANKR_RPC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      requests.map((req, index) => ({
        jsonrpc: '2.0',
        id: index,
        method: req.method,
        params: req.params || [],
      }))
    ),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return await response.json()
}

// Get multiple account infos in one batch request (saves RPC calls)
export async function getMultipleAccounts(
  addresses: PublicKey[]
): Promise<(Buffer | null)[]> {
  const requests: BatchRequest[] = addresses.map((addr) => ({
    method: 'getAccountInfo',
    params: [addr.toBase58(), { encoding: 'base64' }],
  }))

  const responses = await sendBatchRequest(requests)

  return responses.map((res) => {
    if (res.error || !res.result?.value?.data) {
      return null
    }
    return Buffer.from(res.result.value.data[0], 'base64')
  })
}

// Get token accounts by owner in batch
export async function getTokenAccountsByOwner(
  owner: PublicKey,
  programId: PublicKey
): Promise<
  {
    pubkey: PublicKey
    account: {
      data: Buffer
      executable: boolean
      lamports: number
      owner: PublicKey
    }
  }[]
> {
  const response = await fetch(ANKR_RPC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getTokenAccountsByOwner',
      params: [
        owner.toBase58(),
        { programId: programId.toBase58() },
        { encoding: 'base64' },
      ],
    }),
  })

  const data = await response.json()

  if (data.error) {
    throw new Error(data.error.message)
  }

  return data.result.value.map((item: any) => ({
    pubkey: new PublicKey(item.pubkey),
    account: {
      data: Buffer.from(item.account.data[0], 'base64'),
      executable: item.account.executable,
      lamports: item.account.lamports,
      owner: new PublicKey(item.account.owner),
    },
  }))
}

// Get transaction history with Ankr's enhanced API
export async function getTransactionHistory(
  address: PublicKey,
  limit: number = 10,
  before?: string
): Promise<any[]> {
  const params: any[] = [address.toBase58()]
  
  const options: any = { limit }
  if (before) {
    options.before = before
  }
  params.push(options)

  const response = await fetch(ANKR_RPC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getSignaturesForAddress',
      params,
    }),
  })

  const data = await response.json()

  if (data.error) {
    throw new Error(data.error.message)
  }

  return data.result
}

// Get token balances for multiple tokens in one call
export async function getTokenBalances(
  walletAddress: PublicKey,
  tokenMints: PublicKey[]
): Promise<{ mint: string; balance: bigint }[]> {
  const tokenAccounts = await Promise.all(
    tokenMints.map(async (mint) => {
      try {
        const { getAssociatedTokenAddress } = await import('@solana/spl-token')
        const ata = await getAssociatedTokenAddress(mint, walletAddress)
        return { mint: mint.toBase58(), ata: ata.toBase58() }
      } catch {
        return null
      }
    })
  )

  const validAccounts = tokenAccounts.filter((acc): acc is { mint: string; ata: string } => acc !== null)

  // Batch request for all token accounts
  const requests: BatchRequest[] = validAccounts.map((acc) => ({
    method: 'getTokenAccountBalance',
    params: [acc.ata],
  }))

  const responses = await sendBatchRequest(requests)

  return responses.map((res, index) => ({
    mint: validAccounts[index].mint,
    balance: res.result?.value?.amount ? BigInt(res.result.value.amount) : BigInt(0),
  }))
}

// Check Ankr RPC health/status
export async function checkAnkrHealth(): Promise<{
  healthy: boolean
  blockHeight?: number
  blockTime?: number
}> {
  try {
    const response = await fetch(ANKR_RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getHealth',
      }),
    })

    const health = await response.json()

    const slotResponse = await fetch(ANKR_RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBlockHeight',
      }),
    })

    const slotData = await slotResponse.json()

    return {
      healthy: health.result === 'ok',
      blockHeight: slotData.result,
    }
  } catch (error) {
    console.error('Ankr health check failed:', error)
    return { healthy: false }
  }
}

// Rate limit info (Ankr free tier: ~1M requests/day)
export const ANKR_RATE_LIMITS = {
  freeTier: {
    requestsPerDay: 1_000_000,
    requestsPerSecond: 30,
    connections: 10,
  },
  paidTier: {
    requestsPerDay: 'Unlimited',
    requestsPerSecond: 1000,
    connections: 100,
  },
}

// Connection pool for better performance
class AnkrConnectionPool {
  private connections: Connection[] = []
  private currentIndex = 0
  private maxConnections: number

  constructor(maxConnections: number = 3) {
    this.maxConnections = maxConnections
    this.initializeConnections()
  }

  private initializeConnections() {
    for (let i = 0; i < this.maxConnections; i++) {
      this.connections.push(createAnkrConnection())
    }
  }

  getConnection(): Connection {
    const connection = this.connections[this.currentIndex]
    this.currentIndex = (this.currentIndex + 1) % this.maxConnections
    return connection
  }

  async getHealth(): Promise<boolean[]> {
    return Promise.all(
      this.connections.map(async (conn) => {
        try {
          await conn.getVersion()
          return true
        } catch {
          return false
        }
      })
    )
  }
}

export const ankrConnectionPool = new AnkrConnectionPool()
