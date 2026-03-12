import axios from 'axios'
import {
  uploadTokenMetadataToPinata,
  uploadImageToPinata,
  testPinataConnection,
  PinataConfig,
} from './pinata'

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

// Get Pinata config from environment
function getPinataConfig(): PinataConfig | null {
  // Check for JWT first
  const jwt = import.meta.env.VITE_PINATA_JWT
  if (jwt && jwt !== 'your_pinata_jwt_token_here') {
    return { jwt }
  }
  
  // Fall back to API Key + Secret
  const apiKey = import.meta.env.VITE_PINATA_API_KEY
  const apiSecret = import.meta.env.VITE_PINATA_API_SECRET
  
  if (apiKey && apiSecret && 
      apiKey !== 'your_pinata_api_key_here' && 
      apiSecret !== 'your_pinata_api_secret_here') {
    return { apiKey, apiSecret }
  }
  
  return null
}

/**
 * Upload token metadata using Pinata (recommended) or mock fallback
 */
export async function uploadTokenMetadata(
  metadata: TokenMetadata,
  imageFile?: File
): Promise<UploadedMetadata> {
  // Try Pinata first
  const pinataConfig = getPinataConfig()
  
  if (pinataConfig) {
    try {
      console.log('Using Pinata for metadata upload...')
      const result = await uploadTokenMetadataToPinata(
        {
          name: metadata.name,
          symbol: metadata.symbol,
          description: metadata.description,
          image: metadata.image || '',
          twitter: metadata.twitter,
          telegram: metadata.telegram,
          website: metadata.website,
        },
        pinataConfig
      )
      return result
    } catch (error) {
      console.warn('Pinata upload failed, falling back to mock:', error)
    }
  }
  
  // Fallback to mock (for development)
  console.warn('Using mock metadata upload - configure Pinata in .env for production')
  return mockUploadMetadata(metadata, imageFile)
}

/**
 * Mock upload for development
 */
async function mockUploadMetadata(
  metadata: TokenMetadata,
  imageFile?: File
): Promise<UploadedMetadata> {
  let imageUri: string | undefined
  
  if (imageFile) {
    imageUri = `https://mock.storage/image-${Date.now()}.png`
  } else if (metadata.image?.startsWith('data:')) {
    imageUri = `https://mock.storage/image-${Date.now()}.png`
  }
  
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
  
  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const metadataUri = `https://mock.storage/metadata-${Date.now()}.json`
  
  console.log('Mock metadata uploaded:', metadataUri)
  return { metadataUri, imageUri }
}

/**
 * Upload image - tries Pinata first, falls back to mock
 */
export async function uploadImage(file: File): Promise<string> {
  const pinataConfig = getPinataConfig()
  
  if (pinataConfig) {
    try {
      return await uploadImageToPinata(file, pinataConfig)
    } catch (error) {
      console.warn('Pinata image upload failed:', error)
    }
  }
  
  console.warn('Using mock image upload - configure Pinata for production')
  await new Promise(resolve => setTimeout(resolve, 300))
  return `https://mock.storage/image-${Date.now()}.png`
}

/**
 * Upload base64 image
 */
export async function uploadBase64Image(base64Data: string): Promise<string> {
  const pinataConfig = getPinataConfig()
  
  if (pinataConfig) {
    try {
      const { uploadBase64ImageToPinata } = await import('./pinata')
      return await uploadBase64ImageToPinata(
        base64Data,
        `image-${Date.now()}.png`,
        pinataConfig
      )
    } catch (error) {
      console.warn('Pinata base64 upload failed:', error)
    }
  }
  
  console.warn('Using mock base64 upload')
  await new Promise(resolve => setTimeout(resolve, 300))
  return `https://mock.storage/image-${Date.now()}.png`
}

/**
 * Test Pinata connection
 */
export async function testPinata(): Promise<{
  connected: boolean
  message: string
  method?: string
}> {
  const config = getPinataConfig()
  
  if (!config) {
    return {
      connected: false,
      message: 'Pinata not configured. Add API Key + Secret or JWT to .env file',
    }
  }
  
  const method = config.jwt ? 'JWT Token' : 'API Key'
  const isConnected = await testPinataConnection(config)
  
  if (isConnected) {
    return {
      connected: true,
      message: `✅ Pinata connected using ${method}!`,
      method,
    }
  } else {
    return {
      connected: false,
      message: `❌ Pinata connection failed using ${method}. Check your credentials.`,
      method,
    }
  }
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

// Re-export Pinata types
export type { PinataConfig }
export { uploadTokenMetadataToPinata, testPinataConnection }
