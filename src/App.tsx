import { FormEvent, useEffect, useState } from 'react'
import {
  getEvents,
  submitFeedbackToSupabase,
  FeedbackData,
} from './lib/supabase'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'

function Star({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m12 2.7 2.82 5.72 6.31.92-4.56 4.44 1.07 6.28L12 17.09l-5.64 2.97 1.07-6.28-4.56-4.44 6.31-.92L12 2.7Z"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function App() {
  // Navigation / View state
  const [currentView, setCurrentView] = useState<'form' | 'admin-login' | 'admin-dashboard'>('form')
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('jaipuria_admin_auth') === 'true'
  })

  // Form states
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [events, setEvents] = useState<string[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Check URL hash for direct /#admin access
  useEffect(() => {
    function handleHashChange() {
      const hash = window.location.hash.toLowerCase()
      if (hash === '#admin' || hash === '#dashboard') {
        const isAuth = sessionStorage.getItem('jaipuria_admin_auth') === 'true'
        setCurrentView(isAuth ? 'admin-dashboard' : 'admin-login')
      } else if (hash === '#login') {
        setCurrentView('admin-login')
      }
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Fetch latest event_name list directly from your Supabase 'events' table
  useEffect(() => {
    let isMounted = true
    async function loadEvents() {
      setLoadingEvents(true)
      try {
        const fetchedEvents = await getEvents()
        if (isMounted) {
          setEvents(fetchedEvents)
        }
      } catch (err) {
        console.error('Failed to load events from Supabase:', err)
      } finally {
        if (isMounted) setLoadingEvents(false)
      }
    }

    loadEvents()
    return () => {
      isMounted = false
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)

    if (rating === 0) {
      alert('Please select a star rating before submitting.')
      return
    }

    const formData = new FormData(event.currentTarget)
    const feedbackPayload: FeedbackData = {
      parentName: (formData.get('parentName') as string)?.trim() || '',
      wardName: (formData.get('wardName') as string)?.trim() || '',
      wardClass: (formData.get('wardClass') as string)?.trim() || '',
      email: (formData.get('email') as string)?.trim() || '',
      event: (formData.get('event') as string) || '',
      rating: rating,
      feedback: (formData.get('feedback') as string)?.trim() || '',
    }

    setIsSubmitting(true)

    try {
      const result = await submitFeedbackToSupabase(feedbackPayload)
      if (result.success) {
        setSubmitted(true)
      } else {
        setErrorMessage(result.error || 'Failed to submit feedback. Please try again.')
      }
    } catch (err: any) {
      console.error('Error submitting form:', err)
      setErrorMessage(err?.message || 'An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleReset() {
    setSubmitted(false)
    setRating(0)
    setHoveredRating(0)
    setErrorMessage(null)
  }

  function handleAdminLoginSuccess() {
    sessionStorage.setItem('jaipuria_admin_auth', 'true')
    setIsAdminAuthenticated(true)
    setCurrentView('admin-dashboard')
    window.location.hash = '#dashboard'
  }

  function handleAdminLogout() {
    sessionStorage.removeItem('jaipuria_admin_auth')
    setIsAdminAuthenticated(false)
    setCurrentView('admin-login')
    window.location.hash = '#login'
  }

  function navigateToForm() {
    setCurrentView('form')
    window.location.hash = ''
  }

  // Render Admin Dashboard
  if (currentView === 'admin-dashboard' && isAdminAuthenticated) {
    return <AdminDashboard onLogout={handleAdminLogout} onBackToForm={navigateToForm} />
  }

  // Render Admin Login
  if (currentView === 'admin-login') {
    return <AdminLogin onLoginSuccess={handleAdminLoginSuccess} onBackToForm={navigateToForm} />
  }

  // Render Public Parent Feedback Form
  return (
    <main className="page">
      <div className="top-accent" />

      <header className="school-header">
        <img src="/assets/school-logo.png" alt="Seth M. R. Jaipuria School, Lucknow" />
        <div className="header-divider" />
        <p className="founders-edition">34th Founders’ Day</p>
        <p className="founders-theme">CHETNA</p>
        <h1>Parent Feedback Form</h1>
        <span>Your feedback helps us make every celebration more meaningful.</span>
      </header>

      <section className="form-card">
        {submitted ? (
          <div className="thank-you">
            <div className="checkmark">✓</div>
            <p>RESPONSE SUBMITTED</p>
            <h2>Thank you for your feedback.</h2>
            <span>We truly appreciate you taking the time to share your experience with us.</span>
            <button type="button" onClick={handleReset}>Submit another response</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-heading">
              <div>
                <p>YOUR DETAILS</p>
                <h2>Tell us about your visit</h2>
              </div>
              <span>All fields marked * are required</span>
            </div>

            {errorMessage && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '12px 16px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #f87171',
                  borderRadius: '4px',
                  color: '#991b1b',
                  fontSize: '13px',
                }}
              >
                {errorMessage}
              </div>
            )}

            <div className="field-grid">
              <label className="field">
                <span>Name of Parent *</span>
                <input type="text" name="parentName" placeholder="Enter your full name" required />
              </label>

              <label className="field">
                <span>Name of Ward *</span>
                <input type="text" name="wardName" placeholder="Enter your ward’s name" required />
              </label>

              <label className="field">
                <span>Ward’s Class *</span>
                <input type="text" name="wardClass" placeholder="e.g. Class VIII – A" required />
              </label>

              <label className="field">
                <span>Email ID *</span>
                <input type="email" name="email" placeholder="name@example.com" required />
              </label>

              <label className="field full-width">
                <span>Which event did you visit? *</span>
                <div className="select-wrap">
                  <select name="event" defaultValue="" required>
                    <option value="" disabled>
                      {loadingEvents ? 'Loading events...' : 'Select an event'}
                    </option>
                    {events.map((evtName, idx) => (
                      <option key={`${evtName}-${idx}`} value={evtName}>
                        {evtName}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
            </div>

            <fieldset className="rating-field">
              <legend>How would you rate your experience? *</legend>
              <div className="rating-content">
                <div className="stars" onMouseLeave={() => setHoveredRating(0)}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={star <= (hoveredRating || rating) ? 'active' : ''}
                      onMouseEnter={() => setHoveredRating(star)}
                      onFocus={() => setHoveredRating(star)}
                      onBlur={() => setHoveredRating(0)}
                      onClick={() => setRating(star)}
                      aria-label={`${star} out of 5 stars`}
                    >
                      <Star active={star <= (hoveredRating || rating)} />
                    </button>
                  ))}
                </div>
                <span>{rating ? `${rating} out of 5` : 'Select your rating'}</span>
              </div>
              <input
                className="rating-required"
                value={rating || ''}
                onChange={() => {}}
                required
                tabIndex={-1}
                aria-hidden="true"
              />
            </fieldset>

            <label className="field feedback-field">
              <span>Your Feedback *</span>
              <textarea
                name="feedback"
                rows={5}
                placeholder="Please share your thoughts, suggestions, or a moment you especially enjoyed..."
                required
              />
            </label>

            <div className="submit-area">
              <p>Thank you for being part of our 34th Founders’ Day (CHETNA).</p>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                <span>→</span>
              </button>
            </div>
          </form>
        )}
      </section>

      <footer>SETH M. R. JAIPURIA SCHOOL <span>•</span> LUCKNOW</footer>
    </main>
  )
}
