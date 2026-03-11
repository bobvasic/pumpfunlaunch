import { useState, ChangeEvent } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  InputAdornment,
  Paper,
  LinearProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import { useSwapPump } from '../hooks/useSwapPump'
import { useWalletBalance } from '../hooks/useWalletBalance'
import { PublicKey } from '@solana/web3.js'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

export function LiquidityManager() {
  const [tabValue, setTabValue] = useState(0)
  const { solBalance } = useWalletBalance()
  const {
    creatingLP,
    addingLiquidity,
    removingLiquidity,
    swapping,
    createLiquidityPool,
    addLiquidity,
    removeLiquidity,
    withdrawAllLP,
    getUserLPBalance,
    getPoolInfo,
  } = useSwapPump()

  // Create LP state
  const [createTokenMint, setCreateTokenMint] = useState('')
  const [createSolAmount, setCreateSolAmount] = useState('1')
  const [createTokenAmount, setCreateTokenAmount] = useState('1000000')

  // Add liquidity state
  const [addTokenMint, setAddTokenMint] = useState('')
  const [addSolAmount, setAddSolAmount] = useState('0.5')
  const [addTokenAmount, setAddTokenAmount] = useState('500000')

  // Remove liquidity state
  const [removeTokenMint, setRemoveTokenMint] = useState('')
  const [lpBalance, setLpBalance] = useState<bigint | null>(null)
  const [checkingBalance, setCheckingBalance] = useState(false)

  // Swap state
  const [swapTokenMint, setSwapTokenMint] = useState('')
  const [swapAmount, setSwapAmount] = useState('')
  const [isBuy, setIsBuy] = useState(true)

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleCreateLP = async () => {
    try {
      const mint = new PublicKey(createTokenMint)
      await createLiquidityPool(
        mint,
        parseFloat(createSolAmount),
        parseFloat(createTokenAmount)
      )
    } catch (error) {
      console.error('Invalid token mint:', error)
    }
  }

  const handleAddLiquidity = async () => {
    try {
      const mint = new PublicKey(addTokenMint)
      await addLiquidity(
        mint,
        parseFloat(addSolAmount),
        parseFloat(addTokenAmount)
      )
    } catch (error) {
      console.error('Invalid token mint:', error)
    }
  }

  const checkLPBalance = async () => {
    if (!removeTokenMint) return
    setCheckingBalance(true)
    try {
      const mint = new PublicKey(removeTokenMint)
      const balance = await getUserLPBalance(mint)
      setLpBalance(balance)
    } catch (error) {
      console.error('Error checking balance:', error)
    } finally {
      setCheckingBalance(false)
    }
  }

  const handleWithdrawAll = async () => {
    if (!removeTokenMint) return
    try {
      const mint = new PublicKey(removeTokenMint)
      await withdrawAllLP(mint)
      setLpBalance(BigInt(0))
    } catch (error) {
      console.error('Error withdrawing:', error)
    }
  }

  const handleSwap = async () => {
    if (!swapTokenMint || !swapAmount) return
    try {
      const mint = new PublicKey(swapTokenMint)
      if (isBuy) {
        await useSwapPump().buyTokens(mint, parseFloat(swapAmount))
      } else {
        await useSwapPump().sellTokens(mint, parseFloat(swapAmount))
      }
    } catch (error) {
      console.error('Swap error:', error)
    }
  }

  const isProcessing = creatingLP || addingLiquidity || removingLiquidity || swapping

  return (
    <Card>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<AccountBalanceIcon />} label="Create LP" />
            <Tab icon={<AddIcon />} label="Add Liquidity" />
            <Tab icon={<RemoveIcon />} label="Withdraw LP" />
            <Tab icon={<SwapHorizIcon />} label="Swap" />
          </Tabs>
        </Box>

        {/* Create LP Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Create Liquidity Pool
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create a new liquidity pool for your token on swap.pump.fun
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Token Mint Address"
                  placeholder="Enter token mint address"
                  value={createTokenMint}
                  onChange={(e) => setCreateTokenMint(e.target.value)}
                  disabled={creatingLP}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SOL Amount"
                  type="number"
                  value={createSolAmount}
                  onChange={(e) => setCreateSolAmount(e.target.value)}
                  disabled={creatingLP}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">SOL</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Token Amount"
                  type="number"
                  value={createTokenAmount}
                  onChange={(e) => setCreateTokenAmount(e.target.value)}
                  disabled={creatingLP}
                />
              </Grid>

              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  You'll receive LP tokens representing your share of the pool. 
                  You can withdraw your liquidity at any time.
                </Alert>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={creatingLP ? <CircularProgress size={20} color="inherit" /> : <AccountBalanceIcon />}
                  onClick={handleCreateLP}
                  disabled={creatingLP || !createTokenMint}
                >
                  {creatingLP ? 'Creating Pool...' : 'Create Liquidity Pool'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Add Liquidity Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Add Liquidity
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add more liquidity to an existing pool
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Token Mint Address"
                  placeholder="Enter token mint address"
                  value={addTokenMint}
                  onChange={(e) => setAddTokenMint(e.target.value)}
                  disabled={addingLiquidity}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SOL Amount"
                  type="number"
                  value={addSolAmount}
                  onChange={(e) => setAddSolAmount(e.target.value)}
                  disabled={addingLiquidity}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">SOL</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Token Amount"
                  type="number"
                  value={addTokenAmount}
                  onChange={(e) => setAddTokenAmount(e.target.value)}
                  disabled={addingLiquidity}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={addingLiquidity ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                  onClick={handleAddLiquidity}
                  disabled={addingLiquidity || !addTokenMint}
                >
                  {addingLiquidity ? 'Adding Liquidity...' : 'Add Liquidity'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Withdraw LP Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Withdraw Liquidity
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Withdraw all your LP tokens and receive SOL and tokens back
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Token Mint Address"
                  placeholder="Enter token mint address"
                  value={removeTokenMint}
                  onChange={(e) => {
                    setRemoveTokenMint(e.target.value)
                    setLpBalance(null)
                  }}
                  disabled={removingLiquidity}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  onClick={checkLPBalance}
                  disabled={checkingBalance || !removeTokenMint}
                  fullWidth
                >
                  {checkingBalance ? <CircularProgress size={20} /> : 'Check LP Balance'}
                </Button>
              </Grid>

              {lpBalance !== null && (
                <Grid item xs={12}>
                  <Paper
                    variant="outlined"
                    sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Your LP Token Balance
                    </Typography>
                    <Typography variant="h4" sx={{ mt: 1, fontWeight: 600 }}>
                      {lpBalance.toString()}
                    </Typography>
                    <Chip
                      label={lpBalance > 0 ? 'Active Position' : 'No Position'}
                      color={lpBalance > 0 ? 'success' : 'default'}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Paper>
                </Grid>
              )}

              <Grid item xs={12}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Withdrawing will burn all your LP tokens and return both SOL and 
                  tokens to your wallet based on the current pool ratio.
                </Alert>
                <Button
                  fullWidth
                  variant="contained"
                  color="error"
                  size="large"
                  startIcon={removingLiquidity ? <CircularProgress size={20} color="inherit" /> : <RemoveIcon />}
                  onClick={handleWithdrawAll}
                  disabled={removingLiquidity || !removeTokenMint || lpBalance === BigInt(0)}
                >
                  {removingLiquidity ? 'Withdrawing...' : 'Withdraw All LP'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Swap Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Swap Tokens
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Buy or sell tokens from the liquidity pool
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 1, display: 'flex', gap: 1 }}>
                  <Button
                    fullWidth
                    variant={isBuy ? 'contained' : 'outlined'}
                    onClick={() => setIsBuy(true)}
                    color="success"
                  >
                    Buy
                  </Button>
                  <Button
                    fullWidth
                    variant={!isBuy ? 'contained' : 'outlined'}
                    onClick={() => setIsBuy(false)}
                    color="error"
                  >
                    Sell
                  </Button>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Token Mint Address"
                  placeholder="Enter token mint address"
                  value={swapTokenMint}
                  onChange={(e) => setSwapTokenMint(e.target.value)}
                  disabled={swapping}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={isBuy ? 'SOL Amount' : 'Token Amount'}
                  type="number"
                  value={swapAmount}
                  onChange={(e) => setSwapAmount(e.target.value)}
                  disabled={swapping}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {isBuy ? 'SOL' : 'Tokens'}
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={swapping ? <CircularProgress size={20} color="inherit" /> : <SwapHorizIcon />}
                  onClick={handleSwap}
                  disabled={swapping || !swapTokenMint || !swapAmount}
                  color={isBuy ? 'success' : 'error'}
                >
                  {swapping ? 'Swapping...' : isBuy ? 'Buy Tokens' : 'Sell Tokens'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </CardContent>
    </Card>
  )
}
