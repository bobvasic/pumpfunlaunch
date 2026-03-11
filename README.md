# Pump.fun Token Creator

A comprehensive Solana dApp for creating memecoins on pump.fun and managing liquidity pools on swap.pump.fun. 

**🔥 Now with Python Backend using Ankr SDK!**

Built with React, Material-UI, Solana Web3.js, and a Python FastAPI backend using the official Ankr SDK for advanced blockchain operations.

## Features

### Token Creation
- 🚀 Create new tokens on pump.fun with custom metadata
- 🎨 Upload token images
- 🔗 Add social links (Twitter, Telegram, Website)
- 💰 Optional initial buy to bootstrap liquidity

### Liquidity Pool Management
- 🏊 Create new liquidity pools on swap.pump.fun
- ➕ Add liquidity to existing pools
- ➖ Withdraw all LP tokens back to wallet
- 💱 Buy/Sell tokens through the pool

### Wallet Integration
- 🔌 Connect with Phantom, Solflare, or other Solana wallets
- 💎 View SOL and token balances
- ✅ Secure transaction signing

### Ankr RPC Integration
- ⚡ High-performance Solana RPC via Ankr (Direct Solana endpoint)
- 📦 Batch request support for multiple accounts
- 📊 Token balance aggregation
- 📜 Transaction history queries
- 🔍 Health monitoring and latency tracking
- 🐍 Python SDK for advanced blockchain operations

## Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **UI Library**: Material-UI (MUI) v5
- **Blockchain**: Solana Web3.js + SPL Token
- **Wallet**: Solana Wallet Adapter
- **Build Tool**: Vite

### Backend (Python)
- **Framework**: FastAPI
- **SDK**: Ankr SDK (Python)
- **RPC Provider**: Ankr Multichain
- **Server**: Uvicorn
- **API Docs**: Auto-generated OpenAPI/Swagger

### Architecture
```
┌─────────────────┐      HTTP/WebSocket      ┌──────────────────┐
│  React Frontend │  ◄────────────────────►  │  Python Backend  │
│   (Port 5173)   │                          │   (Port 8000)    │
└─────────────────┘                          └────────┬─────────┘
       │                                              │
       │ Direct RPC                                   │ Ankr SDK
       │                                              │
       └──────────────┬───────────────────────────────┘
                      │
              ┌───────▼─────────┐
              │  Ankr Solana    │
              │  RPC Endpoint   │
              │  (Mainnet)      │
              └─────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Python 3.9+ (for backend)
- A Solana wallet (Phantom, Solflare, etc.)

### Installation

#### 1. Frontend Setup

```bash
# Clone or navigate to the project
cd pumpfun-token-creator

# Install frontend dependencies
npm install

# Start frontend development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

#### 2. Python Backend Setup (Optional but Recommended)

The Python backend uses the **official Ankr SDK** for advanced Solana operations.

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Or with virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file (optional)
echo "ANKR_API_KEY=your_key_here" > .env

# Start the Python backend server
python main.py
```

The backend will be available at `http://localhost:8000`

**Backend Features:**
- ⚡ Ankr SDK integration for optimized RPC calls
- 📦 Batch request support for multiple accounts
- 💰 Real-time token price data
- 📊 Token holder queries
- 📜 Transaction history with pagination
- 🔌 WebSocket support for real-time updates

Access the backend API docs at: http://localhost:8000/docs

### Build for Production

```bash
npm run build
```

## Configuration

### Ankr Solana RPC Configuration

This project uses **Ankr Solana RPC** for reliable mainnet access.

**RPC Endpoint**: `https://rpc.ankr.com/solana/{API_KEY}`

⚠️ **Important**: You must provide your own Ankr API key via environment variables.

- **Network**: Solana Mainnet
- **Free Tier**: 1M requests/day, 30 req/sec
- **Documentation**: https://www.ankr.com/docs/rpc-service/chains/chains-list/solana/

The API key is extracted from the endpoint and configured in:
- **Frontend**: `VITE_ANKR_API_KEY` in `.env`
- **Backend**: `ANKR_API_KEY` in `.env`

To use your own Ankr API key:
1. Sign up at https://www.ankr.com/rpc/
2. Copy your API key
3. Update the `.env` files:
```bash
# frontend/.env
VITE_ANKR_API_KEY=your_api_key_here

# backend/.env
ANKR_API_KEY=your_api_key_here
```

### Program IDs

The following program IDs are used:
- **Pump.fun Program**: `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`
- **swap.pump.fun Program**: Replace with actual program ID in `src/utils/swapPump.ts`

⚠️ **Important**: The swap.pump.fun program ID in this template is a placeholder. You need to replace it with the actual deployed program ID.

## Usage Guide

### 1. Create a Token

1. Connect your wallet
2. Fill in token details:
   - Name (e.g., "Moon Rocket")
   - Symbol (e.g., "MOON")
   - Description
   - Upload token image (required)
   - Optional: Add social links
3. Set initial buy amount (optional)
4. Click "Create Token"
5. Approve the transaction in your wallet

### 2. Create Liquidity Pool

1. Switch to the "Create LP" tab
2. Enter the token mint address
3. Specify:
   - SOL amount to deposit
   - Token amount to deposit
4. Click "Create Liquidity Pool"
5. You'll receive LP tokens representing your pool share

### 3. Add Liquidity

1. Switch to the "Add Liquidity" tab
2. Enter the token mint address
3. Specify amounts to add
4. Click "Add Liquidity"

### 4. Withdraw Liquidity

1. Switch to the "Withdraw LP" tab
2. Enter the token mint address
3. Click "Check LP Balance" to see your position
4. Click "Withdraw All LP" to remove all liquidity
5. You'll receive both SOL and tokens back to your wallet

### 5. Swap Tokens

1. Switch to the "Swap" tab
2. Select Buy or Sell
3. Enter token mint address
4. Specify amount
5. Click "Buy Tokens" or "Sell Tokens"

## Architecture

### Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx      # App header with wallet
│   ├── TokenCreationForm.tsx
│   ├── LiquidityManager.tsx
│   └── WalletButton.tsx
├── hooks/              # Custom React hooks
│   ├── usePumpFun.ts   # Pump.fun interactions
│   ├── useSwapPump.ts  # swap.pump.fun interactions
│   └── useWalletBalance.ts
├── utils/              # Utility functions
│   ├── pumpfun.ts      # Pump.fun program interactions
│   └── swapPump.ts     # swap.pump.fun program interactions
├── App.tsx             # Main app component
└── main.tsx           # Entry point
```

### Key Components

#### Token Creation
Uses pump.fun's bonding curve program to create tokens with:
- Associated token accounts
- Bonding curve PDA
- Metadata upload (IPFS/Arweave integration needed for production)

#### Liquidity Pool
Implements AMM-style liquidity pools on swap.pump.fun:
- LP token minting
- Proportional deposits/withdrawals
- Constant product formula for swaps

## Important Notes

⚠️ **Security Warning**
- This is a template/demo application
- Always verify transaction details before signing
- Test thoroughly on devnet before mainnet use
- Review and audit smart contract interactions

### Program IDs

The pump.fun program ID is publicly known. However, swap.pump.fun program details may need to be updated based on the actual deployed contracts. Always verify program IDs from official sources.

### Transaction Fees

- Token creation: ~0.02 SOL
- LP creation: Variable based on accounts created
- Swaps: Small fee (typically 0.3%)

## Customization

### Theming

Modify the theme in `src/main.tsx`:

```typescript
const theme = createTheme({
  palette: {
    primary: {
      main: '#your-color',
    },
    // ... other customizations
  },
})
```

### Adding New Features

1. Create new components in `src/components/`
2. Add hooks in `src/hooks/`
3. Implement utility functions in `src/utils/`
4. Update `App.tsx` to include new features

## Troubleshooting

### Common Issues

1. **"Program not found"**
   - Verify program IDs are correct
   - Check network connection

2. **"Insufficient funds"**
   - Ensure wallet has enough SOL for rent and fees
   - Check token account rent exemption

3. **Transaction fails**
   - Check slippage settings
   - Verify token accounts exist
   - Review transaction simulation

### Debug Mode

Enable detailed logging:
```typescript
// In browser console
localStorage.setItem('debug', 'solana:*')
```

## License

MIT License - Use at your own risk.

## Disclaimer

This software is provided as-is without any warranties. Cryptocurrency transactions are irreversible. Always test on devnet first and verify all contract interactions. The authors are not responsible for any losses incurred through the use of this software.

## Resources

- [Pump.fun](https://pump.fun)
- [Solana Docs](https://docs.solana.com)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js)
- [SPL Token](https://spl.solana.com/token)
