# 🚀 快速开始 - 单镜像部署

## 一键启动

```bash
# 进入项目目录
cd /Users/zhuanzmima0000/Documents/vscode_repo/LLM_SE/AI-Travel-Planner

# 启动服务
docker-compose -f docker-compose-single.yml up -d
```

## 访问应用

- **前端应用**: http://localhost
- **后端 API**: http://localhost/api
- **健康检查**: http://localhost/api/health

## 常用命令

```bash
# 查看运行状态
docker ps | grep ai-travel-planner

# 查看实时日志
docker-compose -f docker-compose-single.yml logs -f

# 停止服务
docker-compose -f docker-compose-single.yml down

# 重新构建
docker-compose -f docker-compose-single.yml up -d --build

# 重启服务
docker-compose -f docker-compose-single.yml restart
```

## 镜像信息

- **镜像名称**: ai-travel-planner-app:latest
- **镜像大小**: ~208MB
- **基础镜像**: nginx:alpine + node:20-alpine
- **端口映射**: 80:80

## 架构特点

✅ **单镜像**: 前后端整合，部署简单
✅ **轻量级**: 基于 Alpine Linux，镜像小巧
✅ **生产就绪**: 使用 Nginx + Node.js 稳定架构
✅ **健康检查**: 自带健康检查端点

## 问题？

详细文档请参考:
- [单镜像部署指南](./SINGLE_IMAGE_DEPLOY.md)
- [Docker 设置](./DOCKER_SETUP.md)

