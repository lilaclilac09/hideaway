/**
 * HideAway Service
 * Integrates with Solana program and IPFS
 */

import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { WalletContextState } from '@solana/wallet-adapter-react'
import {
  HIDEAWAY_PROGRAM_ID,
  deriveFileVaultAddress,
  createUploadFileInstruction,
  createAccessFileInstruction,
  createShareFileInstruction,
  getFileVault as getVaultSDK,
  FileVaultData,
} from '../../../client/src/index'
import { uploadToIpfs } from './ipfs'
import { hashFile, generateSalt } from './hashing'
import { encryptWithLit, createTimeCondition } from './lit'

export interface UploadedFile {
  fileHash: string
  cid: string
  fileName: string
  uploadedAt: Date
  vaultAddress: string
}

/**
 * Upload file to HideAway
 */
export async function uploadFile(
  connection: Connection,
  wallet: WalletContextState,
  file: File,
  timeLockExpiry?: number
): Promise<UploadedFile> {
  if (!wallet.publicKey || !wallet.sendTransaction) {
    throw new Error('Wallet not connected')
  }

  // 1. Generate salt
  const salt = generateSalt()

  // 2. Hash file
  const fileHash = await hashFile(file, salt)

  // 3. Upload to IPFS
  const cid = await uploadToIpfs(file)

  // 4. Encrypt CID with Lit Protocol (optional time lock)
  let encryptedCid: string
  if (timeLockExpiry) {
    const conditions = createTimeCondition(timeLockExpiry)
    const encrypted = await encryptWithLit(cid, conditions)
    encryptedCid = encrypted.encryptedData // Store encrypted data
  } else {
    encryptedCid = cid // For now, store plain CID (can encrypt later)
  }

  // 5. Create upload instruction
  const [transaction, vaultAddress] = await createUploadFileInstruction(
    HIDEAWAY_PROGRAM_ID,
    wallet.publicKey,
    fileHash,
    salt,
    encryptedCid
  )

  // 6. Send transaction
  const latestBlockhash = await connection.getLatestBlockhash()
  transaction.recentBlockhash = latestBlockhash.blockhash
  transaction.feePayer = wallet.publicKey

  const signature = await wallet.sendTransaction(transaction, connection)
  await connection.confirmTransaction(signature, 'confirmed')

  return {
    fileHash: Buffer.from(fileHash).toString('hex'),
    cid,
    fileName: file.name,
    uploadedAt: new Date(),
    vaultAddress: vaultAddress.toString(),
  }
}

/**
 * Access file from HideAway
 */
export async function accessFile(
  connection: Connection,
  wallet: WalletContextState,
  vaultAddress: PublicKey,
  fileHash: Uint8Array,
  zkProof?: Uint8Array
): Promise<void> {
  if (!wallet.publicKey || !wallet.sendTransaction) {
    throw new Error('Wallet not connected')
  }

  const transaction = await createAccessFileInstruction(
    HIDEAWAY_PROGRAM_ID,
    wallet.publicKey,
    vaultAddress,
    fileHash,
    zkProof
  )

  const latestBlockhash = await connection.getLatestBlockhash()
  transaction.recentBlockhash = latestBlockhash.blockhash
  transaction.feePayer = wallet.publicKey

  const signature = await wallet.sendTransaction(transaction, connection)
  await connection.confirmTransaction(signature, 'confirmed')
}

/**
 * Share file (MPC, Time Lock, or Lit Condition)
 */
export async function shareFile(
  connection: Connection,
  wallet: WalletContextState,
  vaultAddress: PublicKey,
  shareType: 'mpc' | 'timelock' | 'lit',
  options: {
    mpcShareCount?: number
    timeLockExpiry?: number
    accessFlags?: number
  }
): Promise<void> {
  if (!wallet.publicKey || !wallet.sendTransaction) {
    throw new Error('Wallet not connected')
  }

  const transaction = await createShareFileInstruction(
    HIDEAWAY_PROGRAM_ID,
    wallet.publicKey,
    vaultAddress,
    shareType,
    options
  )

  const latestBlockhash = await connection.getLatestBlockhash()
  transaction.recentBlockhash = latestBlockhash.blockhash
  transaction.feePayer = wallet.publicKey

  const signature = await wallet.sendTransaction(transaction, connection)
  await connection.confirmTransaction(signature, 'confirmed')
}

/**
 * Get file vault data
 */
export async function getVault(
  connection: Connection,
  vaultAddress: PublicKey
): Promise<FileVaultData | null> {
  return await getVaultSDK(connection, vaultAddress)
}

/**
 * Get all vaults for a user
 */
export async function getUserVaults(
  connection: Connection,
  owner: PublicKey
): Promise<FileVaultData[]> {
  // In production, use getProgramAccounts with filters
  // For now, return empty array (client should track vaults)
  return []
}
