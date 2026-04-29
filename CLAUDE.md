# 施工图质检标注训练系统

## 技术栈
Vue 3 (Composition API + script setup) + TypeScript + Konva.js + Pinia + Vue Router + Vite

## 数据存储
localStorage（图片列表和标注列表通过 imageId 关联，上线前替换为后端 API）

## 核心功能
- **答题模式**: 画圈标注 → 提交 → IoU 评分（阈值 0.5）
- **管理模式**: 上传图片 + 创建预设标注（绿色虚线）
- **调试模式**: 实时显示 IoU 匹配结果

## 开发命令
- `npm run dev` → http://localhost:5173/
- `npm run build`

## 用户偏好
- commit 描述用中文
- 推送前先确认，不要自动 git push
- 回复简洁，不要多余总结
- 前端问题优先排查事件绑定和 DOM 状态

## GitHub
https://github.com/hejiteng/auto_images

## 待解决问题
- 图片画圈无反应（事件已绑定到 stage.on('mousedown')，但画布上拖拽无效果，需进一步排查）
