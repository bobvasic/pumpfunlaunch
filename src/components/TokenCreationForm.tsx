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
  Slider,
  Alert,
  CircularProgress,
  FormHelperText,
} from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import TwitterIcon from '@mui/icons-material/Twitter'
import TelegramIcon from '@mui/icons-material/Telegram'
import LanguageIcon from '@mui/icons-material/Language'
import { usePumpFun, TokenCreationData } from '../hooks/usePumpFun'

export function TokenCreationForm() {
  const { createToken, creating } = usePumpFun()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<TokenCreationData>({
    name: '',
    symbol: '',
    description: '',
    twitter: '',
    telegram: '',
    website: '',
  })

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [initialBuy, setInitialBuy] = useState<number>(0.1)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: keyof TokenCreationData) => (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
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
    if (!imagePreview) {
      newErrors.image = 'Token image is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    const result = await createToken(
      { ...formData, image: imagePreview || undefined },
      initialBuy > 0 ? initialBuy : undefined
    )

    if (result) {
      // Reset form
      setFormData({
        name: '',
        symbol: '',
        description: '',
        twitter: '',
        telegram: '',
        website: '',
      })
      setImagePreview(null)
      setInitialBuy(0.1)
    }
  }

  return (
    <Card>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom fontWeight={600}>
          Create New Token
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Launch your memecoin on pump.fun with instant liquidity
        </Typography>

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
              placeholder="e.g., Moon Rocket"
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
              placeholder="e.g., MOON"
              value={formData.symbol}
              onChange={handleInputChange('symbol')}
              error={!!errors.symbol}
              helperText={errors.symbol}
              disabled={creating}
              inputProps={{ style: { textTransform: 'uppercase' } }}
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

          {/* Initial Buy */}
          <Grid item xs={12}>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Initial Buy Amount: {initialBuy} SOL
              </Typography>
              <Slider
                value={initialBuy}
                onChange={(_, value) => setInitialBuy(value as number)}
                min={0}
                max={10}
                step={0.1}
                marks={[
                  { value: 0, label: '0' },
                  { value: 5, label: '5' },
                  { value: 10, label: '10' },
                ]}
                disabled={creating}
              />
              <FormHelperText>
                Buy tokens immediately after creation (optional)
              </FormHelperText>
            </Box>
          </Grid>

          {/* Submit Button */}
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Creating a token requires approximately 0.02 SOL for rent and fees.
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
              {creating ? 'Creating Token...' : 'Create Token'}
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}
