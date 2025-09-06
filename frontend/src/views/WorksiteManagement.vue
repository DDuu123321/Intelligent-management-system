<template>
  <div class="worksite-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>{{ $t("worksite.management") || "Worksite Management" }}</h2>
      <el-button type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon>
        {{ $t("worksite.add") || "Add Worksite" }}
      </el-button>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filter-section">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-input
            v-model="searchQuery"
            :placeholder="
              $t('worksite.searchPlaceholder') || 'Search worksite name or ID'
            "
            clearable
            @change="loadWorksites"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="statusFilter"
            :placeholder="$t('worksite.status') || 'Status'"
            clearable
            @change="loadWorksites"
          >
            <el-option
              :label="$t('status.active') || 'Active'"
              value="active"
            />
            <el-option
              :label="$t('status.inactive') || 'Inactive'"
              value="inactive"
            />
            <el-option
              :label="$t('status.suspended') || 'Suspended'"
              value="suspended"
            />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button @click="resetFilters">{{
            $t("common.reset") || "Reset"
          }}</el-button>
          <el-button type="primary" @click="loadWorksites">{{
            $t("common.search") || "Search"
          }}</el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 工地列表 -->
    <el-table v-loading="loading" :data="worksites" style="width: 100%">
      <el-table-column
        prop="worksite_id"
        :label="$t('worksite.id') || 'Site ID'"
        width="120"
      />
      <el-table-column
        prop="name"
        :label="$t('worksite.name') || 'Site Name'"
        width="200"
      />
      <el-table-column
        prop="address"
        :label="$t('worksite.address') || 'Address'"
      />
      <el-table-column
        :label="$t('worksite.coordinates') || 'Coordinates'"
        width="180"
      >
        <template #default="{ row }">
          <span v-if="row.latitude && row.longitude">
            {{ Number(row.latitude).toFixed(6) }},
            {{ Number(row.longitude).toFixed(6) }}
          </span>
          <span v-else class="text-gray">未设置</span>
        </template>
      </el-table-column>
      <el-table-column
        prop="status"
        :label="$t('worksite.status') || 'Status'"
        width="100"
      >
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="created_at"
        :label="$t('common.createTime') || 'Created'"
        width="160"
      >
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('common.actions') || 'Actions'"
        width="200"
        fixed="right"
      >
        <template #default="{ row }">
          <el-button size="small" @click="viewWorksite(row)">{{
            $t("common.view") || "View"
          }}</el-button>
          <el-button size="small" type="primary" @click="editWorksite(row)">{{
            $t("common.edit") || "Edit"
          }}</el-button>
          <el-button size="small" type="danger" @click="deleteWorksite(row)">{{
            $t("common.delete") || "Delete"
          }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :total="totalWorksites"
      layout="total, sizes, prev, pager, next, jumper"
      style="margin-top: 20px; text-align: center"
      @size-change="loadWorksites"
      @current-change="loadWorksites"
    />

    <!-- 添加/编辑工地对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="worksiteFormRef"
        :model="worksiteForm"
        :rules="formRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item
              :label="$t('worksite.id') || 'Site ID'"
              prop="worksite_id"
            >
              <el-input v-model="worksiteForm.worksite_id" :disabled="isEdit" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              :label="$t('worksite.status') || 'Status'"
              prop="status"
            >
              <el-select v-model="worksiteForm.status" style="width: 100%">
                <el-option
                  :label="$t('status.active') || 'Active'"
                  value="active"
                />
                <el-option
                  :label="$t('status.inactive') || 'Inactive'"
                  value="inactive"
                />
                <el-option
                  :label="$t('status.suspended') || 'Suspended'"
                  value="suspended"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item :label="$t('worksite.name') || 'Site Name'" prop="name">
          <el-input v-model="worksiteForm.name" />
        </el-form-item>

        <el-form-item
          :label="$t('worksite.address') || 'Address'"
          prop="address"
        >
          <el-input v-model="worksiteForm.address" type="textarea" :rows="2" />
        </el-form-item>

        <el-form-item :label="$t('worksite.description') || 'Description'">
          <el-input
            v-model="worksiteForm.description"
            type="textarea"
            :rows="3"
          />
        </el-form-item>

        <el-divider>{{
          $t("worksite.locationInfo") || "Location Information"
        }}</el-divider>

        <!-- Interactive Map Location Selector -->
        <el-form-item
          :label="$t('worksite.location') || 'Worksite Location'"
          prop="location"
        >
          <WorksiteMapSelector
            v-model="locationData"
            @location-selected="handleLocationSelected"
            @location-cleared="handleLocationCleared"
          />
        </el-form-item>

        <!-- Optional: Show coordinates as read-only for reference -->
        <el-row
          v-if="worksiteForm.latitude && worksiteForm.longitude"
          :gutter="20"
        >
          <el-col :span="12">
            <el-form-item :label="$t('worksite.latitude') || 'Latitude'">
              <el-input
                :value="
                  worksiteForm.latitude ? worksiteForm.latitude.toFixed(8) : ''
                "
                readonly
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('worksite.longitude') || 'Longitude'">
              <el-input
                :value="
                  worksiteForm.longitude
                    ? worksiteForm.longitude.toFixed(8)
                    : ''
                "
                readonly
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item :label="$t('worksite.timezone') || 'Time Zone'">
          <el-select v-model="worksiteForm.timezone" style="width: 100%">
            <el-option
              label="澳洲西部时间 (AWST UTC+8)"
              value="Australia/Perth"
            />
            <el-option
              label="澳洲东部时间 (AEST UTC+10)"
              value="Australia/Sydney"
            />
            <el-option
              label="澳洲中部时间 (ACST UTC+9:30)"
              value="Australia/Adelaide"
            />
          </el-select>
        </el-form-item>

        <el-divider>{{
          $t("worksite.contactInfo") || "Contact Information"
        }}</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('worksite.manager') || 'Site Manager'">
              <el-input v-model="worksiteForm.manager_name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('worksite.phone') || 'Contact Phone'">
              <el-input v-model="worksiteForm.manager_phone" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">{{
          $t("common.cancel") || "Cancel"
        }}</el-button>
        <el-button type="primary" :loading="saving" @click="saveWorksite">
          {{ $t("common.save") || "Save" }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 工地详情对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      :title="$t('worksite.details') || 'Site Details'"
      width="600px"
    >
      <div v-if="selectedWorksite" class="worksite-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item :label="$t('worksite.id') || 'Site ID'">
            {{ selectedWorksite.worksite_id }}
          </el-descriptions-item>
          <el-descriptions-item :label="$t('worksite.name') || 'Site Name'">
            {{ selectedWorksite.name }}
          </el-descriptions-item>
          <el-descriptions-item
            :label="$t('worksite.address') || 'Address'"
            span="2"
          >
            {{ selectedWorksite.address || "Not set" }}
          </el-descriptions-item>
          <el-descriptions-item
            :label="$t('worksite.coordinates') || 'Coordinates'"
          >
            <span
              v-if="selectedWorksite.latitude && selectedWorksite.longitude"
            >
              {{ Number(selectedWorksite.latitude).toFixed(6) }},
              {{ Number(selectedWorksite.longitude).toFixed(6) }}
            </span>
            <span v-else>未设置</span>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('worksite.status') || 'Status'">
            <el-tag :type="getStatusType(selectedWorksite.status)">
              {{ getStatusText(selectedWorksite.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item
            :label="$t('worksite.manager') || 'Site Manager'"
          >
            {{ selectedWorksite.manager_name || "Not assigned" }}
          </el-descriptions-item>
          <el-descriptions-item
            :label="$t('worksite.phone') || 'Contact Phone'"
          >
            {{ selectedWorksite.manager_phone || "Not provided" }}
          </el-descriptions-item>
          <el-descriptions-item
            :label="$t('worksite.description') || 'Description'"
            span="2"
          >
            {{ selectedWorksite.description || "No description" }}
          </el-descriptions-item>
          <el-descriptions-item
            :label="$t('common.createTime') || 'Created'"
            span="2"
          >
            {{ formatDate(selectedWorksite.created_at) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Search } from "@element-plus/icons-vue";
import type { FormInstance, FormRules } from "element-plus";
import request from "@/utils/request";
import WorksiteMapSelector from "@/components/WorksiteMapSelector.vue";
import type { LocationData } from "@/composables/useGoogleMaps";

// 响应式数据
const loading = ref(false);
const saving = ref(false);
const worksites = ref<any[]>([]);
const totalWorksites = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

// 搜索和筛选
const searchQuery = ref("");
const statusFilter = ref("");

// 对话框控制
const dialogVisible = ref(false);
const viewDialogVisible = ref(false);
const selectedWorksite = ref<any>(null);
const isEdit = ref(false);

// 表单数据
const worksiteForm = reactive({
  worksite_id: "",
  name: "",
  address: "",
  latitude: null as number | null,
  longitude: null as number | null,
  status: "active",
  description: "",
  timezone: "Australia/Perth",
  manager_name: "",
  manager_phone: "",
});

// Location data for map selector
const locationData = ref<LocationData | null>(null);

// 表单验证规则
const formRules: FormRules = {
  worksite_id: [{ required: true, message: "请输入工地ID", trigger: "blur" }],
  name: [{ required: true, message: "请输入工地名称", trigger: "blur" }],
  address: [{ required: true, message: "请输入地址", trigger: "blur" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }],
};

const worksiteFormRef = ref<FormInstance>();

// 计算属性
const dialogTitle = computed(() => {
  return isEdit.value ? "编辑工地" : "添加工地";
});

// 方法
// Map location handling
const handleLocationSelected = (location: LocationData) => {
  worksiteForm.latitude = location.lat;
  worksiteForm.longitude = location.lng;

  // Update address if available and current address is empty
  if (location.address && !worksiteForm.address) {
    worksiteForm.address = location.address;
  }

  console.log("Location selected:", location);
};

const handleLocationCleared = () => {
  worksiteForm.latitude = null;
  worksiteForm.longitude = null;
  locationData.value = null;
  console.log("Location cleared");
};

const loadWorksites = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value,
      status: statusFilter.value,
    };

    const response = await request.get("/worksites", { params });

    if (response.data && response.success !== false) {
      const rawWorksites = response.data.worksites || response.data;
      // 映射后端数据字段到前端期望的字段
      worksites.value = rawWorksites.map((worksite: any) => ({
        ...worksite,
        address: worksite.street_address,
        latitude: worksite.center_latitude,
        longitude: worksite.center_longitude,
      }));
      totalWorksites.value = response.data.pagination?.total || 0;
    }
  } catch (error) {
    ElMessage({ message: "加载工地数据失败", type: "error" });
    console.error("Error loading worksites:", error);
  } finally {
    loading.value = false;
  }
};

const showAddDialog = () => {
  resetForm();
  isEdit.value = false;
  dialogVisible.value = true;
};

const editWorksite = (worksite: any) => {
  // 将后端数据映射到前端表单
  Object.assign(worksiteForm, {
    worksite_id: worksite.worksite_id,
    name: worksite.name,
    address: worksite.street_address,
    latitude: worksite.center_latitude,
    longitude: worksite.center_longitude,
    status: worksite.status,
    description: worksite.description,
    timezone: worksite.timezone,
    manager_name: worksite.project_manager,
    manager_phone: worksite.project_manager_phone,
  });

  // Set location data for map selector
  if (worksite.center_latitude && worksite.center_longitude) {
    locationData.value = {
      lat: worksite.center_latitude,
      lng: worksite.center_longitude,
      address: worksite.street_address || "Address not available",
    };
  } else {
    locationData.value = null;
  }

  isEdit.value = true;
  dialogVisible.value = true;
};

const viewWorksite = (worksite: any) => {
  selectedWorksite.value = worksite;
  viewDialogVisible.value = true;
};

const saveWorksite = async () => {
  if (!worksiteFormRef.value) return;

  await worksiteFormRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true;
      try {
        if (isEdit.value) {
          // 构建符合后端API期望的数据结构
          const worksiteData = {
            worksite_id: worksiteForm.worksite_id,
            name: worksiteForm.name,
            description: worksiteForm.description,
            center_latitude: worksiteForm.latitude,
            center_longitude: worksiteForm.longitude,
            street_address: worksiteForm.address,
            suburb: "Perth", // 默认值
            state: "WA", // 默认值
            postcode: "6000", // 默认值
            status: worksiteForm.status,
            start_date: new Date().toISOString().split("T")[0], // 今天
            timezone: worksiteForm.timezone,
            project_manager: worksiteForm.manager_name,
            project_manager_phone: worksiteForm.manager_phone,
          };

          const response = await request.put(
            `/worksites/${worksiteForm.worksite_id}`,
            worksiteData,
          );
          if (response.success === false) {
            throw new Error(response.message || "Update failed");
          }
        } else {
          // 构建符合后端API期望的数据结构
          const worksiteData = {
            worksite_id: worksiteForm.worksite_id,
            name: worksiteForm.name,
            description: worksiteForm.description,
            center_latitude: worksiteForm.latitude,
            center_longitude: worksiteForm.longitude,
            street_address: worksiteForm.address,
            suburb: "Perth", // 默认值
            state: "WA", // 默认值
            postcode: "6000", // 默认值
            status: worksiteForm.status,
            start_date: new Date().toISOString().split("T")[0], // 今天
            timezone: worksiteForm.timezone,
            project_manager: worksiteForm.manager_name,
            project_manager_phone: worksiteForm.manager_phone,
          };

          const response = await request.post("/worksites", worksiteData);
          if (response.success === false) {
            throw new Error(response.message || "Create failed");
          }
        }

        ElMessage({
          message: isEdit.value ? "工地信息更新成功" : "工地添加成功",
          type: "success",
        });
        dialogVisible.value = false;
        loadWorksites();
      } catch (error) {
        ElMessage({
          message: "保存失败: " + (error as Error).message,
          type: "error",
        });
        console.error("Error saving worksite:", error);
      } finally {
        saving.value = false;
      }
    }
  });
};

const deleteWorksite = async (worksite: any) => {
  try {
    await ElMessageBox.confirm(
      "确定要删除这个工地吗？相关的二维码也会受到影响。",
      "警告",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    const response = await request.delete(`/worksites/${worksite.worksite_id}`);
    if (response.data.success === false) {
      throw new Error(response.data.message || "Delete failed");
    }

    ElMessage({ message: "工地删除成功", type: "success" });
    loadWorksites();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage({
        message: "删除失败: " + (error.message || error),
        type: "error",
      });
      console.error("Error deleting worksite:", error);
    }
  }
};

const resetForm = () => {
  Object.assign(worksiteForm, {
    worksite_id: "",
    name: "",
    address: "",
    latitude: null,
    longitude: null,
    status: "active",
    description: "",
    timezone: "Australia/Perth",
    manager_name: "",
    manager_phone: "",
  });

  // Clear location data
  locationData.value = null;
};

const resetFilters = () => {
  searchQuery.value = "";
  statusFilter.value = "";
  loadWorksites();
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    active: "success",
    inactive: "info",
    suspended: "danger",
  };
  return statusMap[status] || "info";
};

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    active: "活跃",
    inactive: "非活跃",
    suspended: "暂停",
  };
  return statusMap[status] || status;
};

// 生命周期
onMounted(() => {
  loadWorksites();
});
</script>

<style scoped>
.worksite-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-section {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.text-gray {
  color: #909399;
}

.worksite-details .el-descriptions {
  margin-top: 20px;
}
</style>
