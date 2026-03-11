import axios from 'axios'

export interface TokenMetadata {
  name: string
  symbol: string
  description: string
  image?: string
  twitter?: string
  telegram?: string
  website?: string
  showName?: boolean
  createdOn?: string
}

export interface UploadedMetadata {
  metadataUri: string
  imageUri?: string
}

/**
 * Upload token metadata to a storage service
 * In production, this should use Irys (formerly Bundlr) or Arweave
 * 
 * For development/testing, you can use:
 * 1. Irys Network (recommended for pump.fun)
 * 2. Arweave via Bundlr
 * 3. IPFS via Pinata or NFT.Storage
 * 4. Temporary mock for testing
 */
export async function uploadTokenMetadata(
  metadata: TokenMetadata,
  imageFile?: File
): Promise<UploadedMetadata> {
  // For production, implement actual upload to Irys/Arweave
  // This is a placeholder implementation

  let imageUri: string | undefined

  // Upload image if provided
  if (imageFile) {
    imageUri = await uploadImage(imageFile)
  } else if (metadata.image?.startsWith('data:')) {
    // Handle base64 image data
    imageUri = await uploadBase64Image(metadata.image)
  }

  // Prepare metadata JSON
  const tokenMetadata = {
    name: metadata.name,
    symbol: metadata.symbol,
    description: metadata.description,
    image: imageUri,
    twitter: metadata.twitter,
    telegram: metadata.telegram,
    website: metadata.website,
    showName: true,
    createdOn: 'https://pump.fun',
  }

  // Upload metadata JSON
  const metadataUri = await uploadJson(tokenMetadata)

  return { metadataUri, imageUri }
}

/**
 * Upload image to storage
 * Replace with actual Irys implementation for production
 */
async function uploadImage(file: File): Promise<string> {
  // Production implementation using Irys:
  /*
  const irys = new Irys({
    url: 'https://node1.irys.xyz',
    token: 'solana',
    key: process.env.PRIVATE_KEY,
  })
  
  const receipt = await irys.uploadFile(file)
  return `https://arweave.net/${receipt.id}`
  */

  // For development, return a mock URL or use a temporary upload service
  console.warn('Using mock image upload - replace with Irys for production')
  return `https://mock.storage/image-${Date.now()}.png`
}

/**
 * Upload base64 image
 */
async function uploadBase64Image(base64Data: string): Promise<string> {
  // Convert base64 to file and upload
  const response = await fetch(base64Data)
  const blob = await response.blob()
  const file = new File([blob], `image-${Date.now()}.png`, { type: 'image/png' })
  return uploadImage(file)
}

/**
 * Upload JSON metadata
 * Replace with actual Irys implementation for production
 */
async function uploadJson(metadata: object): Promise<string> {
  // Production implementation using Irys:
  /*
  const irys = new Irys({
    url: 'https://node1.irys.xyz',
    token: 'solana',
    key: process.env.PRIVATE_KEY,
  })
  
  const data = JSON.stringify(metadata)
  const receipt = await irys.upload(data)
  return `https://arweave.net/${receipt.id}`
  */

  // For development, you can use a temporary service or mock
  console.warn('Using mock metadata upload - replace with Irys for production')
  
  // Option: Use a temporary JSON storage service for testing
  try {
    const response = await axios.post('https://jsonblob.com/api/jsonBlob', metadata)
    const blobUrl = response.headers.location
    return blobUrl
  } catch (error) {
    // Fallback to mock URL
    return `https://mock.storage/metadata-${Date.now()}.json`
  }
}

/**
 * Irys upload implementation (for production use)
 * 
 * Install: npm install @irys/sdk
 * 
 * Example usage:
 * ```typescript
 * import { default as Irys } from '@irys/sdk';
 * 
 * const irys = new Irys({
 *   url: 'https://node1.irys.xyz',
 *   token: 'solana',
 *   key: privateKey,
 * });
 * 
 * // Upload image
 * const imageReceipt = await irys.uploadFile(imageFile);
 * const imageUri = `https://arweave.net/${imageReceipt.id}`;
 * 
 * // Upload metadata
 * const metadataReceipt = await irys.upload(JSON.stringify(metadataJson));
 * const metadataUri = `https://arweave.net/${metadataReceipt.id}`;
 * ```
 */
export async function uploadWithIrys(
  _metadata: TokenMetadata,
  _imageFile: File,
  _privateKey: string
): Promise<UploadedMetadata> {
  throw new Error(
    'Irys upload not implemented. To use: npm install @irys/sdk and implement the upload logic in this function.'
  )
}

/**
 * Validate metadata before upload
 */
export function validateMetadata(metadata: TokenMetadata): string | null {
  if (!metadata.name || metadata.name.length < 2) {
    return 'Token name must be at least 2 characters'
  }
  if (metadata.name.length > 32) {
    return 'Token name must be less than 32 characters'
  }
  if (!metadata.symbol || metadata.symbol.length < 2) {
    return 'Token symbol must be at least 2 characters'
  }
  if (metadata.symbol.length > 10) {
    return 'Token symbol must be less than 10 characters'
  }
  if (!metadata.description || metadata.description.length < 10) {
    return 'Description must be at least 10 characters'
  }
  if (metadata.description.length > 1000) {
    return 'Description must be less than 1000 characters'
  }
  if (!metadata.image) {
    return 'Token image is required'
  }
  return null
}
