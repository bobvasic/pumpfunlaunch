import { useState, useRef, ChangeEvent } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  InputAdornment,
  Chip,
  Avatar,
  Alert,
  CircularProgress,
  FormHelperText,
} from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import TwitterIcon from '@mui/icons-material/Twitter'
import TelegramIcon from '@mui/icons-material/Telegram'
import LanguageIcon from '@mui/icons-material/Language'
import { useSPLToken, SPLTokenCreationData } from '../hooks/useSPLToken'

export function TokenCreationForm() {
  const { createToken, creating } = useSPLToken()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<SPLTokenCreationData>({
    name: '',
    symbol: '',
    description: '',
    decimals: 6,
    initialSupply: 1000000, // 1 million tokens
    twitter: '',
    telegram: '',
    website: '',
  })

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [createdToken, setCreatedToken] = useState<{
    mint: string
    signature: string
  } | null>(null)

  const handleInputChange = (field: keyof SPLTokenCreationData) => (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'decimals' || field === 'initialSupply' 
      ? parseInt(e.target.value) || 0
      : e.target.value
    
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, image: 'Image must be less than 5MB' }))
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
      setErrors((prev) => ({ ...prev, image: '' }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }
    if (!formData.symbol || formData.symbol.length < 2) {
      newErrors.symbol = 'Symbol must be at least 2 characters'
    }
    if (!formData.description || formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters'
    }
    if (formData.decimals < 0 || formData.decimals > 9) {
      newErrors.decimals = 'Decimals must be between 0 and 9'
    }
    if (formData.initialSupply <= 0) {
      newErrors.initialSupply = 'Initial supply must be greater than 0'
    }
    if (!imagePreview) {
      newErrors.image = 'Token image is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    const result = await createToken({
      ...formData,
      image: imagePreview || undefined,
    })

    if (result) {
      setCreatedToken({
        mint: result.mint.toBase58(),
        signature: result.signature,
      })
      // Reset form
      setFormData({
        name: '',
        symbol: '',
        description: '',
        decimals: 6,
        initialSupply: 1000000,
        twitter: '',
        telegram: '',
        website: '',
      })
      setImagePreview(null)
    }
  }

  return (
    <Card>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom fontWeight={600}>
          Create New SPL Token
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Create a standard Solana SPL token with your own metadata
        </Typography>

        {createdToken && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Token created successfully!
              <br />
              <strong>Mint:</strong> {createdToken.mint}
              <br />
              <a
                href={`https://solscan.io/tx/${createdToken.signature}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#00d084' }}
              >
                View on Solscan
              </a>
            </Typography>
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Token Image Upload */}
          <Grid item xs={12}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageSelect}
              />
              <Avatar
                src={imagePreview || undefined}
                sx={{
                  width: 120,
                  height: 120,
                  cursor: 'pointer',
                  border: '3px dashed',
                  borderColor: errors.image ? 'error.main' : 'primary.main',
                  backgroundColor: 'background.paper',
                  '&:hover': {
                    borderColor: 'primary.light',
                  },
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                {!imagePreview && <CloudUploadIcon sx={{ fontSize: 40 }} />}
              </Avatar>
              <Button
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                onClick={() => fileInputRef.current?.click()}
                size="small"
              >
                Upload Image
              </Button>
              {errors.image && (
                <FormHelperText error>{errors.image}</FormHelperText>
              )}
            </Box>
          </Grid>

          {/* Token Name & Symbol */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Token Name"
              placeholder="e.g., My Token"
              value={formData.name}
              onChange={handleInputChange('name')}
              error={!!errors.name}
              helperText={errors.name}
              disabled={creating}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Token Symbol"
              placeholder="e.g., TOKEN"
              value={formData.symbol}
              onChange={handleInputChange('symbol')}
              error={!!errors.symbol}
              helperText={errors.symbol}
              disabled={creating}
              inputProps={{ style: { textTransform: 'uppercase' } }}
            />
          </Grid>

          {/* Decimals & Initial Supply */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Decimals"
              value={formData.decimals}
              onChange={handleInputChange('decimals')}
              error={!!errors.decimals}
              helperText={errors.decimals || "Usually 6 (like USDC) or 9"}
              disabled={creating}
              InputProps={{ inputProps: { min: 0, max: 9 } }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Initial Supply"
              value={formData.initialSupply}
              onChange={handleInputChange('initialSupply')}
              error={!!errors.initialSupply}
              helperText={errors.initialSupply || "Number of tokens to mint"}
              disabled={creating}
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              placeholder="Describe your token..."
              value={formData.description}
              onChange={handleInputChange('description')}
              error={!!errors.description}
              helperText={errors.description}
              disabled={creating}
            />
          </Grid>

          {/* Social Links */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Social Links (Optional)
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Twitter"
              placeholder="@username"
              value={formData.twitter}
              onChange={handleInputChange('twitter')}
              disabled={creating}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <TwitterIcon sx={{ color: '#1DA1F2' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Telegram"
              placeholder="t.me/group"
              value={formData.telegram}
              onChange={handleInputChange('telegram')}
              disabled={creating}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <TelegramIcon sx={{ color: '#0088cc' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Website"
              placeholder="https://..."
              value={formData.website}
              onChange={handleInputChange('website')}
              disabled={creating}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LanguageIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Submit Button */}
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Creating a token requires approximately 0.02 SOL for rent and fees.
              Initial supply will be minted to your wallet.
            </Alert>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={creating ? <CircularProgress size={20} color="inherit" /> : <AddCircleIcon />}
              onClick={handleSubmit}
              disabled={creating}
              sx={{ py: 2 }}
            >
              {creating ? 'Creating Token...' : 'Create SPL Token'}
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}
