import { useEffect, useState } from 'react'
import {
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  Collapse,
  IconButton,
  Box,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CloudDoneIcon from '@mui/icons-material/CloudDone'
import CloudOffIcon from '@mui/icons-material/CloudOff'
import { usePythonBackend } from '../hooks/usePythonBackend'

export function BackendStatus() {
  const { health, loading, backendAvailable, checkHealth } = usePythonBackend()
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    if (!backendAvailable && !loading) {
      setShowAlert(true)
    }
  }, [backendAvailable, loading])

  if (loading) {
    return (
      <Chip
        icon={<CircularProgress size={16} />}
        label="Checking backend..."
        size="small"
        variant="outlined"
      />
    )
  }

  // Backend is available if health check succeeded
  // Ankr SDK status is separate - shown in tooltip
  const isBackendRunning = backendAvailable
  const hasAnkrKey = health?.ankr_sdk_ready

  return (
    <>
      <Tooltip
        title={
          isBackendRunning
            ? hasAnkrKey
              ? `Python Backend: Connected with Ankr SDK (${health?.latency_ms}ms)`
              : `Python Backend: Connected (Public RPC - ${health?.latency_ms}ms)`
            : 'Python Backend: Not connected. Run: cd backend && python main.py'
        }
      >
        <Chip
          icon={isBackendRunning ? <CloudDoneIcon /> : <CloudOffIcon />}
          label={isBackendRunning ? 'Backend OK' : 'Backend Offline'}
          size="small"
          color={isBackendRunning ? 'success' : 'warning'}
          variant="outlined"
          onClick={() => checkHealth()}
          sx={{ cursor: 'pointer' }}
        />
      </Tooltip>

      <Collapse in={showAlert}>
        <Alert
          severity="info"
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setShowAlert(false)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          sx={{ mb: 2, mt: 1 }}
        >
          <Box component="div" sx={{ fontSize: '0.875rem' }}>
            <strong>Python Backend Not Running</strong>
            <br />
            The app will use direct RPC instead. To use Ankr SDK features:
            <Box component="code" sx={{ display: 'block', mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
              cd backend && pip install -r requirements.txt && python main.py
            </Box>
          </Box>
        </Alert>
      </Collapse>
    </>
  )
}
