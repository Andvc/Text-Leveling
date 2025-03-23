#!/bin/bash

# 文本冒险游戏调试模式启动脚本

echo "正在启动文本机遇游戏 (调试模式)..."

# 修改config.json启用调试模式
echo "启用调试模式..."
# 使用sed临时修改配置文件
sed -i.bak 's/"debugMode": false/"debugMode": true/g' config.json
echo "调试模式已启用"

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
        # 恢复配置文件并退出
        mv config.json.bak config.json
        exit 1
    fi
fi

# 恢复配置文件（当服务器停止时）
trap 'echo "恢复配置文件..."; mv config.json.bak config.json; echo "配置文件已恢复"; exit 0' INT TERM EXIT

# 如果服务器启动成功，尝试打开浏览器
echo "服务器已启动，请在浏览器中访问: http://localhost:8080"
echo "调试面板可通过按F12键打开/关闭"
echo "按Ctrl+C停止服务器"

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