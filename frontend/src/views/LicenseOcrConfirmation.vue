<template>
  <div class="ocr-confirmation">
    <div class="page-header">
      <h2>{{ $t("license.ocrConfirmation") }}</h2>
      <div class="actions">
        <el-button
          type="success"
          :disabled="!hasSelected"
          @click="batchConfirmSelected"
        >
          {{ $t("license.batchConfirm") }}
        </el-button>
        <el-button
          type="warning"
          :disabled="!hasSelected"
          @click="batchRejectSelected"
        >
          {{ $t("license.batchReject") }}
        </el-button>
        <el-button @click="loadPendingLicenses">
          {{ $t("common.refresh") }}
        </el-button>
      </div>
    </div>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ $t("license.pendingOcrRecords") }} ({{ total }})</span>
          <el-checkbox v-model="selectAll" @change="handleSelectAll">{{
            $t("common.selectAll")
          }}</el-checkbox>
        </div>
      </template>
      <el-table
        v-loading="loading"
        :data="licenses"
        style="width: 100%"
        :row-class-name="getRowClassName"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column
          prop="employee_name"
          :label="$t('license.employee')"
          width="140"
        >
          <template #default="scope">
            <div class="employee-info">
              <span
                >{{ scope.row.Employee?.first_name }}
                {{ scope.row.Employee?.last_name }}</span
              >
              <el-icon
                v-if="scope.row.parse_confidence < 0.5"
                class="low-confidence-icon"
                color="#f56c6c"
              >
                <Warning />
              </el-icon>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          prop="license_type"
          :label="$t('license.type')"
          width="180"
        >
          <template #default="scope">
            {{ getLicenseTypeName(scope.row.LicenseType) }}
          </template>
        </el-table-column>

        <el-table-column
          prop="number"
          :label="$t('license.number')"
          width="150"
        />

        <el-table-column
          prop="current_expiry"
          :label="$t('license.currentExpiry')"
          width="120"
        >
          <template #default="scope">
            {{ scope.row.expiry_date }}
          </template>
        </el-table-column>

        <el-table-column
          prop="parsed_expiry"
          :label="$t('license.parsedExpiry')"
          width="120"
        >
          <template #default="scope">
            <div class="parsed-expiry-cell">
              <span :class="getParsedExpiryClass(scope.row)">
                {{ scope.row.parsed_expiry_date || "--" }}
              </span>
              <el-tooltip
                v-if="scope.row.parse_confidence < 0.6"
                :content="$t('license.lowConfidenceWarning')"
                placement="top"
              >
                <el-icon class="confidence-warning-icon" color="#e6a23c">
                  <QuestionFilled />
                </el-icon>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          prop="confidence"
          :label="$t('license.confidence')"
          width="100"
        >
          <template #default="scope">
            <div class="confidence-cell">
              <el-tag
                :type="getConfidenceTagType(scope.row.parse_confidence)"
                size="small"
              >
                {{ Math.round((scope.row.parse_confidence || 0) * 100) }}%
              </el-tag>
              <el-progress
                v-if="scope.row.parse_confidence !== null"
                :percentage="
                  Math.round((scope.row.parse_confidence || 0) * 100)
                "
                :stroke-width="4"
                :show-text="false"
                :color="getConfidenceColor(scope.row.parse_confidence)"
                style="margin-top: 4px"
              />
            </div>
          </template>
        </el-table-column>

        <el-table-column
          prop="ocr_status"
          :label="$t('license.ocrStatus')"
          width="120"
        >
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.ocr_status)" size="small">
              {{ getStatusLabel(scope.row.ocr_status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="$t('license.ocrPreview')" width="200">
          <template #default="scope">
            <el-popover placement="left" :width="400" trigger="click">
              <template #reference>
                <el-button size="small" type="info">{{
                  $t("license.viewOcrText")
                }}</el-button>
              </template>
              <div class="ocr-text-preview">
                <strong>{{ $t("license.ocrRawText") }}:</strong>
                <pre class="ocr-raw-text">{{
                  scope.row.ocr_raw_text || $t("license.noOcrText")
                }}</pre>
              </div>
            </el-popover>
          </template>
        </el-table-column>

        <el-table-column
          :label="$t('common.actions')"
          width="300"
          fixed="right"
        >
          <template #default="scope">
            <el-button
              size="small"
              type="success"
              @click="confirmSingle(scope.row, 'confirm')"
            >
              {{ $t("license.confirm") }}
            </el-button>
            <el-button
              size="small"
              type="warning"
              @click="openModifyDialog(scope.row)"
            >
              {{ $t("license.modify") }}
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="confirmSingle(scope.row, 'reject')"
            >
              {{ $t("license.reject") }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div style="margin-top: 20px; text-align: right">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadPendingLicenses"
          @current-change="loadPendingLicenses"
        />
      </div>
    </el-card>

    <!-- 修改日期对话框 -->
    <el-dialog
      v-model="modifyDialogVisible"
      :title="$t('license.modifyExpiry')"
      width="400px"
    >
      <el-form :model="modifyForm" label-width="120px">
        <el-form-item :label="$t('license.employee')">
          <span
            >{{ currentLicense?.Employee?.first_name }}
            {{ currentLicense?.Employee?.last_name }}</span
          >
        </el-form-item>
        <el-form-item :label="$t('license.type')">
          <span>{{ getLicenseTypeName(currentLicense?.LicenseType) }}</span>
        </el-form-item>
        <el-form-item :label="$t('license.parsedExpiry')">
          <span>{{ currentLicense?.parsed_expiry_date || "--" }}</span>
        </el-form-item>
        <el-form-item :label="$t('license.newExpiry')" required>
          <el-date-picker
            v-model="modifyForm.expiry_date"
            type="date"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item :label="$t('license.notes')">
          <el-input
            v-model="modifyForm.notes"
            type="textarea"
            :rows="3"
            :placeholder="$t('license.modifyReason')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="modifyDialogVisible = false">{{
          $t("common.cancel")
        }}</el-button>
        <el-button type="primary" :loading="modifying" @click="confirmModify">
          {{ $t("common.confirm") }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Warning, QuestionFilled } from "@element-plus/icons-vue";
import { useI18n } from "vue-i18n";
import { usePermissions } from "@/composables/usePermissions";
import {
  getPendingOcrLicenses,
  confirmOcrResult,
  batchConfirmOcr,
} from "@/api/licenses";

const { locale, t } = useI18n();
const { hasPermission } = usePermissions();

// 响应式数据
const loading = ref(false);
const modifying = ref(false);
const licenses = ref<any[]>([]);
const selectedLicenses = ref<any[]>([]);
const selectAll = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

const modifyDialogVisible = ref(false);
const currentLicense = ref<any>(null);
const modifyForm = reactive({
  expiry_date: "",
  notes: "",
});

// 计算属性
const hasSelected = computed(() => selectedLicenses.value.length > 0);

// 方法
function getLicenseTypeName(licenseType: any) {
  if (!licenseType) return "";
  const isZh = (locale.value || "").startsWith("zh");
  return isZh
    ? licenseType.name_zh || licenseType.name_en
    : licenseType.name_en;
}

function getConfidenceTagType(confidence: number) {
  if (confidence >= 0.8) return "success";
  if (confidence >= 0.6) return "warning";
  return "danger";
}

function getStatusTagType(status: string) {
  switch (status) {
    case "parsed":
      return "success";
    case "low_confidence":
      return "warning";
    case "confirmed":
      return "success";
    case "rejected":
      return "danger";
    default:
      return "info";
  }
}

function getStatusLabel(status: string) {
  return t(`license.ocrStatus.${status}`);
}

function getRowClassName({ row }: { row: any }) {
  if (row.parse_confidence < 0.5) {
    return "very-low-confidence-row";
  } else if (row.parse_confidence < 0.7) {
    return "low-confidence-row";
  }
  return "";
}

function getParsedExpiryClass(row: any) {
  if (!row.parsed_expiry_date) return "text-gray";
  if (row.parse_confidence < 0.6) return "text-warning";
  if (row.parse_confidence < 0.8) return "text-warning";
  return "text-success";
}

function getConfidenceColor(confidence: number) {
  if (confidence >= 0.8) return "#67c23a"; // green
  if (confidence >= 0.6) return "#e6a23c"; // orange
  return "#f56c6c"; // red
}

async function loadPendingLicenses() {
  loading.value = true;
  try {
    const response = await getPendingOcrLicenses({
      page: currentPage.value,
      limit: pageSize.value,
    });
    licenses.value = response.data.licenses;
    total.value = response.data.total;
  } catch (error) {
    console.error("加载待确认OCR记录失败:", error);
    ElMessage({ message: t("license.loadOcrFailed"), type: "error" });
  } finally {
    loading.value = false;
  }
}

function handleSelectionChange(selection: any[]) {
  selectedLicenses.value = selection;
  selectAll.value = selection.length === licenses.value.length;
}

function handleSelectAll() {
  // Element Plus 的表格组件会自动处理全选
}

async function confirmSingle(license: any, action: "confirm" | "reject") {
  try {
    const actionText =
      action === "confirm" ? t("license.confirm") : t("license.reject");
    await ElMessageBox.confirm(
      t("license.confirmOcrAction", { action: actionText }),
      t("common.confirm"),
      { type: "warning" },
    );

    await confirmOcrResult(license.employee_license_id, { action });
    ElMessage({
      message: t("license.ocrActionSuccess", { action: actionText }),
      type: "success",
    });
    loadPendingLicenses();
  } catch (error: any) {
    if (error === "cancel") return;
    console.error("OCR确认失败:", error);
    ElMessage({ message: t("license.ocrActionFailed"), type: "error" });
  }
}

function openModifyDialog(license: any) {
  currentLicense.value = license;
  modifyForm.expiry_date = license.parsed_expiry_date || license.expiry_date;
  modifyForm.notes = "";
  modifyDialogVisible.value = true;
}

async function confirmModify() {
  if (!modifyForm.expiry_date) {
    ElMessage({ message: t("license.expiryDateRequired"), type: "error" });
    return;
  }

  modifying.value = true;
  try {
    await confirmOcrResult(currentLicense.value.employee_license_id, {
      action: "modify",
      expiry_date: modifyForm.expiry_date,
      notes: modifyForm.notes,
    });
    ElMessage({ message: t("license.modifySuccess"), type: "success" });
    modifyDialogVisible.value = false;
    loadPendingLicenses();
  } catch (error) {
    console.error("修改到期日期失败:", error);
    ElMessage({ message: t("license.modifyFailed"), type: "error" });
  } finally {
    modifying.value = false;
  }
}

async function batchConfirmSelected() {
  if (selectedLicenses.value.length === 0) return;

  try {
    await ElMessageBox.confirm(
      t("license.batchConfirmWarning", {
        count: selectedLicenses.value.length,
      }),
      t("common.confirm"),
      { type: "warning" },
    );

    const licenses = selectedLicenses.value.map((license) => ({
      id: license.employee_license_id,
      action: "confirm" as const,
    }));

    await batchConfirmOcr(licenses);
    ElMessage({ message: t("license.batchConfirmSuccess"), type: "success" });
    loadPendingLicenses();
  } catch (error: any) {
    if (error === "cancel") return;
    console.error("批量确认失败:", error);
    ElMessage({ message: t("license.batchConfirmFailed"), type: "error" });
  }
}

async function batchRejectSelected() {
  if (selectedLicenses.value.length === 0) return;

  try {
    await ElMessageBox.confirm(
      t("license.batchRejectWarning", { count: selectedLicenses.value.length }),
      t("common.confirm"),
      { type: "warning" },
    );

    const licenses = selectedLicenses.value.map((license) => ({
      id: license.employee_license_id,
      action: "reject" as const,
    }));

    await batchConfirmOcr(licenses);
    ElMessage({ message: t("license.batchRejectSuccess"), type: "success" });
    loadPendingLicenses();
  } catch (error: any) {
    if (error === "cancel") return;
    console.error("批量拒绝失败:", error);
    ElMessage({ message: t("license.batchRejectFailed"), type: "error" });
  }
}

onMounted(() => {
  loadPendingLicenses();
});
</script>

<style scoped>
.ocr-confirmation {
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text-warning {
  color: #e6a23c;
  font-weight: bold;
}

.text-success {
  color: #67c23a;
  font-weight: bold;
}

.text-gray {
  color: #909399;
}

.ocr-text-preview {
  max-height: 300px;
  overflow-y: auto;
}

.ocr-raw-text {
  background: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
}

/* Enhanced styles for low confidence OCR results */
:deep(.very-low-confidence-row) {
  background-color: #fef0f0 !important;
  border-left: 4px solid #f56c6c;
}

:deep(.low-confidence-row) {
  background-color: #fdf6ec !important;
  border-left: 4px solid #e6a23c;
}

.employee-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.low-confidence-icon {
  font-size: 16px;
  animation: pulse 2s infinite;
}

.parsed-expiry-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.confidence-warning-icon {
  font-size: 14px;
}

.confidence-cell {
  min-width: 80px;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
</style>
