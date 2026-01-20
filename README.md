# 木瓦课堂 WootileClass

面向K12教师的Web端教学管理平台，集课堂管理工具于一体，帮助教师提升课堂效率。

## 功能特性

### V1.0 核心功能

#### 班级管理
- 创建/编辑/删除/归档班级
- Excel批量导入学生
- 手动添加/编辑/删除学生

#### 点名系统
- 转盘点名 - 旋转动画随机抽取
- 抽卡点名 - 翻牌动画随机抽取
- 弹幕点名 - 姓名飞屏后定格
- 分组点名 - 随机分组后抽取
- 按序点名 - 按顺序逐个点名
- 快速签到 - 全班一键签到

#### 学生积分
- 积分加减分
- 快捷加分预设
- 积分排行榜（日/周/月/总榜）
- 投屏展示模式
- 积分规则自定义

### V1.1 作业管理
- 课堂作业（老师上传）
- 家庭作业（学生扫码提交）
- 在线批改打分
- 快捷评语
- 提交统计分析

### V1.3 数据统计
- 出勤统计报表
- 积分统计报表
- 作业统计报表
- CSV数据导出

### V2.0 课堂工具
- 课堂计时器（倒计时/正计时）
- 噪音监测（麦克风检测）
- 分组工具（随机分组）
- 座位表（可视化编排）

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
WootileClass/
├── client/                 # 前端项目
│   ├── src/
│   │   ├── components/     # 通用组件
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # API调用
│   │   └── store/          # 状态管理
│   └── package.json
├── server/                 # 后端项目
│   ├── routes/             # 路由
│   ├── controllers/        # 控制器
│   ├── middleware/         # 中间件
│   ├── db/                 # 数据库配置
│   └── package.json
└── README.md
```

## 使用说明

1. 注册账户并登录
2. 在"班级管理"页面创建班级
3. 添加学生或导入Excel学生名单
4. 使用各种课堂工具进行教学管理

## License

MIT
