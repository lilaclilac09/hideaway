import { useState, useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import FileUpload from './components/FileUpload'
import FileList from './components/FileList'
import './App.css'

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css'

function App() {
  const network = WalletAdapterNetwork.Devnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network])

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  )

  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    fileHash: string
    cid: string
    fileName: string
    uploadedAt: Date
    vaultAddress: string
  }>>([])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="app">
            <header className="app-header">
              <h1>🔒 HideAway</h1>
              <p className="subtitle">Private File Vault on Solana</p>
              <p className="description">
                Upload files with on-chain hash verification, encrypted IPFS storage,
                and advanced access controls (ZK proofs, MPC sharing, time-locks)
              </p>
            </header>

            <main className="app-main">
              <FileUpload onFileUploaded={(file) => {
                setUploadedFiles(prev => [...prev, file])
              }} />

              {uploadedFiles.length > 0 && (
                <FileList files={uploadedFiles} />
              )}
            </main>

            <footer className="app-footer">
              <p>
                Built for Tokyo's youth navigating shared devices • 
                Powered by Solana, IPFS, ZK Proofs, MPC, and Lit Protocol
              </p>
            </footer>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default App
