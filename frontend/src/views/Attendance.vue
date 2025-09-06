<template>
  <div class="attendance-container">
    <el-card class="page-header">
      <div class="header-content">
        <h1>{{ $t("attendance.title") }}</h1>
        <div class="header-actions">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            :range-separator="$t('attendance.to')"
            :start-placeholder="$t('attendance.startDate')"
            :end-placeholder="$t('attendance.endDate')"
            @change="handleDateChange"
          />
          <el-button type="primary" @click="exportData">
            <el-icon><Download /></el-icon>
            {{ $t("common.export") }}
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-section">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon present">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ attendanceStats.present }}</div>
              <div class="stat-label">{{ $t("status.present") }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon late">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ attendanceStats.late }}</div>
              <div class="stat-label">{{ $t("status.late") }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon absent">
              <el-icon><Close /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ attendanceStats.absent }}</div>
              <div class="stat-label">{{ $t("status.absent") }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon leave">
              <el-icon><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ attendanceStats.leave }}</div>
              <div class="stat-label">{{ $t("status.leave") }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主要内容区域 -->
    <el-row :gutter="20" class="main-content">
      <!-- 考勤记录表格 -->
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>{{ $t("attendance.recordList") }}</span>
              <div class="header-controls">
                <el-input
                  v-model="searchQuery"
                  :placeholder="$t('attendance.searchPlaceholder')"
                  prefix-icon="Search"
                  style="width: 200px"
                  @input="handleSearch"
                />
                <el-select
                  v-model="statusFilter"
                  :placeholder="$t('attendance.statusFilter')"
                  style="width: 140px; margin-left: 10px"
                  @change="handleSearch"
                >
                  <el-option :label="$t('attendance.all')" value="all" />
                  <el-option :label="$t('status.present')" value="present" />
                  <el-option :label="$t('status.late')" value="late" />
                  <el-option :label="$t('status.absent')" value="absent" />
                  <el-option :label="$t('status.leave')" value="leave" />
                </el-select>
              </div>
            </div>
          </template>

          <el-table
            v-loading="tableLoading"
            :data="filteredAttendanceData"
            style="width: 100%"
          >
            <el-table-column
              prop="employeeId"
              :label="$t('attendance.employeeId')"
              width="80"
            />
            <el-table-column
              prop="name"
              :label="$t('attendance.name')"
              width="100"
            />
            <el-table-column
              prop="department"
              :label="$t('attendance.department')"
              width="120"
            />
            <el-table-column
              prop="date"
              :label="$t('attendance.date')"
              width="100"
            />
            <el-table-column
              prop="checkIn"
              :label="$t('attendance.checkIn')"
              width="100"
            />
            <el-table-column
              prop="checkOut"
              :label="$t('attendance.checkOut')"
              width="100"
            />
            <el-table-column
              prop="workHours"
              :label="$t('attendance.workHours')"
              width="100"
            />
            <el-table-column
              prop="status"
              :label="$t('common.status')"
              width="80"
            >
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)" size="small">
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="$t('common.operation')" width="140">
              <template #default="scope">
                <el-button
                  link
                  type="primary"
                  size="small"
                  @click="editRecord(scope.row)"
                >
                  {{ $t("common.edit") }}
                </el-button>
                <el-button
                  link
                  type="danger"
                  size="small"
                  @click="deleteRecord(scope.row)"
                >
                  {{ $t("common.delete") }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              :page-size="pageSize"
              :total="total"
              layout="total, sizes, prev, pager, next, jumper"
              :page-sizes="[10, 20, 50, 100]"
              @current-change="handlePageChange"
              @size-change="handleSizeChange"
            />
          </div>
        </el-card>
      </el-col>

      <!-- 统计图表 -->
      <el-col :span="8">
        <el-card style="margin-bottom: 20px">
          <template #header>
            <span>{{ $t("attendance.weekTrend") }}</span>
          </template>
          <div ref="weeklyChart" style="height: 200px"></div>
        </el-card>

        <el-card>
          <template #header>
            <span>{{ $t("attendance.deptStats") }}</span>
          </template>
          <div ref="departmentChart" style="height: 200px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="$t('attendance.editTitle')"
      width="500px"
    >
      <el-form :model="editForm" label-width="100px">
        <el-form-item :label="$t('attendance.employeeName')">
          <el-input v-model="editForm.name" disabled />
        </el-form-item>
        <el-form-item :label="$t('attendance.date')">
          <el-date-picker
            v-model="editForm.date"
            type="date"
            :placeholder="$t('attendance.date')"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item :label="$t('attendance.checkIn')">
          <el-time-picker
            v-model="editForm.checkIn"
            :placeholder="$t('attendance.checkIn')"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item :label="$t('attendance.checkOut')">
          <el-time-picker
            v-model="editForm.checkOut"
            :placeholder="$t('attendance.checkOut')"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item :label="$t('common.status')">
          <el-select v-model="editForm.status" style="width: 100%">
            <el-option :label="$t('status.present')" value="present" />
            <el-option :label="$t('status.late')" value="late" />
            <el-option :label="$t('status.absent')" value="absent" />
            <el-option :label="$t('status.leave')" value="leave" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">{{
            $t("common.cancel")
          }}</el-button>
          <el-button type="primary" @click="saveEdit">{{
            $t("common.save")
          }}</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useI18n } from "vue-i18n";
import * as echarts from "echarts";
import {
  getAttendanceStats,
  getAttendanceRecords,
  type AttendanceRecord,
  type AttendanceStats,
} from "@/api/attendance";

const { t } = useI18n();

// 响应式数据
const loading = ref(false);
const tableLoading = ref(false);
const dateRange = ref([]);
const searchQuery = ref("");
const statusFilter = ref("all");
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const editDialogVisible = ref(false);

// 图表实例
const weeklyChart = ref();
const departmentChart = ref();

// 考勤统计数据
const attendanceStats = reactive({
  present: 0,
  late: 0,
  absent: 0,
  leave: 0,
});

// 真实考勤数据
const attendanceRecords = ref<AttendanceRecord[]>([]);

// 编辑表单
const editForm = reactive({
  id: "",
  name: "",
  date: "",
  checkIn: "",
  checkOut: "",
  status: "present",
});

// 动态考勤数据（根据语言显示）
const attendanceData = computed(() => {
  return attendanceRecords.value.map((item) => ({
    id: item.id,
    employeeId: item.User?.employee_id || "",
    name: item.User?.name || "",
    department: item.User?.department || "",
    date: item.date,
    checkIn: item.check_in || "-",
    checkOut: item.check_out || "-",
    workHours: item.work_hours ? `${item.work_hours}${t("units.hour")}` : "-",
    status: item.status,
  }));
});

// 计算属性
const filteredAttendanceData = computed(() => {
  let filtered = attendanceData.value;

  // 搜索过滤
  if (searchQuery.value) {
    filtered = filtered.filter(
      (item) =>
        item.name.includes(searchQuery.value) ||
        item.employeeId.includes(searchQuery.value),
    );
  }

  // 状态过滤
  if (statusFilter.value !== "all") {
    filtered = filtered.filter((item) => item.status === statusFilter.value);
  }

  return filtered;
});

const totalRecords = computed(() => filteredAttendanceData.value.length);

// 方法
const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    present: "success",
    late: "warning",
    absent: "danger",
    leave: "info",
  };
  return types[status] ?? "info";
};

const getStatusText = (status: string) => {
  const texts: { [key: string]: string } = {
    present: t("status.present"),
    late: t("status.late"),
    absent: t("status.absent"),
    leave: t("status.leave"),
  };
  return texts[status] || t("common.unknown");
};

const handleDateChange = (dates: any) => {
  console.log("日期范围变更:", dates);
  currentPage.value = 1;
  fetchAttendanceRecords();
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchAttendanceRecords();
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  fetchAttendanceRecords();
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  fetchAttendanceRecords();
};

const editRecord = (row: any) => {
  Object.assign(editForm, row);
  editDialogVisible.value = true;
};

const saveEdit = () => {
  // 保存编辑逻辑
  ElMessage({ message: t("attendance.saveSuccess"), type: "success" });
  editDialogVisible.value = false;
};

const deleteRecord = (row: any) => {
  ElMessageBox.confirm(
    t("attendance.deleteConfirmMessage"),
    t("attendance.deleteConfirmTitle"),
    {
      confirmButtonText: t("common.confirm"),
      cancelButtonText: t("common.cancel"),
      type: "warning",
    },
  ).then(() => {
    // 删除逻辑
    ElMessage({ message: t("attendance.deleteSuccess"), type: "success" });
  });
};

const exportData = () => {
  ElMessage({ message: t("attendance.exportProcessing"), type: "success" });
  // 导出逻辑
};

// API调用函数
const fetchAttendanceStats = async () => {
  try {
    loading.value = true;
    const response = await getAttendanceStats();
    if (response.success) {
      Object.assign(attendanceStats, response.data);
    }
  } catch (error) {
    console.error("获取考勤统计失败:", error);
    ElMessage({ message: "获取考勤统计失败", type: "error" });
  } finally {
    loading.value = false;
  }
};

const fetchAttendanceRecords = async () => {
  try {
    tableLoading.value = true;
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value,
      status: statusFilter.value !== "all" ? statusFilter.value : undefined,
      startDate: dateRange.value?.[0]
        ? formatDate(dateRange.value[0])
        : undefined,
      endDate: dateRange.value?.[1]
        ? formatDate(dateRange.value[1])
        : undefined,
    };

    const response = await getAttendanceRecords(params);
    if (response.success) {
      attendanceRecords.value = response.data.records;
      total.value = response.data.pagination.total;
    }
  } catch (error) {
    console.error("获取考勤记录失败:", error);
    ElMessage({ message: "获取考勤记录失败", type: "error" });
  } finally {
    tableLoading.value = false;
  }
};

const formatDate = (date: Date) => {
  return date.toISOString().split("T")[0];
};

// 初始化图表
const initCharts = () => {
  nextTick(() => {
    // 本周考勤趋势图
    const weeklyChartInstance = echarts.init(weeklyChart.value);
    const weeklyOption = {
      tooltip: {
        trigger: "axis",
      },
      xAxis: {
        type: "category",
        data: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
      },
      yAxis: {
        type: "value",
      },
      series: [
        {
          name: t("attendance.seriesAttendance"),
          type: "line",
          data: [180, 175, 182, 178, 185, 90, 45],
          smooth: true,
          itemStyle: {
            color: "#409EFF",
          },
        },
      ],
    };
    weeklyChartInstance.setOption(weeklyOption);

    // 部门考勤统计图
    const departmentChartInstance = echarts.init(departmentChart.value);
    const departmentOption = {
      tooltip: {
        trigger: "item",
      },
      series: [
        {
          name: t("attendance.pieTitle"),
          type: "pie",
          radius: "60%",
          data: [
            { value: 45, name: t("attendance.departments.tech") },
            { value: 35, name: t("attendance.departments.sales") },
            { value: 25, name: t("attendance.departments.hr") },
            { value: 20, name: t("attendance.departments.finance") },
            { value: 15, name: t("attendance.departments.operations") },
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    };
    departmentChartInstance.setOption(departmentOption);
  });
};

onMounted(() => {
  initCharts();
  fetchAttendanceStats();
  fetchAttendanceRecords();
});
</script>

<style scoped>
.attendance-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.stats-section {
  margin-bottom: 20px;
}

.stat-card {
  height: 120px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  font-size: 24px;
  color: white;
}

.stat-icon.present {
  background-color: #67c23a;
}

.stat-icon.late {
  background-color: #e6a23c;
}

.stat-icon.absent {
  background-color: #f56c6c;
}

.stat-icon.leave {
  background-color: #909399;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-controls {
  display: flex;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

.main-content {
  margin-top: 20px;
}
</style>
