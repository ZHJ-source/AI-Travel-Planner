# AI Travel Planner - 单镜像部署 Makefile
# 简化常用 Docker 操作

.PHONY: help build up down restart logs verify clean status

# 默认目标
help:
	@echo "🚀 AI Travel Planner - 单镜像部署"
	@echo "=================================="
	@echo ""
	@echo "可用命令:"
	@echo "  make build    - 构建 Docker 镜像"
	@echo "  make up       - 启动服务"
	@echo "  make down     - 停止服务"
	@echo "  make restart  - 重启服务"
	@echo "  make logs     - 查看实时日志"
	@echo "  make verify   - 验证部署状态"
	@echo "  make status   - 查看容器状态"
	@echo "  make clean    - 清理容器和镜像"
	@echo ""
	@echo "快速开始:"
	@echo "  make build && make up && make verify"
	@echo ""

# 构建镜像
build:
	@echo "📦 构建 Docker 镜像..."
	docker-compose -f docker-compose-single.yml build
	@echo "✅ 构建完成"

# 启动服务
up:
	@echo "🚀 启动服务..."
	docker-compose -f docker-compose-single.yml up -d
	@echo "✅ 服务已启动"
	@echo ""
	@echo "访问地址:"
	@echo "  前端: http://localhost"
	@echo "  API:  http://localhost/api"

# 停止服务
down:
	@echo "🛑 停止服务..."
	docker-compose -f docker-compose-single.yml down
	@echo "✅ 服务已停止"

# 重启服务
restart:
	@echo "🔄 重启服务..."
	docker-compose -f docker-compose-single.yml restart
	@echo "✅ 服务已重启"

# 查看日志
logs:
	@echo "📋 查看实时日志 (Ctrl+C 退出)..."
	docker-compose -f docker-compose-single.yml logs -f

# 验证部署
verify:
	@echo "🔍 验证部署状态..."
	@./verify-deployment.sh

# 查看状态
status:
	@echo "📊 容器状态:"
	@docker-compose -f docker-compose-single.yml ps
	@echo ""
	@echo "📈 资源使用:"
	@docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep -E "(CONTAINER|ai-travel-planner)" || true

# 清理
clean:
	@echo "🧹 清理容器和镜像..."
	docker-compose -f docker-compose-single.yml down
	docker rmi ai-travel-planner-app:latest 2>/dev/null || true
	@echo "✅ 清理完成"

# 完整重建（清理后重新构建和启动）
rebuild:
	@echo "🔄 开始完整重建..."
	@make down
	@echo "🗑️  清理旧镜像..."
	@docker rmi ai-travel-planner-app:latest 2>/dev/null || true
	@make build
	@make up
	@echo "🎉 重建完成"
	@sleep 3
	@make verify

# 开发者命令
dev-logs:
	docker-compose -f docker-compose-single.yml logs -f --tail=100

dev-shell:
	docker exec -it ai-travel-planner-app-1 sh

dev-nginx-config:
	docker exec ai-travel-planner-app-1 cat /etc/nginx/conf.d/default.conf

dev-test-backend:
	docker exec ai-travel-planner-app-1 curl -s localhost:3000/api/health

