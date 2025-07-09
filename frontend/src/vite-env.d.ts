/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_THEMEALDB_BASE_URL: string
  readonly VITE_USDA_API_KEY: string
  readonly VITE_USDA_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 