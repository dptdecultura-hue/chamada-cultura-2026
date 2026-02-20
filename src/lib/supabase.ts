import { createClient } from '@supabase/supabase-js'

// Usamos as variáveis do .env.local, mas com um "fallback" caso falhem
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wilmewhekkvcocjbydxb.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpbG1ld2hla2t2Y29jamJ5ZHhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTI3NjYsImV4cCI6MjA4NTAyODc2Nn0.cvB2-YpRM-yQPugRL93_H5NE-966Cb-76y6OFzFC6hs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
