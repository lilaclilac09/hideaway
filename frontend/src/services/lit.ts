/**
 * Lit Protocol Integration
 * Handles conditional access and encryption using Lit Protocol
 */

import * as LitJsSdk from 'lit-js-sdk'

let litClient: any = null

/**
 * Initialize Lit client
 */
export async function initLitClient() {
  if (!litClient) {
    litClient = new LitJsSdk.LitNodeClient({
      alertWhenUnauthorized: false,
      litNetwork: 'serrano', // Use testnet
    })
    await litClient.connect()
  }
  return litClient
}

/**
 * Encrypt data with Lit Protocol access conditions
 */
export async function encryptWithLit(
  data: string,
  accessConditions: any[]
): Promise<{ encryptedData: string; encryptedSymmetricKey: string }> {
  const client = await initLitClient()

  // Create access control conditions
  const accessControlConditions = accessConditions.length > 0
    ? accessConditions
    : [
        {
          contractAddress: '',
          standardContractType: '',
          chain: 'solana',
          method: '',
          parameters: [],
          returnValueTest: {
            comparator: '=',
            value: '',
          },
        },
      ]

  // Encrypt
  const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(data)

  // Save encryption key with access conditions
  const encryptedSymmetricKey = await client.saveEncryptionKey({
    accessControlConditions,
    symmetricKey,
    chain: 'solana',
    authSig: await getAuthSig(),
  })

  return {
    encryptedData: await blobToBase64(encryptedString),
    encryptedSymmetricKey: LitJsSdk.uint8arrayToString(encryptedSymmetricKey, 'base16'),
  }
}

/**
 * Decrypt data with Lit Protocol
 */
export async function decryptWithLit(
  encryptedData: string,
  encryptedSymmetricKey: string,
  accessConditions: any[]
): Promise<string> {
  const client = await initLitClient()

  const symmetricKey = await client.getEncryptionKey({
    accessControlConditions: accessConditions,
    toDecrypt: encryptedSymmetricKey,
    chain: 'solana',
    authSig: await getAuthSig(),
  })

  const encryptedBlob = await base64ToBlob(encryptedData)
  const decryptedString = await LitJsSdk.decryptString(encryptedBlob, symmetricKey)

  return decryptedString
}

/**
 * Create age-based access condition
 */
export function createAgeCondition(minAge: number): any[] {
  return [
    {
      contractAddress: '',
      standardContractType: '',
      chain: 'solana',
      method: '',
      parameters: [],
      returnValueTest: {
        comparator: '>=',
        value: minAge.toString(),
      },
    },
  ]
}

/**
 * Create time-based access condition
 */
export function createTimeCondition(unlockTimestamp: number): any[] {
  return [
    {
      contractAddress: '',
      standardContractType: '',
      chain: 'solana',
      method: '',
      parameters: [],
      returnValueTest: {
        comparator: '>=',
        value: unlockTimestamp.toString(),
      },
    },
  ]
}

/**
 * Get authentication signature (simplified - in production use wallet adapter)
 */
async function getAuthSig(): Promise<any> {
  // TODO: Integrate with Solana wallet adapter
  // This is a placeholder
  return {
    sig: '',
    derivedVia: '',
    signedMessage: '',
    address: '',
  }
}

/**
 * Convert blob to base64
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Convert base64 to blob
 */
async function base64ToBlob(base64: string): Promise<Blob> {
  const response = await fetch(base64)
  return response.blob()
}
