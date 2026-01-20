# English Learning AI Assistant - Netlify 部署修复

## 问题原因
404 错误是因为 Netlify Function 文件位置不正确。

## 正确的项目结构

```
your-project/
├── index.html              # 前端页面
├── netlify.toml           # Netlify 配置
├── package.json           # 依赖配置
└── netlify/
    └── functions/
        └── chat.js        # ⚠️ 必须在这个位置！
```

## 部署步骤

### 1. 在 Netlify 设置环境变量
在 Netlify 网站后台：
1. 进入你的项目
2. 点击 `Site settings` → `Environment variables`
3. 添加环境变量：
   - Key: `DEEPSEEK_API_KEY`
   - Value: 你的 DeepSeek API 密钥

### 2. 上传文件到 GitHub
确保以下文件结构：
```
├── index.html
├── netlify.toml
├── package.json
└── netlify/
    └── functions/
        └── chat.js
```

### 3. 重新部署
在 Netlify 中触发重新部署：
- 方式1: 推送新代码到 GitHub
- 方式2: 在 Netlify 后台点击 "Trigger deploy" → "Deploy site"

## 验证部署
部署成功后：
1. 访问你的网站 URL
2. 打开浏览器开发者工具（F12）
3. 在聊天框输入英文问题
4. 检查 Console 和 Network 标签是否有错误

## 常见错误排查

### 404 错误
- ✅ 检查 `chat.js` 是否在 `netlify/functions/` 目录下
- ✅ 检查 `netlify.toml` 配置是否正确

### 401 错误
- ✅ 检查是否在 Netlify 设置了 `DEEPSEEK_API_KEY` 环境变量
- ✅ 检查 API 密钥是否正确

### 500 错误
- ✅ 查看 Netlify Functions 日志
- ✅ 检查 `chat.js` 代码是否有语法错误

## 本地测试
```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 在项目目录运行
netlify dev

# 设置本地环境变量（可选）
netlify env:set DEEPSEEK_API_KEY "你的密钥"
```

## 文件说明

### index.html
完整的前端聊天界面，包含：
- 聊天UI
- 消息发送逻辑
- API 调用函数

### netlify/functions/chat.js
Netlify Serverless Function，负责：
- 接收前端请求
- 调用 DeepSeek API
- 返回 AI 响应

### netlify.toml
Netlify 部署配置：
- 重定向规则（/api/* → Netlify Functions）
- 构建设置
- Node.js 版本

### package.json
项目依赖配置
