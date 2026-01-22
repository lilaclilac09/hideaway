import { useState, useCallback } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { shareFile } from '../services/hideaway'
import './ShareDialog.css'

interface ShareDialogProps {
  vaultAddress: string
  fileName: string
  onClose: () => void
  onShared?: () => void
}

export default function ShareDialog({
  vaultAddress,
  fileName,
  onClose,
  onShared,
}: ShareDialogProps) {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [shareType, setShareType] = useState<'mpc' | 'timelock' | 'lit'>('timelock')
  const [isSharing, setIsSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [mpcShareCount, setMpcShareCount] = useState(3)
  const [timeLockDate, setTimeLockDate] = useState('')
  const [accessFlags, setAccessFlags] = useState(0)

  const handleShare = useCallback(async () => {
    if (!wallet.publicKey) {
      setError('Please connect your wallet')
      return
    }

    setIsSharing(true)
    setError(null)

    try {
      const options: any = {}

      switch (shareType) {
        case 'mpc':
          if (mpcShareCount < 2 || mpcShareCount > 10) {
            throw new Error('MPC share count must be between 2 and 10')
          }
          options.mpcShareCount = mpcShareCount
          break

        case 'timelock':
          if (!timeLockDate) {
            throw new Error('Please select a time lock date')
          }
          const timestamp = Math.floor(new Date(timeLockDate).getTime() / 1000)
          if (timestamp <= Date.now() / 1000) {
            throw new Error('Time lock date must be in the future')
          }
          options.timeLockExpiry = timestamp
          break

        case 'lit':
          options.accessFlags = accessFlags
          break
      }

      await shareFile(
        connection,
        wallet,
        new PublicKey(vaultAddress),
        shareType,
        options
      )

      if (onShared) {
        onShared()
      }
      onClose()
    } catch (err) {
      console.error('Share error:', err)
      setError(err instanceof Error ? err.message : 'Failed to share file')
    } finally {
      setIsSharing(false)
    }
  }, [
    shareType,
    mpcShareCount,
    timeLockDate,
    accessFlags,
    wallet,
    connection,
    vaultAddress,
    onClose,
    onShared,
  ])

  return (
    <div className="share-dialog-overlay" onClick={onClose}>
      <div className="share-dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="share-dialog-header">
          <h2>Share File</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="share-dialog-body">
          <div className="file-info">
            <p><strong>File:</strong> {fileName}</p>
            <p><strong>Vault:</strong> {vaultAddress.substring(0, 16)}...</p>
          </div>

          <div className="share-type-selector">
            <label>Share Type:</label>
            <div className="share-type-options">
              <label className="share-type-option">
                <input
                  type="radio"
                  value="timelock"
                  checked={shareType === 'timelock'}
                  onChange={(e) => setShareType(e.target.value as 'timelock')}
                />
                <span>Time Lock</span>
                <small>Unlock on a future date</small>
              </label>

              <label className="share-type-option">
                <input
                  type="radio"
                  value="mpc"
                  checked={shareType === 'mpc'}
                  onChange={(e) => setShareType(e.target.value as 'mpc')}
                />
                <span>MPC Sharing</span>
                <small>Multi-party computation</small>
              </label>

              <label className="share-type-option">
                <input
                  type="radio"
                  value="lit"
                  checked={shareType === 'lit'}
                  onChange={(e) => setShareType(e.target.value as 'lit')}
                />
                <span>Lit Conditions</span>
                <small>Custom access conditions</small>
              </label>
            </div>
          </div>

          {shareType === 'timelock' && (
            <div className="share-form-section">
              <label htmlFor="time-lock-date">
                Unlock Date & Time:
              </label>
              <input
                id="time-lock-date"
                type="datetime-local"
                value={timeLockDate}
                onChange={(e) => setTimeLockDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="form-input"
              />
              <p className="form-help">
                The file will be accessible after this date
              </p>
            </div>
          )}

          {shareType === 'mpc' && (
            <div className="share-form-section">
              <label htmlFor="mpc-share-count">
                Number of Shares (2-10):
              </label>
              <input
                id="mpc-share-count"
                type="number"
                min="2"
                max="10"
                value={mpcShareCount}
                onChange={(e) => setMpcShareCount(parseInt(e.target.value) || 2)}
                className="form-input"
              />
              <p className="form-help">
                File will be split into {mpcShareCount} shares. All shares needed to decrypt.
              </p>
            </div>
          )}

          {shareType === 'lit' && (
            <div className="share-form-section">
              <label htmlFor="access-flags">
                Access Flags (bitmask):
              </label>
              <input
                id="access-flags"
                type="number"
                min="0"
                max="255"
                value={accessFlags}
                onChange={(e) => setAccessFlags(parseInt(e.target.value) || 0)}
                className="form-input"
              />
              <div className="access-flags-info">
                <label>
                  <input
                    type="checkbox"
                    checked={(accessFlags & 0x01) !== 0}
                    onChange={(e) => setAccessFlags(e.target.checked ? accessFlags | 0x01 : accessFlags & ~0x01)}
                  />
                  Require ZK Proof
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={(accessFlags & 0x04) !== 0}
                    onChange={(e) => setAccessFlags(e.target.checked ? accessFlags | 0x04 : accessFlags & ~0x04)}
                  />
                  Enable Lit Conditions
                </label>
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <div className="share-actions">
            <button
              onClick={handleShare}
              disabled={isSharing || !wallet.connected}
              className="share-btn"
            >
              {isSharing ? 'Sharing...' : 'Configure Share'}
            </button>
            <button
              onClick={onClose}
              disabled={isSharing}
              className="cancel-btn"
            >
              Cancel
            </button>
          </div>

          {!wallet.connected && (
            <div className="wallet-notice">
              <p>⚠️ Please connect your wallet to share files</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
