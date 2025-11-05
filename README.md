# 🌍 AI Travel Planner

智能旅行规划助手 - 基于 AI 的个性化旅行行程规划系统

---

## 📋 目录结构

```
AI-Travel-Planner/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── app.ts             # 应用入口
│   │   ├── config/            # 配置文件
│   │   ├── middleware/        # 中间件
│   │   ├── routes/            # 路由
│   │   ├── services/          # 业务逻辑
│   │   │   ├── itinerary/     # 行程生成
│   │   │   ├── llm/           # LLM 服务
│   │   │   └── map/           # 地图服务
│   │   └── types/             # 类型定义
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                   # 环境变量（需手动创建）
│
├── frontend/                   # 前端应用
│   ├── src/
│   │   ├── components/        # React 组件
│   │   ├── pages/             # 页面
│   │   ├── services/          # API 服务
│   │   ├── stores/            # 状态管理
│   │   ├── config/            # 配置
│   │   └── types/             # 类型定义
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.production        # 生产环境变量（需手动创建）
│
├── docs/                       # 文档
│   ├── JOURNEY.md             # 工作历程
│   ├── DEPLOYMENT.md          # 部署指南
│   ├── QUICK_START.md         # 快速开始
│   ├── TROUBLESHOOTING.md     # 故障排查
│   ├── DOCKER_SETUP.md        # Docker 配置
│   └── CHANGELOG.md           # 更新日志
│
├── Dockerfile                  # 单镜像构建配置
├── docker-compose-single.yml   # 单镜像部署配置
├── docker-compose.yml          # 分离架构部署配置（备选）
├── nginx-single.conf          # Nginx 配置
├── start.sh                   # 容器启动脚本
├── verify-deployment.sh       # 部署验证脚本
├── Makefile                   # 快捷命令
└── README.md                  # 本文件
```

---

## 🚀 快速开始

### 方式一：使用 Docker 单镜像部署（推荐）

**1. 配置环境变量**

创建 `backend/.env` 文件：
```bash
SUPABASE_URL=你的_supabase_url
SUPABASE_ANON_KEY=你的_supabase_key
DEEPSEEK_API_KEY=你的_deepseek_key
AMAP_WEB_API_KEY=你的_高德地图_key
```

创建 `frontend/.env.production` 文件：
```bash
VITE_SUPABASE_URL=你的_supabase_url
VITE_SUPABASE_ANON_KEY=你的_supabase_key
VITE_AMAP_JS_API_KEY=你的_高德地图_js_key
VITE_AMAP_WEB_API_KEY=你的_高德地图_web_key
```

**2. 构建并启动**

```bash
# 使用 Makefile
make build && make up

# 或使用 docker-compose
docker-compose -f docker-compose-single.yml up -d --build
```

**3. 访问应用**

打开浏览器访问：http://localhost

---

### 方式二：源代码运行（开发模式）

**1. 安装依赖**

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

**2. 配置环境变量**

创建 `backend/.env` 文件（同上）

**3. 启动服务**

```bash
# 终端 1: 启动后端
cd backend
npm run dev

# 终端 2: 启动前端
cd frontend
npm run dev
```

**4. 访问应用**

打开浏览器访问：http://localhost:5173

---

## 🐳 Docker 部署详细说明

### 单镜像部署

**优点**:
- ✅ 部署简单（一个镜像）
- ✅ 资源效率高
- ✅ 网络延迟低
- ✅ 适合小型应用

**使用场景**:
- 单机部署
- 演示环境
- 小型应用

```bash
# 构建镜像
docker build -t ai-travel-planner .

# 运行容器
docker run -d -p 80:80 \
  --env-file backend/.env \
  ai-travel-planner

# 查看日志
docker logs -f <container_id>
```

### 分离架构部署（备选）

**优点**:
- ✅ 前后端独立扩展
- ✅ 故障隔离
- ✅ 符合微服务架构

**使用场景**:
- 大规模部署
- 需要独立扩展
- Kubernetes 环境

```bash
# 使用原有的 docker-compose
docker-compose up -d
```

---

## 📚 文档

- **[工作历程](./docs/JOURNEY.md)** - 单镜像部署实现全过程
- **[部署指南](./docs/DEPLOYMENT.md)** - 完整部署文档
- **[快速开始](./docs/QUICK_START.md)** - 1分钟快速上手
- **[故障排查](./docs/TROUBLESHOOTING.md)** - 常见问题解决
- **[Docker 配置](./docs/DOCKER_SETUP.md)** - Docker 环境配置
- **[更新日志](./docs/CHANGELOG.md)** - 版本更新记录

---

## 🛠️ 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: TailwindCSS
- **状态管理**: Zustand
- **路由**: React Router
- **地图**: 高德地图 JS API

### 后端
- **运行时**: Node.js 20
- **框架**: Express
- **语言**: TypeScript
- **数据库**: Supabase (PostgreSQL)
- **AI 服务**: DeepSeek API
- **地图服务**: 高德地图 Web API

### 部署
- **容器化**: Docker
- **Web 服务器**: Nginx
- **进程管理**: Shell Script
- **编排**: Docker Compose

---

## 🔧 常用命令

### Makefile 命令（推荐）

```bash
make help      # 查看所有可用命令
make build     # 构建 Docker 镜像
make up        # 启动服务
make down      # 停止服务
make restart   # 重启服务
make logs      # 查看实时日志
make status    # 查看容器状态
make verify    # 验证部署
make rebuild   # 完整重建
make clean     # 清理镜像
```

### 开发命令

```bash
# 后端开发
cd backend
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm start        # 启动生产服务器

# 前端开发
cd frontend
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run preview  # 预览生产版本
```

---

## ⚙️ 环境变量说明

### 后端环境变量 (`backend/.env`)

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `SUPABASE_URL` | Supabase 项目 URL | ✅ |
| `SUPABASE_ANON_KEY` | Supabase 匿名密钥 | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务密钥 | ✅ |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | ✅ |
| `DEEPSEEK_API_URL` | DeepSeek API 地址 | ❌ |
| `AMAP_WEB_API_KEY` | 高德地图 Web 服务 Key | ✅ |

### 前端环境变量 (`frontend/.env.production`)

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `VITE_SUPABASE_URL` | Supabase 项目 URL | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | ✅ |
| `VITE_AMAP_JS_API_KEY` | 高德地图 JavaScript API Key | ✅ |
| `VITE_AMAP_WEB_API_KEY` | 高德地图 Web 服务 Key | ✅ |
| `VITE_API_BASE_URL` | API 基础路径（可选） | ❌ |

⚠️ **重要**: Vite 要求所有前端环境变量必须以 `VITE_` 开头！

---

## 📊 镜像信息

- **镜像名称**: ai-travel-planner-app:latest
- **镜像大小**: 208MB
- **基础镜像**: nginx:alpine + node:20-alpine
- **架构**: Nginx (前台) + Node.js (后台)
- **端口**: 80

---

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

---

## 📝 许可证

MIT License

---

## 🔗 相关链接

- **Supabase**: https://supabase.com
- **DeepSeek API**: https://www.deepseek.com
- **高德开放平台**: https://lbs.amap.com

---

## 📞 支持

如遇问题，请查看：
1. [故障排查文档](./docs/TROUBLESHOOTING.md)
2. [部署指南](./docs/DEPLOYMENT.md)
3. [工作历程](./docs/JOURNEY.md)（了解实现细节）

---

**版本**: 1.0.0  
**最后更新**: 2025-11-05
