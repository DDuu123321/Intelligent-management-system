# 员工考勤与车辆监控系统

一个基于 Vue.js + Node.js 的现代化员工考勤和车辆监控管理系统，支持二维码签到、实时监控、数据统计等功能。

## 🌟 功能特性

### 👥 员工管理
- **员工信息管理** - 完整的员工档案管理
- **二维码签到** - 支持扫码快速签到签退
- **考勤统计** - 详细的考勤记录和统计分析
- **证书管理** - 员工证书信息维护和到期提醒

### 🚗 车辆监控
- **车辆档案管理** - 车辆基本信息维护
- **实时位置监控** - GPS定位和轨迹追踪
- **违规检测** - 超速、越界等违规行为监控
- **维护提醒** - 保养、年检等提醒功能

### 📊 数据统计
- **实时仪表盘** - 关键指标可视化展示
- **考勤报表** - 多维度考勤数据分析
- **车辆报表** - 车辆使用情况统计
- **违规统计** - 违规事件分析和趋势

### 🔐 系统管理
- **用户认证** - JWT token 身份验证
- **权限控制** - 基于角色的访问控制
- **系统设置** - 灵活的系统参数配置
- **数据备份** - 自动数据备份和恢复

## 🏗️ 技术架构

### 前端技术栈
- **框架**: Vue.js 3 + TypeScript
- **构建工具**: Vite
- **UI框架**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router
- **图表**: ECharts
- **地图**: 高德地图 API
- **样式**: CSS3 + 响应式设计

### 后端技术栈
- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: SQLite
- **认证**: JWT (JSON Web Tokens)
- **文件上传**: Multer
- **API文档**: RESTful API

### 开发工具
- **包管理**: npm workspaces (monorepo)
- **代码规范**: ESLint + Prettier
- **版本控制**: Git
- **开发环境**: VS Code

## 📁 项目结构

```
监控系统/
├── apps/
│   ├── frontend/                 # Vue.js 前端应用
│   │   ├── src/
│   │   │   ├── components/       # 公共组件
│   │   │   ├── views/           # 页面组件
│   │   │   ├── stores/          # Pinia状态管理
│   │   │   ├── router/          # 路由配置
│   │   │   ├── utils/           # 工具函数
│   │   │   └── assets/          # 静态资源
│   │   ├── public/              # 公共资源
│   │   └── package.json
│   └── backend/                  # Node.js 后端应用
│       ├── routes/              # API路由
│       ├── middleware/          # 中间件
│       ├── uploads/             # 文件上传目录
│       ├── database.db          # SQLite数据库
│       ├── server.js            # 服务器入口
│       └── package.json
├── docs/                        # 项目文档
├── scripts/                     # 开发脚本
├── package.json                 # 根package.json
└── README.md                    # 项目说明
```

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd 监控

# 安装所有依赖
npm install

# 安装concurrently (用于同时启动前后端)
npm install concurrently --save-dev
```

### 启动开发环境

#### 方式一：一键启动（推荐）
```bash
npm run dev
```

#### 方式二：使用PowerShell脚本
```powershell
.\scripts\dev.ps1
```

#### 方式三：分别启动
```bash
# 启动后端 (终端1)
cd apps/backend
npm run dev

# 启动前端 (终端2)  
cd apps/frontend
npm run dev
```

### 访问应用
- **前端应用**: http://localhost:5173
- **后端API**: http://localhost:3000
- **API文档**: http://localhost:3000/api-docs (如果配置了)

### 默认账号
- **用户名**: admin
- **密码**: 123456

## 🔧 配置说明

### 环境变量配置

#### 前端 (.env)
```env
VITE_API_URL=http://localhost:3000
VITE_APP_TITLE=员工考勤与车辆监控系统
```

#### 后端 (.env)
```env
PORT=3000
JWT_SECRET=your-secret-key
DATABASE_URL=./database.db
```

### 数据库配置
项目使用SQLite数据库，首次启动会自动创建数据库文件和表结构。

## 📚 API文档

### 认证相关
- `POST /auth/login` - 用户登录
- `POST /auth/logout` - 用户登出  
- `GET /auth/profile` - 获取用户信息

### 员工管理
- `GET /api/employees` - 获取员工列表
- `POST /api/employees` - 创建员工
- `PUT /api/employees/:id` - 更新员工信息
- `DELETE /api/employees/:id` - 删除员工

### 考勤管理
- `GET /api/attendance` - 获取考勤记录
- `POST /api/attendance/checkin` - 签到
- `POST /api/attendance/checkout` - 签退
- `GET /api/attendance/qrcode` - 生成签到二维码

### 车辆管理
- `GET /api/vehicles` - 获取车辆列表
- `POST /api/vehicles` - 添加车辆
- `PUT /api/vehicles/:id` - 更新车辆信息
- `GET /api/vehicles/:id/location` - 获取车辆位置

### 统计数据
- `GET /api/statistics/dashboard` - 仪表盘数据
- `GET /api/statistics/attendance` - 考勤统计
- `GET /api/statistics/vehicles` - 车辆统计

## 🛠️ 开发指南

### 添加新功能
1. 后端：在 `apps/backend/routes/` 添加新的路由
2. 前端：在 `apps/frontend/src/views/` 添加新页面
3. 更新路由配置和导航菜单

### 数据库操作
```javascript
// 示例：查询员工数据
const employees = await db.all('SELECT * FROM employees WHERE status = ?', ['active']);
```

### 前端状态管理
```typescript
// 使用Pinia store
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
await authStore.login(credentials)
```

## 🧪 测试

### 运行测试
```bash
# 前端测试
cd apps/frontend
npm run test

# 后端测试  
cd apps/backend
npm run test
```

### 功能测试
访问 `/test-frontend.html` 进行前端功能测试

## 📦 构建部署

### 构建生产版本
```bash
# 构建前端
cd apps/frontend
npm run build

# 构建后端（如需要）
cd apps/backend
npm run build
```

### 部署建议
- 前端：部署到CDN或静态文件服务器
- 后端：部署到Node.js服务器
- 数据库：迁移到生产数据库（MySQL/PostgreSQL）

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🐛 问题反馈

如遇到问题，请在 GitHub Issues 中提交，或联系开发团队。

## 📞 联系方式

- 项目维护者：David Du
- 邮箱：dupt321@gmail.com
- 项目地址：(https://github.com/DDuu123321/Intelligent-management-system)

---

**最后更新时间**: 2024年9月2日
**版本**: v1.0.0

