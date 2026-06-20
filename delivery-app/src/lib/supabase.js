import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sxfnqucwcteiligdtehq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_dM-KWcyy3aWtk3XeAYdCkw_uvyhIcuJ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  // Todas las tablas viven en el schema 'delivery'
  db: { schema: 'delivery' },
});

// Cliente separado para llamar funciones RPC en el schema delivery
export const rpc = (fn, args) => supabase.rpc(fn, args);
