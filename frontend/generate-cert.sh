#!/bin/bash

# 生成本地开发用的自签名 HTTPS 证书
# 用于解决摄像头权限问题

echo "🔒 正在生成本地 HTTPS 证书..."

# 检查 openssl 是否存在
if ! command -v openssl &> /dev/null; then
    echo "❌ 错误：未找到 openssl，请先安装 openssl"
    exit 1
fi

# 生成私钥
echo "📝 生成私钥..."
openssl genrsa -out localhost-key.pem 2048

# 生成证书
echo "📜 生成证书..."
openssl req -new -x509 -key localhost-key.pem -out localhost.pem -days 365 -subj "/C=AU/ST=NSW/L=Sydney/O=Development/CN=localhost"

echo "✅ 证书生成完成！"
echo ""
echo "📋 使用说明："
echo "1. 运行此脚本后，修改 vite.config.ts 中的 https 配置："
echo "   https: {"
echo "     key: './localhost-key.pem',"
echo "     cert: './localhost.pem'"
echo "   }"
echo ""
echo "2. 重启开发服务器：npm run dev"
echo "3. 首次访问时浏览器会提示证书不安全，点击"高级" > "继续前往localhost（不安全）""
echo "4. 现在可以正常使用摄像头功能了！"
echo ""
echo "⚠️  注意：这些证书仅用于本地开发，请勿在生产环境使用"