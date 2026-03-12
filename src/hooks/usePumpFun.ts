import { useState, useCallback } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Keypair, Transaction, PublicKey, LAMPORTS_PER_SOL, SystemProgram, TransactionInstruction } from '@solana/web3.js'
import toast from 'react-hot-toast'
import BN from 'bn.js'
import {
  createInitializeMintInstruction,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createMintToInstruction,
} from '@solana/spl-token'
import {
  buyTokenInstruction,
  sellTokenInstruction,
  getBondingCurveData,
  getBondingCurvePDA,
  getAssociatedBondingCurvePDA,
  BuyTokenParams,
  SellTokenParams,
  PUMP_FUN_PROGRAM,
  GLOBAL_ACCOUNT,
  PUMP_FUN_ACCOUNT,
} from '../utils/pumpfun'
import { uploadTokenMetadata, TokenMetadata, validateMetadata } from '../utils/metadata'

export { type TokenMetadata }

export interface TokenCreationResult {
  mint: string
  signature: string
  name: string
  symbol: string
  bondingCurve: string
}

export function usePumpFun() {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()
  const [creating, setCreating] = useState(false)
  const [buying, setBuying] = useState(false)
  const [selling, setSelling] = useState(false)

  // Create a new token on pump.fun
  const createToken = useCallback(async (
    metadata: TokenMetadata,
    initialBuyAmount?: number
  ): Promise<TokenCreationResult | null> => {
    if (!publicKey || !sendTransaction) {
      toast.error('Please connect your wallet')
      return null
    }

    // Validate metadata
    const validationError = validateMetadata(metadata)
    if (validationError) {
      toast.error(validationError)
      return null
    }

    setCreating(true)
    const toastId = toast.loading('Preparing token creation...')

    try {
      // Step 1: Upload metadata
      toast.loading('Uploading metadata to Arweave...', { id: toastId })
      const { metadataUri } = await uploadTokenMetadata(metadata)
      console.log('Metadata uploaded:', metadataUri)

      // Step 2: Generate mint keypair
      const mintKeypair = Keypair.generate()
      const mint = mintKeypair.publicKey
      
      // Get bonding curve PDAs
      const [bondingCurve] = getBondingCurvePDA(mint)
      const [associatedBondingCurve] = getAssociatedBondingCurvePDA(bondingCurve, mint)
      const [globalAccount] = await PublicKey.findProgramAddressSync(
        [Buffer.from('global')],
        PUMP_FUN_PROGRAM
      )

      // Step 3: Create transaction
      const transaction = new Transaction()

      // Create mint account
      const lamports = await getMinimumBalanceForRentExemptMint(connection)
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mint,
          space: MINT_SIZE,
          lamports,
          programId: TOKEN_PROGRAM_ID,
        })
      )

      // Initialize mint
      transaction.add(
        createInitializeMintInstruction(
          mint,
          6, // decimals
          bondingCurve, // mint authority
          null, // freeze authority
          TOKEN_PROGRAM_ID
        )
      )

      // Get creator token account
      const creatorTokenAccount = await getAssociatedTokenAddress(
        mint,
        publicKey,
        false,
        TOKEN_PROGRAM_ID
      )

      // Create create instruction (simplified - actual implementation needs proper instruction data)
      // This is a placeholder for the actual pump.fun create instruction
      const createData = Buffer.alloc(256)
      let offset = 0
      
      // Discriminator for create instruction (you need to get the actual discriminator)
      createData.writeUInt8(24, offset)
      offset += 8
      
      // Name
      const nameBuf = Buffer.from(metadata.name)
      createData.writeUInt32LE(nameBuf.length, offset)
      offset += 4
      nameBuf.copy(createData, offset)
      offset += nameBuf.length
      
      // Symbol
      const symbolBuf = Buffer.from(metadata.symbol)
      createData.writeUInt32LE(symbolBuf.length, offset)
      offset += 4
      symbolBuf.copy(createData, offset)
      offset += symbolBuf.length
      
      // URI
      const uriBuf = Buffer.from(metadataUri)
      createData.writeUInt32LE(uriBuf.length, offset)
      offset += 4
      uriBuf.copy(createData, offset)
      offset += uriBuf.length
      
      // Creator public key
      publicKey.toBuffer().copy(createData, offset)

      const createInstruction = new TransactionInstruction({
        keys: [
          { pubkey: globalAccount, isSigner: false, isWritable: false },
          { pubkey: PUMP_FUN_ACCOUNT, isSigner: false, isWritable: false },
          { pubkey: mint, isSigner: true, isWritable: true },
          { pubkey: bondingCurve, isSigner: false, isWritable: true },
          { pubkey: associatedBondingCurve, isSigner: false, isWritable: true },
          { pubkey: globalAccount, isSigner: false, isWritable: false },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'), isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: creatorTokenAccount, isSigner: false, isWritable: true },
        ],
        programId: PUMP_FUN_PROGRAM,
        data: createData.slice(0, offset),
      })

      transaction.add(createInstruction)

      // Add initial buy if specified
      if (initialBuyAmount && initialBuyAmount > 0) {
        toast.loading('Adding initial buy...', { id: toastId })
        
        const solLamports = Math.floor(initialBuyAmount * LAMPORTS_PER_SOL)
        // Calculate expected tokens (simplified bonding curve math)
        const expectedTokens = Math.floor(solLamports * 1000000) // Rough estimate
        const maxSolCost = Math.floor(solLamports * 1.1) // 10% slippage

        const buyParams: BuyTokenParams = {
          mint,
          amount: new BN(expectedTokens),
          maxSolCost: new BN(maxSolCost),
          buyer: publicKey,
        }

        const buyIx = await buyTokenInstruction(connection, buyParams)
        transaction.add(buyIx)
      }

      // Send transaction
      toast.loading('Please approve the transaction...', { id: toastId })
      
      const signature = await sendTransaction(transaction, connection, {
        signers: [mintKeypair],
        maxRetries: 3,
      })

      toast.loading('Confirming transaction...', { id: toastId })
      
      const confirmation = await connection.confirmTransaction(signature, 'confirmed')
      
      if (confirmation.value.err) {
        console.error('Transaction failed:', confirmation.value.err)
        console.error('Transaction signature:', signature)
        console.error('Mint address:', mint.publicKey.toBase58())
        throw new Error('Transaction failed: ' + JSON.stringify(confirmation.value.err))
      }

      toast.success(
        `Token created successfully! View: https://solscan.io/tx/${signature.slice(0, 20)}...`,
        { id: toastId, duration: 8000 }
      )

      return {
        mint: mint.toBase58(),
        signature,
        name: metadata.name,
        symbol: metadata.symbol,
        bondingCurve: bondingCurve.toBase58(),
      }
    } catch (error: any) {
      console.error('Error creating token:', error)
      
      let errorMessage = 'Failed to create token'
      if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient SOL balance. Please add more SOL to your wallet.'
      } else if (error.message?.includes('Custom":101')) {
        errorMessage = 'Pump.fun program error: Invalid instruction data or insufficient funds. Make sure you have at least 0.05 SOL.'
      } else if (error.message?.includes('rejected')) {
        errorMessage = 'Transaction rejected by user'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage, { id: toastId })
      return null
    } finally {
      setCreating(false)
    }
  }, [publicKey, sendTransaction, connection])

  // Buy tokens from bonding curve
  const buyTokens = useCallback(async (
    mint: PublicKey,
    solAmount: number,
    slippage: number = 10
  ): Promise<string | null> => {
    if (!publicKey || !sendTransaction) {
      toast.error('Please connect your wallet')
      return null
    }

    setBuying(true)
    const toastId = toast.loading('Preparing purchase...')

    try {
      // Get bonding curve data
      const curveData = await getBondingCurveData(connection, mint)
      
      if (!curveData) {
        throw new Error('Bonding curve not found')
      }

      if (curveData.complete) {
        throw new Error('Bonding curve complete - trading on Raydium')
      }

      // Calculate expected tokens
      const solLamports = Math.floor(solAmount * LAMPORTS_PER_SOL)
      const maxSolCost = Math.floor(solLamports * (1 + slippage / 100))
      
      // Simplified token calculation
      const expectedTokens = Math.floor(solLamports * 1e9 / 1e6) // Adjust based on bonding curve

      const buyParams: BuyTokenParams = {
        mint,
        amount: new BN(expectedTokens),
        maxSolCost: new BN(maxSolCost),
        buyer: publicKey,
      }

      const buyIx = await buyTokenInstruction(connection, buyParams)
      const transaction = new Transaction().add(buyIx)

      toast.loading('Please approve the transaction...', { id: toastId })
      
      const signature = await sendTransaction(transaction, connection)
      await connection.confirmTransaction(signature, 'confirmed')

      toast.success(
        `Purchase successful! View: https://solscan.io/tx/${signature.slice(0, 20)}...`,
        { id: toastId, duration: 5000 }
      )
      
      return signature
    } catch (error: any) {
      console.error('Error buying tokens:', error)
      toast.error(error.message || 'Failed to buy tokens', { id: toastId })
      return null
    } finally {
      setBuying(false)
    }
  }, [publicKey, sendTransaction, connection])

  // Sell tokens to bonding curve
  const sellTokens = useCallback(async (
    mint: PublicKey,
    tokenAmount: number,
    slippage: number = 10
  ): Promise<string | null> => {
    if (!publicKey || !sendTransaction) {
      toast.error('Please connect your wallet')
      return null
    }

    setSelling(true)
    const toastId = toast.loading('Preparing sale...')

    try {
      const tokenLamports = Math.floor(tokenAmount * 1e6) // 6 decimals
      
      // Calculate minimum SOL output
      // Simplified calculation - actual depends on bonding curve
      const expectedSol = Math.floor(tokenLamports * 1e6 / 1e9)
      const minSolOutput = Math.floor(expectedSol * (1 - slippage / 100))

      const sellParams: SellTokenParams = {
        mint,
        amount: new BN(tokenLamports),
        minSolOutput: new BN(minSolOutput),
        seller: publicKey,
      }

      const sellIx = await sellTokenInstruction(connection, sellParams)
      const transaction = new Transaction().add(sellIx)

      toast.loading('Please approve the transaction...', { id: toastId })
      
      const signature = await sendTransaction(transaction, connection)
      await connection.confirmTransaction(signature, 'confirmed')

      toast.success(
        `Sale successful! View: https://solscan.io/tx/${signature.slice(0, 20)}...`,
        { id: toastId, duration: 5000 }
      )
      
      return signature
    } catch (error: any) {
      console.error('Error selling tokens:', error)
      toast.error(error.message || 'Failed to sell tokens', { id: toastId })
      return null
    } finally {
      setSelling(false)
    }
  }, [publicKey, sendTransaction, connection])

  // Get token bonding curve data
  const getTokenCurveData = useCallback(async (mint: PublicKey) => {
    return getBondingCurveData(connection, mint)
  }, [connection])

  return {
    creating,
    buying,
    selling,
    createToken,
    buyTokens,
    sellTokens,
    getTokenCurveData,
  }
}

