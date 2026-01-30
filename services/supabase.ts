
import { createClient } from '@supabase/supabase-js';

// Configuration provided by user
const SUPABASE_URL = 'https://jnznhwzqtgzpyqnkvirn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_sNbbbzTGpwZAGQiN6HOutg_bnvzX5nK';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
