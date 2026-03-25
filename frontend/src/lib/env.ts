export function getEnv(nextPublicKey: string): string | undefined {
  const fromNext = process.env[nextPublicKey]
  if (typeof fromNext === 'string' && fromNext.length > 0) return fromNext
  return undefined
}

export function isProd(): boolean {
  return process.env.NODE_ENV === 'production'
}

