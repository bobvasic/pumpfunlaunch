import { useState, useCallback } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Transaction, PublicKey } from '@solana/web3.js'
import toast from 'react-hot-toast'
import {
  createLiquidityPoolInstructions,
  addLiquidityInstructions,
  removeLiquidityInstructions,
  swapSOLForTokensInstructions,
  swapTokensForSOLInstructions,
  getLPTokenBalance,
  getPoolReserves,
  LPCreationParams,
  LPWithdrawParams,
  LPSwapParams,
} from '../utils/swapPump'

export function useSwapPump() {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()
  
  const [creatingLP, setCreatingLP] = useState(false)
  const [addingLiquidity, setAddingLiquidity] = useState(false)
  const [removingLiquidity, setRemovingLiquidity] = useState(false)
  const [swapping, setSwapping] = useState(false)

  // Create new liquidity pool
  const createLiquidityPool = useCallback(async (
    tokenMint: PublicKey,
    solAmount: number,
    tokenAmount: number
  ) => {
    if (!publicKey || !sendTransaction) {
      toast.error('Please connect your wallet')
      return null
    }

    setCreatingLP(true)
    const toastId = toast.loading('Creating liquidity pool...')

    try {
      const params: LPCreationParams = {
        tokenMint,
        solAmount,
        tokenAmount,
        creator: publicKey,
      }

      const { transaction, ephemeralKeypair } = await createLiquidityPoolInstructions(
        connection,
        params
      )

      toast.loading('Confirming transaction...', { id: toastId })
      
      const signature = await sendTransaction(
        transaction,
        connection,
        ephemeralKeypair ? { signers: [ephemeralKeypair] } : undefined
      )

      await connection.confirmTransaction(signature, 'confirmed')

      toast.success('Liquidity pool created successfully!', { id: toastId })
      return signature
    } catch (error: any) {
      console.error('Error creating LP:', error)
      toast.error(error.message || 'Failed to create liquidity pool', { id: toastId })
      return null
    } finally {
      setCreatingLP(false)
    }
  }, [publicKey, sendTransaction, connection])

  // Add liquidity to existing pool
  const addLiquidity = useCallback(async (
    tokenMint: PublicKey,
    solAmount: number,
    tokenAmount: number
  ) => {
    if (!publicKey || !sendTransaction) {
      toast.error('Please connect your wallet')
      return null
    }

    setAddingLiquidity(true)
    const toastId = toast.loading('Adding liquidity...')

    try {
      const params: LPCreationParams = {
        tokenMint,
        solAmount,
        tokenAmount,
        creator: publicKey,
      }

      const { transaction, ephemeralKeypair } = await addLiquidityInstructions(
        connection,
        params
      )

      const signature = await sendTransaction(
        transaction,
        connection,
        ephemeralKeypair ? { signers: [ephemeralKeypair] } : undefined
      )

      await connection.confirmTransaction(signature, 'confirmed')

      toast.success('Liquidity added successfully!', { id: toastId })
      return signature
    } catch (error: any) {
      console.error('Error adding liquidity:', error)
      toast.error(error.message || 'Failed to add liquidity', { id: toastId })
      return null
    } finally {
      setAddingLiquidity(false)
    }
  }, [publicKey, sendTransaction, connection])

  // Remove liquidity (withdraw all LP)
  const removeLiquidity = useCallback(async (
    tokenMint: PublicKey,
    lpAmount: number,
    minSolOutput: number,
    minTokenOutput: number
  ) => {
    if (!publicKey || !sendTransaction) {
      toast.error('Please connect your wallet')
      return null
    }

    setRemovingLiquidity(true)
    const toastId = toast.loading('Withdrawing liquidity...')

    try {
      const params: LPWithdrawParams = {
        tokenMint,
        lpAmount,
        minSolOutput,
        minTokenOutput,
        creator: publicKey,
      }

      const { transaction } = await removeLiquidityInstructions(connection, params)

      const signature = await sendTransaction(transaction, connection)
      await connection.confirmTransaction(signature, 'confirmed')

      toast.success('Liquidity withdrawn successfully!', { id: toastId })
      return signature
    } catch (error: any) {
      console.error('Error removing liquidity:', error)
      toast.error(error.message || 'Failed to withdraw liquidity', { id: toastId })
      return null
    } finally {
      setRemovingLiquidity(false)
    }
  }, [publicKey, sendTransaction, connection])

  // Withdraw all LP tokens
  const withdrawAllLP = useCallback(async (tokenMint: PublicKey) => {
    if (!publicKey) {
      toast.error('Please connect your wallet')
      return null
    }

    // Get LP balance
    const lpBalance = await getLPTokenBalance(connection, tokenMint, publicKey)
    
    if (lpBalance === BigInt(0)) {
      toast.error('No LP tokens found')
      return null
    }

    // Get pool reserves to calculate minimum output
    const reserves = await getPoolReserves(connection, tokenMint)
    
    // Calculate expected outputs (with 5% slippage tolerance)
    const lpAmount = Number(lpBalance)
    const totalSupply = Number(reserves?.totalLPSupply || BigInt(1))
    const share = lpAmount / totalSupply
    
    const minSolOutput = (reserves?.solReserve || 0) * share * 0.95
    const minTokenOutput = (reserves?.tokenReserve || 0) * share * 0.95

    return removeLiquidity(
      tokenMint,
      lpAmount,
      minSolOutput,
      minTokenOutput
    )
  }, [publicKey, connection, removeLiquidity])

  // Buy tokens with SOL
  const buyTokens = useCallback(async (
    tokenMint: PublicKey,
    solAmount: number,
    slippage: number = 1
  ) => {
    if (!publicKey || !sendTransaction) {
      toast.error('Please connect your wallet')
      return null
    }

    setSwapping(true)
    const toastId = toast.loading('Swapping SOL for tokens...')

    try {
      const params: LPSwapParams = {
        tokenMint,
        solAmount,
        isBuy: true,
        slippage,
        user: publicKey,
      }

      const { transaction, ephemeralKeypair } = await swapSOLForTokensInstructions(
        connection,
        params
      )

      const signature = await sendTransaction(transaction, connection, {
        signers: [ephemeralKeypair],
      })

      await connection.confirmTransaction(signature, 'confirmed')

      toast.success('Swap completed successfully!', { id: toastId })
      return signature
    } catch (error: any) {
      console.error('Error swapping:', error)
      toast.error(error.message || 'Failed to swap', { id: toastId })
      return null
    } finally {
      setSwapping(false)
    }
  }, [publicKey, sendTransaction, connection])

  // Sell tokens for SOL
  const sellTokens = useCallback(async (
    tokenMint: PublicKey,
    tokenAmount: number,
    slippage: number = 1
  ) => {
    if (!publicKey || !sendTransaction) {
      toast.error('Please connect your wallet')
      return null
    }

    setSwapping(true)
    const toastId = toast.loading('Swapping tokens for SOL...')

    try {
      const params: LPSwapParams = {
        tokenMint,
        tokenAmount,
        isBuy: false,
        slippage,
        user: publicKey,
      }

      const { transaction, ephemeralKeypair } = await swapTokensForSOLInstructions(
        connection,
        params
      )

      const signature = await sendTransaction(transaction, connection, {
        signers: [ephemeralKeypair],
      })

      await connection.confirmTransaction(signature, 'confirmed')

      toast.success('Swap completed successfully!', { id: toastId })
      return signature
    } catch (error: any) {
      console.error('Error swapping:', error)
      toast.error(error.message || 'Failed to swap', { id: toastId })
      return null
    } finally {
      setSwapping(false)
    }
  }, [publicKey, sendTransaction, connection])

  // Get user's LP balance for a pool
  const getUserLPBalance = useCallback(async (tokenMint: PublicKey): Promise<bigint> => {
    if (!publicKey) return BigInt(0)
    return getLPTokenBalance(connection, tokenMint, publicKey)
  }, [connection, publicKey])

  // Get pool info
  const getPoolInfo = useCallback(async (tokenMint: PublicKey) => {
    return getPoolReserves(connection, tokenMint)
  }, [connection])

  return {
    creatingLP,
    addingLiquidity,
    removingLiquidity,
    swapping,
    createLiquidityPool,
    addLiquidity,
    removeLiquidity,
    withdrawAllLP,
    buyTokens,
    sellTokens,
    getUserLPBalance,
    getPoolInfo,
  }
}
