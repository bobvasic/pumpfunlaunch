import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  Chip,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import { useWallet } from '@solana/wallet-adapter-react'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import { Header } from './components/Header'
import { TokenCreationForm } from './components/TokenCreationForm'
import { LiquidityManager } from './components/LiquidityManager'
import { useWalletBalance } from './hooks/useWalletBalance'

function WelcomeSection() {
  const { solBalance } = useWalletBalance()

  return (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <Typography
        variant="h2"
        sx={{
          fontWeight: 800,
          mb: 2,
          background: 'linear-gradient(135deg, #00d084 0%, #00a86b 50%, #008f5a 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 40px rgba(0, 208, 132, 0.3)',
        }}
      >
        Pump.fun Token Creator
      </Typography>
      <Typography variant="h5" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
        Create memecoins, manage liquidity pools, and trade on swap.pump.fun
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Chip
          icon={<RocketLaunchIcon />}
          label="Token Creation"
          color="primary"
          variant="outlined"
        />
        <Chip
          icon={<WaterDropIcon />}
          label="Liquidity Pools"
          color="primary"
          variant="outlined"
        />
        <Chip
          icon={<SwapHorizIcon />}
          label="Instant Swaps"
          color="primary"
          variant="outlined"
        />
      </Box>

      <Alert severity="info" sx={{ mt: 4, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="body2">
          Connected Wallet Balance: <strong>{solBalance.toFixed(4)} SOL</strong>
        </Typography>
      </Alert>
    </Box>
  )
}

function WalletPrompt() {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(0, 208, 132, 0.1) 0%, rgba(0, 168, 107, 0.05) 100%)',
        border: '1px solid rgba(0, 208, 132, 0.2)',
        borderRadius: 4,
      }}
    >
      <AccountBalanceWalletIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
      <Typography variant="h5" gutterBottom fontWeight={600}>
        Connect Your Wallet
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Please connect your Solana wallet to create tokens, manage liquidity pools,
        and trade on swap.pump.fun
      </Typography>
    </Paper>
  )
}

function App() {
  const { publicKey } = useWallet()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      
      <Box sx={{ pt: 10, pb: 8 }}>
        <Container maxWidth="lg">
          <WelcomeSection />

          {!publicKey ? (
            <WalletPrompt />
          ) : (
            <Grid container spacing={4}>
              {/* Token Creation Section */}
              <Grid item xs={12} md={6}>
                <TokenCreationForm />
              </Grid>

              {/* Liquidity Management Section */}
              <Grid item xs={12} md={6}>
                <LiquidityManager />
              </Grid>
            </Grid>
          )}
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 4,
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary">
            Pump.fun Token Creator • Built with React, Material-UI & Solana Web3.js
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Always verify transactions before signing. Use at your own risk.
          </Typography>
        </Container>
      </Box>
    </Box>
  )
}

export default App
