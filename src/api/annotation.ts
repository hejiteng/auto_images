import request from '@/utils/request'
import type { Annotation } from '@/types/annotation'

export const getAnnotationList = (imageId: string) =>
  request.get(`/annotations`, { params: { imageId } })

export const createAnnotation = (data: Omit<Annotation, 'id'>) =>
  request.post('/annotations', data)
