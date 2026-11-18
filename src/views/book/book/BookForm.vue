<template>
  <Dialog v-model="visible" :title="form.id === undefined ? '新增图书' : '编辑图书'" width="600">
    <el-form
      ref="formRef"
      v-loading="loading"
      :model="form"
      :rules="rules"
      label-width="100px"
      @submit.prevent
    >
      <el-form-item label="书名" prop="name">
        <el-input v-model.trim="form.name" placeholder="请输入书名" maxlength="200" />
      </el-form-item>
      <el-form-item label="作者" prop="author">
        <el-input v-model.trim="form.author" placeholder="请输入作者" maxlength="100" />
      </el-form-item>
      <el-form-item label="ISBN" prop="isbn">
        <el-input v-model.trim="form.isbn" placeholder="请输入ISBN" maxlength="32" />
      </el-form-item>
      <el-form-item label="出版社" prop="publisher">
        <el-input v-model.trim="form.publisher" placeholder="请输入出版社" maxlength="200" />
      </el-form-item>
      <el-form-item label="出版日期" prop="publishDate">
        <el-date-picker
          v-model="form.publishDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择出版日期"
        />
      </el-form-item>
      <el-form-item label="价格（分）" prop="price">
        <el-input-number v-model="form.price" :min="0" :max="2147483647" :precision="0" />
      </el-form-item>
      <el-form-item label="库存" prop="stock">
        <el-input-number v-model="form.stock" :min="0" :max="2147483647" :precision="0" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio :value="0">上架</el-radio>
          <el-radio :value="1">下架</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" :disabled="loading" @click="submit">确 定</el-button>
      <el-button @click="visible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import * as BookApi from '@/api/book/book'

defineOptions({ name: 'BookForm' })

const emit = defineEmits<{ success: [] }>()
const message = useMessage()
const { t } = useI18n()
const visible = ref(false)
const loading = ref(false)
const formRef = ref<FormInstance>()
const newBook = (): BookApi.BookSaveReqVO => ({
  name: '',
  author: '',
  isbn: '',
  publisher: '',
  publishDate: '',
  price: 0,
  stock: 0,
  status: 0
})
const form = ref(newBook())
const rules: FormRules<BookApi.BookSaveReqVO> = {
  name: [{ required: true, whitespace: true, message: '书名不能为空', trigger: 'blur' }],
  author: [{ required: true, whitespace: true, message: '作者不能为空', trigger: 'blur' }],
  isbn: [{ required: true, whitespace: true, message: 'ISBN不能为空', trigger: 'blur' }],
  publisher: [{ required: true, whitespace: true, message: '出版社不能为空', trigger: 'blur' }],
  publishDate: [{ required: true, message: '请选择出版日期', trigger: 'change' }],
  price: [
    {
      required: true,
      type: 'integer',
      min: 0,
      message: '请输入非负整数价格（分）',
      trigger: 'change'
    }
  ],
  stock: [
    { required: true, type: 'integer', min: 0, message: '请输入非负整数库存', trigger: 'change' }
  ],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const open = async (id?: number) => {
  form.value = { ...newBook(), id }
  visible.value = true
  formRef.value?.clearValidate()
  if (id === undefined) return
  loading.value = true
  try {
    const { name, author, isbn, publisher, publishDate, price, stock, status } =
      await BookApi.getBook(id)
    form.value = { id, name, author, isbn, publisher, publishDate, price, stock, status }
  } catch {
    visible.value = false
  } finally {
    loading.value = false
  }
}

const submit = async () => {
  if (loading.value || !(await formRef.value?.validate().catch(() => false))) return
  loading.value = true
  try {
    if (form.value.id === undefined) {
      await BookApi.createBook(form.value)
      message.success(t('common.createSuccess'))
    } else {
      await BookApi.updateBook(form.value)
      message.success(t('common.updateSuccess'))
    }
    visible.value = false
    emit('success')
  } catch {
    // 请求层已显示后端错误，保留表单供用户修改。
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>
