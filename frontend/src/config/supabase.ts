import { createClient } from '@supabase/supabase-js';

// 从localStorage获取自定义配置
function getSupabaseConfig() {
  try {
    const savedKeys = localStorage.getItem('apiKeys');
    if (savedKeys) {
      const parsed = JSON.parse(savedKeys);
      return {
        url: parsed.supabaseUrl || import.meta.env.VITE_SUPABASE_URL || '',
        anonKey: parsed.supabaseAnonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      };
    }
  } catch (error) {
    console.error('Failed to parse saved Supabase config:', error);
  }
  
  return {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  };
}

const config = getSupabaseConfig();

console.log('Supabase config:', { 
  url: config.url, 
  hasKey: !!config.anonKey,
  source: localStorage.getItem('apiKeys') ? 'localStorage' : 'env'
});

export const supabase = createClient(config.url, config.anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});

