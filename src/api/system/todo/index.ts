import request from '@/config/axios'

export interface TodoVO {
  id?: number
  userId?: number
  title: string
  content?: string
  priority: number
  status: number
  deadline?: number
  finishTime?: number
  remark?: string
  createTime?: number
}

export interface TodoStatusCountVO {
  pendingCount: number
  processingCount: number
  finishedCount: number
  totalCount: number
}

// 查询个人待办分页
export const getTodoPage = async (params: PageParam) => {
  return await request.get({ url: '/system/todo/page', params })
}

// 查询个人待办详情
export const getTodo = async (id: number) => {
  return await request.get({ url: '/system/todo/get?id=' + id })
}

// 新增个人待办
export const createTodo = async (data: TodoVO) => {
  return await request.post({ url: '/system/todo/create', data })
}

// 修改个人待办
export const updateTodo = async (data: TodoVO) => {
  return await request.put({ url: '/system/todo/update', data })
}

// 变更个人待办状态
export const updateTodoStatus = async (id: number, status: number) => {
  return await request.put({ url: '/system/todo/update-status', data: { id, status } })
}

// 删除个人待办
export const deleteTodo = async (id: number) => {
  return await request.delete({ url: '/system/todo/delete?id=' + id })
}

// 查询我的待办按状态统计
export const getTodoStatusCount = async () => {
  return await request.get({ url: '/system/todo/status-count' })
}