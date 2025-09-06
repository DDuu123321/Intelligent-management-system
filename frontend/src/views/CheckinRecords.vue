<template>
  <div class="checkin-records">
    <div class="page-header">
      <h2>{{ $t("checkinRecords.title") }}</h2>
      <div class="header-actions">
        <el-button
          type="primary"
          :loading="exporting"
          icon="Download"
          @click="exportRecords"
        >
          {{ $t("checkinRecords.export") }}
        </el-button>
        <el-button :loading="loading" icon="Refresh" @click="refreshData">
          {{ $t("common.refresh") }}
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filters" inline class="filter-form">
        <el-form-item :label="$t('checkinRecords.search')">
          <el-input
            v-model="filters.search"
            :placeholder="$t('checkinRecords.searchPlaceholder')"
            style="width: 200px"
            clearable
            @keyup.enter="searchRecords"
          />
        </el-form-item>

        <el-form-item :label="$t('checkinRecords.employee')">
          <el-select
            v-model="filters.employee_id"
            :placeholder="$t('checkinRecords.selectEmployee')"
            style="width: 200px"
            clearable
            filterable
          >
            <el-option
              v-for="employee in employees"
              :key="employee.employee_id"
              :label="
                `${(employee.first_name || '').trim()} ${(employee.last_name || '').trim()}`.trim() +
                (employee.phone ? ` (${employee.phone})` : '')
              "
              :value="employee.employee_id"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('checkinRecords.worksite')">
          <el-select
            v-model="filters.worksite_id"
            :placeholder="$t('checkinRecords.selectWorksite')"
            style="width: 200px"
            clearable
          >
            <el-option
              v-for="worksite in worksites"
              :key="worksite.worksite_id"
              :label="worksite.name"
              :value="worksite.worksite_id"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('checkinRecords.type')">
          <el-select
            v-model="filters.checkin_type"
            :placeholder="$t('checkinRecords.selectType')"
            style="width: 120px"
            clearable
          >
            <el-option :label="$t('checkinRecords.checkinIn')" value="in" />
            <el-option :label="$t('checkinRecords.checkinOut')" value="out" />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('checkinRecords.status')">
          <el-select
            v-model="filters.status"
            :placeholder="$t('checkinRecords.selectStatus')"
            style="width: 120px"
            clearable
          >
            <el-option :label="$t('checkinRecords.success')" value="success" />
            <el-option :label="$t('checkinRecords.failed')" value="failed" />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('checkinRecords.dateRange')">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            :range-separator="$t('common.to')"
            :start-placeholder="$t('common.startDate')"
            :end-placeholder="$t('common.endDate')"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" icon="Search" @click="searchRecords">
            {{ $t("common.search") }}
          </el-button>
          <el-button icon="Refresh" @click="resetFilters">
            {{ $t("common.reset") }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 签到记录表格 -->
    <el-card shadow="never">
      <el-table
        v-loading="loading"
        :data="records"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column :label="$t('checkinRecords.employee')" min-width="120">
          <template #default="{ row }">
            <div class="employee-info">
              <div class="name">{{ row.employee_name }}</div>
              <div class="phone">{{ row.phone_number }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          :label="$t('checkinRecords.worksite')"
          prop="worksite_name"
          min-width="120"
        />

        <el-table-column
          :label="$t('checkinRecords.type')"
          width="80"
          align="center"
        >
          <template #default="{ row }">
            <el-tag :type="row.checkin_type === 'in' ? 'success' : 'warning'">
              {{
                row.checkin_type === "in"
                  ? $t("checkinRecords.checkinIn")
                  : $t("checkinRecords.checkinOut")
              }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="$t('checkinRecords.time')" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.checkin_time) }}
          </template>
        </el-table-column>

        <el-table-column :label="$t('checkinRecords.location')" min-width="200">
          <template #default="{ row }">
            <div v-if="row.address" class="location-info">
              <div class="address">{{ row.address }}</div>
              <div v-if="row.latitude && row.longitude" class="coordinates">
                {{ row.latitude.toFixed(6) }}, {{ row.longitude.toFixed(6) }}
              </div>
            </div>
            <span v-else class="text-gray-400">{{ $t("common.noData") }}</span>
          </template>
        </el-table-column>

        <el-table-column
          :label="$t('checkinRecords.photo')"
          width="80"
          align="center"
        >
          <template #default="{ row }">
            <el-button
              v-if="row.photo_data"
              size="small"
              type="primary"
              text
              icon="Picture"
              @click="viewPhoto(row.photo_data)"
            >
              {{ $t("checkinRecords.viewPhoto") }}
            </el-button>
            <span v-else class="text-gray-400">{{ $t("common.noData") }}</span>
          </template>
        </el-table-column>

        <el-table-column
          :label="$t('checkinRecords.status')"
          width="80"
          align="center"
        >
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'">
              {{
                row.status === "success"
                  ? $t("checkinRecords.success")
                  : $t("checkinRecords.failed")
              }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          :label="$t('common.actions')"
          width="120"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              size="small"
              type="primary"
              text
              icon="View"
              @click="viewDetails(row)"
            >
              {{ $t("common.details") }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="$t('checkinRecords.details')"
      width="600px"
      @closed="selectedRecord = null"
    >
      <div v-if="selectedRecord" class="record-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item :label="$t('checkinRecords.employee')">
            {{ selectedRecord.employee_name }}
          </el-descriptions-item>
          <el-descriptions-item :label="$t('checkinRecords.phone')">
            {{ selectedRecord.phone_number }}
          </el-descriptions-item>
          <el-descriptions-item :label="$t('checkinRecords.worksite')">
            {{ selectedRecord.worksite_name }}
          </el-descriptions-item>
          <el-descriptions-item :label="$t('checkinRecords.type')">
            <el-tag
              :type="
                selectedRecord.checkin_type === 'in' ? 'success' : 'warning'
              "
            >
              {{
                selectedRecord.checkin_type === "in"
                  ? $t("checkinRecords.checkinIn")
                  : $t("checkinRecords.checkinOut")
              }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('checkinRecords.time')">
            {{ formatDateTime(selectedRecord.checkin_time) }}
          </el-descriptions-item>
          <el-descriptions-item :label="$t('checkinRecords.status')">
            <el-tag
              :type="selectedRecord.status === 'success' ? 'success' : 'danger'"
            >
              {{
                selectedRecord.status === "success"
                  ? $t("checkinRecords.success")
                  : $t("checkinRecords.failed")
              }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('checkinRecords.address')" :span="2">
            {{ selectedRecord.address || $t("common.noData") }}
          </el-descriptions-item>
          <el-descriptions-item
            :label="$t('checkinRecords.coordinates')"
            :span="2"
          >
            <span v-if="selectedRecord.latitude && selectedRecord.longitude">
              {{ selectedRecord.latitude.toFixed(6) }},
              {{ selectedRecord.longitude.toFixed(6) }} ({{
                $t("checkinRecords.accuracy")
              }}: {{ selectedRecord.location_accuracy }}m)
            </span>
            <span v-else>{{ $t("common.noData") }}</span>
          </el-descriptions-item>
          <el-descriptions-item
            :label="$t('checkinRecords.deviceInfo')"
            :span="2"
          >
            <div v-if="selectedRecord.device_info" class="device-info">
              <div>
                {{ $t("checkinRecords.deviceId") }}:
                {{ selectedRecord.device_info.device_id }}
              </div>
              <div>
                {{ $t("checkinRecords.deviceType") }}:
                {{ selectedRecord.device_info.device_type }}
              </div>
              <div>
                {{ $t("checkinRecords.appVersion") }}:
                {{ selectedRecord.device_info.app_version }}
              </div>
            </div>
            <span v-else>{{ $t("common.noData") }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 签到照片 -->
        <div v-if="selectedRecord.photo_data" class="photo-section">
          <h4>{{ $t("checkinRecords.checkinPhoto") }}</h4>
          <el-image
            :src="selectedRecord.photo_data"
            :preview-src-list="[selectedRecord.photo_data]"
            fit="contain"
            style="width: 100%; max-height: 300px"
            preview-teleported
          />
        </div>
      </div>
    </el-dialog>

    <!-- 照片查看对话框 -->
    <el-dialog
      v-model="photoDialogVisible"
      :title="$t('checkinRecords.checkinPhoto')"
      width="500px"
    >
      <el-image
        v-if="currentPhoto"
        :src="currentPhoto"
        :preview-src-list="[currentPhoto]"
        fit="contain"
        style="width: 100%"
        preview-teleported
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getCheckinRecords,
  exportCheckinRecords,
  type CheckinRecord,
  type CheckinRecordsQuery,
} from "@/api/checkin-records";
import { getEmployees } from "@/api/employees";
import { getWorksites } from "@/api/worksites";
import { formatDateTime } from "@/utils/date";

// 响应式数据
const loading = ref(false);
const exporting = ref(false);
const records = ref<CheckinRecord[]>([]);
const employees = ref<any[]>([]);
const worksites = ref<any[]>([]);
const selectedRecords = ref<CheckinRecord[]>([]);
const detailDialogVisible = ref(false);
const photoDialogVisible = ref(false);
const selectedRecord = ref<CheckinRecord | null>(null);
const currentPhoto = ref<string>("");
const dateRange = ref<[string, string] | null>(null);

// 筛选条件
const filters = reactive<CheckinRecordsQuery>({
  search: "",
  employee_id: "",
  worksite_id: "",
  checkin_type: undefined,
  status: undefined,
});

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
});

// 计算属性
const searchParams = computed(() => {
  const params: CheckinRecordsQuery = {
    page: pagination.page,
    limit: pagination.limit,
    ...filters,
  };

  // 处理日期范围
  if (dateRange.value) {
    params.start_date = dateRange.value[0];
    params.end_date = dateRange.value[1];
  }

  // 移除空值
  Object.keys(params).forEach((key) => {
    if (
      params[key as keyof CheckinRecordsQuery] === "" ||
      params[key as keyof CheckinRecordsQuery] === undefined
    ) {
      delete params[key as keyof CheckinRecordsQuery];
    }
  });

  return params;
});

// 方法
const loadData = async () => {
  loading.value = true;
  try {
    const response = await getCheckinRecords(searchParams.value);
    records.value = response.data.records;
    pagination.total = response.data.total;
  } catch (error) {
    console.error("获取签到记录失败:", error);
    ElMessage({ message: "获取签到记录失败", type: "error" });
  } finally {
    loading.value = false;
  }
};

const loadEmployees = async () => {
  try {
    const response = await getEmployees({ page: 1, limit: 1000 });
    employees.value = response.data.employees;
  } catch (error) {
    console.error("获取员工列表失败:", error);
  }
};

const loadWorksites = async () => {
  try {
    const response = await getWorksites({ page: 1, limit: 1000 });
    worksites.value = response.data.worksites;
  } catch (error) {
    console.error("获取工地列表失败:", error);
  }
};

const searchRecords = () => {
  pagination.page = 1;
  loadData();
};

const resetFilters = () => {
  Object.assign(filters, {
    search: "",
    employee_id: "",
    worksite_id: "",
    checkin_type: undefined,
    status: undefined,
  });
  dateRange.value = null;
  searchRecords();
};

const refreshData = () => {
  loadData();
};

const handleSizeChange = (size: number) => {
  pagination.limit = size;
  pagination.page = 1;
  loadData();
};

const handleCurrentChange = (page: number) => {
  pagination.page = page;
  loadData();
};

const handleSelectionChange = (selection: CheckinRecord[]) => {
  selectedRecords.value = selection;
};

const viewDetails = (record: CheckinRecord) => {
  selectedRecord.value = record;
  detailDialogVisible.value = true;
};

const viewPhoto = (photoData: string) => {
  currentPhoto.value = photoData;
  photoDialogVisible.value = true;
};

const exportRecords = async () => {
  try {
    await ElMessageBox.confirm(
      "确定要导出当前筛选条件下的所有签到记录吗？",
      "导出确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    exporting.value = true;
    const blob = await exportCheckinRecords(searchParams.value);

    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `签到记录_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    ElMessage({ message: "导出成功", type: "success" });
  } catch (error) {
    if (error !== "cancel") {
      console.error("导出失败:", error);
      ElMessage({ message: "导出失败", type: "error" });
    }
  } finally {
    exporting.value = false;
  }
};

// 监听搜索参数变化
watch(
  () => searchParams.value,
  () => {
    loadData();
  },
  { deep: true },
);

// 生命周期
onMounted(() => {
  loadData();
  loadEmployees();
  loadWorksites();
});
</script>

<style scoped>
.checkin-records {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.employee-info .name {
  font-weight: 500;
  color: #303133;
}

.employee-info .phone {
  font-size: 12px;
  color: #909399;
}

.location-info .address {
  font-size: 14px;
  color: #303133;
}

.location-info .coordinates {
  font-size: 12px;
  color: #909399;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.record-details {
  max-height: 70vh;
  overflow-y: auto;
}

.photo-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.photo-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.device-info > div {
  margin-bottom: 4px;
  color: #606266;
  font-size: 14px;
}

.text-gray-400 {
  color: #c0c4cc;
}
</style>
