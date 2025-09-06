<template>
  <div class="expiring-licenses">
    <div class="page-header">
      <h2>{{ $t("license.widgetTitle") }}</h2>
      <div class="actions">
        <el-button :loading="exporting" @click="exportCsv">
          {{ $t("license.exportCsv") }}
        </el-button>
        <el-button @click="loadData">
          {{ $t("common.refresh") }}
        </el-button>
      </div>
    </div>

    <!-- 过滤器 -->
    <el-card class="filter-card" style="margin-bottom: 20px">
      <template #header>
        <span>{{ $t("common.filters") }}</span>
      </template>

      <el-form :model="filters" :inline="true" @submit.prevent="loadData">
        <el-form-item :label="$t('license.daysWithin')">
          <el-input-number
            v-model="filters.within"
            :min="1"
            :max="365"
            style="width: 120px"
            @change="loadData"
          />
        </el-form-item>

        <el-form-item :label="$t('license.includeExpired')">
          <el-switch v-model="filters.includeExpired" @change="loadData" />
        </el-form-item>

        <el-form-item :label="$t('common.search')">
          <el-input
            v-model="filters.search"
            :placeholder="$t('license.searchPlaceholder')"
            clearable
            style="width: 200px"
            @change="loadData"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item :label="$t('license.type')">
          <el-select
            v-model="filters.licenseTypeId"
            :placeholder="$t('license.filterType')"
            clearable
            style="width: 180px"
            @change="loadData"
          >
            <el-option
              v-for="type in licenseTypes"
              :key="type.license_type_id"
              :label="getLicenseTypeName(type)"
              :value="type.license_type_id"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('license.status')">
          <el-select
            v-model="filters.status"
            :placeholder="$t('license.filterStatus')"
            clearable
            style="width: 140px"
            @change="loadData"
          >
            <el-option :label="$t('license.expired')" value="expired" />
            <el-option :label="$t('license.expiringSoon')" value="expiring" />
            <el-option :label="$t('license.normal')" value="normal" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="loadData">{{
            $t("common.search")
          }}</el-button>
          <el-button @click="resetFilters">{{ $t("common.reset") }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ $t("license.records") }} ({{ total }})</span>
          <div>
            <el-select
              v-model="pagination.limit"
              style="width: 100px; margin-right: 10px"
              @change="loadData"
            >
              <el-option
                v-for="size in [10, 20, 50, 100]"
                :key="size"
                :label="`${size}/页`"
                :value="size"
              />
            </el-select>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="licenses"
        style="width: 100%"
        @sort-change="handleSortChange"
      >
        <el-table-column
          prop="employee_id"
          :label="$t('employee.id')"
          width="120"
          sortable="custom"
        />

        <el-table-column
          prop="name"
          :label="$t('license.employee')"
          width="150"
          sortable="custom"
        />

        <el-table-column
          prop="licenseName"
          :label="$t('license.type')"
          width="200"
          sortable="custom"
        >
          <template #default="scope">
            {{ getLicenseTypeName(scope.row.license) }}
          </template>
        </el-table-column>

        <el-table-column
          prop="number"
          :label="$t('license.number')"
          width="150"
          sortable="custom"
        />

        <el-table-column
          prop="expiry_date"
          :label="$t('license.expiryDate')"
          width="120"
          sortable="custom"
        />

        <el-table-column
          prop="days_remaining"
          :label="$t('license.daysRemaining')"
          width="120"
          sortable="custom"
        >
          <template #default="scope">
            <span :class="getDaysRemainingClass(scope.row.days_remaining)">
              {{ scope.row.days_remaining }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
          prop="status"
          :label="$t('license.status')"
          width="120"
          sortable="custom"
        >
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)" size="small">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          prop="ocr_status"
          :label="$t('license.ocrStatus')"
          width="130"
        >
          <template #default="scope">
            <el-tag
              :type="getOcrStatusTagType(scope.row.ocr_status)"
              size="small"
            >
              {{ getOcrStatusLabel(scope.row.ocr_status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="$t('license.file')" width="90">
          <template #default="scope">
            <el-tooltip
              v-if="scope.row.file_url"
              :content="scope.row.file_url"
              placement="top"
            >
              <el-button
                link
                type="primary"
                size="small"
                @click="previewFile(scope.row.file_url)"
                >📎</el-button
              >
            </el-tooltip>
            <span v-else style="color: #bbb">--</span>
          </template>
        </el-table-column>

        <el-table-column
          :label="$t('common.actions')"
          width="200"
          fixed="right"
        >
          <template #default="scope">
            <el-button
              v-permission="'LICENSE_EDIT'"
              size="small"
              @click="editLicense(scope.row)"
            >
              {{ $t("license.edit") }}
            </el-button>
            <el-button
              v-if="
                scope.row.ocr_status === 'low_confidence' ||
                scope.row.ocr_status === 'parsed'
              "
              size="small"
              type="warning"
              @click="confirmOcr(scope.row)"
            >
              {{ $t("license.confirmOcr") }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div style="margin-top: 20px; text-align: right">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { usePermissions } from "@/composables/usePermissions";
import {
  getExpiringLicenses,
  getLicenseTypes,
  exportExpiringCsv,
} from "@/api/licenses";
import { Search } from "@element-plus/icons-vue";

const { locale, t } = useI18n();
const router = useRouter();
const { hasPermission } = usePermissions();

// 响应式数据
const loading = ref(false);
const exporting = ref(false);
const licenses = ref<any[]>([]);
const licenseTypes = ref<any[]>([]);
const total = ref(0);

const filters = reactive({
  within: 30,
  includeExpired: true,
  search: "",
  licenseTypeId: null as number | null,
  status: "" as string,
});

const pagination = reactive({
  page: 1,
  limit: 20,
});

const sorting = reactive({
  sortBy: "expiry_date",
  sortOrder: "ASC" as "ASC" | "DESC",
});

// 方法
function getLicenseTypeName(licenseType: any) {
  if (!licenseType) return "";
  const isZh = (locale.value || "").startsWith("zh");
  return isZh
    ? licenseType.name_zh || licenseType.name_en
    : licenseType.name_en;
}

function getDaysRemainingClass(days: number) {
  if (days < 0) return "text-danger";
  if (days <= 7) return "text-danger";
  if (days <= 14) return "text-warning";
  return "";
}

function getStatusTagType(status: string) {
  switch (status) {
    case "expired":
      return "danger";
    case "expiring":
      return "warning";
    case "normal":
      return "success";
    default:
      return "info";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "expired":
      return t("license.expired");
    case "expiring":
      return t("license.expiringSoon");
    case "normal":
      return t("license.normal");
    default:
      return status;
  }
}

function getOcrStatusTagType(status: string) {
  switch (status) {
    case "confirmed":
      return "success";
    case "parsed":
      return "success";
    case "low_confidence":
      return "warning";
    case "rejected":
      return "danger";
    default:
      return "info";
  }
}

function getOcrStatusLabel(status: string) {
  return t(`license.ocrStatus.${status}`);
}

async function loadLicenseTypes() {
  try {
    const response = await getLicenseTypes();
    licenseTypes.value = response.data;
  } catch (error) {
    console.error("加载证件类型失败:", error);
  }
}

async function loadData() {
  loading.value = true;
  try {
    const params = {
      ...filters,
      ...pagination,
      ...sorting,
      includeExpired: filters.includeExpired,
      licenseTypeId: filters.licenseTypeId || undefined,
    };

    const response = await getExpiringLicenses(params);

    if (response.data.licenses) {
      // 新格式API响应
      licenses.value = response.data.licenses;
      total.value = response.data.pagination?.total || 0;
    } else {
      // 兼容旧格式
      licenses.value = response.data || [];
      total.value = licenses.value.length;
    }
  } catch (error) {
    console.error("加载到期证件失败:", error);
    ElMessage({ message: t("license.loadFailed"), type: "error" });
  } finally {
    loading.value = false;
  }
}

function handleSortChange({
  prop,
  order,
}: {
  prop: string;
  order: string | null;
}) {
  if (order) {
    sorting.sortBy =
      prop === "name"
        ? "employee_name"
        : prop === "licenseName"
          ? "license_type"
          : prop;
    sorting.sortOrder = order === "ascending" ? "ASC" : "DESC";
  } else {
    sorting.sortBy = "expiry_date";
    sorting.sortOrder = "ASC";
  }
  pagination.page = 1;
  loadData();
}

function resetFilters() {
  Object.assign(filters, {
    within: 30,
    includeExpired: true,
    search: "",
    licenseTypeId: null,
    status: "",
  });
  pagination.page = 1;
  loadData();
}

async function exportCsv() {
  exporting.value = true;
  try {
    const lang = locale.value?.startsWith("zh") ? "zh" : "en";
    const blob = await exportExpiringCsv(filters.within, lang);

    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `expiring_licenses_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    ElMessage({ message: t("license.exportSuccess"), type: "success" });
  } catch (error) {
    console.error("导出失败:", error);
    ElMessage({ message: t("license.exportFailed"), type: "error" });
  } finally {
    exporting.value = false;
  }
}

function previewFile(url: string) {
  if (url) {
    window.open(url, "_blank");
  }
}

function editLicense(license: any) {
  // 跳转到证件管理页面，并定位到该证件
  router.push({
    path: "/licenses",
    query: { employeeId: license.employee_id, highlightId: license.id },
  });
}

function confirmOcr(license: any) {
  // 跳转到OCR确认页面
  router.push("/admin/licenses/ocr-confirmation");
}

onMounted(() => {
  loadLicenseTypes();
  loadData();
});
</script>

<style scoped>
.expiring-licenses {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header .actions > * {
  margin-left: 10px;
}

.filter-card .el-form {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text-danger {
  color: #f56c6c;
  font-weight: bold;
}

.text-warning {
  color: #e6a23c;
  font-weight: bold;
}
</style>
