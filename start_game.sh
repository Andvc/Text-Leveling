#!/bin/bash

# 文本冒险游戏启动脚本

echo "正在启动文本冒险游戏..."

# 检查是否安装了Python
if command -v python3 &>/dev/null; then
    echo "使用Python启动简易Web服务器..."
    python3 -m http.server 8080
elif command -v python &>/dev/null; then
    echo "使用Python启动简易Web服务器..."
    python -m SimpleHTTPServer 8080
else
    echo "未找到Python，尝试使用Node.js..."
    
    # 检查是否安装了Node.js
    if command -v npx &>/dev/null; then
        echo "使用Node.js的http-server启动..."
        npx http-server -p 8080
    else
        echo "错误: 未找到Python或Node.js。"
        echo "请安装Python或Node.js，或者手动启动Web服务器。"
        exit 1
    fi
fi

# 如果服务器启动成功，尝试打开浏览器
echo "服务器已启动，请在浏览器中访问: http://localhost:8080"

# 尝试打开浏览器
if command -v open &>/dev/null; then
    echo "自动打开浏览器..."
    open http://localhost:8080
elif command -v xdg-open &>/dev/null; then
    echo "自动打开浏览器..."
    xdg-open http://localhost:8080
elif command -v start &>/dev/null; then
    echo "自动打开浏览器..."
    start http://localhost:8080
else
    echo "请手动打开浏览器并访问: http://localhost:8080"
fi 