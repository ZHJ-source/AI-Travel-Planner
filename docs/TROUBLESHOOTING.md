# 🔧 故障排查指南

## 常见问题及解决方案

---

### ❌ 问题1: 前端显示 Network Error / API 调用失败

**现象**:
- 点击"保存"或"我的行程"时报错
- 浏览器控制台显示网络错误
- API 请求失败

**原因**:
前端在构建时需要 Supabase 等环境变量，如果缺少这些配置，前端无法正确初始化 API 客户端。

**解决方案**:

1. **确保前端环境变量文件存在**:
   ```bash
   # 检查文件
   ls -la frontend/.env.production
   ```

2. **创建 `frontend/.env.production` 文件**:
   ```bash
   cd frontend
   cat > .env.production << 'EOF'
   # API 基础URL（留空使用 Nginx 代理）
   VITE_API_BASE_URL=
   
   # Supabase 配置（从 backend/.env 复制）
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # 高德地图配置（可选）
   VITE_AMAP_JS_API_KEY=
   VITE_AMAP_WEB_API_KEY=
   EOF
   ```

3. **从 backend/.env 获取 Supabase 配置**:
   ```bash
   # 查看后端配置
   grep SUPABASE backend/.env
   
   # 将 SUPABASE_URL 和 SUPABASE_ANON_KEY 复制到 frontend/.env.production
   # 注意：前端使用 VITE_ 前缀
   ```

4. **重新构建镜像**:
   ```bash
   docker-compose -f docker-compose-single.yml down
   docker-compose -f docker-compose-single.yml build
   docker-compose -f docker-compose-single.yml up -d
   ```

5. **验证修复**:
   ```bash
   # 检查前端是否包含配置
   docker exec ai-travel-planner-app-1 sh -c 'ls /usr/share/nginx/html/assets/*.js | head -1 | xargs grep -o "supabase.co"'
   
   # 应该能看到你的 Supabase URL
   ```

---

### ❌ 问题2: Docker 镜像构建失败 - 网络超时

**现象**:
```
failed to solve: DeadlineExceeded: failed to fetch oauth token
```

**解决方案**:

配置 Docker 镜像加速器，详见 [DOCKER_SETUP.md](./DOCKER_SETUP.md)

---

### ❌ 问题3: TypeScript 编译错误

**现象**:
```
error TS6133: 'xxx' is declared but its value is never read
```

**解决方案**:

已创建 `tsconfig.prod.json` 文件，使用宽松的类型检查。

---

### ❌ 问题4: 容器启动但无法访问

**检查步骤**:

```bash
# 1. 检查容器状态
docker ps | grep ai-travel-planner

# 2. 查看日志
docker logs ai-travel-planner-app-1

# 3. 测试后端
curl http://localhost/api/health

# 4. 测试前端
curl -I http://localhost/

# 5. 进入容器调试
docker exec -it ai-travel-planner-app-1 sh
```

---

### ❌ 问题5: API 返回 401 Unauthorized

**原因**:
- 用户未登录
- Token 过期
- Supabase 配置错误

**解决方案**:

1. **检查登录状态**:
   - 访问 http://localhost 
   - 确保已登录或注册

2. **检查 Supabase 配置**:
   ```bash
   # 在浏览器控制台检查
   localStorage.getItem('apiKeys')
   ```

3. **重新登录**:
   - 退出登录
   - 清除浏览器缓存
   - 重新登录

---

### ❌ 问题6: Dockerfile 文件损坏/为空

**现象**:
```
failed to solve: file with no instructions
```

**解决方案**:

Dockerfile 已在项目根目录，如果损坏，可以从 Git 恢复：
```bash
git checkout Dockerfile
```

或参考 [SINGLE_IMAGE_DEPLOY.md](./SINGLE_IMAGE_DEPLOY.md) 中的完整 Dockerfile 内容。

---

## 🔍 调试技巧

### 查看完整日志
```bash
# 实时日志
docker-compose -f docker-compose-single.yml logs -f

# 最近 100 行
docker logs ai-travel-planner-app-1 --tail 100

# 只看错误
docker logs ai-travel-planner-app-1 2>&1 | grep -i error
```

### 检查容器内部
```bash
# 进入容器
docker exec -it ai-travel-planner-app-1 sh

# 检查进程
ps aux

# 测试后端
curl localhost:3000/api/health

# 查看 Nginx 配置
cat /etc/nginx/conf.d/default.conf
```

### 检查环境变量
```bash
# 在容器内
docker exec ai-travel-planner-app-1 env | grep -E "(NODE_ENV|PORT|SUPABASE)"
```

### 验证前端构建
```bash
# 检查构建产物
docker exec ai-travel-planner-app-1 ls -la /usr/share/nginx/html/

# 查看 index.html
docker exec ai-travel-planner-app-1 cat /usr/share/nginx/html/index.html
```

---

## 📞 获取帮助

如果以上方法都无法解决问题：

1. **运行验证脚本**:
   ```bash
   ./verify-deployment.sh
   ```

2. **收集信息**:
   ```bash
   # 容器状态
   docker ps -a
   
   # 完整日志
   docker logs ai-travel-planner-app-1 > debug.log
   
   # 系统信息
   docker info
   ```

3. **查看文档**:
   - [QUICK_START.md](./QUICK_START.md) - 快速开始
   - [SINGLE_IMAGE_DEPLOY.md](./SINGLE_IMAGE_DEPLOY.md) - 详细部署
   - [DOCKER_SETUP.md](./DOCKER_SETUP.md) - Docker 配置

---

## ✅ 预防措施

### 构建前检查清单

- [ ] `backend/.env` 文件存在且配置正确
- [ ] `frontend/.env.production` 文件存在且包含 Supabase 配置
- [ ] Docker 镜像加速器已配置
- [ ] 磁盘空间充足（至少 2GB）
- [ ] Docker Desktop 正在运行

### 部署后验证清单

- [ ] 容器状态为 `Up`
- [ ] `curl http://localhost/api/health` 返回 200
- [ ] `curl http://localhost/` 返回 200
- [ ] 浏览器能访问 http://localhost
- [ ] 能正常登录/注册
- [ ] 能保存和查看行程

---

**最后更新**: 2025-11-05  
**相关问题**: Network Error, API 调用失败

