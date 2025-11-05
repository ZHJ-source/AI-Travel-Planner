# 多阶段构建 - 前端构建
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# 安装前端依赖
COPY frontend/package*.json ./
RUN npm ci

# 复制前端源代码并构建（使用生产环境配置）
COPY frontend/ ./
RUN npm run build:prod

# 多阶段构建 - 后端构建
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# 安装后端依赖（包括开发依赖以便编译）
COPY backend/package*.json ./
RUN npm ci

# 复制后端源代码
COPY backend/ ./

# 编译TypeScript（使用生产环境配置）
RUN npx tsc -p tsconfig.prod.json

# 清理开发依赖
RUN npm prune --production

# 最终镜像 - 使用 nginx 基础镜像并安装 Node.js
FROM nginx:alpine

# 安装 Node.js 和 npm
RUN apk add --no-cache nodejs npm

# 创建应用目录
WORKDIR /app

# 从构建阶段复制后端文件
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package.json ./backend/

# 从构建阶段复制前端静态文件到 nginx 目录
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# 复制修改后的 nginx 配置
COPY nginx-single.conf /etc/nginx/conf.d/default.conf

# 复制启动脚本
COPY start.sh /start.sh
RUN chmod +x /start.sh

# 暴露端口 80（nginx）
EXPOSE 80

# 使用启动脚本
CMD ["/start.sh"]
