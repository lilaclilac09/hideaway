# HideAway Architecture

## Overview

HideAway is a decentralized file vault system that combines:
- **On-chain verification** (Solana) for tamper-proof hash commitments
- **Off-chain storage** (IPFS) for encrypted file content
- **Advanced access controls** (ZK proofs, MPC, Lit Protocol)

## System Architecture

```
┌─────────────────┐
│   React Frontend │
│  (File Upload)   │
└────────┬─────────┘
         │
         ├─► Hash File (crypto-js)
         ├─► Upload to IPFS
         ├─► Encrypt CID (Lit)
         └─► Store Hash on Solana
              │
              ▼
┌─────────────────────────┐
│   Solana Program         │
│   (FileVault Account)    │
│   - File Hash (32 bytes) │
│   - Salt (32 bytes)      │
│   - Encrypted CID        │
│   - Access Flags         │
└─────────────────────────┘
              │
              ├─► ZK Proof Verification (Bonsol)
              ├─► MPC Sharing (Arcium)
              └─► Lit Conditions
```

## Data Flow

### Upload Flow

1. **User selects file** → Frontend
2. **Generate salt** → Random 32 bytes
3. **Hash file** → SHA-256(file + salt)
4. **Upload to IPFS** → Get CID
5. **Encrypt CID** → Lit Protocol (optional)
6. **Create transaction** → UploadFile instruction
7. **Sign & send** → Solana network
8. **Store on-chain** → FileVault PDA account

### Access Flow

1. **User requests access** → Frontend
2. **Fetch vault data** → From Solana
3. **Verify hash** → Compare with local file
4. **Check access control**:
   - Owner? → Grant access
   - ZK proof? → Verify proof
   - MPC share? → Verify share
   - Lit condition? → Verify condition
   - Time lock? → Check expiry
5. **Download from IPFS** → Using CID
6. **Decrypt** → Using Lit Protocol (if encrypted)

## On-Chain Structure

### FileVault Account (323 bytes)

```
┌─────────────────┬──────┬─────────────────────────────────┐
│ Discriminator   │  8   │ "hideaway"                      │
│ Bump            │  1   │ PDA bump seed                    │
│ Owner           │ 32   │ File owner Pubkey                │
│ File Hash       │ 32   │ SHA-256(file + salt)             │
│ Salt            │ 32   │ Random salt                      │
│ Encrypted CID   │128   │ IPFS CID (encrypted)             │
│ CID Length      │  1   │ Actual CID length                │
│ Uploaded At     │  8   │ Unix timestamp (i64)             │
│ Time Lock       │  8   │ Expiry timestamp (i64)           │
│ MPC Share Count │  1   │ Number of MPC shares             │
│ Access Flags    │  1   │ ZK/MPC/Lit flags                 │
│ Padding         │ 71   │ Reserved                         │
└─────────────────┴──────┴─────────────────────────────────┘
```

### PDA Derivation

```
FileVault PDA = PDA(
  seeds: ["file_vault", owner, file_hash, bump],
  program_id
)
```

## Instructions

### UploadFile (Discriminator: 0)

**Accounts:**
- `[signer]` owner
- `[writable]` file_vault (PDA)
- `[]` system_program

**Data:**
- file_hash: [u8; 32]
- salt: [u8; 32]
- encrypted_cid_length: u8
- encrypted_cid: [u8; length]

### AccessFile (Discriminator: 1)

**Accounts:**
- `[signer]` accessor
- `[]` file_vault

**Data:**
- file_hash: [u8; 32]
- zk_proof_length: u8
- zk_proof: [u8; length] (optional)

### ShareFile (Discriminator: 2)

**Accounts:**
- `[signer]` owner
- `[writable]` file_vault

**Data:**
- share_type: u8 (0=MPC, 1=TimeLock, 2=LitCondition)
- share_data: varies by type

## Security Model

### Hash Verification

- **Salted hashes** prevent rainbow table attacks
- **On-chain commitments** prevent tampering
- **Hash mismatch** → Access denied

### Access Control Layers

1. **Owner Check**: File owner always has access
2. **ZK Proof**: Verify access without revealing file
3. **MPC Sharing**: Multi-party computation for group access
4. **Time Locks**: Schedule access for future dates
5. **Lit Conditions**: Age-based or custom conditions

### Encryption

- **File content**: Encrypted before IPFS upload (optional)
- **CID**: Encrypted with Lit Protocol before on-chain storage
- **Symmetric keys**: Managed by Lit Protocol with access conditions

## Integration Points

### IPFS

```typescript
// Upload
const cid = await uploadToIpfs(file)

// Download
const fileData = await downloadFromIpfs(cid)
```

### Lit Protocol

```typescript
// Encrypt with conditions
const { encryptedData, encryptedSymmetricKey } = await encryptWithLit(
  data,
  accessConditions
)

// Decrypt
const decrypted = await decryptWithLit(
  encryptedData,
  encryptedSymmetricKey,
  accessConditions
)
```

### ZK Proofs (Bonsol)

```rust
// In access_file.rs
// TODO: Verify ZK proof
if vault.requires_zk_proof() {
    // Verify proof against public inputs
    // verify_zk_proof(proof, public_inputs)?
}
```

### MPC (Arcium)

```rust
// In share_file.rs
// TODO: Set up MPC sharing
if share_type == MPC {
    vault.mpc_share_count = mpc_share_count;
    vault.access_flags |= 0x02;
}
```

## Performance Considerations

### On-Chain Costs

- **Account creation**: ~0.001 SOL (rent exemption)
- **Upload transaction**: ~0.000005 SOL (base fee)
- **Access transaction**: ~0.000005 SOL (base fee)
- **Share transaction**: ~0.000005 SOL (base fee)

### Off-Chain Costs

- **IPFS storage**: Free (decentralized)
- **IPFS pinning**: Optional paid service
- **Lit Protocol**: Gas fees for encryption/decryption

## Scalability

- **File size**: Limited by IPFS (practically unlimited)
- **On-chain data**: Only hash + CID (323 bytes per file)
- **Throughput**: Limited by Solana TPS (~3000 TPS)
- **Storage**: IPFS handles large files efficiently

## Future Enhancements

- [ ] File versioning
- [ ] Batch uploads
- [ ] File compression
- [ ] CDN integration
- [ ] Mobile app
- [ ] Browser extension
