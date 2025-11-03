# API Key 配置说明

## 快速配置

访问设置页面：`http://localhost:5173/settings`

### 需要配置的6个密钥

| 密钥 | 用途 | 存储位置 |
|------|------|----------|
| DeepSeek API Key | AI生成 | 浏览器localStorage |
| 高德Web API Key | 后端搜索 | 浏览器localStorage |
| 高德JS API Key | 前端地图 | 浏览器localStorage |
| Supabase URL | 数据库 | 浏览器localStorage |
| Supabase Anon Key | 前端认证 | 浏览器localStorage |
| **Supabase Service Role Key** | **后端管理** | **后端服务器内存** |

## 安全机制

### Service Role Key 安全保障

```
前端输入 → 后端API接收 → 保存到服务器内存 → 不存储在浏览器
```

- ✅ 不会存储在浏览器localStorage
- ✅ 不会暴露给客户端
- ✅ 直接保存到后端服务器
- ⚠️ 服务器重启后需要重新配置

### 其他Key

- 存储在浏览器localStorage
- 通过HTTP请求头传递给后端
- 不同浏览器配置不共享

## 配置优先级

```
设置页面配置 > 环境变量配置
```

## 获取密钥

- **DeepSeek**: https://platform.deepseek.com/api_keys
- **高德地图**: https://console.amap.com (需要申请Web服务和JS API两种类型)
- **Supabase**: https://supabase.com/dashboard → Settings → API

## 注意事项

1. 高德地图需要两个不同类型的Key（Web服务 + JS API）
2. Service Role Key保存在后端内存，服务器重启后需要重新配置
3. 修改Supabase或高德JS API配置后需刷新页面
4. DeepSeek和高德Web API Key修改后立即生效
