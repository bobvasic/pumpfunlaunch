/**
 * API Client for Python Backend
 * Communicates with the FastAPI server using Ankr SDK
 */

import axios, { AxiosInstance, AxiosError } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('[API Error]', error.response?.data || error.message)
        return Promise.reject(error)
      }
    )
  }

  // Health check
  async healthCheck() {
    const response = await this.client.get('/health')
    return response.data
  }

  // Generic RPC call through Python backend
  async rpcCall(method: string, params: any[] = []) {
    const response = await this.client.post('/rpc/call', {
      method,
      params,
    })
    return response.data
  }

  // Get multiple accounts in batch
  async getAccountsBatch(addresses: string[]) {
    const response = await this.client.post('/accounts/batch', {
      addresses,
    })
    return response.data
  }

  // Get token balances
  async getTokenBalances(walletAddress: string, tokenMints: string[]) {
    const response = await this.client.post('/token/balances', {
      wallet_address: walletAddress,
      token_mints: tokenMints,
    })
    return response.data
  }

  // Get transaction history
  async getTransactionHistory(
    address: string,
    limit: number = 10,
    before?: string
  ) {
    const response = await this.client.post('/transactions/history', {
      address,
      limit,
      before,
    })
    return response.data
  }

  // Get blockchain info
  async getBlockchainInfo() {
    const response = await this.client.get('/blockchain/info')
    return response.data
  }

  // Get token holders
  async getTokenHolders(mintAddress: string, limit: number = 100) {
    const response = await this.client.get(`/token/holders/${mintAddress}`, {
      params: { limit },
    })
    return response.data
  }

  // Get token price
  async getTokenPrice(mintAddress: string) {
    const response = await this.client.get(`/token/price/${mintAddress}`)
    return response.data
  }

  // Create token (prepare transaction)
  async createToken(
    metadata: {
      name: string
      symbol: string
      description: string
      image?: string
      twitter?: string
      telegram?: string
      website?: string
    },
    creatorWallet: string,
    initialBuyAmount: number = 0
  ) {
    const response = await this.client.post('/token/create', {
      metadata,
      creator_wallet: creatorWallet,
      initial_buy_amount: initialBuyAmount,
    })
    return response.data
  }
}

export const apiClient = new ApiClient()
export default apiClient
