<template>
  <div class="employee-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">{{ $t("employee.management") }}</h1>
        <p class="page-subtitle">
          {{
            $t("employee.management.subtitle") ||
            "Manage and view all employee information"
          }}
        </p>
      </div>
      <div class="header-right">
        <el-button
          v-permission="'EMPLOYEE_CREATE'"
          type="primary"
          size="default"
          class="action-button"
          @click="showAddDialog"
        >
          <el-icon><Plus /></el-icon>
          {{ $t("employee.add") }}
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选卡片 -->
    <el-card class="filter-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon><Search /></el-icon>
            <span>{{ $t("common.filter") || "Filter Criteria" }}</span>
          </div>
          <el-button text type="primary" @click="toggleFilterExpanded">
            <el-icon :class="{ 'rotate-180': filterExpanded }"
              ><ArrowDown
            /></el-icon>
          </el-button>
        </div>
      </template>

      <el-collapse-transition>
        <div v-show="filterExpanded" class="filter-content">
          <el-row :gutter="20" class="filter-row">
            <el-col :lg="6" :md="8" :sm="12" :xs="24">
              <div class="filter-item">
                <label class="filter-label">{{ $t("common.search") }}</label>
                <el-input
                  v-model="searchQuery"
                  :placeholder="$t('employee.searchPlaceholder')"
                  clearable
                  size="default"
                  @change="loadEmployees"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </div>
            </el-col>
            <el-col :lg="4" :md="6" :sm="12" :xs="24">
              <div class="filter-item">
                <label class="filter-label">{{ $t("employee.status") }}</label>
                <el-select
                  v-model="statusFilter"
                  :placeholder="$t('employee.status')"
                  clearable
                  class="full-width"
                  @change="loadEmployees"
                >
                  <el-option :label="$t('status.active')" value="active" />
                  <el-option :label="$t('status.inactive')" value="inactive" />
                  <el-option
                    :label="$t('status.suspended')"
                    value="suspended"
                  />
                </el-select>
              </div>
            </el-col>
            <el-col :lg="4" :md="6" :sm="12" :xs="24">
              <div class="filter-item">
                <label class="filter-label">{{
                  $t("employee.department")
                }}</label>
                <el-select
                  v-model="departmentFilter"
                  :placeholder="$t('employee.department')"
                  clearable
                  class="full-width"
                  @change="loadEmployees"
                >
                  <el-option
                    :label="$t('department.construction')"
                    value="Construction"
                  />
                  <el-option
                    :label="$t('department.electrical')"
                    value="Electrical"
                  />
                  <el-option :label="$t('department.safety')" value="Safety" />
                  <el-option
                    :label="$t('department.management')"
                    value="Management"
                  />
                </el-select>
              </div>
            </el-col>
            <el-col :lg="4" :md="6" :sm="12" :xs="24">
              <div class="filter-item">
                <label class="filter-label">{{
                  $t("employee.worksite")
                }}</label>
                <el-select
                  v-model="worksiteFilter"
                  :placeholder="$t('employee.worksite')"
                  clearable
                  class="full-width"
                  @change="loadEmployees"
                >
                  <el-option
                    v-for="site in worksites"
                    :key="site.worksite_id"
                    :label="site.name"
                    :value="site.worksite_id"
                  />
                </el-select>
              </div>
            </el-col>
            <el-col :lg="6" :md="8" :sm="24" :xs="24">
              <div class="filter-actions">
                <el-button :icon="RefreshRight" @click="resetFilters">{{
                  $t("common.reset")
                }}</el-button>
                <el-button
                  type="primary"
                  :icon="Search"
                  @click="loadEmployees"
                  >{{ $t("common.search") }}</el-button
                >
              </div>
            </el-col>
          </el-row>
        </div>
      </el-collapse-transition>
    </el-card>

    <!-- 员工列表 -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="table-header">
          <div class="header-title">
            <el-icon><User /></el-icon>
            <span>{{ $t("employee.list") || "Employee List" }}</span>
            <el-tag v-if="employees.length > 0" type="info" class="count-tag">{{
              employees.length
            }}</el-tag>
          </div>
          <div class="table-actions">
            <el-button-group>
              <el-button
                :icon="Grid"
                size="small"
                :type="viewMode === 'table' ? 'primary' : ''"
                @click="viewMode = 'table'"
              >
                {{ $t("common.table") || "Table" }}
              </el-button>
              <el-button
                :icon="Menu"
                size="small"
                :type="viewMode === 'card' ? 'primary' : ''"
                @click="viewMode = 'card'"
              >
                {{ $t("common.card") || "Card" }}
              </el-button>
            </el-button-group>
          </div>
        </div>
      </template>

      <div v-if="viewMode === 'table'">
        <el-table
          v-loading="loading"
          :data="employees"
          class="employee-table"
          @row-click="viewEmployee"
        >
          <el-table-column
            prop="employee_id"
            :label="$t('employee.id')"
            width="120"
          />
          <el-table-column :label="$t('employee.name')" width="150">
            <template #default="{ row }">
              {{ `${row.first_name || ""} ${row.last_name || ""}`.trim() }}
            </template>
          </el-table-column>
          <el-table-column
            prop="department_id"
            :label="$t('employee.department')"
            width="120"
          >
            <template #default="{ row }">
              <span v-if="row.department_id">{{
                getDepartmentName(row.department_id)
              }}</span>
              <span v-else class="text-muted">{{ $t("common.notSet") }}</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="position"
            :label="$t('employee.position')"
            width="150"
          />
          <el-table-column
            prop="phone"
            :label="$t('employee.phone')"
            width="120"
          />
          <el-table-column :label="$t('employee.whiteCard')" width="120">
            <template #default="{ row }">
              <el-tag
                :type="
                  isWhiteCardValid(row.white_card_expiry) ? 'success' : 'danger'
                "
              >
                {{ formatDate(row.white_card_expiry) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="status"
            :label="$t('employee.status')"
            width="100"
          >
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ $t(`status.${row.status}`) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('employee.canCheckin')" width="80">
            <template #default="{ row }">
              <el-icon :color="row.can_checkin ? '#67C23A' : '#F56C6C'">
                <Check v-if="row.can_checkin" />
                <Close v-else />
              </el-icon>
            </template>
          </el-table-column>
          <el-table-column
            :label="$t('common.actions')"
            width="200"
            fixed="right"
          >
            <template #default="{ row }">
              <el-button size="small" @click="viewEmployee(row)">{{
                $t("common.view")
              }}</el-button>
              <el-button
                v-permission="'EMPLOYEE_EDIT'"
                size="small"
                type="primary"
                @click="editEmployee(row)"
                >{{ $t("common.edit") }}</el-button
              >
              <el-button
                v-permission="'EMPLOYEE_DELETE'"
                size="small"
                type="danger"
                @click="handleDeleteEmployee(row)"
                >{{ $t("common.delete") }}</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 卡片视图 -->
      <div v-else class="card-view">
        <div class="employee-cards">
          <div
            v-for="employee in employees"
            :key="employee.id"
            class="employee-card"
            @click="viewEmployee(employee)"
          >
            <div class="card-avatar">
              <el-avatar :size="60" :src="employee.profile_photo">
                <el-icon><User /></el-icon>
              </el-avatar>
              <div class="status-badge" :class="employee.status">
                <el-icon
                  ><Check v-if="employee.status === 'active'" /><Warning v-else
                /></el-icon>
              </div>
            </div>
            <div class="card-content">
              <h3 class="employee-name">
                {{
                  `${employee.first_name || ""} ${employee.last_name || ""}`.trim()
                }}
              </h3>
              <p class="employee-position">{{ employee.position }}</p>
              <p class="employee-department">
                {{ getDepartmentName(employee.department_id) }}
              </p>
              <div class="card-tags">
                <el-tag :type="getStatusType(employee.status)" size="small">
                  {{ $t(`status.${employee.status}`) }}
                </el-tag>
                <el-tag v-if="employee.can_checkin" type="success" size="small">
                  {{ $t("employee.canCheckin") || "Can Check-in" }}
                </el-tag>
              </div>
            </div>
            <div class="card-actions">
              <el-button
                size="small"
                circle
                :icon="View"
                @click.stop="viewEmployee(employee)"
              />
              <el-button
                v-permission="'EMPLOYEE_EDIT'"
                size="small"
                circle
                :icon="Edit"
                type="primary"
                @click.stop="editEmployee(employee)"
              />
              <el-button
                v-permission="'EMPLOYEE_DELETE'"
                size="small"
                circle
                :icon="Delete"
                type="danger"
                @click.stop="handleDeleteEmployee(employee)"
              />
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :total="totalEmployees"
      layout="total, sizes, prev, pager, next, jumper"
      style="margin-top: 20px; text-align: center"
      @size-change="loadEmployees"
      @current-change="loadEmployees"
    />

    <!-- 添加/编辑员工对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="employeeFormRef"
        :model="employeeForm"
        :rules="formRules"
        label-width="150px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('employee.id')" prop="employee_id">
              <el-input v-model="employeeForm.employee_id" :disabled="isEdit" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('employee.status')" prop="status">
              <el-select v-model="employeeForm.status" style="width: 100%">
                <el-option :label="$t('status.active')" value="active" />
                <el-option :label="$t('status.inactive')" value="inactive" />
                <el-option :label="$t('status.suspended')" value="suspended" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('employee.firstName')" prop="first_name">
              <el-input v-model="employeeForm.first_name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('employee.lastName')" prop="last_name">
              <el-input v-model="employeeForm.last_name" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('employee.email')" prop="email">
              <el-input v-model="employeeForm.email" type="email" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('employee.phone')" prop="phone">
              <el-input v-model="employeeForm.phone" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item
              :label="$t('employee.dateOfBirth')"
              prop="date_of_birth"
            >
              <el-date-picker
                v-model="employeeForm.date_of_birth"
                type="date"
                style="width: 100%"
                :placeholder="$t('employee.selectDate')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('employee.visaStatus')" prop="visa_status">
              <el-select v-model="employeeForm.visa_status" style="width: 100%">
                <el-option :label="$t('visa.citizen')" value="citizen" />
                <el-option
                  :label="$t('visa.permanentResident')"
                  value="permanent_resident"
                />
                <el-option
                  :label="$t('visa.temporaryVisa')"
                  value="temporary_visa"
                />
                <el-option
                  :label="$t('visa.workingHoliday')"
                  value="working_holiday"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item
              :label="$t('employee.whiteCardNumber')"
              prop="white_card_number"
            >
              <el-input v-model="employeeForm.white_card_number" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              :label="$t('employee.whiteCardExpiry')"
              prop="white_card_expiry"
            >
              <el-date-picker
                v-model="employeeForm.white_card_expiry"
                type="date"
                style="width: 100%"
                :placeholder="$t('employee.selectDate')"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('employee.department')" prop="department">
              <el-select v-model="employeeForm.department" style="width: 100%">
                <el-option
                  :label="$t('department.construction')"
                  value="Construction"
                />
                <el-option
                  :label="$t('department.electrical')"
                  value="Electrical"
                />
                <el-option :label="$t('department.safety')" value="Safety" />
                <el-option
                  :label="$t('department.management')"
                  value="Management"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('employee.position')" prop="position">
              <el-input v-model="employeeForm.position" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('employee.hourlyRate')" prop="hourly_rate">
              <el-input-number
                v-model="employeeForm.hourly_rate"
                :precision="2"
                :min="15"
                :max="200"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              :label="$t('employee.employmentType')"
              prop="employment_type"
            >
              <el-select
                v-model="employeeForm.employment_type"
                style="width: 100%"
              >
                <el-option
                  :label="$t('employment.fullTime')"
                  value="full_time"
                />
                <el-option
                  :label="$t('employment.partTime')"
                  value="part_time"
                />
                <el-option :label="$t('employment.casual')" value="casual" />
                <el-option
                  :label="$t('employment.contractor')"
                  value="contractor"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('employee.startDate')" prop="start_date">
              <el-date-picker
                v-model="employeeForm.start_date"
                type="date"
                style="width: 100%"
                :placeholder="$t('employee.selectDate')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('employee.canCheckin')" prop="can_checkin">
              <el-switch v-model="employeeForm.can_checkin" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 紧急联系人信息 -->
        <el-divider>{{ $t("employee.emergencyContact") }}</el-divider>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item
              :label="$t('employee.emergencyName')"
              prop="emergency_contact_name"
            >
              <el-input v-model="employeeForm.emergency_contact_name" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item
              :label="$t('employee.emergencyPhone')"
              prop="emergency_contact_phone"
            >
              <el-input v-model="employeeForm.emergency_contact_phone" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item
              :label="$t('employee.emergencyRelationship')"
              prop="emergency_contact_relationship"
            >
              <el-input v-model="employeeForm.emergency_contact_relationship" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 工地分配 -->
        <el-divider>{{ $t("employee.worksiteAssignment") }}</el-divider>

        <el-form-item :label="$t('employee.assignedWorksites')">
          <el-select
            v-model="employeeForm.worksite_ids"
            multiple
            style="width: 100%"
          >
            <el-option
              v-for="site in worksites"
              :key="site.worksite_id"
              :label="site.name"
              :value="site.worksite_id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">{{
          $t("common.cancel")
        }}</el-button>
        <el-button type="primary" :loading="saving" @click="saveEmployee">
          {{ $t("common.save") }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 员工详情对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      :title="$t('employee.details')"
      width="600px"
    >
      <div v-if="selectedEmployee" class="employee-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item :label="$t('employee.id')">
            {{ selectedEmployee.employee_id }}
          </el-descriptions-item>
          <el-descriptions-item :label="$t('employee.name')">
            {{
              `${selectedEmployee.first_name || ""} ${selectedEmployee.last_name || ""}`.trim()
            }}
          </el-descriptions-item>
          <el-descriptions-item :label="$t('employee.email')">
            {{ selectedEmployee.email }}
          </el-descriptions-item>
          <el-descriptions-item :label="$t('employee.phone')">
            {{ selectedEmployee.phone }}
          </el-descriptions-item>
          <el-descriptions-item :label="$t('employee.department')">
            {{ $t(`department.${selectedEmployee.department.toLowerCase()}`) }}
          </el-descriptions-item>
          <el-descriptions-item :label="$t('employee.position')">
            {{ selectedEmployee.position }}
          </el-descriptions-item>
          <el-descriptions-item :label="$t('employee.whiteCardNumber')">
            {{ selectedEmployee.white_card_number }}
          </el-descriptions-item>
          <el-descriptions-item :label="$t('employee.whiteCardExpiry')">
            <el-tag
              :type="
                isWhiteCardValid(selectedEmployee.white_card_expiry)
                  ? 'success'
                  : 'danger'
              "
            >
              {{ formatDate(selectedEmployee.white_card_expiry) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('employee.status')">
            <el-tag :type="getStatusType(selectedEmployee.status)">
              {{ $t(`status.${selectedEmployee.status}`) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('employee.canCheckin')">
            <el-icon
              :color="selectedEmployee.can_checkin ? '#67C23A' : '#F56C6C'"
            >
              <Check v-if="selectedEmployee.can_checkin" />
              <Close v-else />
            </el-icon>
          </el-descriptions-item>
        </el-descriptions>

        <div
          v-if="
            selectedEmployee.Worksites && selectedEmployee.Worksites.length > 0
          "
          style="margin-top: 20px"
        >
          <h4>{{ $t("employee.assignedWorksites") }}</h4>
          <el-tag
            v-for="site in selectedEmployee.Worksites"
            :key="site.worksite_id"
            style="margin-right: 8px"
          >
            {{ site.name }}
          </el-tag>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  Search,
  Check,
  Close,
  User,
  ArrowDown,
  RefreshRight,
  Grid,
  Menu,
  View,
  Edit,
  Delete,
  Warning,
} from "@element-plus/icons-vue";
import type { FormInstance, FormRules } from "element-plus";
import request from "@/utils/request";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "@/api/employees";
import { usePermissions } from "@/composables/usePermissions";

// 权限控制
const { hasPermission } = usePermissions();

// 响应式数据
const loading = ref(false);
const saving = ref(false);
const employees = ref([]);
const worksites = ref([]);
const departments = ref([]);
const totalEmployees = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

// 搜索和筛选
const searchQuery = ref("");
const statusFilter = ref("");
const departmentFilter = ref("");
const worksiteFilter = ref("");
const filterExpanded = ref(true);

// 视图模式
const viewMode = ref("table");

// 对话框控制
const dialogVisible = ref(false);
const viewDialogVisible = ref(false);
const selectedEmployee = ref(null);
const isEdit = ref(false);

// 表单数据
const employeeForm = reactive({
  employee_id: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  date_of_birth: "",
  visa_status: "citizen",
  white_card_number: "",
  white_card_expiry: "",
  department: "",
  position: "",
  hourly_rate: 25.0,
  employment_type: "full_time",
  start_date: "",
  status: "active",
  can_checkin: true,
  emergency_contact_name: "",
  emergency_contact_phone: "",
  emergency_contact_relationship: "",
  worksite_ids: [],
});

// 表单验证规则
const formRules: FormRules = {
  employee_id: [{ required: true, message: "请输入员工ID", trigger: "blur" }],
  first_name: [{ required: true, message: "请输入名字", trigger: "blur" }],
  last_name: [{ required: true, message: "请输入姓氏", trigger: "blur" }],
  email: [{ type: "email", message: "请输入有效的邮箱地址", trigger: "blur" }],
  phone: [{ required: true, message: "请输入电话号码", trigger: "blur" }],
  date_of_birth: [
    { required: true, message: "请选择出生日期", trigger: "change" },
  ],
  white_card_number: [
    { required: true, message: "请输入White Card号码", trigger: "blur" },
  ],
  white_card_expiry: [
    { required: true, message: "请选择White Card过期日期", trigger: "change" },
  ],
  department: [{ required: true, message: "请选择部门", trigger: "change" }],
  position: [{ required: true, message: "请输入职位", trigger: "blur" }],
  hourly_rate: [{ required: true, message: "请输入时薪", trigger: "blur" }],
  start_date: [
    { required: true, message: "请选择入职日期", trigger: "change" },
  ],
  emergency_contact_name: [
    { required: true, message: "请输入紧急联系人姓名", trigger: "blur" },
  ],
  emergency_contact_phone: [
    { required: true, message: "请输入紧急联系人电话", trigger: "blur" },
  ],
  emergency_contact_relationship: [
    { required: true, message: "请输入与紧急联系人的关系", trigger: "blur" },
  ],
};

const employeeFormRef = ref<FormInstance>();

// 计算属性
const dialogTitle = computed(() => {
  return isEdit.value ? "编辑员工" : "添加员工";
});

// 方法
const loadEmployees = async () => {
  loading.value = true;
  try {
    // 调用实际的API
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value,
      status: statusFilter.value,
      department: departmentFilter.value,
      worksite_id: worksiteFilter.value,
    };

    const response = await getEmployees(params);

    if (response.success) {
      employees.value = response.data.employees || response.data;
      totalEmployees.value =
        response.data.pagination?.total || response.data.employees?.length || 0;
    } else {
      ElMessage({
        message: response.message || "Failed to load employee data",
        type: "error",
      });
    }
  } catch (error) {
    ElMessage({ message: "加载员工数据失败", type: "error" });
    console.error("Error loading employees:", error);
  } finally {
    loading.value = false;
  }
};

const loadWorksites = async () => {
  try {
    // 调用实际的API获取工地数据
    const response = await request.get("/worksites");

    if (response.success) {
      worksites.value = response.data.worksites || response.data || [];
    } else {
      ElMessage({ message: "加载工地数据失败", type: "error" });
    }
  } catch (error) {
    console.error("Error loading worksites:", error);
    ElMessage({ message: "加载工地数据失败", type: "error" });
  }
};

const loadDepartments = async () => {
  try {
    const response = await request.get("/departments");

    if (response.success) {
      departments.value = response.data || [];
    } else {
      ElMessage({ message: "加载部门数据失败", type: "error" });
    }
  } catch (error) {
    console.error("Error loading departments:", error);
    ElMessage({ message: "加载部门数据失败", type: "error" });
  }
};

const showAddDialog = () => {
  resetForm();
  isEdit.value = false;
  dialogVisible.value = true;
};

const editEmployee = (employee: any) => {
  Object.assign(employeeForm, employee);
  isEdit.value = true;
  dialogVisible.value = true;
};

const viewEmployee = (employee: any) => {
  selectedEmployee.value = employee;
  viewDialogVisible.value = true;
};

const saveEmployee = async () => {
  if (!employeeFormRef.value) return;

  await employeeFormRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true;
      try {
        // 调用实际的API
        if (isEdit.value) {
          const response = await updateEmployee(
            employeeForm.employee_id,
            employeeForm,
          );
          if (!response.success) {
            throw new Error(response.message);
          }
        } else {
          const response = await createEmployee(employeeForm);
          if (!response.success) {
            throw new Error(response.message);
          }
        }

        ElMessage({
          message: isEdit.value ? "员工信息更新成功" : "员工添加成功",
          type: "success",
        });
        dialogVisible.value = false;
        loadEmployees();
      } catch (error) {
        ElMessage({ message: "保存失败", type: "error" });
        console.error("Error saving employee:", error);
      } finally {
        saving.value = false;
      }
    }
  });
};

const handleDeleteEmployee = async (employee: any) => {
  try {
    await ElMessageBox.confirm("确定要删除这个员工吗？", "警告", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    // 调用实际的API
    const response = await deleteEmployee(employee.employee_id);
    if (!response.success) {
      throw new Error(response.message);
    }

    ElMessage({ message: "员工删除成功", type: "success" });
    loadEmployees();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage({ message: "删除失败", type: "error" });
      console.error("Error deleting employee:", error);
    }
  }
};

const resetForm = () => {
  Object.assign(employeeForm, {
    employee_id: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    visa_status: "citizen",
    white_card_number: "",
    white_card_expiry: "",
    department: "",
    position: "",
    hourly_rate: 25.0,
    employment_type: "full_time",
    start_date: "",
    status: "active",
    can_checkin: true,
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    worksite_ids: [],
  });
};

const resetFilters = () => {
  searchQuery.value = "";
  statusFilter.value = "";
  departmentFilter.value = "";
  worksiteFilter.value = "";
  loadEmployees();
};

// 切换筛选展开状态
const toggleFilterExpanded = () => {
  filterExpanded.value = !filterExpanded.value;
};

const isWhiteCardValid = (expiry: string) => {
  return new Date(expiry) > new Date();
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

const getStatusType = (status: string) => {
  const statusMap = {
    active: "success",
    inactive: "info",
    suspended: "danger",
  };
  return statusMap[status] || "info";
};

const getDepartmentName = (departmentId: number) => {
  const department = departments.value.find((d) => d.id === departmentId);
  return department ? department.name : `部门 ${departmentId}`;
};

// 生命周期
onMounted(() => {
  loadEmployees();
  loadWorksites();
});
</script>

<style scoped>
.employee-management {
  padding: 24px;
  background: transparent;
  min-height: 100vh;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f2f5;
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 8px 0;
  position: relative;
}

.page-title::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -12px;
  width: 60px;
  height: 4px;
  background: linear-gradient(90deg, #409eff, #36a3f7);
  border-radius: 2px;
}

.page-subtitle {
  color: #7f8c8d;
  font-size: 16px;
  margin: 0;
  font-weight: 400;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-button {
  height: 44px;
  padding: 0 24px;
  border-radius: 8px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.4);
}

/* 筛选卡片 */
.filter-card {
  margin-bottom: 24px;
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  overflow: hidden;
}

.filter-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.filter-card :deep(.el-card__header) {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-bottom: 1px solid #e9ecef;
  padding: 16px 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #2c3e50;
  font-size: 16px;
}

.rotate-180 {
  transform: rotate(180deg);
}

.filter-content {
  padding: 4px 0;
}

.filter-row {
  align-items: end;
}

.filter-item {
  margin-bottom: 16px;
}

.filter-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.full-width {
  width: 100%;
}

.filter-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  align-items: end;
  height: 100%;
  padding-bottom: 16px;
}

.employee-details .el-descriptions {
  margin-top: 20px;
}
</style>
