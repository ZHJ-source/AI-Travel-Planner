#!/bin/sh

# 启动后端服务（在后台运行）
cd /app/backend
node dist/app.js &

# 等待后端服务启动
sleep 3

# 启动 nginx（前台运行）
nginx -g 'daemon off;'

