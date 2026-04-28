import request from '@/utils/request'

export const getImageList = (params: {
  project?: string
  category?: string
  difficulty?: string
  page: number
  pageSize: number
}) => request.get('/images', { params })

export const getImageDetail = (id: string) =>
  request.get(`/images/${id}`)

export const getRandomImage = (params: {
  project?: string
  difficulty?: string
}) => request.get('/images/random', { params })
