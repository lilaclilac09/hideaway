# HideAway Local Setup Guide

All files are stored locally in this directory. No external GitHub repository is required.

## Project Location

All HideAway files are located in:
```
/Users/aileen/Downloads/pamm/solana-pamm-analysis/hideaway/
```

## Local File Structure

```
hideaway/
├── programs/           # Solana program (Rust)
│   └── hideaway/
│       └── src/
├── client/            # TypeScript SDK
│   └── src/
├── frontend/          # React frontend
│   └── src/
├── scripts/           # Python utilities
├── README.md          # Main documentation
├── ARCHITECTURE.md    # Technical architecture
├── USER_FLOW.md       # User flow visualizations
├── WORKFLOW_SUMMARY.md # Workflow documentation
├── QUICKSTART.md      # Quick start guide
└── IMPLEMENTATION_COMPLETE.md # Implementation summary
```

## All Files Are Local

- ✅ All source code is saved locally
- ✅ All documentation is saved locally
- ✅ All configuration files are saved locally
- ✅ No external repository dependencies (except build dependencies)

## Building Locally

### 1. Build Solana Program
```bash
cd hideaway/programs/hideaway
cargo build-sbf
```

### 2. Build TypeScript Client
```bash
cd hideaway/client
npm install
npm run build
```

### 3. Run Frontend
```bash
cd hideaway/frontend
npm install
npm run dev
```

## Dependencies

The only external dependencies are:
- **Pinocchio**: Solana framework (via Cargo.toml)
- **npm packages**: Standard Node.js dependencies (via package.json)
- **Rust crates**: Standard Rust dependencies (via Cargo.toml)

All project code and documentation is stored locally in this directory.

## Documentation Files

All documentation is available locally:
- `README.md` - Main project documentation
- `ARCHITECTURE.md` - Technical architecture details
- `USER_FLOW.md` - User flow and workflow visualizations
- `WORKFLOW_SUMMARY.md` - Complete workflow documentation
- `QUICKSTART.md` - Quick start guide
- `IMPLEMENTATION_COMPLETE.md` - Implementation summary
- `LOCAL_SETUP.md` - This file

## No External Repository Required

This project is completely self-contained. All files are saved locally and no GitHub repository is needed to run or develop the application.

---

**Everything is saved locally • No external repository required**
