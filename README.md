# 🌏 AI 旅行规划师

基于多 Agent 协同的智能旅行行程规划系统，使用 DeepSeek AI 生成个性化旅行计划。

## 项目简介

### 核心功能
- 🤖 AI 自然语言行程生成
- 🗺️ 高德地图地点验证和展示
- 🎤 语音输入支持
- 💾 行程保存和管理
- 🔐 用户认证系统

### 技术栈
- **前端**：React 18 + TypeScript + TailwindCSS + Vite
- **后端**：Node.js + Express + TypeScript
- **AI 服务**：DeepSeek API
- **地图服务**：高德地图 API
- **数据库**：Supabase (PostgreSQL)

### Agent 架构
- **LLM Agent**：解析需求、生成行程
- **Map Agent**：地点验证、POI 搜索
- **Validator Agent**：过滤 AI 幻觉内容

---

## 🔑 API Keys 配置

### 需要的 API Keys（共 7 个配置项）

| API Key | 用途 | 获取地址 |
|---------|------|----------|
| DeepSeek API Key | AI 生成行程 | [platform.deepseek.com](https://platform.deepseek.com/api_keys) |
| 高德 Web API Key | 后端地点搜索 | [console.amap.com](https://console.amap.com) 选择"Web服务" |
| 高德 JS API Key | 前端地图显示 | [console.amap.com](https://console.amap.com) 选择"Web端(JS API)" |
| Supabase URL | 数据库连接 | [supabase.com](https://supabase.com) → 项目 → Settings → API |
| Supabase Anon Key | 前端认证 | Supabase → Settings → API → `anon` `public` |
| Supabase Service Key | 后端管理 | Supabase → Settings → API → `service_role` `secret` |

⚠️ **注意**：高德地图需要申请**两个不同类型**的 Key（Web服务 + JS API）

---

## 🚀 部署方式一：源码部署

### 1. 克隆代码
```bash
git clone https://github.com/YOUR_USERNAME/AI-Travel-Planner.git
cd AI-Travel-Planner
```

### 2. 初始化数据库

**`backend/supabase-schema.sql` 的作用**：创建应用所需的数据库表结构（`itineraries` 行程表、`user_profiles` 用户表）及安全策略。

**操作步骤**：
1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 创建新项目
3. 进入 **SQL Editor** → **New Query**
4. 复制 `backend/supabase-schema.sql` 的全部内容并执行
5. 在 **Table Editor** 中确认 `itineraries` 和 `user_profiles` 表已创建

### 3. 配置环境变量

**后端** `backend/.env`：
```bash
cp backend/.env.example backend/.env
# 编辑 backend/.env
```

填入以下内容：
```env
DEEPSEEK_API_KEY=你的DeepSeek_API_Key
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
AMAP_WEB_API_KEY=你的高德Web服务Key
SUPABASE_URL=https://你的项目ID.supabase.co
SUPABASE_ANON_KEY=你的Supabase_Anon_Key
SUPABASE_SERVICE_ROLE_KEY=你的Supabase_Service_Key
PORT=3000
```

**前端** `frontend/.env`：
```bash
cp frontend/.env.example frontend/.env
# 编辑 frontend/.env
```

填入以下内容：
```env
VITE_AMAP_JS_API_KEY=你的高德JS_API_Key
VITE_SUPABASE_URL=https://你的项目ID.supabase.co
VITE_SUPABASE_ANON_KEY=你的Supabase_Anon_Key
```

### 4. 安装依赖
```bash
# 后端
cd backend
npm install

# 前端
cd frontend
npm install
```

### 5. 启动服务
```bash
# 终端 1 - 启动后端
cd backend
npm run dev
# 运行在 http://localhost:3000

# 终端 2 - 启动前端
cd frontend
npm run dev
# 运行在 http://localhost:5173
```

### 6. 访问应用
打开浏览器访问 `http://localhost:5173`

---

## 🐳 部署方式二：Docker 部署

### 1. 克隆代码并初始化数据库
```bash
git clone https://github.com/YOUR_USERNAME/AI-Travel-Planner.git
cd AI-Travel-Planner
```

按照上面"源码部署"的步骤 2 初始化 Supabase 数据库。

### 2. 配置环境变量

只需配置 `backend/.env`（同源码部署的步骤 3）

### 3. 修改 docker-compose.yml

编辑 `docker-compose.yml`，在 `frontend` 服务下添加构建参数：

```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_AMAP_JS_API_KEY: "你的高德JS_API_Key"
        VITE_SUPABASE_URL: "你的Supabase_URL"
        VITE_SUPABASE_ANON_KEY: "你的Supabase_Anon_Key"
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - app-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    env_file:
      - ./backend/.env
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

### 4. 启动容器
```bash
docker-compose up -d
```

### 5. 访问应用
- 前端：`http://localhost`
- 后端：`http://localhost:3000`

### Docker 管理命令
```bash
# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 重新构建
docker-compose up -d --build
```

---

## 📁 项目结构

```
AI-Travel-Planner/
├── backend/
│   ├── src/
│   │   ├── routes/          # API 路由
│   │   ├── services/        # Agent 业务逻辑
│   │   │   ├── llm/         # DeepSeek AI 服务
│   │   │   ├── map/         # 高德地图服务
│   │   │   └── itinerary/   # 行程生成器
│   │   ├── middleware/      # 认证、错误处理
│   │   └── config/          # 配置文件
│   ├── supabase-schema.sql  # 数据库表结构
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/           # 页面组件
│   │   ├── components/      # UI 组件
│   │   ├── services/        # API 调用
│   │   └── stores/          # 状态管理
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
└── docker-compose.yml       # Docker 编排配置
```

---

## 🔧 常见问题

### 1. 保存行程时报错 "Missing or invalid authorization header"

**原因**：数据库表结构未正确创建

**解决**：
1. 确认已在 Supabase 中执行 `backend/supabase-schema.sql`
2. 检查 Table Editor 中是否有 `itineraries` 表
3. 确认 `itineraries` 表包含 `data` JSONB 字段

### 2. 地图不显示

**原因**：高德地图 API Key 类型错误

**解决**：
- 前端必须使用 **"Web端(JS API)"** 类型的 Key
- 后端必须使用 **"Web服务"** 类型的 Key
- 两个 Key 不能混用

### 3. AI 生成失败

**原因**：DeepSeek API Key 无效或余额不足

**解决**：
1. 检查 `backend/.env` 中的 `DEEPSEEK_API_KEY`
2. 访问 [DeepSeek 控制台](https://platform.deepseek.com) 确认 Key 状态
3. 确保账户有足够余额

### 4. Docker 构建失败

**解决**：
```bash
# 清理缓存
docker-compose down
docker system prune -a

# 重新构建
docker-compose up -d --build
```

---

## 📝 使用流程

1. **注册账户**：访问应用首页 → 注册
2. **规划行程**：点击"开始规划旅行" → 填写信息或语音输入
3. **查看结果**：AI 生成行程 → 地图显示路线
4. **保存管理**：保存到云端 → "我的行程"中查看

---

## 📄 License

MIT

---

**开发框架**：React + Node.js + Supabase  
**核心技术**：DeepSeek LLM + 高德地图 API
