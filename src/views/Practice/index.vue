<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import ImageCanvas from '@/components/ImageCanvas/index.vue'
import { usePracticeStore } from '@/stores/practice'

const practiceStore = usePracticeStore()
const canvasRef = ref<InstanceType<typeof ImageCanvas> | null>(null)

onMounted(() => {
  practiceStore.reset()
  practiceStore.loadImage()
  practiceStore.startTimer()
})

onUnmounted(() => {
  practiceStore.reset()
})

const handleSubmit = () => {
  const annotations = canvasRef.value?.getAnnotations() || []
  practiceStore.userAnnotations = annotations
  canvasRef.value?.showResults(practiceStore.presetAnnotations, 0.5)
  practiceStore.doSubmit()
}

const handleNext = () => {
  practiceStore.reset()
  practiceStore.loadImage()
  practiceStore.startTimer()
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}分${s}秒`
}
</script>

<template>
  <div class="practice-page">
    <div v-if="!practiceStore.result" class="practice-mode">
      <div class="toolbar">
        <span class="title">施工质检标注练习</span>
        <div class="info-bar">
          <span>计时: {{ formatTime(practiceStore.timerSeconds) }}</span>
          <span>已标注: {{ canvasRef?.getAnnotations().length || 0 }} 处</span>
        </div>
      </div>

      <ImageCanvas
        v-if="practiceStore.currentImage"
        ref="canvasRef"
        :image-url="practiceStore.currentImage.url"
        mode="practice"
        :preset-annotations="practiceStore.presetAnnotations"
        :debug="true"
        @annotation-added="() => {}"
      />
      <div v-else class="loading">
        <p>加载中...</p>
        <button class="btn-primary" @click="practiceStore.loadImage()">重新加载</button>
      </div>

      <div class="actions">
        <button class="btn" @click="canvasRef?.undo()">撤销</button>
        <button class="btn" @click="canvasRef?.clearAll()">清空</button>
        <button class="btn-primary" @click="handleSubmit">提交答案</button>
      </div>

      <p class="hint">在图片上圈出你认为有问题的区域</p>
    </div>

    <div v-else class="result-mode">
      <div class="result-header">
        <h2>得分: {{ practiceStore.result.score }}/100</h2>
        <p>用时: {{ formatTime(practiceStore.result.timeSpent) }}</p>
        <p>正确: {{ practiceStore.result.correctHits }} | 遗漏: {{ practiceStore.result.missedAnnotations.length }} | 误标: {{ practiceStore.result.falsePositives.length }}</p>
      </div>

      <div class="result-list">
        <div
          v-for="ann in practiceStore.result.missedAnnotations"
          :key="ann.id"
          class="result-item missed"
        >
          <h3>❌ 遗漏: {{ ann.answer }}</h3>
          <p>严重程度: {{ ann.severity }}</p>
          <p>{{ ann.explanation }}</p>
        </div>
        <div
          v-for="ann in practiceStore.result.falsePositives"
          :key="ann.id"
          class="result-item false-positive"
        >
          <h3>⚠️ 误标区域</h3>
          <p>该区域不存在问题</p>
        </div>
        <div class="result-item correct" v-if="practiceStore.result.correctHits > 0">
          <h3>✅ 正确标注 {{ practiceStore.result.correctHits }} 处</h3>
        </div>
      </div>

      <div class="actions">
        <button class="btn-primary" @click="handleNext">下一题</button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.practice-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .title {
    font-size: 20px;
    font-weight: bold;
  }

  .info-bar {
    display: flex;
    gap: 20px;
    color: #666;
  }
}

.loading {
  text-align: center;
  padding: 60px;
  color: #999;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  justify-content: center;
}

.btn {
  padding: 10px 24px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background: #f5f5f5;
  }
}

.btn-primary {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  background: #409eff;
  color: #fff;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background: #3a8ee6;
  }
}

.hint {
  text-align: center;
  color: #999;
  margin-top: 12px;
}

.result-header {
  text-align: center;
  margin-bottom: 20px;

  h2 {
    font-size: 28px;
    color: #409eff;
  }

  p {
    color: #666;
    margin: 4px 0;
  }
}

.result-list {
  max-height: 400px;
  overflow-y: auto;
}

.result-item {
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 12px;

  h3 {
    margin: 0 0 8px;
    font-size: 16px;
  }

  p {
    margin: 4px 0;
    color: #666;
    font-size: 14px;
  }

  &.missed {
    background: #fff3e0;
    border-left: 4px solid #ff9800;
  }

  &.false-positive {
    background: #fce4ec;
    border-left: 4px solid #f44336;
  }

  &.correct {
    background: #e8f5e9;
    border-left: 4px solid #4caf50;
  }
}
</style>
