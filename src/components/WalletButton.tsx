import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { styled } from '@mui/material/styles'

const StyledWalletButton = styled(WalletMultiButton)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  border: 'none',
  borderRadius: 12,
  padding: '12px 24px',
  fontSize: '1rem',
  fontWeight: 600,
  fontFamily: '"Roboto", sans-serif',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  boxShadow: '0 4px 14px 0 rgba(0, 208, 132, 0.39)',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
    boxShadow: '0 6px 20px rgba(0, 208, 132, 0.23)',
    transform: 'translateY(-1px)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
  '&.wallet-adapter-button-trigger': {
    backgroundColor: theme.palette.primary.main,
  },
}))

export function WalletButton() {
  return <StyledWalletButton />
}
