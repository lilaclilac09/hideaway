# HideAway Quick Start Guide

Get HideAway up and running in minutes!

## Prerequisites

1. **Solana CLI**: Install from [solana.com](https://docs.solana.com/cli/install-solana-cli-tools)
2. **Rust**: Install from [rustup.rs](https://rustup.rs/)
3. **Node.js**: v18+ from [nodejs.org](https://nodejs.org/)

## Step 1: Build the Solana Program

```bash
cd hideaway/programs/hideaway

# Install Solana build tools if needed
# sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Build the program
cargo build-sbf

# Or use Anchor if you prefer
# anchor build
```

## Step 2: Deploy to Devnet

```bash
# Set Solana CLI to devnet
solana config set --url devnet

# Get some SOL for fees (if needed)
solana airdrop 2

# Deploy the program
solana program deploy target/deploy/hideaway.so

# Note the program ID and update it in:
# - hideaway/client/src/index.ts (HIDEAWAY_PROGRAM_ID)
# - hideaway/frontend/src/services/hideaway.ts
```

## Step 3: Set Up TypeScript Client

```bash
cd hideaway/client
npm install
npm run build
```

## Step 4: Set Up Frontend

```bash
cd hideaway/frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173` (or the port Vite assigns).

## Step 5: Test File Hashing

```bash
cd hideaway/scripts

# Build the scripts
cargo build --release

# Run tests
cargo run --bin test_hideaway

# Hash a file
cargo run --bin hash_file -- path/to/your/file.pdf

# Or use the release binaries directly
./target/release/test_hideaway
./target/release/hash_file path/to/your/file.pdf
```

## Step 6: Use HideAway

1. **Open the frontend** in your browser
2. **Connect your Solana wallet** (Phantom, Solflare, etc.)
3. **Upload a file** by dragging and dropping or clicking to select
4. **View your files** in the list below
5. **Click "View Vault"** to see on-chain data

## Example Workflow

### Upload a File

```typescript
import { uploadFile } from '@hideaway/client'
import { Connection, Keypair } from '@solana/web3.js'

const connection = new Connection('https://api.devnet.solana.com')
const wallet = Keypair.generate()

// Hash your file (use crypto-js or Python script)
const fileHash = new Uint8Array(32) // Your SHA-256 hash
const salt = new Uint8Array(32) // Your salt
const encryptedCid = "QmYourIPFSCID..." // From IPFS

const vaultAddress = await uploadFile(
  connection,
  wallet,
  fileHash,
  salt,
  encryptedCid
)

console.log('File vault:', vaultAddress.toString())
```

### Access a File

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

### Share with Time Lock

```typescript
import { createShareFileInstruction } from '@hideaway/client'

// Unlock in 1 year
const unlockDate = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)

const transaction = await createShareFileInstruction(
  programId,
  owner,
  fileVault,
  'timelock',
  { timeLockExpiry: unlockDate }
)

await sendAndConfirmTransaction(connection, transaction, [owner])
```

## Troubleshooting

### Program ID Not Found

Update the `HIDEAWAY_PROGRAM_ID` in:
- `hideaway/client/src/index.ts`
- `hideaway/frontend/src/services/hideaway.ts`

### IPFS Not Working

Make sure you have IPFS installed or use a public gateway:
```typescript
// In hideaway/frontend/src/services/ipfs.ts
// You can use a public IPFS gateway instead:
const IPFS_GATEWAY = 'https://ipfs.io/ipfs/'
```

### Wallet Connection Issues

Make sure you're on devnet and have SOL for fees:
```bash
solana config set --url devnet
solana airdrop 2
```

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Explore ZK proofs with Bonsol
- Set up MPC sharing with Arcium
- Configure Lit Protocol conditions
- Deploy to mainnet (after security audit!)

## Support

Check the documentation for more help.

Happy hiding! 🔒
