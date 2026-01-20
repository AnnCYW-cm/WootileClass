# 教师教学平台 MVP

面向K12教师的Web端教学管理平台，实现班级管理和点名系统两大核心功能。

## 功能特性

### 班级管理
- 创建/编辑/删除班级
- Excel批量导入学生
- 手动添加/编辑/删除学生

### 点名系统
- 转盘点名 - 旋转动画随机抽取学生
- 抽卡点名 - 翻牌动画随机抽取学生
- 按序点名 - 按顺序逐个点名
- 快速签到 - 全班一键签到

### 出勤状态
- 出勤
- 缺勤
- 迟到
- 请假

## 技术栈

- **前端**: React 18 + Vite + TailwindCSS + React Router + Framer Motion
- **后端**: Node.js + Express
- **数据库**: PostgreSQL

## 快速开始

### 前置条件

- Node.js 18+
- PostgreSQL 已安装并运行

### 1. 创建数据库

```bash
createdb teacher_platform
```

### 2. 配置后端

```bash
cd server
cp .env.example .env
# 编辑 .env 文件，配置数据库连接信息
```

### 3. 启动后端

```bash
cd server
npm install
npm run dev
```

服务将运行在 http://localhost:3001

### 4. 启动前端

```bash
cd client
npm install
npm run dev
```

应用将运行在 http://localhost:5173

## 项目结构

```
teacher-platform/
├── client/                 # 前端项目
│   ├── src/
│   │   ├── components/     # 通用组件
│   │   ├── pages/          # 页面组件
│   │   ├── hooks/          # 自定义Hooks
│   │   ├── services/       # API调用
│   │   ├── store/          # 状态管理
│   │   └── utils/          # 工具函数
│   └── package.json
├── server/                 # 后端项目
│   ├── routes/             # 路由
│   ├── controllers/        # 控制器
│   ├── models/             # 数据模型
│   ├── middleware/         # 中间件
│   ├── db/                 # 数据库配置
│   └── package.json
└── README.md
```

## API 接口

### 用户认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `GET /api/auth/profile` - 获取用户信息

### 班级管理
- `GET /api/classes` - 获取班级列表
- `POST /api/classes` - 创建班级
- `PUT /api/classes/:id` - 更新班级
- `DELETE /api/classes/:id` - 删除班级

### 学生管理
- `GET /api/students/class/:classId` - 获取学生列表
- `POST /api/students/class/:classId` - 添加学生
- `POST /api/students/class/:classId/import` - Excel导入学生
- `PUT /api/students/:id` - 更新学生
- `DELETE /api/students/:id` - 删除学生

### 点名
- `GET /api/attendance/class/:classId` - 获取点名记录
- `POST /api/attendance/class/:classId` - 记录点名
- `POST /api/attendance/class/:classId/batch` - 批量点名
- `GET /api/attendance/class/:classId/random` - 随机抽取学生

## Excel 导入格式

支持 `.xlsx` 和 `.xls` 格式，列名支持：

| 中文列名 | 英文列名 |
|---------|---------|
| 姓名 | name |
| 学号 | student_no |
| 性别 | gender |

## 使用说明

1. 注册账户并登录
2. 在"班级管理"页面创建班级
3. 添加学生或导入Excel学生名单
4. 进入"点名系统"选择班级
5. 选择点名方式进行点名
