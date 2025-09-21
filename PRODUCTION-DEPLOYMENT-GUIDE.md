# Time Master Enterprise - 生产部署指南

## 🚀 快速部署

本指南将帮助您将 Time Master Enterprise 部署到生产环境。

### 📋 部署前检查清单

- [ ] 服务器环境准备完成
- [ ] 域名和SSL证书配置完成
- [ ] 数据库服务器准备完成
- [ ] LDAP服务器连接测试通过
- [ ] SMTP邮件服务配置完成
- [ ] 监控和日志系统准备完成

## 🏗️ 部署架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Web Server    │    │   API Server    │
│   (Nginx/CDN)   │───▶│   (Nginx)       │───▶│   (Flask)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Static Files  │    │   Database      │
                       │   (CDN/S3)      │    │   (PostgreSQL)  │
                       └─────────────────┘    └─────────────────┘
```

## 🛠️ 部署方式

### 方式一：Docker 容器化部署（推荐）

#### 1. 环境准备

```bash
# 安装 Docker 和 Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. 配置环境变量

```bash
# 复制并编辑生产环境配置
cp .env.production .env
nano .env

# 必须配置的关键变量：
# - SECRET_KEY: Flask 应用密钥
# - JWT_SECRET_KEY: JWT 令牌密钥
# - POSTGRES_PASSWORD: 数据库密码
# - LDAP_BIND_PASSWORD: LDAP 绑定密码
# - SMTP_PASSWORD: SMTP 邮件密码
```

#### 3. 启动服务

```bash
# 构建并启动所有服务
docker-compose -f docker-compose.prod.yml up -d

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

#### 4. 初始化数据库

```bash
# 进入后端容器
docker exec -it timemaster-backend bash

# 运行数据库迁移
python manage.py db upgrade

# 创建管理员用户
python manage.py create-admin
```

### 方式二：传统服务器部署

#### 1. 前端部署

```bash
# 1. 构建前端应用
pnpm install
pnpm run build

# 2. 上传到服务器
rsync -avz --delete dist/ user@server:/var/www/timemaster/

# 3. 配置 Nginx
sudo cp nginx.prod.conf /etc/nginx/sites-available/timemaster
sudo ln -s /etc/nginx/sites-available/timemaster /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 2. 后端部署

```bash
# 1. 服务器环境准备
sudo apt update
sudo apt install python3.11 python3.11-venv python3.11-dev
sudo apt install postgresql postgresql-contrib redis-server

# 2. 创建应用用户
sudo useradd -m -s /bin/bash timemaster
sudo su - timemaster

# 3. 部署应用
git clone https://github.com/your-org/time-master-web.git
cd time-master-web/time-master-enterprise-backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 4. 配置环境变量
cp .env.example .env.production
nano .env.production

# 5. 启动服务
gunicorn -w 4 -b 127.0.0.1:5000 src.main:app
```

### 方式三：云服务部署

#### Vercel + Railway 部署

1. **前端部署到 Vercel**
   ```bash
   # 安装 Vercel CLI
   npm i -g vercel
   
   # 部署
   vercel --prod
   ```

2. **后端部署到 Railway**
   - 连接 GitHub 仓库
   - 配置环境变量
   - 自动部署

#### AWS 部署

1. **前端部署到 S3 + CloudFront**
2. **后端部署到 ECS 或 Lambda**
3. **数据库使用 RDS**

## 🔧 配置详解

### 环境变量配置

| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `VITE_API_BASE_URL` | API 基础地址 | `https://api.timemaster.com` |
| `SECRET_KEY` | Flask 应用密钥 | `your-secret-key` |
| `DATABASE_URL` | 数据库连接字符串 | `postgresql://user:pass@host:5432/db` |
| `LDAP_SERVER` | LDAP 服务器地址 | `ldaps://ldap.company.com` |
| `SMTP_SERVER` | SMTP 服务器地址 | `smtp.company.com` |

### SSL 证书配置

#### Let's Encrypt 免费证书

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d timemaster.company.com

# 自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

#### 自签名证书（测试环境）

```bash
# 生成自签名证书
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem -out ssl/cert.pem \
  -subj "/C=CN/ST=State/L=City/O=Company/CN=timemaster.local"
```

## 📊 监控和维护

### 健康检查

```bash
# 前端健康检查
curl -f https://timemaster.company.com/health

# 后端健康检查
curl -f https://api.timemaster.company.com/health

# 数据库连接检查
docker exec timemaster-database pg_isready
```

### 日志管理

```bash
# 查看应用日志
docker-compose -f docker-compose.prod.yml logs -f backend

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 查看系统日志
journalctl -u nginx -f
```

### 备份策略

```bash
# 数据库备份
docker exec timemaster-database pg_dump -U timemaster timemaster > backup_$(date +%Y%m%d).sql

# 文件备份
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/

# 自动备份脚本
cat > /etc/cron.daily/timemaster-backup << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/timemaster"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 数据库备份
docker exec timemaster-database pg_dump -U timemaster timemaster | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# 文件备份
tar -czf $BACKUP_DIR/files_$DATE.tar.gz uploads/

# 清理旧备份（保留30天）
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
EOF

chmod +x /etc/cron.daily/timemaster-backup
```

## 🔒 安全配置

### 防火墙配置

```bash
# UFW 防火墙配置
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 安全头配置

已在 `nginx.prod.conf` 中配置：
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Content-Security-Policy
- Strict-Transport-Security

### 速率限制

- API 接口：10 请求/秒
- 登录接口：1 请求/秒
- 静态资源：无限制

## 🚨 故障排除

### 常见问题

1. **前端无法访问**
   ```bash
   # 检查 Nginx 状态
   sudo systemctl status nginx
   
   # 检查配置语法
   sudo nginx -t
   
   # 查看错误日志
   sudo tail -f /var/log/nginx/error.log
   ```

2. **API 接口 502 错误**
   ```bash
   # 检查后端服务状态
   docker-compose -f docker-compose.prod.yml ps backend
   
   # 查看后端日志
   docker-compose -f docker-compose.prod.yml logs backend
   ```

3. **数据库连接失败**
   ```bash
   # 检查数据库状态
   docker-compose -f docker-compose.prod.yml ps database
   
   # 测试数据库连接
   docker exec -it timemaster-database psql -U timemaster -d timemaster
   ```

### 性能优化

1. **启用 Gzip 压缩**（已配置）
2. **配置静态资源缓存**（已配置）
3. **使用 CDN 加速**
4. **数据库索引优化**
5. **Redis 缓存配置**

## 📈 扩展部署

### 负载均衡

```nginx
upstream backend_servers {
    server backend1:5000;
    server backend2:5000;
    server backend3:5000;
}
```

### 数据库集群

- 主从复制
- 读写分离
- 连接池配置

### 缓存策略

- Redis 集群
- CDN 配置
- 浏览器缓存

## 📞 支持和维护

### 联系方式

- 技术支持：support@company.com
- 紧急联系：emergency@company.com

### 维护窗口

- 定期维护：每周日 02:00-04:00
- 紧急维护：随时

### 更新流程

1. 测试环境验证
2. 生产环境备份
3. 滚动更新部署
4. 功能验证测试
5. 监控观察

---

**注意：请根据实际环境调整配置参数，确保安全性和稳定性。**