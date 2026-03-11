import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
  SendOptions,
} from '@solana/web3.js'
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createInitializeMintInstruction,
  createMintToInstruction,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
} from '@solana/spl-token'
import BN from 'bn.js'

// Pump.fun Program IDs
export const PUMP_FUN_PROGRAM = new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P')
export const PUMP_FUN_ACCOUNT = new PublicKey('Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1')
export const PUMP_SWAP_PROGRAM = new PublicKey('11111111111111111111111111111111') // Replace with actual swap.pump.fun program ID

// Bonding curve-related constants
export const GLOBAL_ACCOUNT = new PublicKey('4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf')

export interface TokenMetadata {
  name: string
  symbol: string
  description: string
  image?: string
  twitter?: string
  telegram?: string
  website?: string
}

export interface CreateTokenParams {
  name: string
  symbol: string
  uri: string
  creator: PublicKey
}

export interface BuyTokenParams {
  mint: PublicKey
  amount: BN
  maxSolCost: BN
  buyer: PublicKey
}

export interface SellTokenParams {
  mint: PublicKey
  amount: BN
  minSolOutput: BN
  seller: PublicKey
}

// Compute bonding curve PDA
export function getBondingCurvePDA(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('bonding-curve'), mint.toBuffer()],
    PUMP_FUN_PROGRAM
  )
}

// Compute associated bonding curve address
export function getAssociatedBondingCurvePDA(bondingCurve: PublicKey, mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [bondingCurve.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
}

// Create token on pump.fun
export async function createTokenInstruction(
  connection: Connection,
  creator: PublicKey,
  mint: Keypair,
  metadata: CreateTokenParams
): Promise<TransactionInstruction[]> {
  const instructions: TransactionInstruction[] = []
  
  // Get bonding curve PDAs
  const [bondingCurve] = getBondingCurvePDA(mint.publicKey)
  const [associatedBondingCurve] = getAssociatedBondingCurvePDA(bondingCurve, mint.publicKey)
  
  // Get creator's associated token account
  const creatorTokenAccount = await getAssociatedTokenAddress(
    mint.publicKey,
    creator,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  
  // Create mint account
  const lamports = await getMinimumBalanceForRentExemptMint(connection)
  
  instructions.push(
    SystemProgram.createAccount({
      fromPubkey: creator,
      newAccountPubkey: mint.publicKey,
      space: MINT_SIZE,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    })
  )
  
  // Initialize mint
  instructions.push(
    createInitializeMintInstruction(
      mint.publicKey,
      6, // decimals
      bondingCurve, // mint authority
      null, // freeze authority
      TOKEN_PROGRAM_ID
    )
  )
  
  // Create associated token account for creator
  instructions.push(
    createAssociatedTokenAccountInstruction(
      creator,
      creatorTokenAccount,
      creator,
      mint.publicKey,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
  )
  
  // Create create instruction data
  const createData = Buffer.alloc(100)
  let offset = 0
  
  // Discriminator for create instruction
  createData.writeUInt8(24, offset) // create instruction discriminator
  offset += 8
  
  // Name length and string
  const nameBuffer = Buffer.from(metadata.name)
  createData.writeUInt32LE(nameBuffer.length, offset)
  offset += 4
  nameBuffer.copy(createData, offset)
  offset += nameBuffer.length
  
  // Symbol length and string
  const symbolBuffer = Buffer.from(metadata.symbol)
  createData.writeUInt32LE(symbolBuffer.length, offset)
  offset += 4
  symbolBuffer.copy(createData, offset)
  offset += symbolBuffer.length
  
  // URI length and string
  const uriBuffer = Buffer.from(metadata.uri)
  createData.writeUInt32LE(uriBuffer.length, offset)
  offset += 4
  uriBuffer.copy(createData, offset)
  
  const createInstruction = new TransactionInstruction({
    keys: [
      { pubkey: creator, isSigner: true, isWritable: true },
      { pubkey: mint.publicKey, isSigner: true, isWritable: true },
      { pubkey: bondingCurve, isSigner: false, isWritable: true },
      { pubkey: associatedBondingCurve, isSigner: false, isWritable: true },
      { pubkey: GLOBAL_ACCOUNT, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: creatorTokenAccount, isSigner: false, isWritable: true },
    ],
    programId: PUMP_FUN_PROGRAM,
    data: createData.slice(0, offset + uriBuffer.length),
  })
  
  instructions.push(createInstruction)
  
  return instructions
}

// Buy tokens from bonding curve (add liquidity / purchase)
export async function buyTokenInstruction(
  connection: Connection,
  params: BuyTokenParams
): Promise<TransactionInstruction> {
  const { mint, amount, maxSolCost, buyer } = params
  
  const [bondingCurve] = getBondingCurvePDA(mint)
  const [associatedBondingCurve] = getAssociatedBondingCurvePDA(bondingCurve, mint)
  
  const buyerTokenAccount = await getAssociatedTokenAddress(
    mint,
    buyer,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  
  // Create buy instruction data
  const data = Buffer.alloc(24)
  data.writeUInt8(102, 0) // buy discriminator
  data.writeBigUInt64LE(BigInt(amount.toString()), 8)
  data.writeBigUInt64LE(BigInt(maxSolCost.toString()), 16)
  
  return new TransactionInstruction({
    keys: [
      { pubkey: GLOBAL_ACCOUNT, isSigner: false, isWritable: false },
      { pubkey: PUMP_FUN_ACCOUNT, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: bondingCurve, isSigner: false, isWritable: true },
      { pubkey: associatedBondingCurve, isSigner: false, isWritable: true },
      { pubkey: buyer, isSigner: true, isWritable: true },
      { pubkey: buyerTokenAccount, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    programId: PUMP_FUN_PROGRAM,
    data,
  })
}

// Sell tokens back to bonding curve (remove liquidity / sell)
export async function sellTokenInstruction(
  connection: Connection,
  params: SellTokenParams
): Promise<TransactionInstruction> {
  const { mint, amount, minSolOutput, seller } = params
  
  const [bondingCurve] = getBondingCurvePDA(mint)
  const [associatedBondingCurve] = getAssociatedBondingCurvePDA(bondingCurve, mint)
  
  const sellerTokenAccount = await getAssociatedTokenAddress(
    mint,
    seller,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  
  // Create sell instruction data
  const data = Buffer.alloc(24)
  data.writeUInt8(51, 0) // sell discriminator
  data.writeBigUInt64LE(BigInt(amount.toString()), 8)
  data.writeBigUInt64LE(BigInt(minSolOutput.toString()), 16)
  
  return new TransactionInstruction({
    keys: [
      { pubkey: GLOBAL_ACCOUNT, isSigner: false, isWritable: false },
      { pubkey: PUMP_FUN_ACCOUNT, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: bondingCurve, isSigner: false, isWritable: true },
      { pubkey: associatedBondingCurve, isSigner: false, isWritable: true },
      { pubkey: seller, isSigner: true, isWritable: true },
      { pubkey: sellerTokenAccount, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    programId: PUMP_FUN_PROGRAM,
    data,
  })
}

// Calculate buy amount based on SOL input
export function calculateBuyAmount(solAmount: number, currentSupply: number, reserveBalance: number): number {
  // Simplified bonding curve calculation
  // Real implementation would use the actual bonding curve math from pump.fun
  const k = reserveBalance * currentSupply
  const newReserve = reserveBalance + solAmount
  const newSupply = k / newReserve
  return currentSupply - newSupply
}

// Calculate sell amount based on token input
export function calculateSellOutput(tokenAmount: number, currentSupply: number, reserveBalance: number): number {
  // Simplified bonding curve calculation
  const k = reserveBalance * currentSupply
  const newSupply = currentSupply + tokenAmount
  const newReserve = k / newSupply
  return reserveBalance - newReserve
}

// Fetch bonding curve data
export async function getBondingCurveData(
  connection: Connection,
  mint: PublicKey
): Promise<{ supply: BN, reserveBalance: BN, complete: boolean } | null> {
  try {
    const [bondingCurve] = getBondingCurvePDA(mint)
    const accountInfo = await connection.getAccountInfo(bondingCurve)
    
    if (!accountInfo) return null
    
    // Parse bonding curve data (adjust offsets based on actual struct layout)
    const data = accountInfo.data
    const supply = new BN(data.slice(8, 16), 'le')
    const reserveBalance = new BN(data.slice(16, 24), 'le')
    const complete = data[24] === 1
    
    return { supply, reserveBalance, complete }
  } catch (error) {
    console.error('Error fetching bonding curve:', error)
    return null
  }
}
