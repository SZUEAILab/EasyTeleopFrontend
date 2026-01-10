# EasyTeleop Frontend

机器人遥操控制平台前端（Next.js）。

## 功能特性

### 设备管理
- 实时设备状态监控（通过 MQTT）
- 设备配置和测试
- 遥操作组管理
- 支持多种设备类型（VR、机械臂、摄像头）

### 数据管理
- 实时录制控制
- 视频回放与多视角查看
- 机器人姿态可视化
- 录制数据管理

### 远程教学
- 示教数据上传下载
- 轨迹数据管理
- 视频教学资料管理

### 数据清理
- 过期数据清理
- 存储空间管理
- 批量操作支持

## 技术栈

- **前端框架**: Next.js 15 (App Router)
- **UI 组件**: shadcn/ui + Tailwind CSS v4
- **实时通信**: MQTT.js
- **状态管理**: React Hooks
- **类型安全**: TypeScript

## 环境配置

创建 `.env.local` 文件：

```env
NEXT_PUBLIC_API_URL=http://121.43.162.224:8000
NEXT_PUBLIC_MQTT_URL=ws://121.43.162.224:8083/mqtt
NEXT_PUBLIC_MQTT_USERNAME=
NEXT_PUBLIC_MQTT_PASSWORD=
```

## 开发指南

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 项目结构

```
├── app/                    # Next.js 页面
│   ├── page.tsx           # 设备管理
│   ├── data/              # 数据管理
│   ├── teaching/          # 远程教学
│   └── cleanup/           # 数据清理
├── components/            # React 组件
│   ├── ui/               # shadcn/ui 组件
│   ├── sidebar.tsx       # 侧边栏导航
│   ├── header.tsx        # 顶部栏
│   └── ...               # 其他组件
├── lib/                   # 工具库
│   ├── api-client.ts     # API 客户端
│   ├── mqtt-client.ts    # MQTT 客户端
│   ├── types.ts          # TypeScript 类型
│   └── config.ts         # 配置管理
└── hooks/                 # 自定义 Hooks
    └── use-mqtt-status.ts # MQTT 状态 Hook
```

## API 集成

系统通过 RESTful API 与后端通信：

- `/api/devices` - 设备管理
- `/api/teleop-groups` - 遥操作组管理
- `/api/nodes` - 节点管理

## MQTT 主题

实时状态更新通过 MQTT 订阅：

- `node/{id}/status` - 节点状态
- `node/{id}/device/{id}/status` - 设备状态
- `node/{id}/teleop-group/{id}/status` - 遥操组状态
- `node/{id}/teleop-group/{id}/collecting` - 采集状态

