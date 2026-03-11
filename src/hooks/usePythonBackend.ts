import { useState, useCallback, useEffect } from 'react'
import { apiClient } from '../utils/apiClient'

export interface BackendHealth {
  status: string
  ankr_sdk_ready: boolean
  rpc_endpoint: string
  block_height?: number
  latency_ms?: number
}

export interface TokenPrice {
  usdPrice?: number
  tokenName?: string
  tokenSymbol?: string
  tokenDecimal?: number
  tokenType?: string
  contractAddress?: string
}

export function usePythonBackend() {
  const [health, setHealth] = useState<BackendHealth | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [backendAvailable, setBackendAvailable] = useState(false)

  // Check backend health
  const checkHealth = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiClient.healthCheck()
      setHealth(data)
      setBackendAvailable(true)
      setError(null)
      return data
    } catch (err: any) {
      setBackendAvailable(false)
      setError('Python backend not available. Is it running on port 8000?')
      console.error('Backend health check failed:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Get token balances via Python backend
  const getTokenBalances = useCallback(
    async (walletAddress: string, tokenMints: string[]) => {
      try {
        setLoading(true)
        const data = await apiClient.getTokenBalances(walletAddress, tokenMints)
        return data.balances
      } catch (err: any) {
        setError(err.message || 'Failed to fetch token balances')
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Get transaction history via Python backend
  const getTransactionHistory = useCallback(
    async (address: string, limit: number = 10, before?: string) => {
      try {
        setLoading(true)
        const data = await apiClient.getTransactionHistory(address, limit, before)
        return data.transactions
      } catch (err: any) {
        setError(err.message || 'Failed to fetch transaction history')
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Get multiple accounts via Python backend
  const getAccountsBatch = useCallback(async (addresses: string[]) => {
    try {
      setLoading(true)
      const data = await apiClient.getAccountsBatch(addresses)
      return data.accounts
    } catch (err: any) {
      setError(err.message || 'Failed to fetch accounts')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Get blockchain info via Python backend
  const getBlockchainInfo = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiClient.getBlockchainInfo()
      return data.info
    } catch (err: any) {
      setError(err.message || 'Failed to fetch blockchain info')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Get token holders via Python backend
  const getTokenHolders = useCallback(
    async (mintAddress: string, limit: number = 100) => {
      try {
        setLoading(true)
        const data = await apiClient.getTokenHolders(mintAddress, limit)
        return data.holders
      } catch (err: any) {
        setError(err.message || 'Failed to fetch token holders')
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Get token price via Python backend
  const getTokenPrice = useCallback(async (mintAddress: string) => {
    try {
      setLoading(true)
      const data = await apiClient.getTokenPrice(mintAddress)
      return data.price as TokenPrice
    } catch (err: any) {
      setError(err.message || 'Failed to fetch token price')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Generic RPC call via Python backend
  const rpcCall = useCallback(async (method: string, params: any[] = []) => {
    try {
      setLoading(true)
      const data = await apiClient.rpcCall(method, params)
      return data.result
    } catch (err: any) {
      setError(err.message || 'RPC call failed')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Prepare token creation via Python backend
  const prepareTokenCreation = useCallback(
    async (
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
    ) => {
      try {
        setLoading(true)
        const data = await apiClient.createToken(
          metadata,
          creatorWallet,
          initialBuyAmount
        )
        return data
      } catch (err: any) {
        setError(err.message || 'Failed to prepare token creation')
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Check health on mount
  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [checkHealth])

  return {
    health,
    loading,
    error,
    backendAvailable,
    checkHealth,
    getTokenBalances,
    getTransactionHistory,
    getAccountsBatch,
    getBlockchainInfo,
    getTokenHolders,
    getTokenPrice,
    rpcCall,
    prepareTokenCreation,
  }
}
