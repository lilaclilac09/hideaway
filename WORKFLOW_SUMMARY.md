# HideAway Workflow Summary

## Overview

HideAway is a decentralized file vault system that enables users to store files privately on Solana with advanced access controls. Files are hashed for integrity verification, encrypted, stored on IPFS, and only cryptographic commitments are stored on-chain.

## Complete User Journey

### 1. Initial Setup
- User opens HideAway frontend
- Connects Solana wallet (Phantom, Solflare, etc.)
- Wallet connection enables all features

### 2. Upload File Flow

```
User Action → Frontend Processing → On-Chain Storage → Confirmation
```

**Steps:**
1. User selects file (drag & drop or file picker)
2. Frontend generates random 32-byte salt
3. File is hashed: `SHA-256(file_content + salt)`
4. File uploaded to IPFS → receives CID
5. CID encrypted with Lit Protocol (optional time-lock conditions)
6. Transaction created with:
   - File hash (32 bytes)
   - Salt (32 bytes)
   - Encrypted CID (up to 128 bytes)
7. Transaction signed and sent to Solana
8. Program creates FileVault PDA account
9. On-chain storage of hash commitment
10. Success confirmation to user

**On-Chain Data Stored:**
- File hash (for integrity verification)
- Salt (for hash verification)
- Encrypted CID (for file retrieval)
- Owner address
- Timestamps
- Access control flags

### 3. Access File Flow

```
User Request → Hash Verification → Access Control Check → File Retrieval
```

**Steps:**
1. User selects file from vault list
2. User selects local file to verify
3. Frontend hashes local file with stored salt
4. Hash comparison:
   - Match → Continue
   - Mismatch → Access denied
5. Access control verification:
   - **Owner Check**: Owner always has access
   - **ZK Proof**: Verify proof if required
   - **MPC Share**: Verify share if enabled
   - **Time Lock**: Check if expired
   - **Lit Condition**: Verify condition met
6. On-chain access transaction (verifies hash match)
7. Decrypt CID (if encrypted with Lit)
8. Download file from IPFS using CID
9. File available to user

### 4. Share File Flow

```
User Selection → Share Type Selection → Configuration → On-Chain Update
```

**Share Types:**

**A. Time Lock Sharing**
- User selects future date/time
- Time lock expiry stored on-chain
- File accessible after expiry date
- Use case: "Future self" access, milestone unlocks

**B. MPC Sharing**
- User sets number of shares (2-10)
- File split using multi-party computation
- All shares required to decrypt
- Use case: Group access, distributed trust

**C. Lit Condition Sharing**
- User configures access conditions:
  - ZK proof required
  - Age-based access
  - NFT ownership
  - Custom conditions
- Conditions stored on-chain
- Lit Protocol enforces conditions
- Use case: Conditional access, age gates

**Steps:**
1. User selects file to share
2. User chooses share type
3. User configures share parameters
4. Transaction created with share configuration
5. On-chain update to FileVault account
6. Access flags updated
7. Share configured successfully

## Technical Architecture

### Frontend Components

```
App.tsx
├── FileUpload.tsx (File selection & upload)
├── FileList.tsx (Vault display)
│   ├── AccessModal.tsx (File access)
│   └── ShareDialog.tsx (Sharing configuration)
└── Services
    ├── hideaway.ts (Solana integration)
    ├── ipfs.ts (IPFS client)
    ├── hashing.ts (SHA-256 hashing)
    └── lit.ts (Lit Protocol)
```

### Backend Program

```
lib.rs (Entrypoint)
├── instructions/
│   ├── upload_file.rs (Store file hash & CID)
│   ├── access_file.rs (Verify hash & access)
│   └── share_file.rs (Configure sharing)
├── state.rs (FileVault account structure)
├── pda.rs (PDA derivation)
└── error.rs (Custom errors)
```

### Data Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Frontend   │─────▶│   IPFS      │      │   Lit       │
│  (React)    │      │  (Storage)  │      │ (Encrypt)   │
└──────┬──────┘      └─────────────┘      └─────────────┘
       │
       ▼
┌─────────────┐
│  Solana     │
│  Program    │
│  (Rust)     │
└─────────────┘
```

## Key Features

### 1. Hash Verification
- **Purpose**: Ensure file integrity
- **Method**: SHA-256(file + salt)
- **Storage**: On-chain (32 bytes)
- **Verification**: Client-side hash comparison

### 2. Encryption
- **CID Encryption**: Lit Protocol
- **File Encryption**: Optional (before IPFS upload)
- **Access Control**: Conditional decryption

### 3. Access Controls
- **Owner Access**: Always granted
- **ZK Proofs**: Privacy-preserving verification (Bonsol)
- **MPC Sharing**: Multi-party computation (Arcium)
- **Time Locks**: Scheduled access
- **Lit Conditions**: Custom access rules

### 4. Off-Chain Storage
- **IPFS**: Decentralized file storage
- **Benefits**: Scalable, no size limits
- **On-Chain**: Only hash + encrypted CID

## Security Model

### Hash Security
- **Salted Hashes**: Prevents rainbow table attacks
- **SHA-256**: Cryptographically secure
- **On-Chain Verification**: Tamper-proof

### Access Security
- **Multi-Layer**: Owner, ZK, MPC, Time, Lit
- **On-Chain Validation**: Access control enforced
- **Private Keys**: Wallet-based authentication

### Storage Security
- **Encrypted CIDs**: IPFS links encrypted
- **Lit Protocol**: Threshold encryption
- **Decentralized**: No single point of failure

## Use Cases

### 1. Personal Privacy (Tokyo Youth)
- Hide personal files on shared devices
- Time-locked access (e.g., age 18)
- Family-proof storage

### 2. Document Verification
- Store important documents
- Prove existence without revealing content
- Hash challenges for timestamps

### 3. Group Collaboration
- MPC sharing for teams
- Conditional access based on roles
- Secure file distribution

### 4. Future Self
- Time-locked messages
- Milestone unlocks
- Personal time capsules

## Development Workflow

### Local Development
1. Start Solana test validator
2. Deploy program to localnet
3. Run frontend dev server
4. Connect wallet to localnet
5. Test upload/access/share flows

### Testing
- Unit tests: Rust program logic
- Integration tests: End-to-end flows
- Frontend tests: Component behavior
- Security tests: Access control validation

### Deployment
1. Build Rust program: `cargo build-sbf`
2. Deploy to Devnet: `solana program deploy`
3. Update frontend with program ID
4. Deploy frontend to hosting
5. Test on Devnet
6. Deploy to Mainnet (when ready)

## Future Enhancements

- [ ] Full Bonsol ZK proof integration
- [ ] Arcium MPC complete implementation
- [ ] Lit Protocol full feature set
- [ ] File versioning
- [ ] Batch uploads
- [ ] Mobile app (React Native)
- [ ] Browser extension
- [ ] AI agent automation
- [ ] File compression
- [ ] CDN integration

## Resources

- **Program ID**: (Set after deployment)
- **Network**: Devnet (initially)
- **IPFS**: Local node or Infura
- **Lit Network**: Serrano (testnet)
- **Documentation**: See README.md and ARCHITECTURE.md

---

**Built for privacy • Powered by Solana**
