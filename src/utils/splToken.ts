/**
 * SPL Token Creation Utilities
 * Uses the standard Solana SPL Token program
 */

import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js'
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
} from '@solana/spl-token'
import BN from 'bn.js'

export interface CreateSPLTokenParams {
  name: string
  symbol: string
  decimals: number
  initialSupply: number // in whole tokens (not base units)
  metadataUri: string
  creator: PublicKey
}

export interface TokenCreationResult {
  mint: PublicKey
  tokenAccount: PublicKey
  signature: string
}

/**
 * Create a new SPL token
 * This creates a standard SPL token with initial supply minted to the creator
 */
export async function createSPLToken(
  connection: Connection,
  payer: PublicKey,
  mintKeypair: Keypair,
  params: CreateSPLTokenParams
): Promise<Transaction> {
  const { decimals, initialSupply, creator } = params
  
  // Calculate rent exemption for mint
  const lamports = await getMinimumBalanceForRentExemptMint(connection)
  
  // Create transaction
  const transaction = new Transaction()
  
  // 1. Create mint account
  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: mintKeypair.publicKey,
      space: MINT_SIZE,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    })
  )
  
  // 2. Initialize mint
  // Set creator as both mint authority and freeze authority
  transaction.add(
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      decimals,
      creator, // mint authority
      creator, // freeze authority
      TOKEN_PROGRAM_ID
    )
  )
  
  // 3. Create associated token account for creator
  const associatedTokenAccount = await getAssociatedTokenAddress(
    mintKeypair.publicKey,
    creator,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  
  transaction.add(
    createAssociatedTokenAccountInstruction(
      payer,
      associatedTokenAccount,
      creator,
      mintKeypair.publicKey,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
  )
  
  // 4. Mint initial supply to creator
  if (initialSupply > 0) {
    const supplyInBaseUnits = new BN(initialSupply).mul(
      new BN(10).pow(new BN(decimals))
    )
    
    transaction.add(
      createMintToInstruction(
        mintKeypair.publicKey,
        associatedTokenAccount,
        creator, // mint authority
        BigInt(supplyInBaseUnits.toString()),
        [], // no additional signers needed since creator is mint authority
        TOKEN_PROGRAM_ID
      )
    )
  }
  
  return transaction
}

/**
 * Get token info
 */
export async function getTokenInfo(
  connection: Connection,
  mint: PublicKey
): Promise<{
  decimals: number
  supply: bigint
  mintAuthority: PublicKey | null
  freezeAuthority: PublicKey | null
} | null> {
  try {
    const mintInfo = await connection.getParsedAccountInfo(mint)
    if (!mintInfo.value || !('parsed' in mintInfo.value.data)) {
      return null
    }
    
    const parsed = mintInfo.value.data.parsed.info
    return {
      decimals: parsed.decimals,
      supply: BigInt(parsed.supply),
      mintAuthority: parsed.mintAuthority ? new PublicKey(parsed.mintAuthority) : null,
      freezeAuthority: parsed.freezeAuthority ? new PublicKey(parsed.freezeAuthority) : null,
    }
  } catch (error) {
    console.error('Error getting token info:', error)
    return null
  }
}

/**
 * Get token balance for a wallet
 */
export async function getTokenBalance(
  connection: Connection,
  wallet: PublicKey,
  mint: PublicKey
): Promise<bigint> {
  try {
    const tokenAccount = await getAssociatedTokenAddress(
      mint,
      wallet,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
    
    const balance = await connection.getTokenAccountBalance(tokenAccount)
    return BigInt(balance.value.amount)
  } catch (error) {
    return BigInt(0)
  }
}

/**
 * Calculate total supply in human-readable format
 */
export function formatTokenAmount(amount: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals)
  const whole = amount / divisor
  const fraction = amount % divisor
  
  if (fraction === BigInt(0)) {
    return whole.toString()
  }
  
  // Pad fraction with leading zeros
  const fractionStr = fraction.toString().padStart(decimals, '0')
  // Trim trailing zeros
  const trimmedFraction = fractionStr.replace(/0+$/, '')
  
  return `${whole}.${trimmedFraction}`
}
