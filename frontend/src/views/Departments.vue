<template>
  <div class="departments-container">
    <el-card class="page-header">
      <div class="header-content">
        <h1>{{ $t("departments.title") }}</h1>
        <div class="header-actions">
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            {{ $t("departments.add") }}
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 部门列表 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ $t("departments.list") }}</span>
          <div class="header-controls">
            <el-switch
              v-model="showInactive"
              :active-text="$t('departments.switches.showInactive')"
              :inactive-text="$t('departments.switches.hideInactive')"
              @change="fetchDepartments"
            />
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="departments"
        style="width: 100%"
        row-key="id"
        :tree-props="{ children: 'children' }"
      >
        <el-table-column
          prop="name"
          :label="$t('departments.name')"
          min-width="200"
        >
          <template #default="{ row }">
            <div class="department-name">
              <span>{{ row.name }}</span>
              <el-tag v-if="!row.is_active" type="info" size="small">{{
                $t("departments.switches.disabled")
              }}</el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          prop="description"
          :label="$t('departments.description')"
          min-width="200"
          show-overflow-tooltip
        />

        <el-table-column
          prop="manager"
          :label="$t('departments.manager')"
          min-width="120"
        >
          <template #default="{ row }">
            <span v-if="row.manager">
              {{ row.manager.first_name }} {{ row.manager.last_name }}
            </span>
            <span v-else class="text-muted">{{
              $t("departments.details.notSet")
            }}</span>
          </template>
        </el-table-column>

        <el-table-column
          prop="employee_count"
          :label="$t('departments.employeeCount')"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag type="primary" size="small">{{
              row.employee_count || 0
            }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column
          prop="sort_order"
          :label="$t('departments.sortOrder')"
          width="80"
          align="center"
        />

        <el-table-column
          :label="$t('departments.actions')"
          width="200"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button size="small" @click="viewDepartment(row)">{{
              $t("departments.view")
            }}</el-button>
            <el-button
              size="small"
              type="primary"
              @click="editDepartment(row)"
              >{{ $t("departments.edit") }}</el-button
            >
            <el-button
              size="small"
              type="danger"
              :disabled="
                row.employee_count > 0 ||
                (row.children && row.children.length > 0)
              "
              @click="deleteDepartmentConfirm(row)"
            >
              {{ $t("departments.delete") }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建/编辑部门对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="
        editingDepartment ? $t('departments.edit') : $t('departments.create')
      "
      width="600px"
    >
      <el-form
        ref="departmentFormRef"
        :model="departmentForm"
        :rules="departmentRules"
        label-width="100px"
      >
        <el-form-item :label="$t('departments.form.name')" prop="name">
          <el-input
            v-model="departmentForm.name"
            :placeholder="$t('departments.form.placeholders.name')"
          />
        </el-form-item>

        <el-form-item
          :label="$t('departments.form.description')"
          prop="description"
        >
          <el-input
            v-model="departmentForm.description"
            type="textarea"
            :rows="3"
            :placeholder="$t('departments.form.placeholders.description')"
          />
        </el-form-item>

        <el-form-item
          :label="$t('departments.form.parentDepartment')"
          prop="parent_id"
        >
          <el-select
            v-model="departmentForm.parent_id"
            :placeholder="$t('departments.form.placeholders.parentDepartment')"
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="dept in availableParentDepartments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('departments.form.manager')" prop="manager_id">
          <el-select
            v-model="departmentForm.manager_id"
            :placeholder="$t('departments.form.placeholders.manager')"
            clearable
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="emp in availableManagers"
              :key="emp.id"
              :label="`${emp.first_name} ${emp.last_name} (${emp.employee_id})`"
              :value="emp.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item
          :label="$t('departments.form.sortOrder')"
          prop="sort_order"
        >
          <el-input-number
            v-model="departmentForm.sort_order"
            :min="0"
            :max="999"
            controls-position="right"
          />
        </el-form-item>

        <el-form-item
          v-if="editingDepartment"
          :label="$t('departments.form.status')"
          prop="is_active"
        >
          <el-switch
            v-model="departmentForm.is_active"
            :active-text="$t('departments.form.active')"
            :inactive-text="$t('departments.form.inactive')"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">{{
          $t("departments.cancel")
        }}</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="submitDepartment"
        >
          {{
            editingDepartment
              ? $t("departments.update")
              : $t("departments.create")
          }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 部门详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      :title="$t('departments.details.title')"
      width="800px"
    >
      <div v-if="currentDepartment" class="department-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item :label="$t('departments.details.name')">{{
            currentDepartment.name
          }}</el-descriptions-item>
          <el-descriptions-item :label="$t('departments.details.status')">
            <el-tag :type="currentDepartment.is_active ? 'success' : 'info'">
              {{
                currentDepartment.is_active
                  ? $t("departments.switches.enabled")
                  : $t("departments.switches.disabled")
              }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item
            :label="$t('departments.details.parentDepartment')"
          >
            {{
              currentDepartment.parent?.name || $t("departments.details.none")
            }}
          </el-descriptions-item>
          <el-descriptions-item :label="$t('departments.details.manager')">
            {{
              currentDepartment.manager
                ? `${currentDepartment.manager.first_name} ${currentDepartment.manager.last_name}`
                : $t("departments.details.notSet")
            }}
          </el-descriptions-item>
          <el-descriptions-item
            :label="$t('departments.details.employeeCount')"
            >{{ currentDepartment.employee_count || 0 }}</el-descriptions-item
          >
          <el-descriptions-item :label="$t('departments.details.sortOrder')">{{
            currentDepartment.sort_order
          }}</el-descriptions-item>
          <el-descriptions-item
            :label="$t('departments.details.description')"
            :span="2"
          >
            {{
              currentDepartment.description || $t("departments.details.none")
            }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 员工列表 -->
        <div class="mt-4">
          <h3>{{ $t("departments.details.employees") }}</h3>
          <el-table
            :data="departmentEmployees"
            style="width: 100%"
            size="small"
          >
            <el-table-column
              prop="employee_id"
              :label="$t('departments.details.employeeId')"
              width="120"
            />
            <el-table-column
              :label="$t('departments.details.employeeName')"
              width="120"
            >
              <template #default="{ row }">
                {{ row.first_name }} {{ row.last_name }}
              </template>
            </el-table-column>
            <el-table-column
              prop="position"
              :label="$t('departments.details.position')"
            />
            <el-table-column
              prop="phone"
              :label="$t('departments.details.phone')"
              width="130"
            />
            <el-table-column
              prop="start_date"
              :label="$t('departments.details.startDate')"
              width="110"
            />
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
} from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentEmployees,
  type Department,
  type CreateDepartmentData,
  type DepartmentEmployee,
} from "@/api/departments";

const loading = ref(false);
const submitting = ref(false);
const showCreateDialog = ref(false);
const showDetailDialog = ref(false);
const showInactive = ref(false);

const departments = ref<Department[]>([]);
const departmentEmployees = ref<DepartmentEmployee[]>([]);
const currentDepartment = ref<Department | null>(null);
const editingDepartment = ref<Department | null>(null);
const availableManagers = ref([]); // TODO: 从员工API获取
const { t } = useI18n();
const departmentFormRef = ref<FormInstance>();

const departmentForm = reactive<CreateDepartmentData & { is_active?: boolean }>(
  {
    name: "",
    description: "",
    manager_id: undefined,
    parent_id: undefined,
    sort_order: 0,
    is_active: true,
  },
);

const departmentRules = computed<FormRules>(() => ({
  name: [
    {
      required: true,
      message: t("departments.form.validation.nameRequired"),
      trigger: "blur",
    },
    {
      min: 2,
      max: 50,
      message: t("departments.form.validation.nameLength"),
      trigger: "blur",
    },
  ],
  sort_order: [
    {
      required: true,
      message: t("departments.form.validation.sortOrderRequired"),
      trigger: "blur",
    },
  ],
}));

// 可选择的上级部门（排除自身和子部门）
const availableParentDepartments = computed(() => {
  if (!editingDepartment.value) return departments.value;

  const exclude = new Set([editingDepartment.value.id]);
  const collectChildren = (dept: Department) => {
    if (dept.children) {
      dept.children.forEach((child) => {
        exclude.add(child.id);
        collectChildren(child);
      });
    }
  };
  collectChildren(editingDepartment.value);

  return departments.value.filter((dept) => !exclude.has(dept.id));
});

// 获取部门列表
const fetchDepartments = async () => {
  loading.value = true;
  try {
    const response = await getDepartments({
      include_inactive: showInactive.value,
    });
    departments.value = response.data;
  } catch (error) {
    ElMessage({
      message: t("departments.messages.fetchFailed"),
      type: "error",
    });
  } finally {
    loading.value = false;
  }
};

// 查看部门详情
const viewDepartment = async (department: Department) => {
  currentDepartment.value = department;

  try {
    const response = await getDepartmentEmployees(department.id);
    departmentEmployees.value = response.data.employees;
  } catch (error) {
    ElMessage({
      message: t("departments.messages.fetchEmployeesFailed"),
      type: "error",
    });
  }

  showDetailDialog.value = true;
};

// 编辑部门
const editDepartment = (department: Department) => {
  editingDepartment.value = department;
  Object.assign(departmentForm, {
    name: department.name,
    description: department.description,
    manager_id: department.manager_id,
    parent_id: department.parent_id,
    sort_order: department.sort_order,
    is_active: department.is_active,
  });
  showCreateDialog.value = true;
};

// 重置表单
const resetForm = () => {
  Object.assign(departmentForm, {
    name: "",
    description: "",
    manager_id: undefined,
    parent_id: undefined,
    sort_order: 0,
    is_active: true,
  });
  editingDepartment.value = null;
  departmentFormRef.value?.resetFields();
};

// 提交部门表单
const submitDepartment = async () => {
  if (!departmentFormRef.value) return;

  try {
    await departmentFormRef.value.validate();
    submitting.value = true;

    if (editingDepartment.value) {
      await updateDepartment(editingDepartment.value.id, departmentForm);
      ElMessage({
        message: t("departments.messages.updateSuccess"),
        type: "success",
      });
    } else {
      await createDepartment(departmentForm);
      ElMessage({
        message: t("departments.messages.createSuccess"),
        type: "success",
      });
    }

    showCreateDialog.value = false;
    resetForm();
    await fetchDepartments();
  } catch (error) {
    if (error !== false) {
      ElMessage({
        message: editingDepartment.value
          ? t("departments.messages.updateFailed")
          : t("departments.messages.createFailed"),
        type: "error",
      });
    }
  } finally {
    submitting.value = false;
  }
};

// 删除部门确认
const deleteDepartmentConfirm = async (department: Department) => {
  try {
    await ElMessageBox.confirm(
      t("departments.messages.deleteConfirm", { name: department.name }),
      t("departments.messages.deleteTitle"),
      {
        confirmButtonText: t("departments.delete"),
        cancelButtonText: t("departments.cancel"),
        type: "warning",
      },
    );

    await deleteDepartment(department.id);
    ElMessage({
      message: t("departments.messages.deleteSuccess"),
      type: "success",
    });
    await fetchDepartments();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage({
        message: t("departments.messages.deleteFailed"),
        type: "error",
      });
    }
  }
};

onMounted(() => {
  fetchDepartments();
});

// 监听对话框关闭
watch(showCreateDialog, (newVal) => {
  if (!newVal) {
    resetForm();
  }
});
</script>

<style scoped>
.departments-container {
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
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.department-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.text-muted {
  color: #909399;
}

.department-detail {
  .mt-4 {
    margin-top: 20px;
  }

  h3 {
    margin-bottom: 12px;
    font-size: 16px;
    font-weight: 600;
  }
}
</style>
