# HideAway - Private File Vault on Solana

🔒 **HideAway** is a decentralized file vault that stores file hashes on-chain for integrity verification, with encrypted files stored off-chain on IPFS. Built for Tokyo's youth navigating family-shared devices, HideAway provides portable privacy with advanced access controls.

## Features

- **On-Chain Hash Verification**: SHA-256 file hashes stored on Solana for tamper-proof integrity checks
- **IPFS Storage**: Encrypted files stored off-chain on IPFS for decentralized storage
- **Zero-Knowledge Proofs**: Optional ZK proofs for access without revealing file contents (Bonsol integration ready)
- **MPC Sharing**: Multi-party computation for secure file sharing (Arcium integration ready)
- **Time-Locked Access**: Schedule file access for future dates (e.g., "future self")
- **Lit Protocol Conditions**: Age-based and conditional access controls
- **Salted Hashes**: Prevents rainbow table attacks
- **Wallet-Based Authentication**: Access files via Solana wallet proof

## Project Structure

```
hideaway/
├── programs/
│   └── hideaway/          # Solana program (Rust/Pinocchio)
│       └── src/
│           ├── lib.rs     # Program entrypoint
│           ├── state.rs   # FileVault account structure
│           ├── error.rs   # Custom errors
│           ├── pda.rs     # PDA derivation
│           └── instructions/
│               ├── upload_file.rs
│               ├── access_file.rs
│               └── share_file.rs
├── client/                # TypeScript SDK
│   └── src/
│       └── index.ts
├── frontend/              # React frontend
│   └── src/
│       ├── App.tsx
│       ├── components/
│       │   ├── FileUpload.tsx
│       │   └── FileList.tsx
│       └── services/
│           ├── ipfs.ts
│           ├── hashing.ts
│           ├── hideaway.ts
│           └── lit.ts
└── scripts/               # Rust utilities
    ├── src/bin/
    │   ├── hash_file.rs
    │   └── test_hideaway.rs
```

## Architecture

### On-Chain (Solana)

The `FileVault` account (~323 bytes) stores:
- File owner (Pubkey)
- SHA-256 file hash (32 bytes)
- Salt (32 bytes)
- Encrypted IPFS CID (up to 128 bytes)
- Upload timestamp
- Time lock expiry
- MPC share count
- Access control flags

### Off-Chain (IPFS)

Files are encrypted and stored on IPFS. The CID is encrypted and stored on-chain.

### Access Control

1. **Owner Access**: File owner can always access
2. **ZK Proof**: Verify access without revealing file contents
3. **MPC Sharing**: Multi-party computation for group access
4. **Time Locks**: Schedule access for future dates
5. **Lit Conditions**: Age-based or custom access conditions

## Getting Started

### Prerequisites

- Rust (latest stable)
- Solana CLI (v1.18+)
- Node.js 18+

### Build Solana Program

```bash
cd hideaway/programs/hideaway
cargo build-sbf
```

### Build TypeScript Client

```bash
cd hideaway/client
npm install
npm run build
```

### Run Frontend

```bash
cd hideaway/frontend
npm install
npm run dev
```

### Test File Hashing (Rust)

```bash
cd hideaway/scripts

# Build the scripts
cargo build --release

# Test hashing
cargo run --bin test_hideaway

# Hash a specific file
cargo run --bin hash_file -- path/to/file.pdf

# Or use the release binaries directly
./target/release/test_hideaway
./target/release/hash_file path/to/file.pdf
```

## Usage

### Upload a File

1. Connect your Solana wallet (Phantom, Solflare)
2. Drag and drop files or click to select
3. Files are automatically:
   - Hashed with SHA-256 + salt
   - Uploaded to IPFS
   - CID encrypted (Lit Protocol)
   - Hash commitment stored on-chain

### Access a File

1. Select a file from your list
2. Click "View Vault" to see on-chain data
3. Verify hash matches your local file
4. Download from IPFS using the CID

### Share a File

Use the `ShareFile` instruction to set up:
- **MPC Sharing**: Share with multiple parties
- **Time Lock**: Schedule access for future date
- **Lit Conditions**: Age-based or custom conditions

## Example: Upload File

```typescript
import { uploadFile } from '@hideaway/client'
import { Connection, Keypair } from '@solana/web3.js'

const connection = new Connection('https://api.devnet.solana.com')
const wallet = Keypair.generate()

const fileHash = new Uint8Array(32) // Your file hash
const salt = new Uint8Array(32) // Your salt
const encryptedCid = "QmYourIPFSCID..."

const vaultAddress = await uploadFile(
  connection,
  wallet,
  fileHash,
  salt,
  encryptedCid
)
```

## Example: Access File

```typescript
import { accessFile, getFileVault } from '@hideaway/client'

// Get vault data
const vault = await getFileVault(connection, vaultAddress)

// Verify hash matches
if (vault.fileHash === yourFileHash) {
  // Access granted
  await accessFile(connection, wallet, vaultAddress, yourFileHash)
}
```

## Example: Share with Time Lock

```typescript
import { createShareFileInstruction } from '@hideaway/client'

const unlockDate = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year

const transaction = await createShareFileInstruction(
  programId,
  owner,
  fileVault,
  'timelock',
  { timeLockExpiry: unlockDate }
)
```

## Security Considerations

- **Salted Hashes**: Prevents rainbow table attacks
- **Encrypted CIDs**: IPFS CIDs are encrypted before storage
- **Access Control**: Multiple layers of access control (ZK, MPC, Lit)
- **Time Locks**: Prevents premature access
- **On-Chain Verification**: Hash commitments prevent tampering

## Roadmap

- [ ] Bonsol ZK proof integration
- [ ] Arcium MPC integration
- [ ] Lit Protocol full integration
- [ ] Age-based access conditions
- [ ] File versioning
- [ ] Batch uploads
- [ ] Mobile app (React Native)

## Contributing

Contributions welcome! Please contact the project maintainers for contribution guidelines.

## License

MIT

## Acknowledgments

- Built with Pinocchio Solana framework
- IPFS for decentralized storage
- Lit Protocol for conditional access
- Inspired by Tokyo's youth navigating shared devices

---

**Built for privacy • Powered by Solana**
