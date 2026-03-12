/**
 * API Client for Python Backend
 * Communicates with the FastAPI server using Ankr SDK
 */

import axios, { AxiosInstance, AxiosError } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

console.log('[API Client] Base URL:', API_BASE_URL)

class ApiClient {
  private client: AxiosInstance

  constructor() {
    console.log('[API Client] Initializing with baseURL:', API_BASE_URL)
    
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // Reduced timeout for faster failure detection
    })

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        console.error('[API Request Error]', error)
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[API Response] ${response.status} ${response.config.url}`)
        return response
      },
      (error: AxiosError) => {
        console.error('[API Error]', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          data: error.response?.data,
        })
        return Promise.reject(error)
      }
    )
  }

  // Health check
  async healthCheck() {
    try {
      console.log('[API] Checking health at:', API_BASE_URL + '/health')
      const response = await this.client.get('/health')
      console.log('[API] Health check success:', response.data)
      return response.data
    } catch (error) {
      console.error('[API] Health check failed:', error)
      throw error
    }
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
  async getTransactionHistory(address: string, limit: number = 10, before?: string) {
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

  // Prepare token creation
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
