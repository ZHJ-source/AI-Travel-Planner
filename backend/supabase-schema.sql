-- ============================================
-- AI旅行规划师 - 简化单表设计
-- ============================================
-- 此 schema 使用 JSONB 存储所有行程数据
-- 适合中小规模应用，查询简单，维护方便
-- ============================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 用户配置表（可选）
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(100),
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 行程表 - 简化单表设计
-- ============================================
-- 所有行程数据存储在 data JSONB 字段中
-- data 结构示例：
-- {
--   "destination": "北京",
--   "startDate": "2025-01-01",
--   "endDate": "2025-01-03",
--   "days": [
--     {
--       "date": "第1天",
--       "events": [
--         {
--           "name": "天安门广场",
--           "type": "景点",
--           "location": {...},
--           "subEvents": [...]
--         }
--       ]
--     }
--   ],
--   "travelers": 2,
--   "budget": 5000,
--   "preferences": [],
--   "status": "draft",
--   "transportation": {...},
--   "accommodation": {...}
-- }
-- ============================================

CREATE TABLE IF NOT EXISTS itineraries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_itineraries_user_id 
  ON itineraries(user_id);

CREATE INDEX IF NOT EXISTS idx_itineraries_created_at 
  ON itineraries(created_at DESC);

-- 可选：为 JSONB 字段创建 GIN 索引以支持复杂查询
CREATE INDEX IF NOT EXISTS idx_itineraries_data_gin 
  ON itineraries USING GIN (data);

-- ============================================
-- Row Level Security (RLS) 策略
-- ============================================
-- 确保用户只能访问自己的行程数据

ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;

-- 允许用户查看自己的行程
CREATE POLICY "Users can view own itineraries"
  ON itineraries FOR SELECT
  USING (auth.uid() = user_id);

-- 允许用户创建自己的行程
CREATE POLICY "Users can create own itineraries"
  ON itineraries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 允许用户更新自己的行程
CREATE POLICY "Users can update own itineraries"
  ON itineraries FOR UPDATE
  USING (auth.uid() = user_id);

-- 允许用户删除自己的行程
CREATE POLICY "Users can delete own itineraries"
  ON itineraries FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 辅助函数（可选）
-- ============================================

-- 自动更新 user_profiles 的 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 完成！
-- ============================================
-- 执行此文件后，你将拥有：
-- 1. user_profiles 表（可选，存储用户资料）
-- 2. itineraries 表（存储所有行程数据）
-- 3. 适当的索引和 RLS 策略
-- 
-- 使用方法：
-- 1. 在 Supabase SQL Editor 中执行此文件
-- 2. 确认表已创建
-- 3. 开始使用你的应用！
-- ============================================

