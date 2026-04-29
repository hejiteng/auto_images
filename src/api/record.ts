import request from '@/utils/request'
import type { UserAnnotation } from '@/types/annotation'

export const submitAnswer = (data: {
  imageId: string
  annotations: UserAnnotation[]
  duration: number
}) => request.post('/practice/submit', data)

export const getPracticeResult = (recordId: string) =>
  request.get(`/practice/result/${recordId}`)
