import { useState, useCallback } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { uploadFile } from '../services/hideaway'
import './FileUpload.css'

interface FileUploadProps {
  onFileUploaded: (file: {
    fileHash: string
    cid: string
    fileName: string
    uploadedAt: Date
    vaultAddress: string
  }) => void
}

export default function FileUpload({ onFileUploaded }: FileUploadProps) {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (!wallet.connected) {
      alert('Please connect your wallet first')
      return
    }

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      await uploadFiles(files)
    }
  }, [wallet, connection])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!wallet.connected) {
      alert('Please connect your wallet first')
      return
    }

    const files = e.target.files
    if (files && files.length > 0) {
      await uploadFiles(Array.from(files))
    }
  }, [wallet, connection])

  const uploadFiles = async (files: File[]) => {
    setIsUploading(true)

    try {
      for (const file of files) {
        setUploadProgress(`Uploading ${file.name}...`)
        
        const uploadedFile = await uploadFile(
          connection,
          wallet,
          file
        )

        setUploadProgress(`✓ ${file.name} uploaded successfully`)
        onFileUploaded(uploadedFile)

        // Small delay between uploads
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      setUploadProgress('')
    } catch (error) {
      console.error('Upload error:', error)
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setUploadProgress('')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="file-upload-container">
      <div
        className={`file-upload-dropzone ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="dropzone-content">
          <div className="dropzone-icon">📁</div>
          <h3>Drop files here or click to select</h3>
          <p>Files will be hashed, encrypted, and stored on IPFS with on-chain verification</p>
          <input
            type="file"
            id="file-input"
            multiple
            onChange={handleFileSelect}
            disabled={isUploading || !wallet.connected}
            className="file-input"
          />
          <label htmlFor="file-input" className="file-input-label">
            {isUploading ? 'Uploading...' : 'Choose Files'}
          </label>
        </div>
      </div>

      {uploadProgress && (
        <div className="upload-progress">
          {uploadProgress}
        </div>
      )}

      {!wallet.connected && (
        <div className="wallet-notice">
          <p>⚠️ Please connect your Solana wallet to upload files</p>
        </div>
      )}
    </div>
  )
}
