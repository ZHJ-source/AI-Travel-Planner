# Docker 镜像加速器配置指南

## 问题
无法从 Docker Hub 拉取镜像，出现超时错误。

## 解决方案

### 方案一：配置 Docker Desktop 镜像加速器（macOS）

1. 打开 Docker Desktop
2. 点击右上角的设置图标（齿轮图标）
3. 选择 "Docker Engine"
4. 在 JSON 配置中添加以下内容：

```json
{
  "builder": {
    "gc": {
      "defaultKeepStorage": "20GB",
      "enabled": true
    }
  },
  "experimental": false,
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ]
}
```

5. 点击 "Apply & Restart"
6. 等待 Docker 重启完成

### 方案二：使用已有基础镜像

如果你之前拉取过 `node:20-alpine` 或 `nginx:alpine` 镜像，可以直接构建。

检查已有镜像：
```bash
docker images | grep -E "(node|nginx)"
```

### 方案三：手动拉取基础镜像（配置加速器后）

```bash
# 拉取 Node.js 镜像
docker pull node:20-alpine

# 拉取 Nginx 镜像
docker pull nginx:alpine

# 然后再次构建
docker-compose -f docker-compose-single.yml up -d --build
```

### 方案四：使用其他镜像源

如果以上镜像源不可用，可以尝试：
- 阿里云容器镜像服务（需要注册）: https://cr.console.aliyun.com/
- 腾讯云容器镜像服务: https://mirror.ccs.tencentyun.com
- Docker 中国区官方镜像: https://registry.docker-cn.com

## 验证配置

配置完成后，运行以下命令验证：

```bash
docker info | grep -A 5 "Registry Mirrors"
```

应该能看到你配置的镜像加速器地址。

## 重新构建

配置完成后，重新运行：

```bash
cd /Users/zhuanzmima0000/Documents/vscode_repo/LLM_SE/AI-Travel-Planner
docker-compose -f docker-compose-single.yml up -d --build
```

## 常见问题

**Q: 镜像加速器失效怎么办？**
A: 国内镜像源可能会变化，可以尝试更换其他镜像源。

**Q: 是否需要 VPN？**
A: 配置了镜像加速器后通常不需要，但如果所有镜像源都不可用，可能需要使用代理。

**Q: 能否使用代理？**
A: 可以在 Docker Desktop 设置中配置 HTTP/HTTPS 代理。

