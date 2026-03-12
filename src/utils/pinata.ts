/**
 * Pinata Cloud IPFS Upload Utilities
 * https://pinata.cloud/
 * 
 * Free tier: 100 files, 1GB storage
 * Paid plans start at $0.15/GB
 */

import axios from 'axios'

const PINATA_API_URL = 'https://api.pinata.cloud'

export interface PinataConfig {
  apiKey?: string
  apiSecret?: string
  jwt?: string
}

export interface PinataResponse {
  IpfsHash: string
  PinSize: number
  Timestamp: string
}

// Get headers based on auth method
function getHeaders(config: PinataConfig): Record<string, string> {
  if (config.jwt) {
    return {
      'Authorization': `Bearer ${config.jwt}`,
    }
  }
  return {
    'pinata_api_key': config.apiKey || '',
    'pinata_secret_api_key': config.apiSecret || '',
  }
}

/**
 * Upload image to Pinata IPFS
 */
export async function uploadImageToPinata(
  file: File,
  config: PinataConfig
): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  
  // Add metadata
  const metadata = JSON.stringify({
    name: file.name,
  })
  formData.append('pinataMetadata', metadata)
  
  // Add options
  const options = JSON.stringify({
    cidVersion: 1,
  })
  formData.append('pinataOptions', options)
  
  try {
    const response = await axios.post<PinataResponse>(
      `${PINATA_API_URL}/pinning/pinFileToIPFS`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...getHeaders(config),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    )
    
    // Return IPFS gateway URL
    return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
  } catch (error: any) {
    console.error('Pinata upload error:', error.response?.data || error.message)
    throw new Error(
      error.response?.data?.error || 'Failed to upload image to Pinata'
    )
  }
}

/**
 * Upload base64 image to Pinata
 */
export async function uploadBase64ImageToPinata(
  base64Data: string,
  filename: string,
  config: PinataConfig
): Promise<string> {
  // Convert base64 to blob
  const response = await fetch(base64Data)
  const blob = await response.blob()
  const file = new File([blob], filename, { type: 'image/png' })
  
  return uploadImageToPinata(file, config)
}

/**
 * Upload JSON metadata to Pinata
 */
export async function uploadJSONToPinata(
  jsonData: object,
  name: string,
  config: PinataConfig
): Promise<string> {
  const blob = new Blob([JSON.stringify(jsonData)], { type: 'application/json' })
  const file = new File([blob], `${name}.json`, { type: 'application/json' })
  
  const formData = new FormData()
  formData.append('file', file)
  
  // Add metadata
  const metadata = JSON.stringify({
    name: `${name}.json`,
  })
  formData.append('pinataMetadata', metadata)
  
  // Add options
  const options = JSON.stringify({
    cidVersion: 1,
  })
  formData.append('pinataOptions', options)
  
  try {
    const response = await axios.post<PinataResponse>(
      `${PINATA_API_URL}/pinning/pinFileToIPFS`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...getHeaders(config),
        },
      }
    )
    
    return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
  } catch (error: any) {
    console.error('Pinata JSON upload error:', error.response?.data || error.message)
    throw new Error(
      error.response?.data?.error || 'Failed to upload JSON to Pinata'
    )
  }
}

/**
 * Upload token metadata to Pinata
 */
export async function uploadTokenMetadataToPinata(
  metadata: {
    name: string
    symbol: string
    description: string
    image: string
    twitter?: string
    telegram?: string
    website?: string
  },
  config: PinataConfig
): Promise<{ metadataUri: string; imageUri: string }> {
  // First upload the image if it's base64
  let imageUri = metadata.image
  
  if (metadata.image?.startsWith('data:')) {
    console.log('Uploading image to Pinata...')
    imageUri = await uploadBase64ImageToPinata(
      metadata.image,
      `${metadata.symbol}-image.png`,
      config
    )
    console.log('Image uploaded:', imageUri)
  }
  
  // Create metadata JSON following Metaplex standard
  const tokenMetadata = {
    name: metadata.name,
    symbol: metadata.symbol,
    description: metadata.description,
    image: imageUri,
    ...(metadata.twitter && { twitter: metadata.twitter }),
    ...(metadata.telegram && { telegram: metadata.telegram }),
    ...(metadata.website && { website: metadata.website }),
    attributes: [],
    properties: {
      files: [
        {
          uri: imageUri,
          type: 'image/png',
        },
      ],
      category: 'image',
    },
  }
  
  // Upload metadata JSON
  console.log('Uploading metadata to Pinata...')
  const metadataUri = await uploadJSONToPinata(
    tokenMetadata,
    `${metadata.symbol}-metadata`,
    config
  )
  console.log('Metadata uploaded:', metadataUri)
  
  return { metadataUri, imageUri }
}

/**
 * Test Pinata connection
 */
export async function testPinataConnection(
  config: PinataConfig
): Promise<boolean> {
  try {
    const response = await axios.get(`${PINATA_API_URL}/data/testAuthentication`, {
      headers: getHeaders(config),
    })
    return response.status === 200
  } catch (error) {
    console.error('Pinata connection test failed:', error)
    return false
  }
}

/**
 * Get Pinata usage stats
 */
export async function getPinataUsage(config: PinataConfig): Promise<{
  pin_count: number
  pin_size_total: number
  pin_size_with_replications_total: number
} | null> {
  try {
    const response = await axios.get(`${PINATA_API_URL}/data/userPinnedDataTotal`, {
      headers: getHeaders(config),
    })
    return response.data
  } catch (error) {
    console.error('Failed to get Pinata usage:', error)
    return null
  }
}
