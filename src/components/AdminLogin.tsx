import { FormEvent, useState } from 'react'

interface AdminLoginProps {
  onLoginSuccess: () => void
  onBackToForm: () => void
}

export default function AdminLogin({ onLoginSuccess, onBackToForm }: AdminLoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (username.trim() === 'founders-day-admin' && password === 'feedback@jaipuria2026-27') {
      onLoginSuccess()
    } else {
      setError('Invalid Admin ID or Password. Please check your credentials.')
    }
  }

  return (
    <main className="page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center' }}>
      <div className="top-accent" />

      <header className="school-header" style={{ padding: '24px 20px 20px' }}>
        <img src="/assets/school-logo.png" alt="Seth M. R. Jaipuria School, Lucknow" />
        <div className="header-divider" />
        <p className="founders-edition" style={{ fontSize: '15px' }}>34th Founders’ Day</p>
        <p className="founders-theme" style={{ fontSize: '18px', margin: '0 0 10px' }}>CHETNA</p>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}>Admin Portal Login</h1>
        <span>Sign in to access 34th Founders’ Day feedback records and Excel exports.</span>
      </header>

      <section className="form-card" style={{ maxWidth: '480px', margin: '0 auto', width: '100%' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-heading" style={{ paddingBottom: '20px' }}>
            <div>
              <p>AUTHENTICATION</p>
              <h2 style={{ fontSize: '24px' }}>Sign In</h2>
            </div>
          </div>

          {error && (
            <div
              style={{
                marginTop: '20px',
                padding: '12px 14px',
                backgroundColor: '#fef2f2',
                border: '1px solid #f87171',
                borderRadius: '4px',
                color: '#991b1b',
                fontSize: '12px',
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <label className="field">
              <span>Admin ID *</span>
              <input
                type="text"
                placeholder="Enter Admin ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </label>

            <label className="field">
              <span>Password *</span>
              <input
                type="password"
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
          </div>

          <div style={{ marginTop: '30px' }}>
            <button
              type="submit"
              style={{
                width: '100%',
                height: '50px',
                backgroundColor: 'var(--purple)',
                color: '#fff',
                border: 'none',
                borderRadius: '3px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'background .2s',
              }}
            >
              Sign In to Dashboard
              <span style={{ color: 'var(--orange)', fontSize: '18px' }}>→</span>
            </button>
          </div>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={onBackToForm}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--purple)',
                fontSize: '12px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              ← Return to Parent Feedback Form
            </button>
          </div>
        </form>
      </section>

      <footer style={{ marginTop: 'auto' }}>
        SETH M. R. JAIPURIA SCHOOL <span>•</span> LUCKNOW
      </footer>
    </main>
  )
}
