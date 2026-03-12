import { useState, useEffect } from 'react'
import { Chip, Tooltip, CircularProgress } from '@mui/material'
import CloudDoneIcon from '@mui/icons-material/CloudDone'
import CloudOffIcon from '@mui/icons-material/CloudOff'
import { testPinata } from '../utils/metadata'

export function PinataStatus() {
  const [status, setStatus] = useState<{
    connected: boolean
    message: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkPinataStatus()
  }, [])

  const checkPinataStatus = async () => {
    setLoading(true)
    const result = await testPinata()
    setStatus(result)
    setLoading(false)
  }

  if (loading) {
    return (
      <Chip
        icon={<CircularProgress size={16} />}
        label="Checking Pinata..."
        size="small"
        variant="outlined"
      />
    )
  }

  if (!status) return null

  return (
    <Tooltip title={status.message}>
      <Chip
        icon={status.connected ? <CloudDoneIcon /> : <CloudOffIcon />}
        label={status.connected 
          ? `Pinata (${status.method})` 
          : 'Pinata Not Configured'
        }
        size="small"
        color={status.connected ? 'success' : 'default'}
        variant="outlined"
        onClick={checkPinataStatus}
        sx={{ cursor: 'pointer' }}
      />
    </Tooltip>
  )
}
