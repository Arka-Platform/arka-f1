import Link from 'next/link'

export default function Page() {
  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ margin: 0, fontSize: '2rem' }}>Next.js is running</h1>
      <p style={{ marginTop: '0.75rem', opacity: 0.8, lineHeight: 1.7 }}>
        App Router scaffold is live inside the existing project. Next step is migrating routes incrementally from
        React Router.
      </p>
      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link href="/browse" style={{ padding: '0.75rem 1rem', borderRadius: 999, background: '#111827', color: 'white', textDecoration: 'none' }}>
          Browse
        </Link>
      </div>
    </main>
  )
}

