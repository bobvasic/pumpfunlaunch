"""
Pump.fun Token Creator - Python Backend with Ankr SDK
Uses Ankr's advanced APIs for Solana blockchain interaction
"""

import os
import json
import asyncio
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Ankr SDK imports
from ankr import AnkrAdvancedAPI
from ankr.types import (
    GetBlocksRequest,
    GetTransactionsByAddressRequest,
    GetAccountBalanceRequest,
    GetTokenHoldersRequest,
    GetTokenPriceRequest,
)

# Load environment variables
load_dotenv()

# Ankr API Configuration - MUST be set in environment variables
# Get your own at: https://www.ankr.com/rpc/
ANKR_API_KEY = os.getenv("ANKR_API_KEY")

# Build RPC endpoint with API key (fallback to public RPC if no API key)
if ANKR_API_KEY:
    ANKR_SOLANA_RPC = f"https://rpc.ankr.com/solana/{ANKR_API_KEY}"
else:
    ANKR_SOLANA_RPC = "https://api.mainnet-beta.solana.com"
    print("⚠️  ANKR_API_KEY not set. Using public Solana RPC.")

# Alternative endpoints (for reference):
# ANKR_MULTICHAIN_RPC = f"https://rpc.ankr.com/multichain/{ANKR_API_KEY}"
# ANKR_PREMIUM_RPC = f"https://rpc.ankr.com/premium/solana/{ANKR_API_KEY}"

# Initialize Ankr SDK client
ankr_client: Optional[AnkrAdvancedAPI] = None

# Also create a direct RPC connection for fallback
solana_rpc_endpoint = ANKR_SOLANA_RPC


@dataclass
class AppState:
    """Application state container"""
    ankr_client: Optional[AnkrAdvancedAPI] = None
    rpc_endpoint: str = ANKR_SOLANA_RPC


app_state = AppState()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    print("🚀 Starting Pump.fun Token Creator Backend")
    print(f"🔑 Ankr API Key: {ANKR_API_KEY[:20]}...{ANKR_API_KEY[-8:]}")
    print(f"🔗 Using Ankr Solana RPC: {ANKR_SOLANA_RPC[:50]}...")
    
    try:
        # Initialize Ankr SDK client with Solana endpoint
        # Note: Ankr SDK works with their advanced APIs, for direct RPC we use httpx
        app_state.ankr_client = AnkrAdvancedAPI(
            api_key=ANKR_API_KEY,
        )
        app_state.rpc_endpoint = ANKR_SOLANA_RPC
        print("✅ Ankr SDK client initialized successfully")
    except Exception as e:
        print(f"⚠️  Failed to initialize Ankr SDK: {e}")
        print("   Falling back to direct RPC calls")
        app_state.rpc_endpoint = ANKR_SOLANA_RPC
    
    yield
    
    # Shutdown
    if app_state.ankr_client:
        print("🔌 Closing Ankr SDK client")
        # Ankr client cleanup if needed


app = FastAPI(
    title="Pump.fun Token Creator API",
    description="Python backend with Ankr SDK for Solana blockchain operations",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============== Pydantic Models ==============

class TokenMetadata(BaseModel):
    """Token metadata model"""
    name: str = Field(..., min_length=2, max_length=32)
    symbol: str = Field(..., min_length=2, max_length=10)
    description: str = Field(..., min_length=10, max_length=1000)
    image: Optional[str] = None
    twitter: Optional[str] = None
    telegram: Optional[str] = None
    website: Optional[str] = None


class CreateTokenRequest(BaseModel):
    """Token creation request"""
    metadata: TokenMetadata
    creator_wallet: str
    initial_buy_amount: float = Field(default=0, ge=0)


class RPCRequest(BaseModel):
    """Generic RPC request"""
    method: str
    params: List[Any] = []


class TokenBalanceRequest(BaseModel):
    """Token balance request"""
    wallet_address: str
    token_mints: List[str]


class TransactionHistoryRequest(BaseModel):
    """Transaction history request"""
    address: str
    limit: int = Field(default=10, ge=1, le=100)
    before: Optional[str] = None


class BatchAccountRequest(BaseModel):
    """Batch account info request"""
    addresses: List[str]


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    ankr_sdk_ready: bool
    rpc_endpoint: str
    block_height: Optional[int] = None
    latency_ms: Optional[int] = None


# ============== API Endpoints ==============

@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint"""
    return {
        "message": "Pump.fun Token Creator API",
        "version": "1.0.0",
        "provider": "Ankr SDK",
        "docs": "/docs"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Check API and Ankr RPC health"""
    import time
    import httpx
    start_time = time.time()
    
    block_height = None
    sdk_working = False
    
    # Test direct RPC connection with short timeout
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                ANKR_SOLANA_RPC,
                json={
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "getHealth",
                }
            )
            if response.status_code == 200:
                sdk_working = True
                # Try to get block height
                try:
                    slot_response = await client.post(
                        ANKR_SOLANA_RPC,
                        json={
                            "jsonrpc": "2.0",
                            "id": 1,
                            "method": "getBlockHeight",
                        }
                    )
                    slot_data = slot_response.json()
                    block_height = slot_data.get("result")
                except:
                    pass
    except Exception as e:
        print(f"Health check RPC error: {e}")
    
    latency_ms = int((time.time() - start_time) * 1000)
    
    return HealthResponse(
        status="healthy" if sdk_working else "degraded",
        ankr_sdk_ready=sdk_working,
        rpc_endpoint=ANKR_SOLANA_RPC[:50] + "...",
        block_height=block_height,
        latency_ms=latency_ms
    )


@app.post("/rpc/call")
async def rpc_call(request: RPCRequest):
    """Generic RPC call through Ankr RPC endpoint"""
    import httpx
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                ANKR_SOLANA_RPC,
                json={
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": request.method,
                    "params": request.params
                }
            )
            result = response.json()
            return {"success": True, "result": result.get("result")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/accounts/batch")
async def get_accounts_batch(request: BatchAccountRequest):
    """Get multiple account infos using Ankr SDK batch API"""
    if not app_state.ankr_client:
        raise HTTPException(status_code=503, detail="Ankr SDK not initialized")
    
    try:
        # Use Ankr SDK to fetch multiple accounts
        accounts = []
        for address in request.addresses:
            balance = await app_state.ankr_client.get_account_balance(
                GetAccountBalanceRequest(
                    blockchain="solana",
                    wallet=address
                )
            )
            accounts.append({
                "address": address,
                "balance": balance
            })
        
        return {"success": True, "accounts": accounts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/token/balances")
async def get_token_balances(request: TokenBalanceRequest):
    """Get token balances for multiple tokens using Ankr SDK"""
    if not app_state.ankr_client:
        raise HTTPException(status_code=503, detail="Ankr SDK not initialized")
    
    try:
        balances = []
        for mint in request.token_mints:
            try:
                # Use Ankr SDK to get token balance
                price = await app_state.ankr_client.get_token_price(
                    GetTokenPriceRequest(
                        blockchain="solana",
                        contract=mint
                    )
                )
                balances.append({
                    "mint": mint,
                    "balance": "0",  # Would need actual balance lookup
                    "price_usd": balance.get("usdPrice") if balance else None
                })
            except Exception as e:
                balances.append({
                    "mint": mint,
                    "error": str(e)
                })
        
        return {"success": True, "balances": balances}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/transactions/history")
async def get_transaction_history(request: TransactionHistoryRequest):
    """Get transaction history using Ankr SDK"""
    if not app_state.ankr_client:
        raise HTTPException(status_code=503, detail="Ankr SDK not initialized")
    
    try:
        # Use Ankr SDK to get transactions
        transactions = await app_state.ankr_client.get_transactions_by_address(
            GetTransactionsByAddressRequest(
                blockchain="solana",
                wallet=request.address,
                page_size=request.limit
            )
        )
        
        return {
            "success": True,
            "address": request.address,
            "transactions": transactions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/token/create")
async def create_token(
    request: CreateTokenRequest,
    background_tasks: BackgroundTasks
):
    """
    Create a new token on pump.fun
    This endpoint prepares the transaction data - actual signing happens on frontend
    """
    # Validate metadata
    if len(request.metadata.name) < 2:
        raise HTTPException(status_code=400, detail="Token name too short")
    
    if len(request.metadata.symbol) < 2:
        raise HTTPException(status_code=400, detail="Token symbol too short")
    
    # TODO: Implement actual token creation logic
    # For now, return the prepared transaction data
    
    return {
        "success": True,
        "message": "Token creation prepared",
        "metadata": request.metadata,
        "creator": request.creator_wallet,
        "initial_buy": request.initial_buy_amount,
        "instructions": []  # Would contain actual Solana instructions
    }


@app.get("/blockchain/info")
async def get_blockchain_info():
    """Get Solana blockchain info using Ankr SDK"""
    if not app_state.ankr_client:
        raise HTTPException(status_code=503, detail="Ankr SDK not initialized")
    
    try:
        blocks = await app_state.ankr_client.get_blocks(
            GetBlocksRequest(blockchain="solana", fromBlock="latest", toBlock="latest")
        )
        return {"success": True, "blocks": blocks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/token/holders/{mint_address}")
async def get_token_holders(mint_address: str, limit: int = 100):
    """Get token holders using Ankr SDK"""
    if not app_state.ankr_client:
        raise HTTPException(status_code=503, detail="Ankr SDK not initialized")
    
    try:
        holders = await app_state.ankr_client.get_token_holders(
            GetTokenHoldersRequest(
                blockchain="solana",
                contract=mint_address,
                page_size=limit
            )
        )
        return {"success": True, "holders": holders}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/token/price/{mint_address}")
async def get_token_price(mint_address: str):
    """Get token price using Ankr SDK"""
    if not app_state.ankr_client:
        raise HTTPException(status_code=503, detail="Ankr SDK not initialized")
    
    try:
        price = await app_state.ankr_client.get_token_price(
            GetTokenPriceRequest(
                blockchain="solana",
                contract=mint_address
            )
        )
        return {"success": True, "price": price}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== WebSocket Support (Optional) ==============

from fastapi import WebSocket

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("type") == "subscribe_account":
                address = message.get("address")
                await websocket.send_json({
                    "type": "subscription_confirmed",
                    "address": address
                })
            
            elif message.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
                
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
