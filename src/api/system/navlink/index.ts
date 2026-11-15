import request from '@/config/axios'

export interface NavLinkVO {
  id?: number
  name: string
  url: string
  category: number
  icon: string
  sort: number
  status: number
  remark: string
  createTime?: Date
}

// 查询常用网址导航列表
export const getNavLinkPage = async (params: PageParam) => {
  return await request.get({ url: '/system/nav-link/page', params })
}

// 查询常用网址导航详情
export const getNavLink = async (id: number) => {
  return await request.get({ url: '/system/nav-link/get?id=' + id })
}

// 新增常用网址导航
export const createNavLink = async (data: NavLinkVO) => {
  return await request.post({ url: '/system/nav-link/create', data })
}

// 修改常用网址导航
export const updateNavLink = async (data: NavLinkVO) => {
  return await request.put({ url: '/system/nav-link/update', data })
}

// 删除常用网址导航
export const deleteNavLink = async (id: number) => {
  return await request.delete({ url: '/system/nav-link/delete?id=' + id })
}

// 批量删除常用网址导航
export const deleteNavLinkList = async (ids: number[]) => {
  return await request.delete({ url: '/system/nav-link/delete-list', params: { ids: ids.join(',') } })
}

// 导出常用网址导航
export const exportNavLink = async (params) => {
  return await request.download({ url: '/system/nav-link/export-excel', params })
}
