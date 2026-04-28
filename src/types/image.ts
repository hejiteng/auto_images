export interface ImageItem {
  id: string
  url: string
  projectName: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  description?: string
  uploadTime: string
  annotationCount: number
}
