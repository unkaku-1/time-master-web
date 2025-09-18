# Time Master Enterprise - 企业级任务管理系统

<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion">
  <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask">
</div>

## 📖 项目简介

Time Master Enterprise 是一个基于艾森豪威尔矩阵的智能任务管理系统，专为企业团队设计。系统提供智能优先级计算、LDAP 认证、管理员后台、子任务管理等企业级功能，帮助团队提升工作效率。

### ✨ 核心特性

- **🧠 智能优先级**: 基于艾森豪威尔矩阵的科学任务排序
- **👥 企业认证**: LDAP 集成，支持企业目录服务
- **📊 管理后台**: 完整的用户管理和使用情况分析
- **🎯 子任务管理**: 无限层级的任务分解和独立截止日期
- **📱 响应式设计**: 完美适配桌面、平板和移动设备
- **⚡ 流畅动效**: 60帧动画，提升用户体验

## 🚀 在线演示

- **前端应用**: [https://time-master-web.vercel.app](https://time-master-web.vercel.app)
- **GitHub 仓库**: [https://github.com/unkaku-1/time-master-web](https://github.com/unkaku-1/time-master-web)
- **产品展示**: [https://unkaku-1.github.io/time-master-showcase/](https://unkaku-1.github.io/time-master-showcase/)

## 🛠️ 技术栈

### 前端技术
| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.x | 用户界面框架 |
| Vite | 6.x | 构建工具 |
| Tailwind CSS | 3.x | CSS 框架 |
| Framer Motion | 11.x | 动画库 |
| Axios | 1.x | HTTP 客户端 |
| React Query | 5.x | 数据获取和缓存 |

### 后端技术
| 技术 | 版本 | 用途 |
|------|------|------|
| Flask | 3.x | Web 框架 |
| SQLite | 3.x | 数据库 |
| JWT | - | 身份认证 |
| LDAP | - | 企业目录集成 |
| Flask-CORS | - | 跨域支持 |

### 字体系统
- **英文**: Nunito (Google Fonts)
- **中文**: Noto Sans SC (思源黑体)

## 📁 项目结构

```
time-master-web/
├── public/                 # 静态资源
│   ├── time-master-logo.png
│   └── vite.svg
├── src/                    # 源代码
│   ├── components/         # React 组件
│   │   ├── ui/            # 基础 UI 组件
│   │   ├── AdminPanel.jsx # 管理员面板
│   │   ├── Dashboard.jsx  # 仪表板
│   │   ├── LoginPage.jsx  # 登录页面
│   │   ├── TaskManager.jsx # 任务管理
│   │   └── SubtaskManager.jsx # 子任务管理
│   ├── contexts/          # React 上下文
│   │   └── AuthContext.jsx
│   ├── lib/               # 工具库
│   │   ├── api.js         # API 服务
│   │   ├── priorityCalculator.js # 优先级算法
│   │   ├── storageService.js # 存储服务
│   │   └── taskModel.js   # 任务模型
│   ├── App.jsx            # 主应用组件
│   ├── App.css            # 全局样式
│   └── main.jsx           # 应用入口
├── time-master-enterprise-backend/ # 后端代码
│   ├── src/
│   │   ├── models/        # 数据模型
│   │   ├── routes/        # API 路由
│   │   ├── services/      # 业务服务
│   │   └── main.py        # 后端入口
│   ├── venv/              # Python 虚拟环境
│   └── requirements.txt   # Python 依赖
├── dist/                  # 构建输出
├── package.json           # 前端依赖配置
├── vite.config.js         # Vite 配置
├── tailwind.config.js     # Tailwind 配置
├── README.md              # 项目文档
├── DEPLOYMENT.md          # 部署指南
└── CHANGELOG.md           # 更新日志
```

## 🎯 核心功能

### 1. 智能任务管理
- **艾森豪威尔矩阵**: 基于重要度和紧急度的科学分类
- **动态优先级**: 考虑时间因子和子任务影响的智能算法
- **任务状态**: 待办、进行中、已完成的完整生命周期
- **搜索过滤**: 强大的任务搜索和筛选功能

### 2. 子任务系统
- **无限层级**: 支持任意深度的任务分解
- **独立管理**: 每个子任务独立的截止日期和优先级
- **进度汇总**: 自动计算父任务的完成进度
- **智能提醒**: 基于子任务状态的智能通知

### 3. 企业级认证
- **LDAP 集成**: 与企业目录服务无缝对接
- **JWT 认证**: 安全的令牌认证机制
- **权限控制**: 基于角色的访问控制
- **数据隔离**: 每个用户的数据完全独立

### 4. 管理员后台
- **用户管理**: 完整的用户信息和权限管理
- **使用统计**: 详细的用户活跃度和使用频率分析
- **系统配置**: LDAP 和 SMTP 的可视化配置
- **数据报表**: 多维度的使用情况分析报告

### 5. 现代化界面
- **响应式设计**: 完美适配各种设备尺寸
- **流畅动效**: 60帧动画，提升用户体验
- **深色主题**: 专业的企业级视觉设计
- **无障碍访问**: 符合 WCAG 标准的可访问性

## 🔧 本地开发

### 环境要求
- Node.js 18+ 
- Python 3.11+
- Git

### 快速开始

1. **克隆仓库**
```bash
git clone https://github.com/unkaku-1/time-master-web.git
cd time-master-web
```

2. **安装前端依赖**
```bash
pnpm install
# 或者
npm install
```

3. **启动前端开发服务器**
```bash
pnpm run dev
# 或者
npm run dev
```

4. **设置后端环境**
```bash
cd time-master-enterprise-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

5. **启动后端服务器**
```bash
python src/main.py
```

6. **访问应用**
- 前端: http://localhost:5173
- 后端 API: http://localhost:5000

### 开发工具推荐
- **IDE**: VS Code, WebStorm
- **浏览器**: Chrome DevTools, React DevTools
- **API 测试**: Postman, Insomnia
- **数据库**: SQLite Browser

## 🎨 设计系统

### 色彩方案
```css
/* 主色调 */
--primary: #3b82f6;      /* 蓝色 */
--secondary: #8b5cf6;    /* 紫色 */
--accent: #06b6d4;       /* 青色 */

/* 状态色 */
--success: #10b981;      /* 成功 */
--warning: #f59e0b;      /* 警告 */
--error: #ef4444;        /* 错误 */
--info: #3b82f6;         /* 信息 */

/* 中性色 */
--gray-50: #f9fafb;
--gray-900: #111827;
```

### 组件规范
- **按钮**: 圆角 8px，多种尺寸和状态
- **卡片**: 阴影效果，圆角 12px
- **表单**: 统一的输入框和验证样式
- **导航**: 侧边栏和顶部导航的组合

### 动画规范
- **持续时间**: 150ms - 500ms
- **缓动函数**: ease-out, ease-in-out
- **触发方式**: 悬停、点击、滚动
- **性能**: 使用 transform 和 opacity

## 📊 优先级算法

### 基础计算
```javascript
// 基础分数 = 重要度 × 3 + 紧急度
const baseScore = importance * 3 + urgency;
```

### 时间因子
```javascript
// 时间因子：临近截止日期的任务优先级提升
const timeFactor = calculateTimeFactor(dueDate);
```

### 子任务影响
```javascript
// 子任务因子：父任务继承最紧急子任务的30%优先级
const subtaskFactor = getMaxSubtaskPriority() * 0.3;
```

### 最终优先级
```javascript
const finalPriority = baseScore + timeFactor + subtaskFactor;
```

## 🔒 安全特性

### 认证安全
- JWT 令牌过期机制
- 密码加密存储
- LDAP 安全连接
- 会话管理

### 数据安全
- SQL 注入防护
- XSS 攻击防护
- CSRF 令牌验证
- 数据传输加密

### 权限控制
- 基于角色的访问控制 (RBAC)
- API 端点权限验证
- 数据访问隔离
- 审计日志记录

## 📱 响应式设计

| 断点 | 屏幕尺寸 | 布局特点 |
|------|----------|----------|
| Mobile | < 768px | 单列布局，底部导航 |
| Tablet | 768px - 1024px | 两列布局，侧边导航 |
| Desktop | > 1024px | 三列布局，完整功能 |
| Large | > 1920px | 最大宽度限制 |

## 🚀 部署指南

详细的部署说明请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

### 快速部署

1. **构建前端**
```bash
pnpm run build
```

2. **部署到 Vercel**
```bash
vercel --prod
```

3. **部署后端**
```bash
# 使用 Docker
docker build -t time-master-backend .
docker run -p 5000:5000 time-master-backend
```

## 📊 性能指标

- **首屏加载**: < 2秒
- **交互响应**: < 100ms
- **动画帧率**: 60 FPS
- **包大小**: < 500KB (gzipped)
- **Lighthouse 评分**: 95+

## 🧪 测试

### 运行测试
```bash
# 前端测试
pnpm run test

# 后端测试
cd time-master-enterprise-backend
python -m pytest
```

### 测试覆盖率
- 组件测试: 90%+
- API 测试: 85%+
- 集成测试: 80%+

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范
- 使用 ESLint 和 Prettier
- 遵循 React Hooks 最佳实践
- 编写有意义的提交信息
- 添加必要的测试用例

## 📝 更新日志

详细的更新记录请查看 [CHANGELOG.md](./CHANGELOG.md)

### 最新版本 v2.0.0 (2025-09-18)
- ✨ 企业级多用户支持
- 🔐 LDAP 认证集成
- 📊 管理员后台系统
- 🎯 子任务管理功能
- 🎨 苹果风格 UI 升级

## 🆚 与竞品对比

| 功能特性 | Time Master | Outlook | MS Planner |
|----------|-------------|---------|------------|
| 智能优先级排序 | ✅ | ❌ | 🔶 |
| 子任务管理 | ✅ | ❌ | ✅ |
| 企业认证 | ✅ | ✅ | ✅ |
| 数据分析 | ✅ | ❌ | 🔶 |
| 学习成本 | 极低 | 低 | 中等 |
| 移动端体验 | 优秀 | 良好 | 一般 |

## 📞 技术支持

- **项目维护者**: Time Master Team
- **邮箱**: support@timemaster.com
- **GitHub Issues**: [提交问题](https://github.com/unkaku-1/time-master-web/issues)
- **文档**: [在线文档](https://docs.timemaster.com)

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

---

<div align="center">
  <p>Made with ❤️ by Time Master Team</p>
  <p>© 2025 Time Master Enterprise. All rights reserved.</p>
</div>

