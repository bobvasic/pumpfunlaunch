# Security Policy

## API Keys and Sensitive Data

This project requires API keys for external services. **Never commit API keys to the repository.**

### Required API Keys

1. **Ankr API Key** (for Solana RPC access)
   - Get your key at: https://www.ankr.com/rpc/
   - Free tier: 1M requests/day

### Setting Up Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your API keys:
   ```bash
   VITE_ANKR_API_KEY=your_actual_api_key_here
   ```

3. For the backend:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env and add your API keys
   ```

### What NOT to Commit

- `.env` files
- Any file containing actual API keys
- Log files that may contain sensitive data
- Node modules or Python virtual environments

### Reporting Security Issues

If you discover a security vulnerability, please report it privately.
