# How to Run and Test HideAway

Complete guide for running and testing the HideAway encrypted file vault application.

## Prerequisites

### 1. Install Required Tools

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Verify installations
rustc --version
solana --version
cargo --version

# Install Node.js 18+ (if not installed)
# Visit https://nodejs.org/ or use nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### 2. Install Solana Build Tools

```bash
# Install Solana build tools
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

## Step 1: Build the Solana Program

### Navigate to Program Directory

```bash
cd hideaway/programs/hideaway
```

### Build the Program

```bash
# Build for Solana
cargo build-sbf

# This creates the program at:
# target/deploy/hideaway.so
```

### Expected Output

```
Compiling hideaway v0.1.0
...
Finished release [optimized] target(s) in X.XXs
```

## Step 2: Start Local Solana Validator

### Terminal 1: Start Validator

```bash
# Start local validator
solana-test-validator

# Keep this terminal open - validator runs in foreground
```

The validator will start on `http://127.0.0.1:8899`

### Terminal 2: Configure Solana CLI

```bash
# Set to localhost
solana config set --url localhost

# Check configuration
solana config get

# Airdrop SOL for testing
solana airdrop 10
```

## Step 3: Deploy the Program

### Deploy to Local Validator

```bash
# From hideaway/programs/hideaway directory
solana program deploy target/deploy/hideaway.so

# Note the Program Id from output, e.g.:
# Program Id: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
```

### Update Program ID

Update the program ID in these files:

**1. `hideaway/client/src/index.ts`:**
```typescript
export const HIDEAWAY_PROGRAM_ID = new PublicKey("YOUR_PROGRAM_ID_HERE");
```

**2. `hideaway/frontend/src/services/hideaway.ts`:**
```typescript
const HIDEAWAY_PROGRAM_ID = new PublicKey("YOUR_PROGRAM_ID_HERE");
```

## Step 4: Install Frontend Dependencies

```bash
cd hideaway/frontend

# Install dependencies
npm install

# Install additional dependencies if needed
npm install @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets @solana/web3.js crypto-js ipfs-core lit-js-sdk
```

## Step 5: Install Client SDK Dependencies

```bash
cd hideaway/client

# Install dependencies
npm install

# Install Solana dependencies
npm install @solana/web3.js bs58
```

## Step 6: Run the Frontend

```bash
cd hideaway/frontend

# Start development server
npm run dev

# Frontend will be available at:
# http://localhost:5173 (or port shown in terminal)
```

## Step 7: Connect Wallet and Test

### 1. Open Browser

Navigate to `http://localhost:5173`

### 2. Connect Wallet

- Click "Connect Wallet"
- Select Phantom, Solflare, or other Solana wallet
- Approve connection
- Make sure wallet is connected to **localhost** (not mainnet/devnet)

### 3. Test File Upload

1. **Select a File**
   - Drag and drop a file or click to select
   - File should be small for testing (< 1MB recommended)

2. **Upload Process**
   - File will be hashed (SHA-256 + salt)
   - Uploaded to IPFS (local node or gateway)
   - CID encrypted (if Lit Protocol configured)
   - Transaction sent to Solana
   - Wait for confirmation

3. **Verify Upload**
   - Check file appears in vault list
   - Click "View Vault" to see on-chain data
   - Verify hash and CID are displayed

### 4. Test File Access

1. **Select File from List**
   - Click "Access" button on a file card

2. **Verify Hash**
   - Select the same file from your computer
   - Click "Verify & Access"
   - System will:
     - Hash the file with stored salt
     - Compare with on-chain hash
     - Grant access if match
     - Download from IPFS

3. **Test Hash Mismatch**
   - Try accessing with a different file
   - Should show "Hash mismatch" error

### 5. Test File Sharing

1. **Select File**
   - Click "Share" button on a file card

2. **Configure Time Lock**
   - Select "Time Lock" option
   - Set future date/time
   - Click "Configure Share"
   - Verify transaction succeeds

3. **Test MPC Sharing**
   - Select "MPC Sharing" option
   - Set share count (2-10)
   - Configure and verify

## Testing Checklist

### ✅ Basic Functionality

- [ ] Program builds successfully
- [ ] Program deploys to local validator
- [ ] Frontend starts without errors
- [ ] Wallet connects successfully
- [ ] File upload works
- [ ] File appears in vault list
- [ ] Vault data displays correctly

### ✅ Access Control

- [ ] File access with correct hash works
- [ ] File access with wrong hash fails
- [ ] Owner can always access
- [ ] Time lock prevents premature access
- [ ] Time lock allows access after expiry

### ✅ Sharing Features

- [ ] Time lock sharing configures
- [ ] MPC sharing configures
- [ ] Lit conditions configure (if implemented)
- [ ] Share settings persist on-chain

### ✅ Error Handling

- [ ] Invalid file hash shows error
- [ ] Missing wallet shows error
- [ ] Network errors handled gracefully
- [ ] Transaction failures show messages

## Manual Testing Scripts

### Test File Hashing (Rust)

```bash
cd hideaway/scripts

# Build the scripts
cargo build --release

# Test hashing
cargo run --bin test_hideaway

# Hash a specific file
cargo run --bin hash_file -- path/to/your/file.pdf

# Or use the release binaries directly
./target/release/test_hideaway
./target/release/hash_file path/to/your/file.pdf
```

### Test Program Instructions (Rust)

```bash
cd hideaway/programs/hideaway

# Run unit tests
cargo test

# Run specific test
cargo test test_instruction_discriminators
```

## Troubleshooting

### Problem: Program Won't Build

```bash
# Clean and rebuild
cargo clean
cargo build-sbf

# Check Rust version
rustc --version  # Should be 1.70+
```

### Problem: Validator Won't Start

```bash
# Kill existing validator
pkill solana-test-validator

# Start fresh
solana-test-validator --reset
```

### Problem: Wallet Won't Connect

```bash
# Ensure wallet is set to localhost
# In Phantom: Settings > Developer Mode > Change Network > Localhost

# Or use Solana CLI to generate test keypair
solana-keygen new --outfile ~/.config/solana/test-keypair.json
```

### Problem: Transaction Fails

```bash
# Check you have SOL
solana balance

# Airdrop more if needed
solana airdrop 10

# Check program is deployed
solana program show YOUR_PROGRAM_ID
```

### Problem: IPFS Not Working

```bash
# Option 1: Use public IPFS gateway
# Edit hideaway/frontend/src/services/ipfs.ts
# Use: https://ipfs.io/ipfs/ or https://gateway.pinata.cloud/ipfs/

# Option 2: Run local IPFS node
ipfs daemon
```

### Problem: Frontend Build Errors

```bash
# Clear node_modules and reinstall
cd hideaway/frontend
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run build
```

## Automated Testing

### Run All Tests

```bash
# Backend tests
cd hideaway/programs/hideaway
cargo test

# Frontend tests (if configured)
cd hideaway/frontend
npm test

# Integration tests (if configured)
cd hideaway
npm test
```

## Performance Testing

### Test Upload Speed

```bash
# Upload files of different sizes
# Small: < 100KB
# Medium: 100KB - 1MB
# Large: > 1MB

# Measure:
# - Hash generation time
# - IPFS upload time
# - Transaction confirmation time
```

### Test Concurrent Uploads

```bash
# Upload multiple files simultaneously
# Verify all transactions succeed
# Check vault list shows all files
```

## Security Testing

### Test Access Control

```bash
# 1. Upload file with wallet A
# 2. Try to access with wallet B (should fail)
# 3. Try to access with wallet A (should succeed)
# 4. Verify hash mismatch fails
```

### Test Time Locks

```bash
# 1. Upload file with time lock (future date)
# 2. Try to access immediately (should fail)
# 3. Wait until time lock expires
# 4. Try to access (should succeed)
```

## Next Steps

1. **Deploy to Devnet**
   ```bash
   solana config set --url devnet
   solana airdrop 2
   solana program deploy target/deploy/hideaway.so --url devnet
   ```

2. **Deploy to Mainnet** (after security audit)
   ```bash
   solana config set --url mainnet-beta
   solana program deploy target/deploy/hideaway.so --url mainnet-beta
   ```

3. **Set Up IPFS Pinning**
   - Use Pinata or other pinning service
   - Configure in `hideaway/frontend/src/services/ipfs.ts`

4. **Configure Lit Protocol**
   - Set up Lit Protocol account
   - Configure access conditions
   - Test encryption/decryption

---

**Happy Testing! 🔒**

For issues, check the logs in browser console and validator terminal.
