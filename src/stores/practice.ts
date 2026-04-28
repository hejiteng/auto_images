import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserAnnotation, PracticeResult, Annotation } from '@/types/annotation'
import type { ImageItem } from '@/types/image'
import { circleIoU, MATCH_THRESHOLD } from '@/utils/iou'

const STORAGE_KEY_IMAGES = 'practice_image_list'
const STORAGE_KEY_ANNOTATIONS = 'practice_annotation_list'

const defaultImages: ImageItem[] = [
  {
    id: 'img1',
    url: '/images/扁担不对.jpeg',
    projectName: '本地练习',
    category: '安全',
    difficulty: 'medium',
    uploadTime: new Date().toISOString(),
    annotationCount: 1,
  },
  {
    id: 'img2',
    url: '/images/成品保护.jpeg',
    projectName: '本地练习',
    category: '成品保护',
    difficulty: 'medium',
    uploadTime: new Date().toISOString(),
    annotationCount: 1,
  },
]

const defaultAnnotations: Annotation[] = [
  {
    id: 'preset-1',
    imageId: 'img1',
    shape: 'circle',
    coords: { x: 0.5, y: 0.4, radius: 0.1 },
    answer: '扁担使用不规范',
    category: '安全',
    severity: 'major',
    explanation: '应使用标准脚手架扁担，确保施工安全。',
  },
  {
    id: 'preset-2',
    imageId: 'img2',
    shape: 'circle',
    coords: { x: 0.5, y: 0.5, radius: 0.1 },
    answer: '成品保护不到位',
    category: '成品保护',
    severity: 'minor',
    explanation: '已完成部分应采取覆盖、包裹等保护措施。',
  },
]

function loadImages(): ImageItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_IMAGES)
    if (!data) return defaultImages
    const parsed: ImageItem[] = JSON.parse(data)
    // 过滤掉 blob URL（页面刷新后失效）
    const valid = parsed.filter((img) => !img.url.startsWith('blob:'))
    if (valid.length === 0) return defaultImages
    // 清理关联的失效标注
    const validIds = new Set(valid.map((img) => img.id))
    const annotations = loadAnnotations()
    const cleanAnnotations = annotations.filter((a) => validIds.has(a.imageId))
    if (cleanAnnotations.length !== annotations.length) {
      saveAnnotations(cleanAnnotations)
    }
    if (valid.length !== parsed.length) {
      saveImages(valid)
    }
    return valid
  } catch {
    return defaultImages
  }
}

function loadAnnotations(): Annotation[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_ANNOTATIONS)
    return data ? JSON.parse(data) : defaultAnnotations
  } catch {
    return defaultAnnotations
  }
}

function saveImages(images: ImageItem[]) {
  localStorage.setItem(STORAGE_KEY_IMAGES, JSON.stringify(images))
}

function saveAnnotations(annotations: Annotation[]) {
  localStorage.setItem(STORAGE_KEY_ANNOTATIONS, JSON.stringify(annotations))
}

// 初始数据
const imageList = ref<ImageItem[]>(loadImages())
const annotationList = ref<Annotation[]>(loadAnnotations())

let imageIndex = 0

export const usePracticeStore = defineStore('practice', () => {
  const currentImage = ref<ImageItem | null>(null)
  const userAnnotations = ref<UserAnnotation[]>([])
  const presetAnnotations = ref<Annotation[]>([])
  const isSubmitting = ref(false)
  const result = ref<PracticeResult | null>(null)
  const timerSeconds = ref(0)
  let timer: number | null = null

  const loadImage = async (params?: { project?: string; difficulty?: string }) => {
    // Refresh from localStorage
    imageList.value = loadImages()
    annotationList.value = loadAnnotations()

    const image = imageList.value[imageIndex % imageList.value.length]
    imageIndex++
    currentImage.value = image
    presetAnnotations.value = annotationList.value.filter((a) => a.imageId === image.id)
    userAnnotations.value = []
    result.value = null
    timerSeconds.value = 0
  }

  const addAnnotation = (annotation: UserAnnotation) => {
    userAnnotations.value.push(annotation)
  }

  const removeAnnotation = (id: string) => {
    const idx = userAnnotations.value.findIndex((a) => a.id === id)
    if (idx !== -1) userAnnotations.value.splice(idx, 1)
  }

  const reset = () => {
    userAnnotations.value = []
    result.value = null
    timerSeconds.value = 0
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  const startTimer = () => {
    timer = window.setInterval(() => {
      timerSeconds.value++
    }, 1000)
  }

  const doSubmit = async () => {
    if (!currentImage.value) return
    isSubmitting.value = true
    if (timer) {
      clearInterval(timer)
      timer = null
    }

    const matched = new Set<string>()
    const falsePositives: UserAnnotation[] = []

    for (const ua of userAnnotations.value) {
      let hit = false
      for (const pa of presetAnnotations.value) {
        if (matched.has(pa.id)) continue
        const iou = circleIoU(
          { x: ua.coords.x, y: ua.coords.y, r: (ua.coords as any).radius || 0.05 },
          { x: pa.coords.x, y: pa.coords.y, r: (pa.coords as any).radius || 0.05 }
        )
        if (iou >= MATCH_THRESHOLD) {
          matched.add(pa.id)
          hit = true
          break
        }
      }
      if (!hit) falsePositives.push(ua)
    }

    const missed = presetAnnotations.value.filter((a) => !matched.has(a.id))
    const total = presetAnnotations.value.length
    const correctHits = matched.size
    const score = total > 0 ? Math.round((correctHits / total) * 100) : 0

    result.value = {
      imageId: currentImage.value.id,
      userAnnotations: userAnnotations.value,
      correctHits,
      missedAnnotations: missed,
      falsePositives,
      score,
      timeSpent: timerSeconds.value,
    }

    isSubmitting.value = false
  }

  // --- 管理后台方法 ---
  const addImage = (image: ImageItem) => {
    imageList.value.push(image)
    saveImages(imageList.value)
  }

  const removeImage = (id: string) => {
    imageList.value = imageList.value.filter((i) => i.id !== id)
    annotationList.value = annotationList.value.filter((a) => a.imageId !== id)
    saveImages(imageList.value)
    saveAnnotations(annotationList.value)
  }

  const addPresetAnnotation = (annotation: Annotation) => {
    annotationList.value.push(annotation)
    const image = imageList.value.find((i) => i.id === annotation.imageId)
    if (image) image.annotationCount++
    saveAnnotations(annotationList.value)
    saveImages(imageList.value)
  }

  const removePresetAnnotation = (id: string) => {
    const ann = annotationList.value.find((a) => a.id === id)
    if (ann) {
      const image = imageList.value.find((i) => i.id === ann.imageId)
      if (image) image.annotationCount = Math.max(0, image.annotationCount - 1)
    }
    annotationList.value = annotationList.value.filter((a) => a.id !== id)
    saveAnnotations(annotationList.value)
    saveImages(imageList.value)
  }

  const getAllImages = () => imageList.value
  const getAnnotationsForImage = (imageId: string) => annotationList.value.filter((a) => a.imageId === imageId)

  return {
    currentImage,
    userAnnotations,
    presetAnnotations,
    isSubmitting,
    result,
    timerSeconds,
    loadImage,
    addAnnotation,
    removeAnnotation,
    reset,
    startTimer,
    doSubmit,
    addImage,
    removeImage,
    addPresetAnnotation,
    removePresetAnnotation,
    getAllImages,
    getAnnotationsForImage,
  }
})
