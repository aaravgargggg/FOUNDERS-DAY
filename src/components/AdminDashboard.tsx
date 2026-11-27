import { useEffect, useState, useMemo } from 'react'
import * as XLSX from 'xlsx'
import {
  FeedbackItem,
  fetchAllFeedback,
  getEvents,
} from '../lib/supabase'

interface AdminDashboardProps {
  onLogout: () => void
  onBackToForm: () => void
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'inline-flex', gap: '2px', color: '#f47820', fontSize: '15px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} style={{ opacity: star <= rating ? 1 : 0.25 }}>
          ★
        </span>
      ))}
    </div>
  )
}

export default function AdminDashboard({ onLogout, onBackToForm }: AdminDashboardProps) {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [events, setEvents] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [selectedEvent, setSelectedEvent] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [ratingFilter, setRatingFilter] = useState<string>('ALL')

  // Load feedbacks and events
  async function loadData() {
    setLoading(true)
    setError(null)

    try {
      const [fbRes, evtList] = await Promise.all([
        fetchAllFeedback(),
        getEvents(),
      ])

      if (fbRes.success) {
        setFeedbacks(fbRes.data)
      } else {
        setError(fbRes.error || 'Failed to fetch feedback records.')
      }

      if (evtList && evtList.length > 0) {
        setEvents(evtList)
      }
    } catch (err: any) {
      setError(err?.message || 'Error loading dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filtered feedbacks based on event, search query, and rating
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((item) => {
      // Event filter
      if (selectedEvent !== 'ALL' && item.event_name !== selectedEvent) {
        return false
      }

      // Rating filter
      if (ratingFilter !== 'ALL' && String(item.rating) !== ratingFilter) {
        return false
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const match =
          item.parent_name?.toLowerCase().includes(q) ||
          item.ward_name?.toLowerCase().includes(q) ||
          item.ward_class?.toLowerCase().includes(q) ||
          item.email_id?.toLowerCase().includes(q) ||
          item.feedback?.toLowerCase().includes(q) ||
          item.event_name?.toLowerCase().includes(q)

        if (!match) return false
      }

      return true
    })
  }, [feedbacks, selectedEvent, ratingFilter, searchQuery])

  // Summary Metrics
  const totalCount = feedbacks.length
  const filteredCount = filteredFeedbacks.length
  const avgRating =
    filteredFeedbacks.length > 0
      ? (
          filteredFeedbacks.reduce((sum, item) => sum + (Number(item.rating) || 0), 0) /
          filteredFeedbacks.length
        ).toFixed(1)
      : '0.0'

  const fiveStarCount = filteredFeedbacks.filter((item) => Number(item.rating) === 5).length

  // Helper to format feedback items for Excel export
  function formatForExcel(items: FeedbackItem[]) {
    return items.map((item, index) => ({
      'S.No': index + 1,
      'Event Name': item.event_name || 'N/A',
      'Parent Name': item.parent_name || 'N/A',
      "Ward's Name": item.ward_name || 'N/A',
      "Ward's Class": item.ward_class || 'N/A',
      'Email ID': item.email_id || 'N/A',
      'Rating (Out of 5)': item.rating || 0,
      'Feedback / Comments': item.feedback || '',
    }))
  }

  // Export filtered/selected event feedbacks to Excel
  function exportEventExcel() {
    const dataToExport = formatForExcel(filteredFeedbacks)
    if (dataToExport.length === 0) {
      alert('No feedbacks to export for the selected filter.')
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)

    // Set column widths
    worksheet['!cols'] = [
      { wch: 6 },  // S.No
      { wch: 35 }, // Event Name
      { wch: 22 }, // Parent Name
      { wch: 20 }, // Ward's Name
      { wch: 15 }, // Ward's Class
      { wch: 28 }, // Email ID
      { wch: 18 }, // Rating
      { wch: 60 }, // Feedback
    ]

    const workbook = XLSX.utils.book_new()
    const sheetName = selectedEvent === 'ALL' ? 'Filtered Feedback' : selectedEvent.slice(0, 31)
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    const sanitizedEventName =
      selectedEvent === 'ALL' ? 'All_Selected_Events' : selectedEvent.replace(/[^a-zA-Z0-9]/g, '_')
    const fileName = `Jaipuria_Founders_Day_${sanitizedEventName}_Feedback.xlsx`

    XLSX.writeFile(workbook, fileName)
  }

  // Export MASTER (ALL) feedbacks to Excel
  function exportMasterExcel() {
    const dataToExport = formatForExcel(feedbacks)
    if (dataToExport.length === 0) {
      alert('No feedbacks recorded yet in the database.')
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)

    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 35 },
      { wch: 22 },
      { wch: 20 },
      { wch: 15 },
      { wch: 28 },
      { wch: 18 },
      { wch: 60 },
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Feedback')

    const dateStr = new Date().toISOString().slice(0, 10)
    const fileName = `Jaipuria_34th_Founders_Day_MASTER_Feedback_${dateStr}.xlsx`

    XLSX.writeFile(workbook, fileName)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf8f3', color: '#28252f' }}>
      <div className="top-accent" />

      {/* Admin Top Navigation */}
      <header
        style={{
          backgroundColor: '#fff',
          borderBottom: '1px solid #ddd9e2',
          padding: '16px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '15px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <img
            src="/assets/school-logo.png"
            alt="Seth M. R. Jaipuria School"
            style={{ height: '42px', width: 'auto' }}
          />
          <div style={{ borderLeft: '2px solid #f47820', paddingLeft: '14px' }}>
            <h1
              style={{
                margin: 0,
                fontSize: '18px',
                fontFamily: 'DM Serif Display, serif',
                color: '#2b1c58',
              }}
            >
              34th Founders' Day (CHETNA) Feedback Dashboard
            </h1>
            <span style={{ fontSize: '11px', color: '#74707c' }}>
              Administrator Portal • Seth M. R. Jaipuria School
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontSize: '11px',
              padding: '4px 10px',
              backgroundColor: '#f3e8ff',
              color: '#3d2877',
              borderRadius: '20px',
              fontWeight: 600,
            }}
          >
            ● founders-day-admin
          </span>
          <button
            onClick={onBackToForm}
            style={{
              padding: '7px 14px',
              fontSize: '12px',
              backgroundColor: 'transparent',
              border: '1px solid #ddd9e2',
              borderRadius: '3px',
              cursor: 'pointer',
              color: '#3d2877',
              fontWeight: 500,
            }}
          >
            Public Form ↗
          </button>
          <button
            onClick={onLogout}
            style={{
              padding: '7px 14px',
              fontSize: '12px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '3px',
              cursor: 'pointer',
              color: '#991b1b',
              fontWeight: 600,
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '28px 24px 60px' }}>
        {/* Metric Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '18px',
            marginBottom: '26px',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '4px',
              border: '1px solid rgba(61, 40, 119, .12)',
              borderTop: '3px solid #3d2877',
              boxShadow: '0 4px 14px rgba(50, 33, 89, .04)',
            }}
          >
            <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#74707c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              Total Feedbacks
            </p>
            <h3 style={{ margin: 0, fontSize: '32px', color: '#2b1c58', fontFamily: 'DM Serif Display, serif' }}>
              {totalCount}
            </h3>
            <span style={{ fontSize: '11px', color: '#74707c' }}>In Supabase database</span>
          </div>

          <div
            style={{
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '4px',
              border: '1px solid rgba(61, 40, 119, .12)',
              borderTop: '3px solid #f47820',
              boxShadow: '0 4px 14px rgba(50, 33, 89, .04)',
            }}
          >
            <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#74707c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              Filtered Feedbacks
            </p>
            <h3 style={{ margin: 0, fontSize: '32px', color: '#f47820', fontFamily: 'DM Serif Display, serif' }}>
              {filteredCount}
            </h3>
            <span style={{ fontSize: '11px', color: '#74707c' }}>Matching current selection</span>
          </div>

          <div
            style={{
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '4px',
              border: '1px solid rgba(61, 40, 119, .12)',
              borderTop: '3px solid #10b981',
              boxShadow: '0 4px 14px rgba(50, 33, 89, .04)',
            }}
          >
            <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#74707c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              Average Rating
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '32px', color: '#2b1c58', fontFamily: 'DM Serif Display, serif' }}>
                {avgRating}
              </h3>
              <span style={{ fontSize: '16px', color: '#f47820' }}>★ / 5</span>
            </div>
            <span style={{ fontSize: '11px', color: '#74707c' }}>Based on displayed records</span>
          </div>

          <div
            style={{
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '4px',
              border: '1px solid rgba(61, 40, 119, .12)',
              borderTop: '3px solid #6366f1',
              boxShadow: '0 4px 14px rgba(50, 33, 89, .04)',
            }}
          >
            <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#74707c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              5-Star Ratings
            </p>
            <h3 style={{ margin: 0, fontSize: '32px', color: '#6366f1', fontFamily: 'DM Serif Display, serif' }}>
              {fiveStarCount}
            </h3>
            <span style={{ fontSize: '11px', color: '#74707c' }}>
              {filteredCount > 0 ? `${Math.round((fiveStarCount / filteredCount) * 100)}% of filtered` : '0%'}
            </span>
          </div>
        </div>

        {/* Filter and Export Action Bar */}
        <div
          style={{
            backgroundColor: '#fff',
            padding: '20px 24px',
            borderRadius: '4px',
            border: '1px solid rgba(61, 40, 119, .12)',
            marginBottom: '22px',
            boxShadow: '0 8px 24px rgba(50, 33, 89, .04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Event Filter Dropdown */}
            <div style={{ flex: '1 1 300px', minWidth: '240px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#2b1c58', marginBottom: '6px' }}>
                SELECT EVENT (FILTER BY EVENT)
              </label>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '0 12px',
                  border: '1px solid #ddd9e2',
                  borderRadius: '3px',
                  backgroundColor: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="ALL">★ All Events (Master View - {feedbacks.length} feedbacks)</option>
                {events.map((evt) => {
                  const countForEvt = feedbacks.filter((f) => f.event_name === evt).length
                  return (
                    <option key={evt} value={evt}>
                      {evt} ({countForEvt} {countForEvt === 1 ? 'entry' : 'entries'})
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Rating Filter */}
            <div style={{ flex: '0 1 150px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#2b1c58', marginBottom: '6px' }}>
                RATING
              </label>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '0 10px',
                  border: '1px solid #ddd9e2',
                  borderRadius: '3px',
                  backgroundColor: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                <option value="ALL">All Ratings</option>
                <option value="5">5 Stars ★★★★★</option>
                <option value="4">4 Stars ★★★★☆</option>
                <option value="3">3 Stars ★★★☆☆</option>
                <option value="2">2 Stars ★★☆☆☆</option>
                <option value="1">1 Star ★☆☆☆☆</option>
              </select>
            </div>

            {/* Search Input */}
            <div style={{ flex: '1 1 240px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#2b1c58', marginBottom: '6px' }}>
                SEARCH DETAILS
              </label>
              <input
                type="text"
                placeholder="Search parent, ward, email, comment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '0 12px',
                  border: '1px solid #ddd9e2',
                  borderRadius: '3px',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Excel Export Buttons */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', paddingTop: '18px' }}>
              <button
                type="button"
                onClick={exportEventExcel}
                title="Export currently filtered event feedback to Excel"
                style={{
                  height: '44px',
                  padding: '0 16px',
                  backgroundColor: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '3px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, .2)',
                  transition: 'background .2s',
                }}
              >
                <span>📥</span> Export Event Excel
              </button>

              <button
                type="button"
                onClick={exportMasterExcel}
                title="Export all feedbacks across all events to a Master Excel spreadsheet"
                style={{
                  height: '44px',
                  padding: '0 16px',
                  backgroundColor: '#3d2877',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '3px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(61, 40, 119, .2)',
                  transition: 'background .2s',
                }}
              >
                <span>📊</span> Export Master Excel
              </button>

              <button
                type="button"
                onClick={loadData}
                title="Refresh latest data from Supabase"
                style={{
                  height: '44px',
                  padding: '0 14px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '3px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                ↻ Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Feedback List Table */}
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '4px',
            border: '1px solid rgba(61, 40, 119, .12)',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(50, 33, 89, .06)',
          }}
        >
          <div
            style={{
              padding: '16px 24px',
              borderBottom: '1px solid #ddd9e2',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#2b1c58', fontWeight: 600 }}>
                {selectedEvent === 'ALL'
                  ? 'All Event Feedbacks (Master View)'
                  : `Feedbacks for: ${selectedEvent}`}
              </h3>
              <span style={{ fontSize: '11px', color: '#74707c' }}>
                Showing {filteredFeedbacks.length} of {totalCount} total entries
              </span>
            </div>
          </div>

          {error && (
            <div
              style={{
                margin: '18px 24px',
                padding: '12px 16px',
                backgroundColor: '#fef2f2',
                border: '1px solid #f87171',
                borderRadius: '4px',
                color: '#991b1b',
                fontSize: '13px',
              }}
            >
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#74707c' }}>
              <p style={{ fontSize: '15px', fontWeight: 500 }}>Loading feedback records from Supabase...</p>
            </div>
          ) : filteredFeedbacks.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#74707c' }}>
              <div style={{ fontSize: '38px', marginBottom: '10px' }}>📋</div>
              <h4 style={{ margin: '0 0 6px', fontSize: '17px', color: '#2b1c58' }}>
                No feedback found
              </h4>
              <p style={{ margin: 0, fontSize: '13px' }}>
                {selectedEvent !== 'ALL'
                  ? `No parents have submitted feedback for "${selectedEvent}" yet.`
                  : 'No feedback submissions found matching your filters.'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#fcfbfe', borderBottom: '1px solid #ddd9e2', color: '#2b1c58' }}>
                    <th style={{ padding: '12px 16px', width: '45px', fontWeight: 600, fontSize: '11px' }}>#</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '11px' }}>PARENT & WARD</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '11px' }}>EVENT VISITED</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '11px' }}>RATING</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '11px' }}>FEEDBACK</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '11px' }}>CONTACT</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeedbacks.map((item, index) => (
                    <tr
                      key={item.id || index}
                      style={{
                        borderBottom: '1px solid #eee9f2',
                        backgroundColor: index % 2 === 0 ? '#fff' : '#faf9fc',
                        transition: 'background .15s',
                      }}
                    >
                      <td style={{ padding: '14px 16px', color: '#74707c', fontSize: '12px' }}>
                        {index + 1}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#2b1c58', fontSize: '13px' }}>
                          {item.parent_name || 'N/A'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#74707c', marginTop: '2px' }}>
                          Ward: <strong style={{ color: '#28252f' }}>{item.ward_name || 'N/A'}</strong> ({item.ward_class || 'Class N/A'})
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            backgroundColor: '#f3e8ff',
                            color: '#3d2877',
                            borderRadius: '3px',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          {item.event_name || 'General'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <StarRating rating={Number(item.rating) || 0} />
                        <div style={{ fontSize: '11px', color: '#74707c', marginTop: '2px' }}>
                          {item.rating} / 5
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', maxWidth: '340px' }}>
                        <div
                          style={{
                            backgroundColor: '#fff',
                            padding: '8px 12px',
                            borderRadius: '3px',
                            border: '1px solid #ece8f0',
                            fontSize: '12px',
                            lineHeight: 1.5,
                            color: '#28252f',
                          }}
                        >
                          "{item.feedback || 'No comments provided.'}"
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', fontSize: '12px', color: '#74707c' }}>
                        <a
                          href={`mailto:${item.email_id}`}
                          style={{ color: '#3d2877', textDecoration: 'none', fontWeight: 500 }}
                        >
                          {item.email_id || 'N/A'}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <footer style={{ paddingBottom: '30px' }}>
        SETH M. R. JAIPURIA SCHOOL <span>•</span> LUCKNOW <span>•</span> FOUNDERS' DAY ADMINISTRATION
      </footer>
    </div>
  )
}
