# 🌏 AI旅行规划师

基于多Agent协同的智能旅行行程规划系统。

## 项目介绍

### 核心功能
- 🤖 AI自然语言行程生成
- 🗺️ 高德地图地点验证和展示
- 🎤 语音输入支持
- 💾 行程保存和管理
- 🔐 用户认证系统

### Agent架构

系统采用**多Agent协同**架构，包含以下智能体：

```
┌─────────────────────────────────────────┐
│      主控Agent：行程生成协调器           │
│  (services/itinerary/generator.ts)      │
│                                          │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │LLM Agent │ │Map Agent │ │Validator│ │
│  │  规划    │ │  地图    │ │  验证   │ │
│  └──────────┘ └──────────┘ └─────────┘ │
└─────────────────────────────────────────┘
```

**工作流程**：

1. **LLM Agent** (`services/llm/planner.ts`)
   - 解析用户自然语言需求
   - 生成初步行程计划
   - 智能筛选附属事件

2. **Validator Agent** (`services/itinerary/generator.ts`)
   - 验证LLM生成的地点真实性
   - 获取精确坐标
   - 过滤幻觉内容

3. **Map Agent** (`services/map/amap.ts`)
   - 搜索周边POI
   - 提供地理信息
   - 计算距离

4. **Voice Agent** (`components/VoiceInput.tsx`)
   - 语音转文字
   - 实时流式处理

**Pipeline流程**：
```
用户输入 → LLM规划 → 地点验证 → 内容丰富 → 持久化存储
          (生成)    (真实性)    (周边推荐)   (保存)
```

### 技术栈

**前端**：React 18 + TypeScript + TailwindCSS + 高德地图JS API  
**后端**：Node.js + Express + TypeScript  
**AI服务**：DeepSeek API  
**地图服务**：高德地图Web API  
**数据库**：Supabase

## 快速开始

### 1. 配置API Key

需要配置以下7个API配置项：

| API Key | 用途 | 获取地址 | 必填 |
|---------|------|----------|------|
| DeepSeek API Key | AI生成 | https://platform.deepseek.com/api_keys | ✅ |
| DeepSeek API URL | API端点 | 官方默认值 | ❌ (可选) |
| 高德Web API Key | 后端搜索 | https://console.amap.com (Web服务类型) | ✅ |
| 高德JS API Key | 前端地图 | https://console.amap.com (JS API类型) | ✅ |
| Supabase URL | 数据库 | https://supabase.com/dashboard | ✅ |
| Supabase Anon Key | 前端认证 | https://supabase.com/dashboard | ✅ |
| Supabase Service Key | 后端管理 | https://supabase.com/dashboard (仅后端) | ✅ |

**配置方式一**：编辑环境变量

`backend/.env`:
```env
DEEPSEEK_API_KEY=your_key
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions  # 可选，默认官方地址
AMAP_WEB_API_KEY=your_key
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key
```

`frontend/.env`:
```env
VITE_AMAP_JS_API_KEY=your_key
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

**配置方式二**：图形界面配置（推荐）

启动项目后访问 `/settings` 页面配置所有7个配置项。

注意：
- DeepSeek API URL 通常不需要修改，除非使用自定义端点
- Service Role Key 会保存到后端服务器内存，其他配置保存到浏览器localStorage

### 2. 安装依赖

```bash
# 后端
cd backend && npm install

# 前端
cd frontend && npm install
```

### 3. 运行项目

```bash
# 后端（终端1）
cd backend && npm run dev

# 前端（终端2）
cd frontend && npm run dev
```

访问 `http://localhost:5173`

### 4. Docker部署（可选）

```bash
docker-compose up -d
```

## 项目结构

```
AI旅行规划师_v2/
├── backend/
│   └── src/
│       ├── routes/          # API路由
│       ├── services/        # Agent逻辑
│       │   ├── llm/         # LLM Agent
│       │   ├── map/         # Map Agent
│       │   └── itinerary/   # 主控Agent
│       └── config/          # 配置
├── frontend/
│   └── src/
│       ├── pages/           # 页面
│       ├── components/      # 组件
│       └── services/        # API
└── CONFIG.md               # 详细配置说明
```

## 文档

- **CONFIG.md** - 详细配置说明
- **使用说明.md** - 功能使用指南
- **项目说明.md** - 架构和实现细节

---

**License**: MIT
