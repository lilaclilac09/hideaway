/**
 * File Hashing Service
 * Uses crypto-js for SHA-256 hashing with salt
 */

import CryptoJS from 'crypto-js'

/**
 * Generate a random salt
 */
export function generateSalt(): Uint8Array {
  const salt = CryptoJS.lib.WordArray.random(32)
  return new Uint8Array(
    Buffer.from(salt.toString(CryptoJS.enc.Hex), 'hex')
  )
}

/**
 * Hash a file with salt
 */
export async function hashFile(file: File, salt: Uint8Array): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const fileData = e.target?.result as ArrayBuffer
        const wordArray = CryptoJS.lib.WordArray.create(fileData)
        const saltWordArray = CryptoJS.lib.WordArray.create(salt)
        
        // Hash file content + salt
        const hash = CryptoJS.SHA256(wordArray.concat(saltWordArray))
        const hashBytes = new Uint8Array(
          Buffer.from(hash.toString(CryptoJS.enc.Hex), 'hex')
        )
        
        resolve(hashBytes)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Hash a string (for testing)
 */
export function hashString(text: string, salt: Uint8Array): Uint8Array {
  const textWordArray = CryptoJS.enc.Utf8.parse(text)
  const saltWordArray = CryptoJS.lib.WordArray.create(salt)
  const hash = CryptoJS.SHA256(textWordArray.concat(saltWordArray))
  return new Uint8Array(
    Buffer.from(hash.toString(CryptoJS.enc.Hex), 'hex')
  )
}
