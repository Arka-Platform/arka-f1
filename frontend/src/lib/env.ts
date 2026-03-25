type EnvSource = Record<string, string | undefined> | undefined

function getViteEnv(): EnvSource {
  try {
    // In Next.js, import.meta.env is not guaranteed to exist.
    return (import.meta as any).env as EnvSource
  } catch {
    return undefined
  }
}

function getViteEnvValue(key: string): string | undefined {
  const env = getViteEnv()
  if (!env) return undefined
  return env[key]
}

export function getEnv(nextPublicKey: string, viteKey: string): string | undefined {
  // Next.js: uses process.env.NEXT_PUBLIC_*
  const fromNext = process.env[nextPublicKey]
  if (typeof fromNext === 'string' && fromNext.length > 0) return fromNext

  // Vite fallback
  return getViteEnvValue(viteKey)
}

export function isProd(): boolean {
  // Vite sets import.meta.env.PROD
  const viteProd = getViteEnvValue('PROD')
  if (viteProd === 'true') return true
  if (viteProd === 'false') return false

  // Next uses NODE_ENV
  return process.env.NODE_ENV === 'production'
}

