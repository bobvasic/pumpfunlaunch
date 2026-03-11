# Pump.fun Token Creator - Python Backend

Python FastAPI backend using Ankr SDK with direct Solana RPC endpoint for advanced blockchain operations.

## Features

- 🔗 **Ankr SDK + Direct RPC** - Official Python SDK + Solana RPC
- ⚡ **Batch Requests** - Efficient multi-account queries
- 💰 **Token Prices** - Real-time price data
- 📊 **Transaction History** - Comprehensive tx lookups
- 🏦 **Token Holders** - Query holder distributions
- 🔔 **WebSocket Support** - Real-time updates

## RPC Configuration

**RPC Endpoint**: `https://rpc.ankr.com/solana/{API_KEY}`

⚠️ **Important**: You must provide your own Ankr API key via the `ANKR_API_KEY` environment variable.

Get your API key at: https://www.ankr.com/rpc/

## Architecture

```
┌─────────────────┐     HTTP/WebSocket     ┌──────────────────┐
│   React Frontend │◄──────────────────────►│  Python Backend  │
│   (Port 5173)   │                        │   (Port 8000)    │
└─────────────────┘                        └────────┬─────────┘
                                                    │
                                                    │ Ankr SDK
                                                    │
                                            ┌───────▼─────────┐
                                            │   Ankr RPC      │
                                            │ (Multichain)    │
                                            └─────────────────┘
```

## Installation

### Prerequisites
- Python 3.9+
- pip

### Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Or with virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Configuration

Create a `.env` file in the backend directory:

```env
ANKR_API_KEY=your_ankr_api_key_here
```

Get your API key at: https://www.ankr.com/rpc/

## Running the Server

```bash
# Development mode with auto-reload
python main.py

# Or using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Once running, access:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Health & Info
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info |
| GET | `/health` | Health check with Ankr status |
| GET | `/blockchain/info` | Solana blockchain info |

### Accounts & Balances
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/accounts/batch` | Get multiple accounts |
| POST | `/token/balances` | Get token balances |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/transactions/history` | Get transaction history |

### Token Info
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/token/holders/{mint}` | Get token holders |
| GET | `/token/price/{mint}` | Get token price |

### Token Creation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/token/create` | Prepare token creation |

### WebSocket
| Endpoint | Description |
|----------|-------------|
| `/ws` | Real-time updates |

## Example Usage

### Health Check
```bash
curl http://localhost:8000/health
```

### Get Token Balances
```bash
curl -X POST http://localhost:8000/token/balances \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "token_mints": ["So11111111111111111111111111111111111111112"]
  }'
```

### Get Transaction History
```bash
curl -X POST http://localhost:8000/transactions/history \
  -H "Content-Type: application/json" \
  -d '{
    "address": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "limit": 10
  }'
```

## Frontend Integration

The frontend uses `src/utils/apiClient.ts` to communicate with this backend:

```typescript
import { apiClient } from './utils/apiClient'

// Get token balances
const balances = await apiClient.getTokenBalances(
  '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  ['So11111111111111111111111111111111111111112']
)

// Get transaction history
const history = await apiClient.getTransactionHistory(
  '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  10
)
```

## Ankr SDK Features Used

- `blockchain.get_blockchain_info()` - Chain statistics
- `blockchain.get_transactions_by_address()` - Transaction history
- `blockchain.get_account_balance()` - SOL balances
- `token.get_token_price()` - Real-time prices
- `token.get_token_holders()` - Holder data
- `rpc.call()` - Generic RPC calls

## Rate Limits

Ankr free tier:
- 1,000,000 requests/day
- 30 requests/second
- 10 concurrent connections

## Troubleshooting

### ImportError: No module named 'ankr'
```bash
pip install ankr-sdk
```

### Connection refused
Ensure the backend is running:
```bash
python main.py
```

### CORS errors
The backend allows requests from `localhost:5173` by default.
Update `allow_origins` in `main.py` if needed.

## Production Deployment

### Using Docker
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Using Gunicorn
```bash
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

## Resources

- [Ankr SDK Documentation](https://pypi.org/project/ankr-sdk/)
- [Ankr RPC Docs](https://www.ankr.com/docs/rpc-service/chains/chains-list/solana/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
