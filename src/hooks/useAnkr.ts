import { useState, useCallback, useEffect } from 'react'
import { PublicKey } from '@solana/web3.js'
import {
  createAnkrConnection,
  getMultipleAccounts,
  getTokenAccountsByOwner,
  getTransactionHistory,
  getTokenBalances,
  checkAnkrHealth,
  ANKR_RPC_URL,
} from '../utils/ankr'

export interface AnkrStatus {
  healthy: boolean
  blockHeight?: number
  latency?: number
}

export function useAnkr() {
  const [status, setStatus] = useState<AnkrStatus>({ healthy: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connection = createAnkrConnection()

  // Check Ankr RPC health
  const checkHealth = useCallback(async () => {
    setLoading(true)
    setError(null)
    const startTime = Date.now()

    try {
      const result = await checkAnkrHealth()
      const latency = Date.now() - startTime
      setStatus({ ...result, latency })
      return result.healthy
    } catch (err: any) {
      setError(err.message || 'Health check failed')
      setStatus({ healthy: false })
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Get multiple accounts in batch
  const fetchMultipleAccounts = useCallback(async (addresses: PublicKey[]) => {
    setLoading(true)
    setError(null)

    try {
      const accounts = await getMultipleAccounts(addresses)
      return accounts
    } catch (err: any) {
      setError(err.message || 'Failed to fetch accounts')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Get token accounts for wallet
  const fetchTokenAccounts = useCallback(async (owner: PublicKey, programId: PublicKey) => {
    setLoading(true)
    setError(null)

    try {
      const accounts = await getTokenAccountsByOwner(owner, programId)
      return accounts
    } catch (err: any) {
      setError(err.message || 'Failed to fetch token accounts')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Get transaction history
  const fetchTransactionHistory = useCallback(
    async (address: PublicKey, limit: number = 10, before?: string) => {
      setLoading(true)
      setError(null)

      try {
        const history = await getTransactionHistory(address, limit, before)
        return history
      } catch (err: any) {
        setError(err.message || 'Failed to fetch transaction history')
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Get token balances
  const fetchTokenBalances = useCallback(async (walletAddress: PublicKey, tokenMints: PublicKey[]) => {
    setLoading(true)
    setError(null)

    try {
      const balances = await getTokenBalances(walletAddress, tokenMints)
      return balances
    } catch (err: any) {
      setError(err.message || 'Failed to fetch token balances')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Check health on mount
  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [checkHealth])

  return {
    connection,
    rpcUrl: ANKR_RPC_URL,
    status,
    loading,
    error,
    checkHealth,
    fetchMultipleAccounts,
    fetchTokenAccounts,
    fetchTransactionHistory,
    fetchTokenBalances,
  }
}
