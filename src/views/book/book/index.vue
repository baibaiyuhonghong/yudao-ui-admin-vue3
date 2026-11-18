<template>
  <ContentWrap>
    <el-form ref="queryForm" :model="query" inline label-width="80px">
      <el-form-item label="书名" prop="name">
        <el-input
          v-model.trim="query.name"
          placeholder="请输入书名"
          clearable
          @keyup.enter="search"
        />
      </el-form-item>
      <el-form-item label="作者" prop="author">
        <el-input
          v-model.trim="query.author"
          placeholder="请输入作者"
          clearable
          @keyup.enter="search"
        />
      </el-form-item>
      <el-form-item label="ISBN" prop="isbn">
        <el-input
          v-model.trim="query.isbn"
          placeholder="请输入ISBN"
          clearable
          @keyup.enter="search"
        />
      </el-form-item>
      <el-form-item label="出版社" prop="publisher">
        <el-input
          v-model.trim="query.publisher"
          placeholder="请输入出版社"
          clearable
          @keyup.enter="search"
        />
      </el-form-item>
      <el-form-item label="出版日期" prop="publishDate">
        <el-date-picker
          v-model="query.publishDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择出版日期"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="query.status" placeholder="请选择状态" clearable class="!w-160px">
          <el-option label="上架" :value="0" />
          <el-option label="下架" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="search" v-hasPermi="['book:book:query']"
          ><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button
        >
        <el-button @click="reset" v-hasPermi="['book:book:query']"
          ><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button
        >
        <el-button type="primary" plain @click="form?.open()" v-hasPermi="['book:book:create']"
          ><Icon icon="ep:plus" class="mr-5px" /> 新增</el-button
        >
        <el-button
          type="success"
          plain
          :loading="exportLoading"
          @click="handleExport"
          v-hasPermi="['book:book:export']"
          ><Icon icon="ep:download" class="mr-5px" /> 导出</el-button
        >
      </el-form-item>
    </el-form>
  </ContentWrap>
  <ContentWrap>
    <el-table v-loading="loading" :data="books" row-key="id">
      <el-table-column label="编号" prop="id" width="80" />
      <el-table-column label="书名" prop="name" min-width="130" show-overflow-tooltip />
      <el-table-column label="作者" prop="author" min-width="130" show-overflow-tooltip />
      <el-table-column label="ISBN" prop="isbn" min-width="155" show-overflow-tooltip />
      <el-table-column label="出版社" prop="publisher" min-width="130" show-overflow-tooltip />
      <el-table-column label="出版日期" prop="publishDate" width="120" />
      <el-table-column label="价格（分）" prop="price" width="105" />
      <el-table-column label="库存" prop="stock" width="80" />
      <el-table-column label="状态" prop="status" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 0 ? 'success' : 'info'">{{
            row.status === 0 ? '上架' : '下架'
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" prop="createTime" :formatter="dateFormatter" width="180" />
      <el-table-column label="操作" width="135" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            @click="form?.open(row.id)"
            v-hasPermi="['book:book:update']"
            >编辑</el-button
          >
          <el-button
            link
            type="danger"
            @click="handleDelete(row.id)"
            v-hasPermi="['book:book:delete']"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      v-model:page="query.pageNo"
      v-model:limit="query.pageSize"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>
  <BookForm ref="form" @success="getList" />
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import * as BookApi from '@/api/book/book'
import download from '@/utils/download'
import { dateFormatter } from '@/utils/formatTime'
import BookForm from './BookForm.vue'

defineOptions({ name: 'BookBook' })

const message = useMessage()
const { t } = useI18n()
const loading = ref(false)
const exportLoading = ref(false)
const books = ref<BookApi.BookRespVO[]>([])
const total = ref(0)
const query = reactive<BookApi.BookPageReqVO>({
  pageNo: 1,
  pageSize: 10,
  name: '',
  author: '',
  isbn: '',
  publisher: '',
  publishDate: '',
  status: undefined
})
const queryForm = ref<FormInstance>()
const form = ref<InstanceType<typeof BookForm>>()

const getList = async () => {
  loading.value = true
  try {
    const data = await BookApi.getBookPage(query)
    books.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const search = () => {
  query.pageNo = 1
  return getList()
}

const reset = () => {
  queryForm.value?.resetFields()
  return search()
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
  } catch {
    return
  }
  await BookApi.deleteBook(id)
  message.success(t('common.delSuccess'))
  if (books.value.length === 1 && query.pageNo > 1) query.pageNo--
  await getList()
}

const handleExport = async () => {
  try {
    await message.exportConfirm()
  } catch {
    return
  }
  exportLoading.value = true
  try {
    download.excel(await BookApi.exportBook(query), '图书.xlsx')
  } finally {
    exportLoading.value = false
  }
}

onMounted(getList)
</script>
