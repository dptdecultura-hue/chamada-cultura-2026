import { createClient } from '@supabase/supabase-js'

// Usamos as variáveis do .env.local, mas com um "fallback" caso falhem
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wilmewhekkvcocjbydxb.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_mHXaPK-MFZYUggo-qy2soQ_yDDBr1IH'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)