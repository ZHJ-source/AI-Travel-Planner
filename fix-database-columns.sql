-- 修复数据库缺失的列
-- 请在 Supabase Dashboard 的 SQL Editor 中执行此脚本

-- 1. 检查并添加 budget 列到 itineraries 表
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'itineraries' 
        AND column_name = 'budget'
    ) THEN
        ALTER TABLE itineraries 
        ADD COLUMN budget DECIMAL(10, 2);
        RAISE NOTICE 'Added budget column to itineraries table';
    ELSE
        RAISE NOTICE 'budget column already exists';
    END IF;
END $$;

-- 2. 检查并添加 preferences 列到 itineraries 表
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'itineraries' 
        AND column_name = 'preferences'
    ) THEN
        ALTER TABLE itineraries 
        ADD COLUMN preferences JSONB DEFAULT '[]';
        RAISE NOTICE 'Added preferences column to itineraries table';
    ELSE
        RAISE NOTICE 'preferences column already exists';
    END IF;
END $$;

-- 3. 验证列是否存在
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'itineraries'
ORDER BY ordinal_position;

-- 4. 刷新 Supabase 缓存
-- 注意：执行完上述 SQL 后，可能需要等待几秒钟让 PostgREST 刷新缓存
-- 或者在 Supabase Dashboard 中重启 API 服务

