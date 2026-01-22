import { useState } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { getVault } from '../services/hideaway'
import AccessModal from './AccessModal'
import ShareDialog from './ShareDialog'
import './FileList.css'

interface File {
  fileHash: string
  cid: string
  fileName: string
  uploadedAt: Date
  vaultAddress: string
}

interface FileListProps {
  files: File[]
}

export default function FileList({ files }: FileListProps) {
  const { connection } = useConnection()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [vaultData, setVaultData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showAccessModal, setShowAccessModal] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)

  const handleViewVault = async (file: File) => {
    setSelectedFile(file)
    setLoading(true)
    try {
      const vault = await getVault(connection, new PublicKey(file.vaultAddress))
      setVaultData(vault)
    } catch (error) {
      console.error('Error fetching vault:', error)
      alert('Failed to fetch vault data')
    } finally {
      setLoading(false)
    }
  }

  const handleAccessFile = (file: File) => {
    setSelectedFile(file)
    setShowAccessModal(true)
  }

  const handleShareFile = (file: File) => {
    setSelectedFile(file)
    setShowShareDialog(true)
  }

  return (
    <div className="file-list-container">
      <h2>Your Files</h2>
      {files.length === 0 ? (
        <p className="empty-message">No files uploaded yet</p>
      ) : (
        <div className="file-grid">
          {files.map((file, index) => (
            <div key={index} className="file-card">
              <div className="file-icon">📄</div>
              <div className="file-info">
                <h3 className="file-name">{file.fileName}</h3>
                <p className="file-hash">
                  Hash: {file.fileHash.substring(0, 16)}...
                </p>
                <p className="file-cid">
                  IPFS: {file.cid.substring(0, 20)}...
                </p>
                <p className="file-date">
                  {file.uploadedAt.toLocaleString()}
                </p>
              </div>
              <div className="file-actions">
                <button
                  onClick={() => handleViewVault(file)}
                  className="view-vault-btn"
                  disabled={loading}
                >
                  {loading && selectedFile === file ? 'Loading...' : 'View Vault'}
                </button>
                <button
                  onClick={() => handleAccessFile(file)}
                  className="access-btn"
                >
                  Access
                </button>
                <button
                  onClick={() => handleShareFile(file)}
                  className="share-btn"
                >
                  Share
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedFile && vaultData && (
        <div className="vault-modal">
          <div className="vault-modal-content">
            <h3>Vault Details</h3>
            <div className="vault-details">
              <p><strong>File:</strong> {selectedFile.fileName}</p>
              <p><strong>Owner:</strong> {vaultData.owner.toString()}</p>
              <p><strong>Hash:</strong> {Buffer.from(vaultData.fileHash).toString('hex')}</p>
              <p><strong>IPFS CID:</strong> {vaultData.encryptedCid}</p>
              <p><strong>Uploaded:</strong> {new Date(vaultData.uploadedAt * 1000).toLocaleString()}</p>
              <p><strong>Time Lock:</strong> {vaultData.timeLockExpiry > 0 ? new Date(vaultData.timeLockExpiry * 1000).toLocaleString() : 'None'}</p>
              <p><strong>MPC Shares:</strong> {vaultData.mpcShareCount}</p>
              <p><strong>Access Flags:</strong> {vaultData.accessFlags.toString(2).padStart(8, '0')}</p>
            </div>
            <div className="vault-actions">
              <button onClick={() => handleAccessFile(selectedFile)} className="access-btn">
                Access File
              </button>
              <button onClick={() => handleShareFile(selectedFile)} className="share-btn">
                Share File
              </button>
              <button onClick={() => setSelectedFile(null)} className="close-btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedFile && showAccessModal && (
        <AccessModal
          vaultAddress={selectedFile.vaultAddress}
          fileHash={selectedFile.fileHash}
          fileName={selectedFile.fileName}
          onClose={() => {
            setShowAccessModal(false)
            setSelectedFile(null)
          }}
        />
      )}

      {selectedFile && showShareDialog && (
        <ShareDialog
          vaultAddress={selectedFile.vaultAddress}
          fileName={selectedFile.fileName}
          onClose={() => {
            setShowShareDialog(false)
            setSelectedFile(null)
          }}
        />
      )}
    </div>
  )
}
