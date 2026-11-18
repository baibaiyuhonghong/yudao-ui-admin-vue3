import request from '@/config/axios'

export interface BookSaveReqVO {
  id?: number
  name: string
  author: string
  isbn: string
  publisher: string
  publishDate: string
  price: number
  stock: number
  status: 0 | 1
}

export interface BookRespVO extends BookSaveReqVO {
  id: number
  createTime: number
}

export interface BookPageReqVO extends PageParam {
  name?: string
  author?: string
  isbn?: string
  publisher?: string
  publishDate?: string
  status?: BookSaveReqVO['status']
}

const url = '/book/book'

export const getBookPage = (params: BookPageReqVO) =>
  request.get<{ list: BookRespVO[]; total: number }>({ url: url + '/page', params })
export const getBook = (id: number) =>
  request.get<BookRespVO>({ url: url + '/get', params: { id } })
export const createBook = (data: BookSaveReqVO) =>
  request.post<number>({ url: url + '/create', data })
export const updateBook = (data: BookSaveReqVO) =>
  request.put<boolean>({ url: url + '/update', data })
export const deleteBook = (id: number) =>
  request.delete<boolean>({ url: url + '/delete', params: { id } })
export const exportBook = (params: BookPageReqVO) =>
  request.download<Blob>({ url: url + '/export-excel', params })
