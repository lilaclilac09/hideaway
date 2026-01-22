import { useState, useCallback } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { accessFile, getVault } from '../services/hideaway'
import { downloadFromIpfs } from '../services/ipfs'
import { decryptWithLit } from '../services/lit'
import { hashFile } from '../services/hashing'
import './AccessModal.css'

interface AccessModalProps {
  vaultAddress: string
  fileHash: string
  fileName: string
  onClose: () => void
  onAccessGranted?: (fileData: Uint8Array) => void
}

export default function AccessModal({
  vaultAddress,
  fileHash,
  fileName,
  onClose,
  onAccessGranted,
}: AccessModalProps) {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [vaultData, setVaultData] = useState<any>(null)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setError(null)
    }
  }, [])

  const handleVerifyAndAccess = useCallback(async () => {
    if (!selectedFile || !wallet.publicKey) {
      setError('Please select a file and connect your wallet')
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      // 1. Get vault data
      const vault = await getVault(connection, new PublicKey(vaultAddress))
      if (!vault) {
        throw new Error('Vault not found')
      }
      setVaultData(vault)

      // 2. Hash the selected file with the stored salt
      const fileHashBytes = await hashFile(selectedFile, vault.salt)

      // 3. Verify hash matches
      const storedHash = Buffer.from(vault.fileHash).toString('hex')
      const providedHash = Buffer.from(fileHashBytes).toString('hex')

      if (storedHash !== providedHash) {
        throw new Error('Hash mismatch - file integrity check failed')
      }

      // 4. Request access on-chain
      await accessFile(
        connection,
        wallet,
        new PublicKey(vaultAddress),
        fileHashBytes
      )

      // 5. Download from IPFS
      setIsDownloading(true)
      const encryptedCid = vault.encryptedCid
      
      // 6. Decrypt CID (if encrypted with Lit)
      let cid: string
      if (vault.has_lit_conditions && vault.accessFlags & 0x04) {
        // Decrypt using Lit Protocol
        cid = await decryptWithLit(
          encryptedCid,
          '', // encryptedSymmetricKey - would need to be stored separately
          [] // accessConditions
        )
      } else {
        cid = encryptedCid
      }

      // 7. Download file from IPFS
      const fileData = await downloadFromIpfs(cid)

      // 8. Notify parent component
      if (onAccessGranted) {
        onAccessGranted(fileData)
      }

      // 9. Create download link
      const blob = new Blob([fileData])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

    } catch (err) {
      console.error('Access error:', err)
      setError(err instanceof Error ? err.message : 'Failed to access file')
    } finally {
      setIsVerifying(false)
      setIsDownloading(false)
    }
  }, [selectedFile, wallet, connection, vaultAddress, fileName, onAccessGranted])

  return (
    <div className="access-modal-overlay" onClick={onClose}>
      <div className="access-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="access-modal-header">
          <h2>Access File</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="access-modal-body">
          <div className="file-info">
            <p><strong>File:</strong> {fileName}</p>
            <p><strong>Hash:</strong> {fileHash.substring(0, 32)}...</p>
            <p><strong>Vault:</strong> {vaultAddress.substring(0, 16)}...</p>
          </div>

          <div className="file-select-section">
            <label htmlFor="verify-file-input">
              Select the file to verify and access:
            </label>
            <input
              id="verify-file-input"
              type="file"
              onChange={handleFileSelect}
              disabled={isVerifying || isDownloading}
              className="file-input"
            />
            {selectedFile && (
              <p className="selected-file">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          {vaultData && (
            <div className="vault-status">
              <h3>Vault Status</h3>
              <ul>
                <li>Owner: {vaultData.owner.toString().substring(0, 16)}...</li>
                <li>Uploaded: {new Date(vaultData.uploadedAt * 1000).toLocaleString()}</li>
                <li>Time Lock: {vaultData.timeLockExpiry > 0 
                  ? new Date(vaultData.timeLockExpiry * 1000).toLocaleString()
                  : 'None'}
                </li>
                <li>MPC Shares: {vaultData.mpcShareCount}</li>
                <li>ZK Proof Required: {vaultData.requires_zk_proof ? 'Yes' : 'No'}</li>
                <li>Lit Conditions: {vaultData.has_lit_conditions ? 'Yes' : 'No'}</li>
              </ul>
            </div>
          )}

          <div className="access-actions">
            <button
              onClick={handleVerifyAndAccess}
              disabled={!selectedFile || isVerifying || isDownloading || !wallet.connected}
              className="access-btn"
            >
              {isVerifying && 'Verifying...'}
              {isDownloading && 'Downloading...'}
              {!isVerifying && !isDownloading && 'Verify & Access'}
            </button>
          </div>

          {!wallet.connected && (
            <div className="wallet-notice">
              <p>⚠️ Please connect your wallet to access files</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
