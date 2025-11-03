import { createClient } from '@supabase/supabase-js';
import { ENV } from './env';

// 使用匿名密钥创建Supabase客户端（用于验证用户token）
// 注意：这里使用ANON_KEY而不是SERVICE_ROLE_KEY，因为前端用户token是用ANON_KEY签名的
export const supabase = createClient(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// 如果需要管理员操作，可以创建另一个客户端
export const supabaseAdmin = createClient(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

