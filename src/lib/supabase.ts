// ============================================================================
// SUPABASE API CONFIGURATION & METHODS
// Events and Feedback are fetched LIVE from your Supabase database.
// ============================================================================
export const SUPABASE_URL: string =
  import.meta.env.VITE_SUPABASE_URL || 'https://tlvrxuioxzmbchvzngvx.supabase.co'

export const SUPABASE_ANON_KEY: string =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_AdhMaEUqfJnpx44VEuXwHQ_Y1x1IvKe'

export interface FeedbackData {
  parentName: string
  wardName: string
  wardClass: string
  email: string
  event: string
  rating: number
  feedback: string
}

export interface FeedbackItem {
  id: number
  parent_name: string
  ward_name: string
  ward_class: string
  email_id: string
  event_name: string
  rating: number
  feedback: string
  created_at?: string
}

/**
 * Fetches the event list 100% LIVE from your Supabase 'events' table.
 * No hardcoded events list.
 */
export async function getEvents(): Promise<string[]> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/events?select=event_name&order=event_name.asc`,
      {
        method: 'GET',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      console.error(`[Supabase] Events fetch failed with HTTP status ${response.status}`)
      return []
    }

    const data = await response.json()
    if (Array.isArray(data)) {
      return data
        .map((row: any) => row.event_name)
        .filter((name: any) => typeof name === 'string' && name.trim().length > 0)
    }

    return []
  } catch (err) {
    console.error('[Supabase] Error fetching live events from Supabase table:', err)
    return []
  }
}

/**
 * Submits feedback directly to the Supabase 'feedback' table.
 */
export async function submitFeedbackToSupabase(
  data: FeedbackData
): Promise<{ success: boolean; error?: string }> {
  const payload = {
    parent_name: data.parentName,
    ward_name: data.wardName,
    ward_class: data.wardClass,
    email_id: data.email,
    event_name: data.event,
    rating: data.rating,
    feedback: data.feedback,
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/feedback`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[Supabase] Feedback insert failed:', response.status, errorData)

      if (errorData?.code === '42501' || response.status === 401 || response.status === 403) {
        return {
          success: false,
          error:
            'Submission blocked by Supabase Row Level Security. Run "ALTER TABLE public.feedback DISABLE ROW LEVEL SECURITY;" in Supabase SQL Editor.',
        }
      }

      return {
        success: false,
        error: errorData?.message || `Submission failed with status ${response.status}`,
      }
    }

    return { success: true }
  } catch (err: any) {
    console.error('[Supabase] Network error submitting feedback:', err)
    return { success: false, error: err?.message || 'Network error submitting feedback.' }
  }
}

/**
 * Fetches all feedback rows from the Supabase 'feedback' table for the Admin Dashboard.
 */
export async function fetchAllFeedback(): Promise<{
  success: boolean
  data: FeedbackItem[]
  error?: string
}> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/feedback?select=*&order=id.desc`,
      {
        method: 'GET',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      if (errorData?.code === '42501') {
        return {
          success: false,
          data: [],
          error:
            'Read blocked by Supabase Row Level Security. Run "ALTER TABLE public.feedback DISABLE ROW LEVEL SECURITY;" in Supabase SQL Editor.',
        }
      }
      return {
        success: false,
        data: [],
        error: errorData?.message || `Failed to fetch feedback (Status: ${response.status})`,
      }
    }

    const data: FeedbackItem[] = await response.json()
    return { success: true, data: data || [] }
  } catch (err: any) {
    console.error('[Supabase] Error fetching all feedback:', err)
    return { success: false, data: [], error: err?.message || 'Network error' }
  }
}
