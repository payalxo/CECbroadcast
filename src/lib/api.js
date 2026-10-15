import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Sends a request to your Python server, with your login proof attached.
export async function authedFetch(path, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token || '';
  return fetch(API + path, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
  });
}