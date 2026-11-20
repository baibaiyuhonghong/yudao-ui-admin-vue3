<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="标题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入标题"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.SYSTEM_TODO_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="优先级" prop="priority">
        <el-select
          v-model="queryParams.priority"
          placeholder="请选择优先级"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.SYSTEM_TODO_PRIORITY)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['system:todo:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 按状态统计：点击即筛选 -->
  <ContentWrap>
    <div class="flex items-center gap-24px">
      <span class="text-14px text-gray-500">我的待办</span>
      <el-button link :type="queryParams.status === undefined ? 'primary' : ''" @click="filterByStatus(undefined)">
        全部 {{ statusCount.totalCount }}
      </el-button>
      <el-button link :type="queryParams.status === 0 ? 'primary' : ''" @click="filterByStatus(0)">
        待处理 {{ statusCount.pendingCount }}
      </el-button>
      <el-button link :type="queryParams.status === 1 ? 'primary' : ''" @click="filterByStatus(1)">
        进行中 {{ statusCount.processingCount }}
      </el-button>
      <el-button link :type="queryParams.status === FINISHED_STATUS ? 'primary' : ''" @click="filterByStatus(FINISHED_STATUS)">
        已完成 {{ statusCount.finishedCount }}
      </el-button>
    </div>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="编号" align="center" prop="id" width="80" />
      <el-table-column label="标题" align="center" prop="title" min-width="180" show-overflow-tooltip>
        <template #default="scope">
          <span :class="isOverdue(scope.row) ? 'text-red-500 font-bold' : ''">
            {{ scope.row.title }}
          </span>
          <el-tag v-if="isOverdue(scope.row)" type="danger" size="small" class="ml-5px">已逾期</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="优先级" align="center" prop="priority" width="90">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.SYSTEM_TODO_PRIORITY" :value="scope.row.priority" />
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.SYSTEM_TODO_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="截止时间" align="center" prop="deadline" width="180">
        <template #default="scope">
          <span :class="isOverdue(scope.row) ? 'text-red-500 font-bold' : ''">
            {{ scope.row.deadline ? formatDate(scope.row.deadline) : '-' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column
        label="完成时间"
        align="center"
        prop="finishTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="备注" align="center" prop="remark" min-width="150" show-overflow-tooltip />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" align="center" width="180" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['system:todo:update']"
          >
            编辑
          </el-button>
          <el-button
            v-if="scope.row.status !== FINISHED_STATUS"
            link
            type="success"
            @click="handleUpdateStatus(scope.row.id, FINISHED_STATUS)"
            v-hasPermi="['system:todo:update']"
          >
            完成
          </el-button>
          <el-button
            v-else
            link
            type="warning"
            @click="handleUpdateStatus(scope.row.id, 0)"
            v-hasPermi="['system:todo:update']"
          >
            重开
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['system:todo:delete']"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <TodoForm ref="formRef" @success="refresh" />
</template>
<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter, formatDate } from '@/utils/formatTime'
import * as TodoApi from '@/api/system/todo'
import TodoForm from './TodoForm.vue'

defineOptions({ name: 'SystemTodo' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const FINISHED_STATUS = 2 // system_todo_status 字典：已完成

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref<TodoApi.TodoVO[]>([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  title: '',
  status: undefined as number | undefined,
  priority: undefined as number | undefined
})
const queryFormRef = ref() // 搜索的表单
const statusCount = ref<TodoApi.TodoStatusCountVO>({
  pendingCount: 0,
  processingCount: 0,
  finishedCount: 0,
  totalCount: 0
})

/** 已逾期：截止时间已过且状态不是已完成 */
const isOverdue = (row: TodoApi.TodoVO) =>
  !!row.deadline && row.status !== FINISHED_STATUS && Number(row.deadline) < Date.now()

/** 查询个人待办列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await TodoApi.getTodoPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 查询按状态统计 */
const getStatusCount = async () => {
  statusCount.value = await TodoApi.getTodoStatusCount()
}

/** 列表与统计一起刷新 */
const refresh = async () => {
  await Promise.all([getList(), getStatusCount()])
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 点击统计项筛选状态 */
const filterByStatus = (status?: number) => {
  queryParams.status = status
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 状态变更操作 */
const handleUpdateStatus = async (id: number, status: number) => {
  try {
    await TodoApi.updateTodoStatus(id, status)
    message.success(t('common.updateSuccess'))
    await refresh()
  } catch {}
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await TodoApi.deleteTodo(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await refresh()
  } catch {}
}

/** 初始化 **/
onMounted(() => {
  refresh()
})
</script>