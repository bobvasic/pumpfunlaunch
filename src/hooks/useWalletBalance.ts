import { useState, useEffect, useCallback } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token'

export interface TokenBalance {
  mint: string
  symbol: string
  decimals: number
  balance: number
  uiBalance: string
}

export function useWalletBalance() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const [solBalance, setSolBalance] = useState<number>(0)
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([])
  const [loading, setLoading] = useState(false)

  const fetchBalances = useCallback(async () => {
    if (!publicKey) {
      setSolBalance(0)
      setTokenBalances([])
      return
    }

    setLoading(true)
    try {
      // Fetch SOL balance
      const balance = await connection.getBalance(publicKey)
      setSolBalance(balance / LAMPORTS_PER_SOL)

      // Fetch token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
      )

      const balances: TokenBalance[] = tokenAccounts.value
        .map((account) => {
          const parsedInfo = account.account.data.parsed.info
          const mint = parsedInfo.mint
          const balance = parsedInfo.tokenAmount.uiAmount
          const decimals = parsedInfo.tokenAmount.decimals
          
          return {
            mint,
            symbol: '', // Would need token metadata
            decimals,
            balance: Number(parsedInfo.tokenAmount.amount),
            uiBalance: balance?.toFixed(decimals) || '0',
          }
        })
        .filter((t) => t.balance > 0)

      setTokenBalances(balances)
    } catch (error) {
      console.error('Error fetching balances:', error)
    } finally {
      setLoading(false)
    }
  }, [connection, publicKey])

  const getTokenBalance = useCallback(async (mint: PublicKey): Promise<number> => {
    if (!publicKey) return 0
    
    try {
      const associatedAccount = await getAssociatedTokenAddress(mint, publicKey)
      const account = await getAccount(connection, associatedAccount)
      return Number(account.amount)
    } catch (error) {
      return 0
    }
  }, [connection, publicKey])

  useEffect(() => {
    fetchBalances()
    
    // Set up interval to refresh every 10 seconds
    const interval = setInterval(fetchBalances, 10000)
    return () => clearInterval(interval)
  }, [fetchBalances])

  return {
    solBalance,
    tokenBalances,
    loading,
    refresh: fetchBalances,
    getTokenBalance,
  }
}
