<template>
  <div class="license-management">
    <div class="page-header">
      <h2>{{ $t("license.title") }}</h2>
      <div class="actions">
        <el-select
          v-if="hasPermission('LICENSE_VIEW_ALL')"
          v-model="employeeId"
          filterable
          clearable
          :placeholder="$t('employee.searchPlaceholder')"
          style="width: 240px"
          @change="loadEmployeeLicenses"
        >
          <el-option
            v-for="emp in employeeOptions"
            :key="emp.employee_id"
            :label="empLabel(emp)"
            :value="emp.employee_id"
          />
        </el-select>
        <el-button
          v-permission="'LICENSE_CREATE'"
          type="primary"
          :disabled="!employeeId"
          @click="openAddDialog"
          >{{ $t("license.add") }}</el-button
        >
        <el-button
          v-permission="'LICENSE_BATCH_IMPORT'"
          type="warning"
          @click="openBatchImportDialog"
          >{{ $t("license.batchImport") }}</el-button
        >
        <el-button
          v-permission="'LICENSE_EDIT'"
          type="info"
          @click="$router.push('/admin/licenses/ocr-confirmation')"
          >{{ $t("license.ocrConfirmation") }}</el-button
        >
        <el-button :disabled="!employeeId" @click="loadEmployeeLicenses">{{
          $t("license.refresh")
        }}</el-button>
        <el-button @click="loadExpiringAll">{{
          $t("license.widgetTitle")
        }}</el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>{{ $t("license.title") }} - {{ currentEmployeeName }}</span>
              <div>
                <el-input
                  v-model="searchText"
                  size="small"
                  :placeholder="$t('license.searchPlaceholder')"
                  style="width: 200px; margin-right: 8px"
                  clearable
                />
                <el-select
                  v-model="statusFilter"
                  size="small"
                  clearable
                  :placeholder="$t('license.filterStatus')"
                  style="width: 140px; margin-right: 8px"
                >
                  <el-option :label="$t('license.normal')" value="normal" />
                  <el-option
                    :label="$t('license.expiringSoon')"
                    value="expiring"
                  />
                  <el-option :label="$t('license.expired')" value="expired" />
                </el-select>
                <el-select
                  v-model="typeFilter"
                  size="small"
                  clearable
                  :placeholder="$t('license.filterType')"
                  style="width: 160px; margin-right: 8px"
                >
                  <el-option
                    v-for="t in licenseTypes"
                    :key="t.id"
                    :label="licenseTypeName(t)"
                    :value="t.id"
                  />
                </el-select>
              </div>
            </div>
          </template>
          <el-table
            v-loading="loading"
            :data="filteredLicenses"
            size="small"
            style="width: 100%"
          >
            <el-table-column
              prop="licenseName"
              :label="$t('license.type')"
              width="220"
            />
            <el-table-column
              prop="number"
              :label="$t('license.number')"
              width="150"
            />
            <el-table-column
              prop="issue_date"
              :label="$t('license.issueDate')"
              width="120"
            />
            <el-table-column
              prop="expiry_date"
              :label="$t('license.expiryDate')"
              width="120"
            />
            <el-table-column
              prop="days_remaining"
              :label="$t('license.daysRemaining')"
              width="120"
            />
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
                    @click="previewFile(scope.row)"
                    >📎</el-button
                  >
                </el-tooltip>
                <span v-else style="color: #bbb">--</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('license.ocrResult')" width="130">
              <template #default="scope">
                <el-tag
                  v-if="scope.row.ocr_status === 'parsed'"
                  type="success"
                  size="small"
                  >{{ $t("license.ocrParsed") }}</el-tag
                >
                <el-tag
                  v-else-if="scope.row.ocr_status === 'low_confidence'"
                  type="warning"
                  size="small"
                  >{{ $t("license.ocrLow") }}</el-tag
                >
                <el-tag v-else type="info" size="small">{{
                  $t("license.ocrNone")
                }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column
              prop="statusLabel"
              :label="$t('license.status')"
              width="120"
            >
              <template #default="scope">
                <el-tag :type="scope.row.statusTag">{{
                  scope.row.statusLabel
                }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column
              :label="$t('license.actions')"
              width="230"
              fixed="right"
            >
              <template #default="scope">
                <el-button
                  v-permission="'LICENSE_EDIT'"
                  size="small"
                  @click="editLicense(scope.row)"
                  >{{ $t("license.edit") }}</el-button
                >
                <el-button
                  v-permission="'LICENSE_DELETE'"
                  size="small"
                  type="danger"
                  @click="deleteLicense(scope.row)"
                  >{{ $t("common.delete") }}</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>{{ $t("license.widgetTitle") }}</span>
          </template>
          <el-table
            :data="expiringAll"
            size="small"
            style="width: 100%"
            height="400px"
          >
            <el-table-column
              prop="name"
              :label="$t('license.employee')"
              width="140"
            />
            <el-table-column
              prop="licenseName"
              :label="$t('license.type')"
              width="180"
            />
            <el-table-column
              prop="days_remaining"
              :label="$t('license.daysRemaining')"
              width="100"
            />
            <el-table-column
              prop="statusLabel"
              :label="$t('license.status')"
              width="120"
            >
              <template #default="scope">
                <el-tag :type="scope.row.statusTag" size="small">{{
                  scope.row.statusLabel
                }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" label-width="120px" :rules="rules">
        <el-form-item :label="$t('license.type')" prop="license_type_id">
          <el-select
            v-model="form.license_type_id"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="t in licenseTypes"
              :key="t.id"
              :value="t.id"
              :label="licenseTypeName(t)"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('license.number')" prop="number">
          <el-input v-model="form.number" />
        </el-form-item>
        <el-form-item :label="$t('license.issueDate')" prop="issue_date">
          <el-date-picker
            v-model="form.issue_date"
            type="date"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item :label="$t('license.expiryDate')" prop="expiry_date">
          <el-date-picker
            v-model="form.expiry_date"
            type="date"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item
          :label="$t('license.customAdvanceDays')"
          prop="custom_advance_days"
        >
          <el-input-number
            v-model="form.custom_advance_days"
            :min="0"
            :max="180"
          />
        </el-form-item>
        <el-form-item :label="$t('license.upload')">
          <el-upload
            class="license-uploader"
            drag
            :auto-upload="false"
            :on-change="onFileChange"
            :file-list="fileList"
            :limit="1"
            accept="image/*,.pdf"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              {{ $t("license.upload") }}<br /><em>{{
                $t("license.noFile")
              }}</em>
            </div>
          </el-upload>
          <div v-if="ocrPreview" class="ocr-preview">
            <strong>{{ $t("license.ocrResult") }}:</strong>
            <pre>{{ ocrPreview }}</pre>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{
          $t("common.cancel")
        }}</el-button>
        <el-button type="primary" :loading="saving" @click="saveLicense">{{
          $t("common.save")
        }}</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog
      v-model="batchImportDialogVisible"
      :title="$t('license.batchImport')"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="batch-import-content">
        <!-- 导入说明 -->
        <el-alert
          :title="$t('license.importInstructions')"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <template #default>
            <p>{{ $t("license.importFormat") }}</p>
            <p>
              {{ $t("license.importFields") }}: employee_id, license_type,
              number, expiry_date, issue_date, issuing_authority, file_name
            </p>
          </template>
        </el-alert>

        <!-- 文件上传区域 -->
        <el-form :model="importForm" label-width="120px">
          <el-form-item :label="$t('license.csvFile')" required>
            <el-upload
              ref="csvUpload"
              :file-list="importForm.csvFile"
              :before-upload="beforeCsvUpload"
              :on-change="handleCsvChange"
              :auto-upload="false"
              accept=".csv"
              :limit="1"
            >
              <el-button type="primary">{{
                $t("license.selectCsvFile")
              }}</el-button>
              <template #tip>
                <div class="el-upload__tip">{{ $t("license.csvFileTip") }}</div>
              </template>
            </el-upload>
          </el-form-item>

          <el-form-item :label="$t('license.attachmentZip')">
            <el-upload
              ref="zipUpload"
              :file-list="importForm.zipFile"
              :before-upload="beforeZipUpload"
              :on-change="handleZipChange"
              :auto-upload="false"
              accept=".zip"
              :limit="1"
            >
              <el-button>{{ $t("license.selectZipFile") }}</el-button>
              <template #tip>
                <div class="el-upload__tip">{{ $t("license.zipFileTip") }}</div>
              </template>
            </el-upload>
          </el-form-item>
        </el-form>

        <!-- 导入进度 -->
        <div v-if="importProgress.show" class="import-progress">
          <el-progress
            :percentage="importProgress.percentage"
            :status="importProgress.status"
          />
          <p>{{ importProgress.text }}</p>
        </div>

        <!-- 导入结果 -->
        <div v-if="importResult" class="import-result">
          <el-alert
            :type="importResult.success > 0 ? 'success' : 'error'"
            :closable="false"
          >
            <template #title>
              {{ $t("license.importComplete") }}
            </template>
            <template #default>
              <p>{{ $t("license.totalRecords") }}: {{ importResult.total }}</p>
              <p>
                {{ $t("license.successRecords") }}: {{ importResult.success }}
              </p>
              <p>
                {{ $t("license.failedRecords") }}: {{ importResult.failed }}
              </p>
            </template>
          </el-alert>

          <!-- 错误详情 -->
          <div
            v-if="importResult.errors && importResult.errors.length > 0"
            style="margin-top: 10px"
          >
            <el-collapse>
              <el-collapse-item
                :title="$t('license.errorDetails')"
                name="errors"
              >
                <el-table
                  :data="importResult.errors"
                  size="small"
                  max-height="300px"
                >
                  <el-table-column
                    prop="row"
                    :label="$t('license.rowNumber')"
                    width="80"
                  />
                  <el-table-column
                    prop="employee_id"
                    :label="$t('license.employeeId')"
                    width="120"
                  />
                  <el-table-column
                    prop="error"
                    :label="$t('license.errorMessage')"
                  />
                </el-table>
              </el-collapse-item>
            </el-collapse>
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchImportDialogVisible = false">{{
            $t("common.cancel")
          }}</el-button>
          <el-button
            type="primary"
            :loading="importing"
            :disabled="!canImport"
            @click="performBatchImport"
          >
            {{ $t("license.startImport") }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { useI18n } from "vue-i18n";
import { usePermissions } from "@/composables/usePermissions";
import { useAuthStore } from "@/stores/auth";
import { getEmployees } from "@/api/employees";
import {
  getLicenseTypes,
  getEmployeeLicenses,
  createEmployeeLicense,
  updateEmployeeLicense,
  deleteEmployeeLicense,
  getExpiringLicenses,
  uploadCreateEmployeeLicense,
  uploadUpdateEmployeeLicense,
} from "@/api/licenses";
import { UploadFilled } from "@element-plus/icons-vue";

const { locale, t } = useI18n();
const { hasPermission, userRole, isAdmin, isManager } = usePermissions();
const authStore = useAuthStore();

const employeeId = ref<string>("");
const employeeOptions = ref<any[]>([]);
const licenseTypes = ref<any[]>([]);
const licenses = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const searchText = ref("");
const statusFilter = ref("");
const typeFilter = ref<number | "">("");
const expiringAll = ref<any[]>([]);
const fileList = ref<any[]>([]);
const selectedFile = ref<File | null>(null);
const ocrPreview = ref("");

// 批量导入相关状态
const batchImportDialogVisible = ref(false);
const importing = ref(false);
const importForm = reactive({
  csvFile: [] as any[],
  zipFile: [] as any[],
});
const importProgress = reactive({
  show: false,
  percentage: 0,
  status: "" as "success" | "exception" | "",
  text: "",
});
const importResult = ref<any>(null);

const form = reactive<any>({
  license_type_id: "",
  number: "",
  issue_date: "",
  expiry_date: "",
  custom_advance_days: null,
});
const formRef = ref<FormInstance>();

const rules: FormRules = {
  license_type_id: [
    {
      required: true,
      message: t("license.type") + (t("common.required") || "*"),
      trigger: "change",
    },
  ],
  expiry_date: [
    {
      required: true,
      message: t("license.expiryDate") + (t("common.required") || "*"),
      trigger: "change",
    },
  ],
};

const currentEmployeeName = computed(() => {
  const emp = employeeOptions.value.find(
    (e) => e.employee_id === employeeId.value,
  );
  return emp ? emp.first_name + " " + emp.last_name : "";
});

// 批量导入计算属性
const canImport = computed(() => {
  return importForm.csvFile.length > 0 && !importing.value;
});

const dialogTitle = computed(() =>
  editingId.value ? t("license.edit") : t("license.add"),
);

function licenseTypeName(t: any) {
  const isZh = (locale.value || "").startsWith("zh");
  return isZh ? t.name_zh || t.name_en : t.name_en;
}
function empLabel(emp: any) {
  return `${emp.employee_id} - ${emp.first_name} ${emp.last_name}`;
}

function decorateLicense(r: any) {
  const days = r.days_remaining;
  let statusTag = "";
  if (r.status === "expired") statusTag = "danger";
  else if (r.status === "expiring")
    statusTag = days <= 7 ? "danger" : days <= 14 ? "warning" : "info";
  else statusTag = "success";
  const isZh = (locale.value || "").startsWith("zh");
  const licenseName = isZh
    ? r.LicenseType?.name_zh || r.LicenseType?.name_en
    : r.LicenseType?.name_en || r.LicenseType?.name_zh;
  const statusLabel =
    r.status === "expired"
      ? t("license.expired")
      : r.status === "expiring"
        ? t("license.expiringSoon")
        : t("license.normal");
  return { ...r, licenseName, statusTag, statusLabel };
}

const filteredLicenses = computed(() => {
  return licenses.value.filter((l) => {
    if (
      searchText.value &&
      !(
        `${l.number || ""}`
          .toLowerCase()
          .includes(searchText.value.toLowerCase()) ||
        `${l.licenseName || ""}`
          .toLowerCase()
          .includes(searchText.value.toLowerCase())
      )
    )
      return false;
    if (statusFilter.value && l.status !== statusFilter.value) return false;
    if (typeFilter.value && l.license_type_id !== typeFilter.value)
      return false;
    return true;
  });
});

async function loadEmployees() {
  const res = await getEmployees({ page: 1, limit: 500 });
  employeeOptions.value = res.data.employees || res.data;
}
async function loadLicenseTypes() {
  try {
    const res = await getLicenseTypes();
    licenseTypes.value = res.data;
  } catch (error) {
    console.error("Failed to load license types:", error);
    ElMessage({ message: "加载许可证类型失败", type: "error" });
  }
}
async function loadEmployeeLicenses() {
  if (!employeeId.value) return;
  loading.value = true;
  try {
    const res = await getEmployeeLicenses(employeeId.value);
    // 后端返回 list 需要客户端补充 status/days 逻辑 -> 需要调用 expiring endpoint or 现有数据加入
    // 这里直接重新计算
    const today = new Date();
    licenses.value = res.data.map((r: any) => {
      const exp = new Date(r.expiry_date);
      const diff = Math.floor(
        (exp.getTime() - today.getTime()) / (24 * 3600 * 1000),
      );
      const advance =
        r.custom_advance_days || r.LicenseType?.default_advance_days || 30;
      let status = "normal";
      if (diff < 0) status = "expired";
      else if (diff <= advance) status = "expiring";
      return decorateLicense({ ...r, days_remaining: diff, status });
    });
  } finally {
    loading.value = false;
  }
}
async function loadExpiringAll() {
  const res = await getExpiringLicenses({
    within: 60,
    limit: 50,
    sortBy: "expiry_date",
    sortOrder: "ASC",
  });
  const isZh = (locale.value || "").startsWith("zh");
  const licenses = res.data?.licenses || res.data || []; // 兼容新旧API格式
  expiringAll.value = licenses.map((r: any) => {
    const days = r.days_remaining;
    let statusTag = "";
    if (r.status === "expired") statusTag = "danger";
    else if (r.status === "expiring")
      statusTag = days <= 7 ? "danger" : days <= 14 ? "warning" : "info";
    else statusTag = "success";
    const licenseName = isZh
      ? r.license?.name_zh || r.license?.name_en
      : r.license?.name_en || r.license?.name_zh;
    const statusLabel =
      r.status === "expired"
        ? t("license.expired")
        : r.status === "expiring"
          ? t("license.expiringSoon")
          : t("license.normal");
    return { ...r, licenseName, statusTag, statusLabel };
  });
}

function openAddDialog() {
  editingId.value = null;
  Object.assign(form, {
    license_type_id: "",
    number: "",
    issue_date: "",
    expiry_date: "",
    custom_advance_days: null,
  });
  selectedFile.value = null;
  fileList.value = [];
  ocrPreview.value = "";
  dialogVisible.value = true;
}
function editLicense(row: any) {
  editingId.value = row.employee_license_id || row.id;
  Object.assign(form, {
    license_type_id: row.license_type_id,
    number: row.number,
    issue_date: row.issue_date,
    expiry_date: row.expiry_date,
    custom_advance_days: row.custom_advance_days,
  });
  selectedFile.value = null;
  fileList.value = [];
  ocrPreview.value = row.ocr_raw_text || "";
  dialogVisible.value = true;
}
function onFileChange(file: any) {
  selectedFile.value = file.raw;
  ocrPreview.value = ""; // 上传前清空，后端返回再刷新（当前后端直接创建返回，只能在保存后重新加载）
}

// 覆盖 saveLicense 逻辑支持文件
async function saveLicense() {
  if (!employeeId.value) return;
  await formRef.value?.validate(async (valid) => {
    if (!valid) return;
    saving.value = true;
    try {
      if (selectedFile.value) {
        const fd = new FormData();
        fd.append("license_type_id", form.license_type_id);
        if (form.number) fd.append("number", form.number);
        if (form.issue_date) fd.append("issue_date", form.issue_date);
        fd.append("expiry_date", form.expiry_date);
        if (form.custom_advance_days != null)
          fd.append("custom_advance_days", form.custom_advance_days);
        fd.append("file", selectedFile.value);
        if (editingId.value) {
          await uploadUpdateEmployeeLicense(editingId.value, fd);
        } else {
          await uploadCreateEmployeeLicense(employeeId.value, fd);
        }
      } else {
        if (editingId.value) {
          await updateEmployeeLicense(editingId.value, form);
        } else {
          await createEmployeeLicense(employeeId.value, form);
        }
      }
      ElMessage({ message: t("common.save"), type: "success" });
      dialogVisible.value = false;
      selectedFile.value = null;
      fileList.value = [];
      loadEmployeeLicenses();
      loadExpiringAll();
    } catch (error: any) {
      console.error("保存证件失败:", error);
      let errorMessage = "保存失败";

      // 处理不同类型的错误
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      // 特定错误消息的国际化处理
      if (
        errorMessage.includes("File too large") ||
        errorMessage.includes("文件过大")
      ) {
        errorMessage =
          t("license.fileTooLarge") ||
          "File too large, please select a file smaller than 5MB";
      } else if (
        errorMessage.includes("不支持的文件类型") ||
        errorMessage.includes("Unsupported file type")
      ) {
        errorMessage =
          t("license.unsupportedFileType") ||
          "Unsupported file type, please upload image or PDF files";
      } else if (errorMessage.includes("license_type_id required")) {
        errorMessage =
          t("license.licenseTypeRequired") || "Please select certificate type";
      } else if (errorMessage.includes("expiry_date required")) {
        errorMessage =
          t("license.expiryDateRequired") || "Please select expiry date";
      }

      ElMessage({ message: errorMessage, type: "error" });
    } finally {
      saving.value = false;
    }
  });
}
async function deleteLicense(row: any) {
  try {
    await ElMessageBox.confirm(
      t("license.deleteConfirm"),
      t("common.confirm"),
      { type: "warning" },
    );
    await deleteEmployeeLicense(row.employee_license_id || row.id);
    ElMessage({ message: t("common.delete"), type: "success" });
    loadEmployeeLicenses();
    loadExpiringAll(); // 同时刷新即将到期列表
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("删除证件失败:", error);
      let errorMessage = "删除失败";

      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      // 特定错误处理
      if (
        errorMessage.includes("not found") ||
        errorMessage.includes("不存在")
      ) {
        errorMessage = "证件不存在或已被删除";
      } else if (
        errorMessage.includes("permission") ||
        errorMessage.includes("权限")
      ) {
        errorMessage = "没有权限删除此证件";
      }

      ElMessage({ message: errorMessage, type: "error" });
    }
  }
}

function previewFile(row: any) {
  if (!row.file_url) return;
  const url = row.file_url;
  if (/\.(png|jpg|jpeg|gif)$/i.test(url)) {
    window.open(url, "_blank");
  } else if (/\.pdf$/i.test(url)) {
    window.open(url, "_blank");
  } else {
    window.open(url, "_blank");
  }
}

// 批量导入方法
function openBatchImportDialog() {
  batchImportDialogVisible.value = true;
  importForm.csvFile = [];
  importForm.zipFile = [];
  importProgress.show = false;
  importProgress.percentage = 0;
  importProgress.status = "";
  importProgress.text = "";
  importResult.value = null;
}

function beforeCsvUpload(file: File) {
  const isCSV = file.type === "text/csv" || file.name.endsWith(".csv");
  if (!isCSV) {
    ElMessage({ message: t("license.csvFileTypeError"), type: "error" });
    return false;
  }
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    ElMessage({ message: t("license.fileSizeLimit"), type: "error" });
    return false;
  }
  return false; // 阻止自动上传
}

function handleCsvChange(file: any) {
  importForm.csvFile = [file];
}

function beforeZipUpload(file: File) {
  const isZIP = file.type === "application/zip" || file.name.endsWith(".zip");
  if (!isZIP) {
    ElMessage({ message: t("license.zipFileTypeError"), type: "error" });
    return false;
  }
  const isLt100M = file.size / 1024 / 1024 < 100;
  if (!isLt100M) {
    ElMessage({ message: t("license.zipFileSizeLimit"), type: "error" });
    return false;
  }
  return false; // 阻止自动上传
}

function handleZipChange(file: any) {
  importForm.zipFile = [file];
}

async function performBatchImport() {
  if (!canImport.value) return;

  importing.value = true;
  importProgress.show = true;
  importProgress.percentage = 0;
  importProgress.status = "";
  importProgress.text = t("license.preparingImport");
  importResult.value = null;

  try {
    const formData = new FormData();

    // 添加 CSV 文件
    if (importForm.csvFile.length > 0) {
      formData.append("csv", importForm.csvFile[0].raw);
    }

    // 添加 ZIP 文件（如果有）
    if (importForm.zipFile.length > 0) {
      formData.append("attachments", importForm.zipFile[0].raw);
    }

    importProgress.percentage = 20;
    importProgress.text = t("license.uploadingFiles");

    // 调用批量导入 API
    const response = await fetch("/api/v1/licenses/import", {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    importProgress.percentage = 80;
    importProgress.text = t("license.processingData");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    importProgress.percentage = 100;
    importProgress.status = result.success ? "success" : "exception";
    importProgress.text = t("license.importComplete");

    // 显示导入结果
    importResult.value = {
      total: result.data.total || 0,
      success: result.data.success || 0,
      failed: result.data.failed || 0,
      errors: result.data.errors || [],
    };

    if (result.success) {
      ElMessage({ message: t("license.importSuccess"), type: "success" });
      // 刷新数据
      if (employeeId.value) {
        loadEmployeeLicenses();
      }
      loadExpiringAll();
    } else {
      ElMessage({
        message: result.message || t("license.importFailed"),
        type: "error",
      });
    }
  } catch (error: any) {
    console.error("Batch import error:", error);
    importProgress.status = "exception";
    importProgress.text = t("license.importError");

    let errorMessage = t("license.importError");

    // 处理不同类型的错误
    if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error?.message) {
      if (error.message.includes("HTTP 413")) {
        errorMessage =
          t("license.fileTooLarge") ||
          "File too large, please reduce file size and try again";
      } else if (error.message.includes("HTTP 400")) {
        errorMessage = "文件格式错误，请检查CSV格式是否正确";
      } else if (error.message.includes("HTTP 401")) {
        errorMessage = "登录已过期，请重新登录";
      } else if (error.message.includes("HTTP 403")) {
        errorMessage = "没有权限执行批量导入操作";
      } else if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("Network")
      ) {
        errorMessage =
          t("license.networkError") ||
          "Network connection failed, please check your connection and try again";
      } else {
        errorMessage = error.message;
      }
    }

    ElMessage({ message: errorMessage, type: "error" });
  } finally {
    importing.value = false;
  }
}

onMounted(() => {
  loadLicenseTypes();
  loadExpiringAll();

  if (hasPermission("LICENSE_VIEW_ALL")) {
    // 管理员和经理可以查看所有员工证件
    loadEmployees();
  } else {
    // 普通员工只能查看自己的证件
    if (authStore.user?.employee_id) {
      employeeId.value = authStore.user.employee_id;
      loadEmployeeLicenses();
    }
  }
});
</script>

<style scoped>
.license-management {
  padding: 20px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.page-header .actions > * {
  margin-left: 8px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.ocr-preview {
  background: #f5f7fa;
  padding: 8px;
  margin-top: 8px;
  max-height: 150px;
  overflow: auto;
  font-size: 12px;
}

/* 批量导入样式 */
.batch-import-content {
  padding: 10px 0;
}
.import-progress {
  margin: 20px 0;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}
.import-result {
  margin: 20px 0;
  padding: 15px;
  border-radius: 4px;
}
.import-result .el-collapse {
  margin-top: 10px;
}
.import-result .el-table {
  background: transparent;
}
</style>
