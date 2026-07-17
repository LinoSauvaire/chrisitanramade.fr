
export function s3UrlToProxy(url: string | null | undefined): string | null {
  if (!url) return null

  
  if (url.startsWith('/')) return url

  try {
    const parsed = new URL(url)
    const match = parsed.pathname.match(/^\/uploads\/(.+)$/)
    if (match) {
      return `/api/s3/${match[1]}`
    }
    return url
  } catch {
    return url
  }
}
