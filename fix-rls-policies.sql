-- 修复 Supabase Row-Level Security (RLS) 策略
-- 在 Supabase Dashboard 的 SQL Editor 中执行

-- 1. 确保 RLS 已启用（通常默认启用）
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;

-- 2. 删除可能存在的旧策略（如果有）
DROP POLICY IF EXISTS "Users can view own itineraries" ON itineraries;
DROP POLICY IF EXISTS "Users can create own itineraries" ON itineraries;
DROP POLICY IF EXISTS "Users can update own itineraries" ON itineraries;
DROP POLICY IF EXISTS "Users can delete own itineraries" ON itineraries;

-- 3. 创建新的 RLS 策略

-- 允许用户查看自己的行程
CREATE POLICY "Users can view own itineraries"
  ON itineraries
  FOR SELECT
  USING (auth.uid() = user_id);

-- 允许用户创建行程（关键！这个策略解决你的保存问题）
CREATE POLICY "Users can create own itineraries"
  ON itineraries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 允许用户更新自己的行程
CREATE POLICY "Users can update own itineraries"
  ON itineraries
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 允许用户删除自己的行程
CREATE POLICY "Users can delete own itineraries"
  ON itineraries
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4. 验证策略是否创建成功
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'itineraries';

-- 5. 测试插入（可选）
-- 这个测试会使用你当前登录的用户
-- 如果成功，说明策略配置正确
INSERT INTO itineraries (user_id, title, data)
VALUES (
  auth.uid(),
  '测试行程',
  '{"destination": "测试城市", "days": []}'::jsonb
)
RETURNING id, title;

-- 如果上面的测试成功，记得删除测试数据
-- DELETE FROM itineraries WHERE title = '测试行程';

