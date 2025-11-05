# 📦 部署指南

完整的 Docker 单镜像部署文档。

---

## 快速开始

```bash
# 1. 构建镜像
make build

# 2. 启动服务
make up

# 3. 验证部署
make verify

# 访问应用
open http://localhost
```

---

## 环境要求

- Docker Desktop
- 磁盘空间: 至少 2GB
- 端口 80 未被占用

---

## 完整部署步骤

### 1. 配置环境变量

#### 后端配置 (`backend/.env`)

```bash
# Supabase
SUPABASE_URL=你的_supabase_url
SUPABASE_ANON_KEY=你的_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=你的_supabase_service_role_key

# DeepSeek API
DEEPSEEK_API_KEY=你的_deepseek_key

# 高德地图
AMAP_WEB_API_KEY=你的_高德地图_web_api_key
```

#### 前端配置 (`frontend/.env.production`)

```bash
# Supabase (必填)
VITE_SUPABASE_URL=你的_supabase_url
VITE_SUPABASE_ANON_KEY=你的_supabase_anon_key

# 高德地图 (必填)
VITE_AMAP_JS_API_KEY=你的_高德地图_js_api_key
VITE_AMAP_WEB_API_KEY=你的_高德地图_web_api_key
```

⚠️ **重要**: 前端所有环境变量必须以 `VITE_` 开头！

### 2. 构建镜像

```bash
# 使用 Makefile
make build

# 或使用 docker-compose
docker-compose -f docker-compose-single.yml build
```

### 3. 启动服务

```bash
# 使用 Makefile
make up

# 或使用 docker-compose
docker-compose -f docker-compose-single.yml up -d
```

### 4. 验证部署

```bash
# 自动验证
./verify-deployment.sh

# 或手动检查
curl http://localhost/api/health
curl http://localhost/
```

---

## 常用命令

### 使用 Makefile（推荐）

```bash
make help      # 查看所有命令
make build     # 构建镜像
make up        # 启动服务
make down      # 停止服务
make restart   # 重启服务
make logs      # 查看日志
make status    # 查看状态
make verify    # 验证部署
make rebuild   # 完整重建
make clean     # 清理镜像
```

### 使用 docker-compose

```bash
# 启动
docker-compose -f docker-compose-single.yml up -d

# 停止
docker-compose -f docker-compose-single.yml down

# 查看日志
docker-compose -f docker-compose-single.yml logs -f

# 重启
docker-compose -f docker-compose-single.yml restart
```

---

## 重新构建

当你修改了代码或配置后：

```bash
# 方法 1: 使用 Makefile
make rebuild

# 方法 2: 手动执行
docker-compose -f docker-compose-single.yml down
docker-compose -f docker-compose-single.yml build
docker-compose -f docker-compose-single.yml up -d
```

---

## 访问应用

- **前端**: http://localhost
- **后端 API**: http://localhost/api
- **健康检查**: http://localhost/api/health

---

## 架构说明

### 单镜像架构

```
┌─────────────────────────────────┐
│   Docker Container (Port 80)    │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Nginx (前台)             │   │
│  │ - 静态文件服务           │   │
│  │ - API 代理到 :3000      │   │
│  └─────────────────────────┘   │
│            ↓                    │
│  ┌─────────────────────────┐   │
│  │ Node.js (后台)           │   │
│  │ - Express API            │   │
│  │ - 监听 localhost:3000   │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

### 镜像信息

- **名称**: ai-travel-planner-app:latest
- **大小**: 208MB
- **基础镜像**: nginx:alpine + node:20-alpine

---

## 故障排查

详见 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### 常见问题

#### 1. 网络错误 / API 调用失败

**原因**: 环境变量未配置

**解决**:
1. 检查 `frontend/.env.production` 是否存在
2. 确保所有变量都有 `VITE_` 前缀
3. 重新构建镜像

#### 2. 地图加载失败

**原因**: 高德地图 API Key 未配置或配置错误

**解决**:
1. 确保配置了 `VITE_AMAP_JS_API_KEY`
2. 确保配置了 `VITE_AMAP_WEB_API_KEY`
3. 重新构建镜像

#### 3. 容器无法启动

**检查日志**:
```bash
docker logs ai-travel-planner-app-1
```

**常见原因**:
- 端口 80 被占用
- 环境变量缺失
- 内存不足

---

## 性能优化

### 镜像大小优化

已经使用了多阶段构建和 Alpine 基础镜像，镜像大小已优化到 208MB。

### 构建速度优化

1. 使用 `.dockerignore` 排除不必要文件
2. 利用 Docker 缓存层
3. 分离依赖安装和代码复制

---

## 安全建议

1. **不要将 `.env` 文件提交到 Git**
2. **定期更新基础镜像**
3. **使用非 root 用户运行**（待实现）
4. **定期扫描漏洞**

---

## 更多信息

- [快速开始](./QUICK_START.md)
- [故障排查](./TROUBLESHOOTING.md)
- [Docker 配置](./DOCKER_SETUP.md)
- [工作历程](./JOURNEY.md)
- [更新日志](./CHANGELOG.md)

