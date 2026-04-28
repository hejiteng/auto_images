import request from '@/utils/request'

export const getHistory = (params: {
  page: number
  pageSize: number
}) => request.get('/records', { params })

export const getStats = () => request.get('/records/stats')
