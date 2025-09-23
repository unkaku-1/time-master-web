# Vercel 部署指南

## 项目概述
Time Master Enterprise - 企业级任务管理系统，基于 React + Vite 构建。

## 部署配置文件

### 1. vercel.json 配置
项目已包含完整的 `vercel.json` 配置文件，包含：
- 构建命令：`pnpm build`
- 输出目录：`dist`
- 框架：`vite`
- SPA 路由重写规则
- 静态资源缓存优化
- 安全头配置
- 亚洲区域部署优化

### 2. 构建优化
- Vite 配置已优化，包含代码分割
- 添加了 terser 压缩
- 静态资源缓存策略
- 构建产物大小优化

### 3. 环境变量配置
生产环境需要配置以下环境变量：

```bash
# 必需的环境变量
VITE_API_BASE_URL=https://your-api-domain.com
VITE_APP_NAME=Time Master Enterprise
VITE_APP_VERSION=2.0.0

# 可选的环境变量
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=false
VITE_SENTRY_DSN=your-sentry-dsn
VITE_GOOGLE_ANALYTICS_ID=your-ga-id
```

## 部署步骤

### 方式一：GitHub 集成部署（推荐）

1. **访问 Vercel 控制台**
   - 前往 https://vercel.com
   - 使用 GitHub 账户登录

2. **导入项目**
   - 点击 "New Project"
   - 选择 GitHub 仓库：`unkaku-1/time-master-web`
   - Vercel 会自动检测到 Vite 项目

3. **配置项目设置**
   - Framework Preset: `Vite`
   - Build Command: `pnpm build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`

4. **设置环境变量**
   在 Vercel 项目设置中添加环境变量：
   ```
   VITE_API_BASE_URL=https://your-api-domain.com
   VITE_APP_NAME=Time Master Enterprise
   VITE_APP_VERSION=2.0.0
   VITE_ENABLE_ANALYTICS=true
   VITE_ENABLE_DEBUG=false
   ```

5. **部署**
   - 点击 "Deploy" 开始部署
   - 等待构建完成

### 方式二：CLI 部署

如果需要使用 CLI 部署，请先解决用户名编码问题：

```bash
# 设置环境变量
$env:VERCEL_USER_AGENT = "vercel-cli/48.1.0"

# 使用 token 登录
vercel login --token YOUR_VERCEL_TOKEN

# 部署项目
vercel --prod
```

## 性能优化

### 1. 构建优化
- ✅ 代码分割（vendor, router, ui, utils）
- ✅ Terser 压缩
- ✅ 静态资源缓存
- ✅ 构建产物大小优化

### 2. 部署优化
- ✅ 亚洲区域部署（香港、新加坡、东京）
- ✅ 静态资源 CDN 缓存
- ✅ 安全头配置
- ✅ SPA 路由支持

### 3. 监控配置
- 可选集成 Sentry 错误监控
- 可选集成 Google Analytics
- Vercel Analytics 自动启用

## 验证部署

部署完成后，请验证以下功能：

1. **基础功能**
   - [ ] 页面正常加载
   - [ ] 路由跳转正常
   - [ ] 静态资源加载正常

2. **性能指标**
   - [ ] 首屏加载时间 < 3s
   - [ ] Lighthouse 性能评分 > 90
   - [ ] 核心 Web 指标达标

3. **功能完整性**
   - [ ] 任务管理功能正常
   - [ ] 数据持久化正常
   - [ ] 响应式设计正常

## 故障排除

### 常见问题

1. **构建失败**
   - 检查 Node.js 版本（推荐 18+）
   - 确认依赖安装完整
   - 检查环境变量配置

2. **路由 404**
   - 确认 vercel.json 中的重写规则
   - 检查 React Router 配置

3. **静态资源加载失败**
   - 检查构建输出目录
   - 确认资源路径配置

## 联系支持

如遇到部署问题，请检查：
1. Vercel 部署日志
2. 浏览器控制台错误
3. 网络请求状态

---

**部署状态**: ✅ 配置完成，等待部署
**最后更新**: 2025-01-23