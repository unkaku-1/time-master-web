# Time Master Enterprise - 部署指南

本文档详细介绍了如何部署 Time Master Enterprise 全栈应用，包括前端 React 应用和后端 Flask API。

## 📋 部署架构

Time Master Enterprise 采用前后端分离架构：

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (React)   │───▶│   后端 (Flask)   │───▶│   数据库 (SQLite) │
│   静态网站托管    │    │   服务器部署      │    │   文件存储        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 前端部署

### 1. Vercel 部署（推荐）

Vercel 提供最佳的 React 应用部署体验。

#### 自动部署

1. **连接 GitHub**
   - 访问 [Vercel](https://vercel.com/)
   - 使用 GitHub 账户登录
   - 导入 `time-master-web` 仓库

2. **配置项目**
   ```json
   {
     "name": "time-master-web",
     "framework": "vite",
     "buildCommand": "pnpm run build",
     "outputDirectory": "dist",
     "installCommand": "pnpm install"
   }
   ```

3. **环境变量**
   ```bash
   VITE_API_BASE_URL=https://your-backend-api.com
   VITE_APP_NAME=Time Master Enterprise
   ```

#### 手动部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 构建项目
pnpm run build

# 部署
vercel --prod
```

### 2. Netlify 部署

1. **构建设置**
   - Build command: `pnpm run build`
   - Publish directory: `dist`
   - Node version: `18`

2. **环境变量**
   ```bash
   VITE_API_BASE_URL=https://your-backend-api.com
   ```

3. **重定向配置**
   
   创建 `public/_redirects` 文件：
   ```
   /*    /index.html   200
   ```

### 3. GitHub Pages 部署

1. **安装 gh-pages**
   ```bash
   pnpm add -D gh-pages
   ```

2. **配置 package.json**
   ```json
   {
     "scripts": {
       "deploy": "pnpm run build && gh-pages -d dist"
     },
     "homepage": "https://username.github.io/time-master-web"
   }
   ```

3. **部署**
   ```bash
   pnpm run deploy
   ```

### 4. 自定义服务器部署

#### Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/time-master-web/dist;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🖥️ 后端部署

### 1. 传统服务器部署

#### 环境准备

```bash
# 安装 Python 3.11+
sudo apt update
sudo apt install python3.11 python3.11-venv python3.11-dev

# 安装系统依赖
sudo apt install build-essential libldap2-dev libsasl2-dev libssl-dev
```

#### 部署步骤

1. **克隆代码**
   ```bash
   git clone https://github.com/unkaku-1/time-master-web.git
   cd time-master-web/time-master-enterprise-backend
   ```

2. **创建虚拟环境**
   ```bash
   python3.11 -m venv venv
   source venv/bin/activate
   ```

3. **安装依赖**
   ```bash
   pip install -r requirements.txt
   ```

4. **配置环境变量**
   ```bash
   export FLASK_ENV=production
   export SECRET_KEY=your-secret-key
   export LDAP_SERVER=ldap://your-ldap-server
   export LDAP_BASE_DN=dc=company,dc=com
   ```

5. **启动服务**
   ```bash
   # 开发环境
   python src/main.py

   # 生产环境（使用 Gunicorn）
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 src.main:app
   ```

### 2. Docker 部署

#### Dockerfile

创建 `time-master-enterprise-backend/Dockerfile`：

```dockerfile
FROM python:3.11-slim

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    libldap2-dev \
    libsasl2-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 5000

# 启动命令
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "src.main:app"]
```

#### Docker Compose

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  backend:
    build: ./time-master-enterprise-backend
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
      - SECRET_KEY=${SECRET_KEY}
      - LDAP_SERVER=${LDAP_SERVER}
      - LDAP_BASE_DN=${LDAP_BASE_DN}
    volumes:
      - ./data:/app/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./dist:/usr/share/nginx/html
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
    restart: unless-stopped
```

#### 部署命令

```bash
# 构建和启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 3. 云平台部署

#### Heroku 部署

1. **安装 Heroku CLI**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku

   # Ubuntu
   curl https://cli-assets.heroku.com/install.sh | sh
   ```

2. **创建应用**
   ```bash
   cd time-master-enterprise-backend
   heroku create time-master-api
   ```

3. **配置环境变量**
   ```bash
   heroku config:set SECRET_KEY=your-secret-key
   heroku config:set LDAP_SERVER=ldap://your-ldap-server
   ```

4. **部署**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

#### Railway 部署

1. **连接 GitHub**
   - 访问 [Railway](https://railway.app/)
   - 连接 GitHub 仓库

2. **配置服务**
   - 选择 `time-master-enterprise-backend` 目录
   - 设置启动命令: `gunicorn -w 4 -b 0.0.0.0:$PORT src.main:app`

3. **环境变量**
   ```bash
   SECRET_KEY=your-secret-key
   LDAP_SERVER=ldap://your-ldap-server
   PORT=5000
   ```

## 🔧 环境配置

### 前端环境变量

创建 `.env.production` 文件：

```bash
# API 配置
VITE_API_BASE_URL=https://api.timemaster.com
VITE_API_TIMEOUT=10000

# 应用配置
VITE_APP_NAME=Time Master Enterprise
VITE_APP_VERSION=2.0.0

# 功能开关
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=false

# 第三方服务
VITE_SENTRY_DSN=your-sentry-dsn
```

### 后端环境变量

创建 `.env` 文件：

```bash
# Flask 配置
FLASK_ENV=production
SECRET_KEY=your-very-secret-key-here
DEBUG=False

# 数据库配置
DATABASE_URL=sqlite:///data/timemaster.db

# LDAP 配置
LDAP_SERVER=ldap://your-ldap-server.com
LDAP_PORT=389
LDAP_BASE_DN=dc=company,dc=com
LDAP_BIND_DN=cn=admin,dc=company,dc=com
LDAP_BIND_PASSWORD=your-ldap-password

# SMTP 配置
SMTP_SERVER=smtp.company.com
SMTP_PORT=587
SMTP_USERNAME=noreply@company.com
SMTP_PASSWORD=your-smtp-password
SMTP_USE_TLS=True

# JWT 配置
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ACCESS_TOKEN_EXPIRES=3600

# 安全配置
CORS_ORIGINS=https://timemaster.company.com,https://app.timemaster.com
RATE_LIMIT=100/hour

# 日志配置
LOG_LEVEL=INFO
LOG_FILE=/var/log/timemaster/app.log
```

## 📊 监控和日志

### 应用监控

1. **Sentry 错误监控**
   ```javascript
   // 前端
   import * as Sentry from "@sentry/react";
   
   Sentry.init({
     dsn: import.meta.env.VITE_SENTRY_DSN,
     environment: import.meta.env.MODE,
   });
   ```

   ```python
   # 后端
   import sentry_sdk
   from sentry_sdk.integrations.flask import FlaskIntegration
   
   sentry_sdk.init(
       dsn=os.getenv('SENTRY_DSN'),
       integrations=[FlaskIntegration()],
       environment=os.getenv('FLASK_ENV')
   )
   ```

2. **性能监控**
   ```bash
   # 安装监控工具
   pip install prometheus-flask-exporter
   ```

### 日志配置

```python
# 后端日志配置
import logging
from logging.handlers import RotatingFileHandler

if not app.debug:
    file_handler = RotatingFileHandler(
        'logs/timemaster.log', 
        maxBytes=10240000, 
        backupCount=10
    )
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
```

## 🔒 安全配置

### HTTPS 配置

1. **Let's Encrypt 证书**
   ```bash
   # 安装 Certbot
   sudo apt install certbot python3-certbot-nginx
   
   # 获取证书
   sudo certbot --nginx -d timemaster.company.com
   ```

2. **Nginx HTTPS 配置**
   ```nginx
   server {
       listen 443 ssl http2;
       server_name timemaster.company.com;
       
       ssl_certificate /etc/letsencrypt/live/timemaster.company.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/timemaster.company.com/privkey.pem;
       
       # SSL 安全配置
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
       ssl_prefer_server_ciphers off;
       
       # 安全头部
       add_header Strict-Transport-Security "max-age=63072000" always;
       add_header X-Frame-Options DENY;
       add_header X-Content-Type-Options nosniff;
       add_header X-XSS-Protection "1; mode=block";
   }
   ```

### 防火墙配置

```bash
# UFW 防火墙配置
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 5000/tcp  # 只允许内部访问后端
```

## 🚀 CI/CD 配置

### GitHub Actions

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build
        run: pnpm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.KEY }}
          script: |
            cd /var/www/time-master-web
            git pull origin main
            cd time-master-enterprise-backend
            source venv/bin/activate
            pip install -r requirements.txt
            sudo systemctl restart timemaster
```

## 📋 部署检查清单

### 部署前检查
- [ ] 环境变量配置完成
- [ ] 数据库连接测试通过
- [ ] LDAP 连接测试通过
- [ ] SMTP 配置测试通过
- [ ] SSL 证书配置完成
- [ ] 防火墙规则配置
- [ ] 备份策略制定

### 部署后验证
- [ ] 前端页面正常加载
- [ ] 用户登录功能正常
- [ ] API 接口响应正常
- [ ] 数据库读写正常
- [ ] 邮件通知功能正常
- [ ] 性能指标达标
- [ ] 安全扫描通过

## 🆘 故障排除

### 常见问题

1. **前端构建失败**
   ```bash
   # 清理缓存
   pnpm store prune
   rm -rf node_modules
   pnpm install
   ```

2. **后端启动失败**
   ```bash
   # 检查依赖
   pip check
   
   # 重新安装依赖
   pip install -r requirements.txt --force-reinstall
   ```

3. **LDAP 连接失败**
   ```bash
   # 测试 LDAP 连接
   ldapsearch -x -H ldap://your-server -D "cn=admin,dc=company,dc=com" -W
   ```

### 日志查看

```bash
# 前端日志（浏览器控制台）
# 后端日志
tail -f /var/log/timemaster/app.log

# Nginx 日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# 系统日志
journalctl -u timemaster -f
```

## 📞 技术支持

如果在部署过程中遇到问题：

1. 查看本文档的故障排除部分
2. 检查 [GitHub Issues](https://github.com/unkaku-1/time-master-web/issues)
3. 联系技术支持: support@timemaster.com

---

**部署成功后，请及时更新系统和依赖，定期备份数据！**

