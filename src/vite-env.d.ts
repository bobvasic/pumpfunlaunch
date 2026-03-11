/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_ANKR_API_KEY: string
  readonly VITE_SOLANA_RPC: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.png'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.svg'
declare module '*.gif'
