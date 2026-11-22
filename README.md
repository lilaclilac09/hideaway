# HideAway - Private File Vault on Solana

🔒 **HideAway** is a prototype for storing file hash commitments on Solana and file bytes on IPFS. It is not a verified private vault and must not be used for sensitive files.

Status: BLOCKED — frontend dependency installation fails and privacy/access integrations are incomplete; next human action: select a supported Lit SDK/integration and validate deployment and encryption before using any files.

Verification scope (2026-11-22): the TypeScript client builds and local hashing checks can run, but this does not prove wallet uploads, private storage, sharing or on-chain authorization. GitHub homepage is unset, Pages is disabled and deployment records are empty; an unlisted deployment has not been ruled out. See [acceptance audit](notes/acceptance-audit-2026-11-22.md).

**Privacy warning:** the current UI upload path sends file bytes directly to IPFS without file encryption and normally stores the CID as plaintext. Salting a hash does not encrypt the file or make its contents private. The SDK program ID is still a placeholder; Bonsol/Arcium/Lit authorization and Clock integration are incomplete. Do not connect a funded wallet or upload personal data to test this prototype. Existing workflow diagrams and implementation checklists describe intended/scaffolded behavior, not observed end-to-end verification.

## Features

- **On-Chain Hash Verification**: SHA-256 file hashes stored on Solana for tamper-proof integrity checks
- **IPFS Storage**: Raw file upload/download service; file encryption is not implemented
- **Zero-Knowledge Proofs**: Bonsol verification TODO; not a verified access control
- **MPC Sharing**: Arcium integration TODO; not functional secure MPC sharing
- **Time-Locked Access**: Fields/instructions scaffolded; current timestamp is a placeholder
- **Lit Protocol Conditions**: Partial integration with placeholder authentication
- **Salted Hashes**: SHA-256 hashing with salt; not file encryption
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

The upload service sends raw file bytes to IPFS. CID encryption is attempted only when a time-lock argument is supplied; the current upload component supplies no such argument, so it uses a plaintext CID. This is not confidential storage.

### Access Control

1. **Owner Access**: File owner can always access
2. **ZK Proof**: Verify access without revealing file contents
3. **MPC Sharing**: Multi-party computation for group access
4. **Time Locks**: Schedule access for future dates
5. **Lit Conditions**: Age-based or custom access conditions

## Getting Started

Current blocker: `frontend/package.json` requests unavailable `lit-js-sdk@^3.1.0`, so the frontend setup below fails during dependency resolution. Selecting another SDK/version requires API compatibility validation; this audit does not silently substitute one.

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
3. The intended flow is below, but it is not end-to-end verified; current upload behavior is described in the privacy warning above:
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

- **Salted hashes are not encryption**: they do not protect raw uploaded file contents.
- **CID confidentiality is incomplete**: normal UI uploads use a plaintext CID.
- **Access controls are incomplete**: ZK/MPC/Lit and time-lock scaffolding is not verified enforcement.
- **On-chain verification is unverified here**: a hash commitment is an integrity mechanism, not an IPFS access gate.

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
