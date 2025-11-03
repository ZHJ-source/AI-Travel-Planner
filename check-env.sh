#!/bin/bash

# 环境检查脚本
# 用于检查项目的环境配置是否完整

echo "🔍 检查环境配置..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查前端环境变量
echo "📦 检查前端配置 (frontend/.env)..."
if [ -f "frontend/.env" ]; then
    echo -e "${GREEN}✓${NC} .env 文件存在"
    
    # 检查必需的环境变量
    if grep -q "VITE_SUPABASE_URL=" frontend/.env; then
        echo -e "${GREEN}✓${NC} VITE_SUPABASE_URL 已配置"
    else
        echo -e "${RED}✗${NC} VITE_SUPABASE_URL 未配置"
    fi
    
    if grep -q "VITE_SUPABASE_ANON_KEY=" frontend/.env; then
        echo -e "${GREEN}✓${NC} VITE_SUPABASE_ANON_KEY 已配置"
    else
        echo -e "${RED}✗${NC} VITE_SUPABASE_ANON_KEY 未配置"
    fi
    
    if grep -q "VITE_AMAP_JS_API_KEY=" frontend/.env; then
        echo -e "${GREEN}✓${NC} VITE_AMAP_JS_API_KEY 已配置"
    else
        echo -e "${YELLOW}⚠${NC} VITE_AMAP_JS_API_KEY 未配置（地图将无法显示）"
    fi
else
    echo -e "${RED}✗${NC} frontend/.env 文件不存在"
    echo -e "${YELLOW}提示：${NC}请创建 frontend/.env 文件，参考 ENV_SETUP.md"
fi

echo ""

# 检查后端环境变量
echo "🔧 检查后端配置 (backend/.env)..."
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✓${NC} .env 文件存在"
    
    # 检查必需的环境变量
    if grep -q "SUPABASE_URL=" backend/.env; then
        echo -e "${GREEN}✓${NC} SUPABASE_URL 已配置"
    else
        echo -e "${RED}✗${NC} SUPABASE_URL 未配置"
    fi
    
    if grep -q "SUPABASE_SERVICE_KEY=" backend/.env; then
        echo -e "${GREEN}✓${NC} SUPABASE_SERVICE_KEY 已配置"
    else
        echo -e "${RED}✗${NC} SUPABASE_SERVICE_KEY 未配置"
    fi
    
    if grep -q "AMAP_WEB_API_KEY=" backend/.env; then
        echo -e "${GREEN}✓${NC} AMAP_WEB_API_KEY 已配置"
    else
        echo -e "${YELLOW}⚠${NC} AMAP_WEB_API_KEY 未配置（地理编码将失败）"
    fi
    
    if grep -q "DEEPSEEK_API_KEY=" backend/.env; then
        echo -e "${GREEN}✓${NC} DEEPSEEK_API_KEY 已配置"
    else
        echo -e "${RED}✗${NC} DEEPSEEK_API_KEY 未配置"
    fi
else
    echo -e "${RED}✗${NC} backend/.env 文件不存在"
    echo -e "${YELLOW}提示：${NC}请创建 backend/.env 文件，参考 ENV_SETUP.md"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 更多帮助："
echo "  - 配置指南: ENV_SETUP.md"
echo "  - 故障排除: TROUBLESHOOTING.md"
echo "  - 使用说明: 使用说明.md"
echo ""

