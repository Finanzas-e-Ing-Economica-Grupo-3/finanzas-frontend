// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://dbelhyauxylwfoisnxsr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiZWxoeWF1eHlsd2ZvaXNueHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDY2NDQsImV4cCI6MjA2MjQ4MjY0NH0.HATnQoVDFeojA8hSxz8qXLnSKzwO4UN04AtR0hG0b9g";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);