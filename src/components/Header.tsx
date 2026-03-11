import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import RefreshIcon from '@mui/icons-material/Refresh'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from './WalletButton'
import { useWalletBalance } from '../hooks/useWalletBalance'
import { BackendStatus } from './BackendStatus'

export function Header() {
  const { publicKey } = useWallet()
  const { solBalance, refresh } = useWalletBalance()

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        background: 'rgba(10, 10, 15, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 4 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <RocketLaunchIcon sx={{ color: 'primary.main', fontSize: 32 }} />
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #00d084 0%, #00a86b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Pump.fun Creator
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <BackendStatus />
          {publicKey && (
            <>
              <Tooltip title="Refresh balance">
                <IconButton onClick={refresh} size="small" sx={{ color: 'text.secondary' }}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Chip
                icon={<AccountBalanceWalletIcon />}
                label={`${solBalance.toFixed(4)} SOL`}
                variant="outlined"
                sx={{
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '& .MuiChip-icon': { color: 'primary.main' },
                }}
              />
            </>
          )}
          <WalletButton />
        </Box>
      </Toolbar>
    </AppBar>
  )
}
