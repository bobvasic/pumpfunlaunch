// Polyfills must be first
import './polyfills'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
// Using Ankr RPC instead of default clusterApiUrl
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { Connection } from '@solana/web3.js'
import { ANKR_RPC_URL, createAnkrConnection } from './utils/ankr'
import { Toaster } from 'react-hot-toast'
import App from './App'
import '@solana/wallet-adapter-react-ui/styles.css'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00d084',
      light: '#5fe9a6',
      dark: '#009e56',
    },
    secondary: {
      main: '#ff6b6b',
      light: '#ff9e9e',
      dark: '#c73e3e',
    },
    background: {
      default: '#0a0a0f',
      paper: '#14141f',
    },
    text: {
      primary: '#ffffff',
      secondary: '#a0a0b0',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 24px',
        },
        contained: {
          boxShadow: '0 4px 14px 0 rgba(0, 208, 132, 0.39)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(0, 208, 132, 0.23)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.05)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
})

// Ankr Solana RPC Endpoint (Direct endpoint)
// Using provided Ankr Solana RPC
const endpoint = ANKR_RPC_URL
const connection = createAnkrConnection('confirmed')

console.log('🔌 Using Ankr Solana RPC:', endpoint.slice(0, 50) + '...')

const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
]

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 5000,
                style: {
                  background: '#14141f',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                },
                success: {
                  iconTheme: {
                    primary: '#00d084',
                    secondary: '#14141f',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ff6b6b',
                    secondary: '#14141f',
                  },
                },
              }}
            />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
