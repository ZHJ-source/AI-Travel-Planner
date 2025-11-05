#!/bin/bash

# AI Travel Planner - 部署验证脚本
# 用于验证单镜像部署是否正常运行

set -e

echo "🔍 AI Travel Planner - 部署验证"
echo "=================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_pass() {
    echo -e "${GREEN}✅ $1${NC}"
}

check_fail() {
    echo -e "${RED}❌ $1${NC}"
}

check_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. 检查 Docker 是否运行
echo "1️⃣  检查 Docker 状态..."
if docker info > /dev/null 2>&1; then
    check_pass "Docker 运行正常"
else
    check_fail "Docker 未运行或无法访问"
    exit 1
fi
echo ""

# 2. 检查镜像是否存在
echo "2️⃣  检查 Docker 镜像..."
if docker images | grep -q "ai-travel-planner-app"; then
    IMAGE_SIZE=$(docker images ai-travel-planner-app:latest --format "{{.Size}}")
    check_pass "镜像存在: ai-travel-planner-app:latest (${IMAGE_SIZE})"
else
    check_fail "镜像不存在，请先构建: docker-compose -f docker-compose-single.yml build"
    exit 1
fi
echo ""

# 3. 检查容器是否运行
echo "3️⃣  检查容器状态..."
if docker ps | grep -q "ai-travel-planner-app"; then
    CONTAINER_STATUS=$(docker ps --filter "name=ai-travel-planner-app" --format "{{.Status}}")
    check_pass "容器运行中: ${CONTAINER_STATUS}"
else
    check_fail "容器未运行，请启动: docker-compose -f docker-compose-single.yml up -d"
    exit 1
fi
echo ""

# 4. 检查端口映射
echo "4️⃣  检查端口映射..."
if docker ps | grep "ai-travel-planner-app" | grep -q "80->80"; then
    check_pass "端口映射正确: 0.0.0.0:80->80/tcp"
else
    check_warn "端口映射可能不正确"
fi
echo ""

# 5. 测试前端访问
echo "5️⃣  测试前端访问..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    check_pass "前端访问正常 (HTTP $HTTP_CODE)"
else
    check_fail "前端访问失败 (HTTP $HTTP_CODE)"
fi
echo ""

# 6. 测试后端 API
echo "6️⃣  测试后端 API..."
API_RESPONSE=$(curl -s http://localhost/api/health 2>/dev/null || echo "")
if echo "$API_RESPONSE" | grep -q "ok"; then
    TIMESTAMP=$(echo "$API_RESPONSE" | grep -o '"timestamp":"[^"]*"' | cut -d'"' -f4)
    check_pass "后端 API 正常"
    echo "   响应: $API_RESPONSE"
else
    check_fail "后端 API 异常"
    echo "   响应: $API_RESPONSE"
fi
echo ""

# 7. 检查容器日志（最后10行）
echo "7️⃣  查看容器日志..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker logs ai-travel-planner-app-1 --tail 10 2>&1 | sed 's/^/   /'
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 8. 容器资源使用
echo "8️⃣  容器资源使用..."
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep -E "(CONTAINER|ai-travel-planner)" | sed 's/^/   /'
echo ""

# 总结
echo "=================================="
echo "🎉 部署验证完成！"
echo ""
echo "📝 访问地址:"
echo "   - 前端应用: http://localhost"
echo "   - 后端 API: http://localhost/api"
echo "   - 健康检查: http://localhost/api/health"
echo ""
echo "📚 常用命令:"
echo "   - 查看日志: docker-compose -f docker-compose-single.yml logs -f"
echo "   - 重启服务: docker-compose -f docker-compose-single.yml restart"
echo "   - 停止服务: docker-compose -f docker-compose-single.yml down"
echo ""

