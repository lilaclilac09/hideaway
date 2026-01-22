# Quick Test Guide - HideAway

Fast setup and test instructions for HideAway.

## Quick Start (5 minutes)

### 1. Build Program

```bash
cd hideaway/programs/hideaway
cargo build-sbf
```

### 2. Start Validator (Terminal 1)

```bash
solana-test-validator
```

### 3. Deploy Program (Terminal 2)

```bash
solana config set --url localhost
solana airdrop 10
cd hideaway/programs/hideaway
solana program deploy target/deploy/hideaway.so
# Copy the Program Id from output
```

### 4. Update Program ID

Edit `hideaway/client/src/index.ts`:
```typescript
export const HIDEAWAY_PROGRAM_ID = new PublicKey("PASTE_PROGRAM_ID_HERE");
```

Edit `hideaway/frontend/src/services/hideaway.ts`:
```typescript
const HIDEAWAY_PROGRAM_ID = new PublicKey("PASTE_PROGRAM_ID_HERE");
```

### 5. Install & Run Frontend

```bash
cd hideaway/frontend
npm install
npm run dev
```

### 6. Test in Browser

1. Open http://localhost:5173
2. Connect wallet (set to localhost)
3. Upload a test file
4. Verify it appears in list
5. Click "Access" and verify with same file

## Test Checklist

- [ ] Program builds
- [ ] Validator running
- [ ] Program deployed
- [ ] Frontend starts
- [ ] Wallet connects
- [ ] File uploads
- [ ] File appears in list
- [ ] Access works with correct file
- [ ] Access fails with wrong file

## Common Issues

**Validator won't start?**
```bash
pkill solana-test-validator
solana-test-validator --reset
```

**No SOL?**
```bash
solana airdrop 10
```

**Build fails?**
```bash
cargo clean
cargo build-sbf
```

**Frontend errors?**
```bash
cd hideaway/frontend
rm -rf node_modules
npm install
```

---

That's it! You're ready to test HideAway.
