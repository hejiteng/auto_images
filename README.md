# 施工图质检标注训练系统

一个基于 Vue 3 + Konva.js 的施工图质检标注训练平台。用户通过圈出施工照片中的问题区域进行练习，系统根据 IoU 算法自动评分。

## 功能特性

### 答题模式
- 浏览施工照片，鼠标拖拽画圈标出问题区域（矩形辅助框 + 内切圆预览）
- 提交后自动对比预设标注，计算 IoU 匹配得分
- 实时显示命中、遗漏、误标结果及用时

### 管理模式
- 上传本地图片到系统
- 在图片上画圈创建预设标注（填写问题描述、严重程度、详细解释）
- 管理图片和标注列表，支持删除操作
- **权限控制**：需通过顶部 Admin 开关切换后方可访问（调试阶段免密，预留密码验证扩展）

### 调试模式
- 绿色虚线显示预设标注范围
- 红色实线显示用户绘制圆
- 提交后实时展示 IoU 值和匹配结果，方便调整判定阈值

## 技术栈

| 技术 | 说明 |
|------|------|
| Vue 3 | Composition API + `<script setup>` |
| TypeScript | 类型安全 |
| Konva.js | Canvas 绘图引擎 |
| Pinia | 状态管理 |
| Vue Router | 路由管理 |
| Vite | 构建工具 |
| localStorage | 数据持久化 |

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

启动后访问 http://localhost:5173/ 即可使用。

## 数据存储

当前使用 `localStorage` 持久化所有数据（图片和标注），分为两个数组通过 `imageId` 关联：

- 图片列表：记录图片路径、名称、分类等
- 标注列表：记录标注坐标、答案、严重程度等，通过 `imageId` 关联对应图片

## 后端 API

后端预留 6 个接口，通过环境变量切换数据源：

| # | 接口 | 说明 |
|---|------|------|
| 1 | `GET /api/images` | 获取图片列表，支持 `?projectName=&category=&difficulty=` 筛选 |
| 2 | `POST /api/images` | 上传图片（FormData），返回 `{ id, url, ... }` |
| 3 | `DELETE /api/images/:id` | 删除图片 |
| 4 | `GET /api/annotations?imageId=xxx` | 获取某张图的所有标注（管理模式用） |
| 5 | `POST /api/annotations` | 保存新标注（画圈+答案+严重程度+解释） |
| 6 | `POST /api/practice/submit` | 提交答题，前端计算 IoU，后端仅存储 `{ imageId, annotations, score, duration }` |

### 环境变量

| 文件 | 说明 |
|------|------|
| `.env.development` | `VITE_API_BASE_URL=http://localhost:3000/api` |
| `.env.production` | `VITE_API_BASE_URL=https://api.yourdomain.com/api` |

前端调用通过 `src/utils/request.ts` 统一封装，`baseURL` 从环境变量读取，默认 fallback 为 `/api`。

### 关键设计

- **答题模式不获取预设标注**：防止用户提前看到答案，仅在前端本地进行 IoU 匹配计算
- **提交时只提交用户画的圈坐标**：得分由前端计算，后端仅做数据持久化

## 项目结构

```
src/
├── components/
│   └── ImageCanvas/     # 画布组件（Konva 绘图）
├── stores/
│   └── practice.ts      # 状态管理（图片/标注 CRUD）
├── utils/
│   └── iou.ts           # IoU 计算工具
├── views/
│   ├── Practice/        # 答题页面
│   ├── Admin/           # 管理页面
│   └── ...
├── types/               # TypeScript 类型定义
└── router/              # 路由配置
```

## IoU 匹配

系统使用圆形 IoU（Intersection over Union）算法判断用户标注是否与预设标注匹配，默认阈值为 `0.5`。

```
IoU = 交集面积 / 并集面积
IoU >= 0.5 → 命中（HIT）
IoU < 0.5  → 未命中（MISS）
```

## 权限控制

管理系统通过顶部导航栏的 **Admin 开关** 切换访问权限：
- **调试阶段**：切换开关即可进入管理模式，无需密码
- **正式上线**：代码中已预留密码验证逻辑（`TODO` 注释标注），取消注释即可启用密码保护
- 未授权用户访问 `/admin` 时，顶部弹窗提示"无权限"并拦截跳转
