import { useState, useCallback } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Keypair, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import toast from 'react-hot-toast'
import {
  createSPLToken,
  CreateSPLTokenParams,
  TokenCreationResult,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '../utils/splToken'
import { uploadTokenMetadata, TokenMetadata } from '../utils/metadata'

export interface SPLTokenCreationData {
  name: string
  symbol: string
  description: string
  decimals: number
  initialSupply: number
  image?: string
  twitter?: string
  telegram?: string
  website?: string
}

export function useSPLToken() {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()
  const [creating, setCreating] = useState(false)

  const createToken = useCallback(async (
    data: SPLTokenCreationData
  ): Promise<TokenCreationResult | null> => {
    if (!publicKey || !sendTransaction) {
      toast.error('Please connect your wallet')
      return null
    }

    setCreating(true)
    const toastId = toast.loading('Preparing token creation...')

    try {
      // Step 1: Upload metadata
      toast.loading('Uploading metadata...', { id: toastId })
      
      const metadata: TokenMetadata = {
        name: data.name,
        symbol: data.symbol,
        description: data.description,
        image: data.image,
        twitter: data.twitter,
        telegram: data.telegram,
        website: data.website,
      }
      
      const { metadataUri } = await uploadTokenMetadata(metadata)
      console.log('Metadata uploaded:', metadataUri)

      // Step 2: Generate mint keypair
      const mintKeypair = Keypair.generate()
      console.log('Mint address:', mintKeypair.publicKey.toBase58())

      // Step 3: Create transaction
      toast.loading('Creating transaction...', { id: toastId })
      
      const params: CreateSPLTokenParams = {
        name: data.name,
        symbol: data.symbol,
        decimals: data.decimals,
        initialSupply: data.initialSupply,
        metadataUri,
        creator: publicKey,
      }

      const transaction = await createSPLToken(
        connection,
        publicKey,
        mintKeypair,
        params
      )

      // Step 4: Send transaction
      toast.loading('Please approve the transaction in your wallet...', { id: toastId })
      
      const signature = await sendTransaction(transaction, connection, {
        signers: [mintKeypair],
      })

      console.log('Transaction sent:', signature)
      
      // Step 5: Confirm transaction
      toast.loading('Confirming transaction...', { id: toastId })
      
      const confirmation = await connection.confirmTransaction(signature, 'confirmed')
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed: ' + JSON.stringify(confirmation.value.err))
      }

      // Get token account address
      const tokenAccount = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )

      toast.success(
        () => (
          <div>
            Token created successfully!
            <br />
            <a
              href={`https://solscan.io/tx/${signature}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#00d084' }}
            >
              View on Solscan
            </a>
          </div>
        ),
        { id: toastId, duration: 8000 }
      )

      return {
        mint: mintKeypair.publicKey,
        tokenAccount,
        signature,
      }
    } catch (error: any) {
      console.error('Error creating token:', error)
      
      let errorMessage = 'Failed to create token'
      if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient SOL balance. Please add more SOL to your wallet.'
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

  return {
    creating,
    createToken,
  }
}
