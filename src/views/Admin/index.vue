<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import Konva from 'konva'
import ImageCanvas from '@/components/ImageCanvas/index.vue'
import { usePracticeStore } from '@/stores/practice'
import type { ImageItem, Annotation, CircleCoords } from '@/types/annotation'

const store = usePracticeStore()
const images = ref<ImageItem[]>([])
const currentAdminImage = ref<ImageItem | null>(null)
const adminAnnotations = ref<Annotation[]>([])
const canvasRef = ref<InstanceType<typeof ImageCanvas> | null>(null)

// 标注表单
const dialogVisible = ref(false)
const formData = ref({
  answer: '',
  category: '',
  severity: 'minor' as 'minor' | 'major' | 'critical',
  explanation: '',
})
const pendingAnnotationCoords = ref<CircleCoords | null>(null)
const pendingKonvaObject = ref<Konva.Circle | null>(null)

const severityMap = { minor: '轻微', major: '严重', critical: '致命' }

function loadImages() {
  images.value = store.getAllImages()
  console.log('[admin] loadImages:', images.value.map(i => ({ id: i.id, name: i.projectName })))
  if (images.value.length > 0 && !currentAdminImage.value) {
    selectImage(images.value[0])
  }
}

function selectImage(image: ImageItem) {
  currentAdminImage.value = image
  adminAnnotations.value = store.getAnnotationsForImage(image.id)
  console.log('[admin] selectImage:', image.id, 'annotations:', adminAnnotations.value)
}

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const url = URL.createObjectURL(file)
  const newImage: ImageItem = {
    id: `img-${Date.now()}`,
    url,
    projectName: '本地上传',
    category: '综合',
    difficulty: 'medium',
    uploadTime: new Date().toISOString(),
    annotationCount: 0,
  }
  store.addImage(newImage)
  loadImages()
  selectImage(newImage)
  input.value = ''
}

function handleDeleteImage(image: ImageItem) {
  if (confirm(`确定删除图片「${image.projectName}」及其标注？`)) {
    store.removeImage(image.id)
    if (currentAdminImage.value?.id === image.id) {
      currentAdminImage.value = null
    }
    loadImages()
  }
}

function handleAnnotationAdded(annotation: any) {
  pendingAnnotationCoords.value = annotation.coords as CircleCoords
  pendingKonvaObject.value = annotation._konvaObject
  formData.value = { answer: '', category: currentAdminImage.value?.category || '', severity: 'minor', explanation: '' }
  dialogVisible.value = true
}

function handleSaveAnnotation() {
  if (!pendingAnnotationCoords.value || !currentAdminImage.value || !formData.value.answer) return

  const annotation: Annotation = {
    id: `preset-${Date.now()}`,
    imageId: currentAdminImage.value.id,
    shape: 'circle',
    coords: pendingAnnotationCoords.value,
    answer: formData.value.answer,
    category: formData.value.category,
    severity: formData.value.severity,
    explanation: formData.value.explanation,
  }

  // Convert red circle to green dashed preset circle on canvas
  canvasRef.value?.confirmAnnotation(annotation.id, annotation)

  store.addPresetAnnotation(annotation)
  adminAnnotations.value = store.getAnnotationsForImage(currentAdminImage.value.id)
  dialogVisible.value = false
  pendingAnnotationCoords.value = null
  pendingKonvaObject.value = null
}

function handleCancelAnnotation() {
  // Remove the red user circle from canvas
  if (pendingKonvaObject.value) {
    pendingKonvaObject.value.destroy()
  }
  dialogVisible.value = false
  pendingAnnotationCoords.value = null
  pendingKonvaObject.value = null
}

function handleDeleteAnnotation(id: string) {
  store.removePresetAnnotation(id)
  canvasRef.value?.removePresetAnnotation(id)
  adminAnnotations.value = store.getAnnotationsForImage(currentAdminImage.value?.id || '')
}

loadImages()
</script>

<template>
  <div class="admin-page">
    <!-- 左侧：图片列表 -->
    <div class="panel panel-left">
      <h3>图片列表</h3>
      <div class="upload-area">
        <label class="upload-btn" for="file-upload">➕ 上传新图片</label>
        <input id="file-upload" type="file" accept="image/*" @change="handleFileUpload" />
      </div>
      <div class="image-list">
        <div
          v-for="img in images"
          :key="img.id"
          :class="['image-item', { active: currentAdminImage?.id === img.id }]"
          @click="selectImage(img)"
        >
          <div class="image-info">
            <span class="image-name">{{ img.projectName }}</span>
            <span class="image-meta">{{ img.category }} · {{ img.annotationCount }}处</span>
          </div>
          <button class="delete-btn" @click.stop="handleDeleteImage(img)">✕</button>
        </div>
      </div>
    </div>

    <!-- 中间：画布 -->
    <div class="panel panel-center">
      <h3 v-if="currentAdminImage">{{ currentAdminImage.projectName }} - 标注模式</h3>
      <h3 v-else>请先选择或上传图片</h3>
      <ImageCanvas
        v-if="currentAdminImage"
        ref="canvasRef"
        :image-url="currentAdminImage.url"
        mode="practice"
        :readonly="false"
        :debug="true"
        :preset-annotations="adminAnnotations"
        @annotation-added="handleAnnotationAdded"
      />
    </div>

    <!-- 右侧：标注列表 -->
    <div class="panel panel-right">
      <h3>标注列表 ({{ adminAnnotations.length }})</h3>
      <div class="annotation-list">
        <div v-for="ann in adminAnnotations" :key="ann.id" class="annotation-item">
          <div class="annotation-header">
            <span class="annotation-answer">{{ ann.answer }}</span>
            <span :class="['severity-badge', ann.severity]">{{ severityMap[ann.severity] }}</span>
          </div>
          <p class="annotation-explanation">{{ ann.explanation }}</p>
          <button class="delete-ann-btn" @click="handleDeleteAnnotation(ann.id)">删除</button>
        </div>
        <p v-if="adminAnnotations.length === 0" class="empty-text">暂无标注</p>
      </div>
    </div>

    <!-- 标注表单弹窗 -->
    <Teleport to="body">
      <div v-if="dialogVisible" class="modal-overlay" @click.self="dialogVisible = false">
        <div class="modal">
          <h3>添加标注</h3>
          <div class="form-group">
            <label>问题描述</label>
            <input v-model="formData.answer" type="text" placeholder="如：水管未做保温处理" />
          </div>
          <div class="form-group">
            <label>严重程度</label>
            <select v-model="formData.severity">
              <option value="minor">轻微</option>
              <option value="major">严重</option>
              <option value="critical">致命</option>
            </select>
          </div>
          <div class="form-group">
            <label>详细解释</label>
            <textarea v-model="formData.explanation" rows="3" placeholder="补充说明..."></textarea>
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" @click="handleCancelAnnotation">取消</button>
            <button class="btn-save" @click="handleSaveAnnotation">保存</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.admin-page {
  display: flex;
  height: calc(100vh - 45px);
  gap: 0;
}

.panel {
  padding: 16px;
  overflow-y: auto;

  h3 {
    font-size: 16px;
    margin: 0 0 12px;
    color: #333;
    border-bottom: 1px solid #eee;
    padding-bottom: 8px;
  }
}

.panel-left {
  width: 260px;
  min-width: 260px;
  background: #fafafa;
  border-right: 1px solid #e8e8e8;
}

.panel-center {
  flex: 1;
  min-width: 0;
  background: #f5f5f5;
}

.panel-right {
  width: 300px;
  min-width: 300px;
  background: #fafafa;
  border-left: 1px solid #e8e8e8;
}

.upload-area {
  margin-bottom: 12px;
}

.upload-btn {
  display: block;
  padding: 10px;
  background: #409eff;
  color: #fff;
  border-radius: 6px;
  text-align: center;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background: #3a8ee6;
  }
}

#file-upload {
  display: none;
}

.image-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.image-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: #eee;
  }

  &.active {
    background: #409eff;
    color: #fff;
  }

  &.active .image-meta {
    color: rgba(255, 255, 255, 0.8);
  }
}

.image-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.image-name {
  font-size: 14px;
  font-weight: 500;
}

.image-meta {
  font-size: 12px;
  color: #999;
}

.delete-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 4px;

  &:hover {
    color: #f44336;
    background: rgba(244, 67, 54, 0.1);
  }
}

.annotation-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.annotation-item {
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.annotation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.annotation-answer {
  font-weight: 600;
  font-size: 14px;
}

.severity-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #fff;

  &.minor { background: #67c23a; }
  &.major { background: #e6a23c; }
  &.critical { background: #f56c6c; }
}

.annotation-explanation {
  font-size: 13px;
  color: #666;
  margin: 0 0 8px;
}

.delete-ann-btn {
  padding: 4px 12px;
  border: 1px solid #f44336;
  border-radius: 4px;
  background: #fff;
  color: #f44336;
  cursor: pointer;
  font-size: 12px;

  &:hover {
    background: #f44336;
    color: #fff;
  }
}

.empty-text {
  text-align: center;
  color: #999;
  padding: 20px 0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);

  h3 {
    margin: 0 0 20px;
  }
}

.form-group {
  margin-bottom: 16px;

  label {
    display: block;
    margin-bottom: 6px;
    font-size: 14px;
    color: #333;
  }

  input, select, textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: #409eff;
    }
  }
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn-cancel {
  padding: 8px 20px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}

.btn-save {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  background: #409eff;
  color: #fff;
  cursor: pointer;

  &:hover {
    background: #3a8ee6;
  }
}
</style>
