<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import Konva from 'konva'
import type { UserAnnotation, CircleCoords, Annotation } from '@/types/annotation'
import { circleIoU, MATCH_THRESHOLD } from '@/utils/iou'

const props = defineProps<{
  imageUrl: string
  mode: 'practice' | 'review'
  presetAnnotations?: Annotation[]
  readonly?: boolean
  debug?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', annotations: UserAnnotation[]): void
  (e: 'cancel'): void
  (e: 'annotation-added', annotation: UserAnnotation): void
}>()

// Track the last drawn circle for confirmation in admin mode
let lastDrawnCircle: Konva.Circle | null = null

const containerEl = ref<HTMLDivElement | null>(null)
let stage: Konva.Stage | null = null
let layer: Konva.Layer | null = null
let userAnnotations = ref<UserAnnotation[]>([])
let userCircleObjects: Konva.Circle[] = []
let presetCircleObjects: Record<string, Konva.Node[]> = {}
let isDrawing = ref(false)
let startX = ref(0)
let startY = ref(0)
let tempRect: Konva.Rect | null = null
let tempCircle: Konva.Circle | null = null
let annotationCount = ref(0)
let canvasReady = ref(false)
let errorMsg = ref('')
let debugResults = ref<{ iou: number; hit: boolean; label: string }[]>([])

// Draw preset annotations (green dashed circles)
function drawPresetAnnotations(annotations: Annotation[], w: number, h: number) {
  if (!layer) return
  for (const ann of annotations) {
    const coords = ann.coords as CircleCoords
    const circle = new Konva.Circle({
      x: coords.x * w,
      y: coords.y * h,
      radius: coords.radius * w,
      fill: 'transparent',
      stroke: '#4caf50',
      strokeWidth: 2,
      dash: [8, 4],
    })
    ;(circle as any).annotationId = ann.id
    layer.add(circle)

    const objects: Konva.Node[] = [circle]

    if (props.debug) {
      const label = new Konva.Text({
        x: coords.x * w,
        y: coords.y * h - coords.radius * w - 16,
        text: ann.answer,
        fontSize: 12,
        fill: '#4caf50',
        align: 'center',
      })
      ;(label as any).annotationId = ann.id
      layer.add(label)
      objects.push(label)
    }

    presetCircleObjects[ann.id] = objects
  }
}

// Draw user annotations with result overlay (after submit)
function drawUserAnnotationWithResult(
  coords: CircleCoords,
  result: { iou: number; hit: boolean; label: string },
  w: number,
  h: number
) {
  if (!layer) return

  const color = result.hit ? '#2196f3' : '#ff4444'
  const overlay = new Konva.Circle({
    x: coords.x * w,
    y: coords.y * h,
    radius: coords.radius * w,
    fill: result.hit ? 'rgba(33, 150, 243, 0.15)' : 'rgba(255, 68, 68, 0.1)',
    stroke: color,
    strokeWidth: result.hit ? 3 : 2,
    dash: result.hit ? [] : [4, 4],
  })
  layer.add(overlay)

  if (props.debug) {
    const text = new Konva.Text({
      x: coords.x * w,
      y: coords.y * h + coords.radius * w + 8,
      text: `IoU: ${result.iou.toFixed(2)} ${result.hit ? 'HIT' : 'MISS'}`,
      fontSize: 13,
      fill: result.hit ? '#2196f3' : '#ff4444',
      fontStyle: 'bold',
      align: 'center',
    })
    layer.add(text)
  }
}

function loadCanvasImage() {
  if (!stage || !layer || !containerEl.value) return

  canvasReady.value = false
  errorMsg.value = ''
  debugResults.value = []
  userCircleObjects = []
  presetCircleObjects = {}

  const maxW = containerEl.value.clientWidth || 1200

  const imageObj = new Image()
  imageObj.crossOrigin = 'anonymous'
  imageObj.src = props.imageUrl

  imageObj.onload = () => {
    if (!imageObj.naturalWidth) {
      console.error('Failed to load image:', props.imageUrl)
      errorMsg.value = '图片加载失败: ' + props.imageUrl
      stage!.setAttrs({ width: 600, height: 300 })
      layer!.batchDraw()
      return
    }

    const scale = maxW / imageObj.naturalWidth
    const w = imageObj.naturalWidth * scale
    const h = imageObj.naturalHeight * scale

    stage!.setAttrs({ width: w, height: h })

    const bgImage = new Konva.Image({
      image: imageObj,
      width: w,
      height: h,
      x: 0,
      y: 0,
    })
    layer.add(bgImage)
    bgImage.moveToBottom()
    layer.batchDraw()
    canvasReady.value = true

    // Draw preset annotations
    if (props.presetAnnotations && props.presetAnnotations.length > 0) {
      drawPresetAnnotations(props.presetAnnotations, w, h)
    }
  }

  imageObj.onerror = () => {
    console.error('Failed to load image:', props.imageUrl)
    errorMsg.value = '图片加载失败: ' + props.imageUrl
  }
}

onMounted(async () => {
  await nextTick()
  if (!containerEl.value) return

  stage = new Konva.Stage({
    container: containerEl.value,
    width: 800,
    height: 400,
  })

  layer = new Konva.Layer()
  stage.add(layer)

  // Bind mouse events to stage for drawing
  stage.on('mousedown', onMouseDown)
  stage.on('mousemove', onMouseMove)
  stage.on('mouseup', onMouseUp)

  await nextTick()
  loadCanvasImage()
})

onUnmounted(() => {
  if (stage) {
    // Don't call stage.destroy() - Vue is managing the container DOM.
    // Just clear internal references.
    layer = null
    stage = null
  }
})

// Watch for image changes
watch(() => props.imageUrl, async (newUrl, oldUrl) => {
  if (!stage || !layer || !containerEl.value) return

  // Fully destroy the old stage and rebuild to avoid DOM conflicts
  stage.destroy()
  stage = null
  layer = null
  userAnnotations.value = []
  userCircleObjects = []
  presetCircleObjects = {}
  tempRect = null
  tempCircle = null
  lastDrawnCircle = null
  isDrawing.value = false

  await nextTick()

  // Re-create stage
  stage = new Konva.Stage({
    container: containerEl.value,
    width: 800,
    height: 400,
  })
  layer = new Konva.Layer()
  stage.add(layer)

  // Re-bind mouse events
  stage.on('mousedown', onMouseDown)
  stage.on('mousemove', onMouseMove)
  stage.on('mouseup', onMouseUp)

  loadCanvasImage()
})

function onMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
  if (!layer) return
  const pos = stage!.getPointerPosition()
  if (!pos) return
  startX.value = pos.x
  startY.value = pos.y
  isDrawing.value = true

  // 矩形辅助框（绿色虚线）
  tempRect = new Konva.Rect({
    x: pos.x,
    y: pos.y,
    width: 0,
    height: 0,
    fill: 'transparent',
    stroke: '#4caf50',
    strokeWidth: 2,
    dash: [5, 5],
    visible: false,
  })
  layer.add(tempRect)

  // 内切圆（红色实线）
  tempCircle = new Konva.Circle({
    x: pos.x,
    y: pos.y,
    radius: 0,
    fill: 'rgba(255, 68, 68, 0.08)',
    stroke: '#ff4444',
    strokeWidth: 2,
    visible: false,
  })
  layer.add(tempCircle)
}

function onMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
  if (!isDrawing.value || !tempCircle || !tempRect || !layer) return
  const pos = stage!.getPointerPosition()
  if (!pos) return

  const width = Math.abs(pos.x - startX.value)
  const height = Math.abs(pos.y - startY.value)

  // 矩形（绿色虚线）
  tempRect.setAttrs({
    x: Math.min(pos.x, startX.value),
    y: Math.min(pos.y, startY.value),
    width,
    height,
    visible: true,
  })

  // 内切圆（红色实线），取短边为直径
  const diameter = Math.min(width, height)
  const radius = diameter / 2
  const cx = (startX.value + pos.x) / 2
  const cy = (startY.value + pos.y) / 2

  tempCircle.setAttrs({
    x: cx,
    y: cy,
    radius,
    visible: true,
  })

  layer.batchDraw()
}

function onMouseUp(e: Konva.KonvaEventObject<MouseEvent>) {
  if (!isDrawing.value || !tempCircle || !tempRect || !layer) return
  isDrawing.value = false

  const r = tempCircle.radius()
  // 隐藏矩形，保留圆
  tempRect.visible(false)

  if (r < 5) {
    tempCircle.destroy()
    tempRect.destroy()
    tempCircle = null
    tempRect = null
    return
  }

  const imgW = stage!.width()
  const imgH = stage!.height()

  const cx = tempCircle.x() / imgW
  const cy = tempCircle.y() / imgH

  const coords: CircleCoords = {
    x: cx,
    y: cy,
    radius: r / imgW,
  }

  const annotation: UserAnnotation = {
    id: `user-${Date.now()}-${annotationCount.value++}`,
    shape: 'circle',
    coords,
    timestamp: Date.now(),
  }

  // Track this circle for admin confirmation
  lastDrawnCircle = tempCircle
  userCircleObjects.push(tempCircle)
  tempRect = null
  tempCircle = null

  emit('annotation-added', { ...annotation, _konvaObject: lastDrawnCircle })
}

function undo() {
  if (userAnnotations.value.length === 0 || !layer) return
  userAnnotations.value.pop()
  if (userCircleObjects.length > 0) {
    const obj = userCircleObjects.pop()
    obj?.destroy()
    layer.batchDraw()
  }
}

function clearAll() {
  if (!layer) return
  for (const obj of userCircleObjects) {
    obj.destroy()
  }
  userAnnotations.value = []
  userCircleObjects = []
  if (tempRect) {
    tempRect.destroy()
    tempRect = null
  }
  if (tempCircle) {
    tempCircle.destroy()
    tempCircle = null
  }
  lastDrawnCircle = null
  isDrawing.value = false
  layer.batchDraw()
}

function showResults(presetAnnotations: Annotation[], threshold: number) {
  if (!layer || !presetAnnotations) return

  const imgW = stage!.width()
  const imgH = stage!.height()
  debugResults.value = []

  for (const ua of userAnnotations.value) {
    let bestIoU = 0
    let bestMatch: Annotation | null = null

    for (const pa of presetAnnotations) {
      const iou = circleIoU(
        { x: ua.coords.x, y: ua.coords.y, r: ua.coords.radius },
        { x: (pa.coords as any).x, y: (pa.coords as any).y, r: (pa.coords as any).radius || 0.05 }
      )
      if (iou > bestIoU) {
        bestIoU = iou
        bestMatch = pa
      }
    }

    const hit = bestIoU >= threshold
    debugResults.value.push({ iou: bestIoU, hit, label: bestMatch?.answer || '无匹配' })

    drawUserAnnotationWithResult(ua.coords as CircleCoords, { iou: bestIoU, hit, label: bestMatch?.answer || '' }, imgW, imgH)
  }
}

function getAnnotations() {
  return userAnnotations.value
}

function confirmAnnotation(annotationId: string, annotation: Annotation) {
  if (!layer || !lastDrawnCircle) {
    console.warn('confirmAnnotation: missing layer or lastDrawnCircle')
    return
  }

  const imgW = stage!.width()
  const imgH = stage!.height()

  // Remove from userCircleObjects since it's now a preset
  const idx = userCircleObjects.indexOf(lastDrawnCircle)
  if (idx !== -1) {
    userCircleObjects.splice(idx, 1)
  }

  // Convert red user circle to green dashed preset circle
  lastDrawnCircle.setAttrs({
    stroke: '#4caf50',
    strokeWidth: 2,
    dash: [8, 4],
    fill: 'transparent',
  })
  ;(lastDrawnCircle as any).annotationId = annotationId

  const objects: Konva.Node[] = [lastDrawnCircle]

  // Add debug label
  if (props.debug) {
    const coords = annotation.coords as CircleCoords
    const label = new Konva.Text({
      x: coords.x * imgW,
      y: coords.y * imgH - coords.radius * imgW - 16,
      text: annotation.answer,
      fontSize: 12,
      fill: '#4caf50',
      align: 'center',
    })
    ;(label as any).annotationId = annotationId
    layer.add(label)
    objects.push(label)
  }

  presetCircleObjects[annotationId] = objects

  console.log('confirmAnnotation:', {
    id: annotationId,
    objectsCount: objects.length,
    objects: objects.map((o: any) => ({ type: o.getClassName(), annotationId: o.annotationId })),
  })

  lastDrawnCircle = null
  layer.batchDraw()
}

function removePresetAnnotation(id: string) {
  if (!layer) return
  const objects = presetCircleObjects[id]
  if (!objects) {
    console.warn('removePresetAnnotation: no objects found for id', id)
    return
  }
  for (const obj of objects) {
    obj.destroy()
  }
  delete presetCircleObjects[id]
  layer.batchDraw()
  console.log('removePresetAnnotation:', { id, removedCount: objects.length, remainingIds: Object.keys(presetCircleObjects) })
}

defineExpose({ undo, clearAll, getAnnotations, showResults, confirmAnnotation, removePresetAnnotation })
</script>

<template>
  <div class="canvas-container">
    <div ref="containerEl" class="canvas-inner"></div>
    <p v-show="!canvasReady && !errorMsg" class="loading-text">图片加载中...</p>
    <p v-show="errorMsg" class="error-text">{{ errorMsg }}</p>
  </div>
  <div v-if="debug && debugResults.length > 0" class="debug-panel">
    <h4>调试面板 (阈值: {{ MATCH_THRESHOLD }})</h4>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>匹配目标</th>
          <th>IoU</th>
          <th>结果</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(r, i) in debugResults" :key="i" :class="r.hit ? 'hit' : 'miss'">
          <td>{{ i + 1 }}</td>
          <td>{{ r.label }}</td>
          <td>{{ r.iou.toFixed(4) }}</td>
          <td>{{ r.hit ? 'HIT' : 'MISS' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
.canvas-container {
  position: relative;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
  min-height: 200px;

  .canvas-inner {
    width: 100%;
    min-height: 200px;
  }

  :deep(.konvajs-content) {
    cursor: crosshair;
    width: 100% !important;
  }
}

.loading-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #999;
}

.error-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #f44336;
  font-size: 14px;
  text-align: center;
}

.debug-panel {
  max-width: 1200px;
  margin: 16px auto;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);

  h4 {
    margin: 0 0 12px;
    color: #333;
  }

  table {
    width: 100%;
    border-collapse: collapse;

    th, td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }

    th {
      background: #f8f8f8;
      font-weight: 600;
      color: #555;
    }
  }

  tr.hit td {
    color: #2196f3;
    font-weight: bold;
  }

  tr.miss td {
    color: #ff4444;
  }
}
</style>
