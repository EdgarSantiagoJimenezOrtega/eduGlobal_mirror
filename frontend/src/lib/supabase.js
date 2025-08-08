import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mppfxkhpkxdqtupwgrzz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wcGZ4a2hwa3hkcXR1cHdncnp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MDA2MTQsImV4cCI6MjA3MDE3NjYxNH0.VmRymeGl_v12pwqPWKu6Mk7hSnLyki3UjM5DQFrdyMg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})