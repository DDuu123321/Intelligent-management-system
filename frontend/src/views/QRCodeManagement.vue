<template>
  <div class="qrcode-management">
    <div class="header-section">
      <h2>{{ $t("qrManagement.title") }}</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        {{ $t("qrManagement.createNew") }}
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ stats.total_qrcodes }}</div>
              <div class="stat-label">
                {{ $t("qrManagement.totalQRCodes") }}
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ stats.active_qrcodes }}</div>
              <div class="stat-label">
                {{ $t("qrManagement.activeQRCodes") }}
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ stats.today_scans }}</div>
              <div class="stat-label">{{ $t("qrManagement.todayScans") }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ stats.today_checkins }}</div>
              <div class="stat-label">
                {{ $t("qrManagement.todayCheckins") }}
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <el-form inline>
        <el-form-item :label="$t('qrManagement.worksite')">
          <el-select
            v-model="filterForm.worksite_id"
            :placeholder="$t('qrManagement.selectWorksite')"
            clearable
          >
            <el-option
              v-for="site in worksites"
              :key="site.worksite_id"
              :label="site.name"
              :value="site.worksite_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('qrManagement.statusFilter')">
          <el-select
            v-model="filterForm.is_active"
            :placeholder="$t('qrManagement.selectStatus')"
            clearable
          >
            <el-option :label="$t('qrManagement.active')" :value="true" />
            <el-option :label="$t('qrManagement.disabled')" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadQRCodes">{{
            $t("qrManagement.query")
          }}</el-button>
          <el-button @click="resetFilter">{{
            $t("qrManagement.reset")
          }}</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 二维码列表 -->
    <div class="table-section">
      <el-table v-loading="loading" :data="qrcodes" stripe>
        <el-table-column
          prop="worksite_name"
          :label="$t('qrManagement.worksiteName')"
          width="200"
        />
        <el-table-column :label="$t('qrManagement.qrCode')" width="120">
          <template #default="{ row }">
            <el-button size="small" @click="showQRCode(row)">
              <el-icon><ViewIcon /></el-icon>
              {{ $t("qrManagement.view") }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column
          prop="radius"
          :label="$t('qrManagement.validRange')"
          width="100"
        >
          <template #default="{ row }">
            {{ row.radius }}{{ $t("qrManagement.meters") }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('qrManagement.configuration')" width="150">
          <template #default="{ row }">
            <div class="config-tags">
              <el-tag v-if="row.require_gps" size="small" type="success"
                >GPS</el-tag
              >
              <el-tag v-if="row.require_photo" size="small" type="warning"
                >拍照</el-tag
              >
              <el-tag
                v-if="row.face_verification_enabled"
                size="small"
                type="danger"
                >人脸</el-tag
              >
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('qrManagement.usageStats')" width="120">
          <template #default="{ row }">
            <div class="usage-stats">
              <div>{{ $t("qrManagement.scans") }}: {{ row.scan_count }}</div>
              <div>
                {{ $t("qrManagement.checkins") }}: {{ row.successful_checkins }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="last_used_at"
          :label="$t('qrManagement.lastUsed')"
          width="150"
        >
          <template #default="{ row }">
            {{
              row.last_used_at
                ? formatTime(row.last_used_at)
                : $t("qrManagement.notUsed")
            }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.status')" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'danger'" size="small">
              {{
                row.is_active
                  ? $t("qrManagement.active")
                  : $t("qrManagement.disabled")
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('qrManagement.operations')"
          width="200"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button size="small" @click="editQRCode(row)">{{
              $t("qrManagement.edit")
            }}</el-button>
            <el-button size="small" @click="viewCheckins(row)">{{
              $t("qrManagement.checkinRecords")
            }}</el-button>
            <el-button
              size="small"
              :type="row.is_active ? 'danger' : 'success'"
              @click="toggleStatus(row)"
            >
              {{
                row.is_active
                  ? $t("qrManagement.disable")
                  : $t("qrManagement.enable")
              }}
            </el-button>
            <el-button size="small" type="danger" @click="deleteQRCode(row)">
              {{ $t("common.delete") }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadQRCodes"
          @current-change="loadQRCodes"
        />
      </div>
    </div>

    <!-- 创建/编辑二维码对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="
        editingQRCode
          ? $t('qrManagement.editQRCode')
          : $t('qrManagement.createQRCode')
      "
      width="600px"
    >
      <el-form
        ref="qrcodeFormRef"
        :model="qrcodeForm"
        :rules="qrcodeRules"
        label-width="120px"
      >
        <el-form-item :label="$t('qrManagement.worksite')" prop="worksite_id">
          <el-select
            v-model="qrcodeForm.worksite_id"
            :placeholder="$t('qrManagement.selectWorksite')"
            style="width: 100%"
            @change="onWorksiteChange"
          >
            <el-option
              v-for="site in worksites"
              :key="site.worksite_id"
              :label="site.name"
              :value="site.worksite_id"
            />
          </el-select>
        </el-form-item>

        <el-form-item
          :label="$t('qrManagement.worksiteName')"
          prop="worksite_name"
        >
          <el-input
            v-model="qrcodeForm.worksite_name"
            :placeholder="$t('qrManagement.worksiteNamePlaceholder')"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item
              :label="$t('qrManagement.centerLatitude')"
              prop="center_latitude"
            >
              <el-input-number
                v-model="qrcodeForm.center_latitude"
                :precision="8"
                :step="0.00001"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              :label="$t('qrManagement.centerLongitude')"
              prop="center_longitude"
            >
              <el-input-number
                v-model="qrcodeForm.center_longitude"
                :precision="8"
                :step="0.00001"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item :label="$t('qrManagement.validRadius')" prop="radius">
          <el-input-number
            v-model="qrcodeForm.radius"
            :min="10"
            :max="1000"
            :step="10"
          />
          {{ $t("qrManagement.meters") }}
        </el-form-item>

        <el-form-item :label="$t('qrManagement.configuration')">
          <el-checkbox-group v-model="verificationOptions">
            <el-checkbox label="require_gps">{{
              $t("qrManagement.requireGPS")
            }}</el-checkbox>
            <el-checkbox label="require_photo">{{
              $t("qrManagement.requirePhoto")
            }}</el-checkbox>
            <el-checkbox label="face_verification_enabled">{{
              $t("qrManagement.faceVerification")
            }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item :label="$t('common.timeRestriction')">
          <el-checkbox
            v-model="qrcodeForm.allow_checkin_anytime"
            :label="$t('qrManagement.allowAnytimeCheckin')"
          />
        </el-form-item>

        <el-row v-if="!qrcodeForm.allow_checkin_anytime" :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('qrManagement.workTimeStart')">
              <el-time-picker
                v-model="qrcodeForm.work_start_time"
                format="HH:mm:ss"
                value-format="HH:mm:ss"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('qrManagement.workTimeEnd')">
              <el-time-picker
                v-model="qrcodeForm.work_end_time"
                format="HH:mm:ss"
                value-format="HH:mm:ss"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item :label="$t('common.description')">
          <el-input
            v-model="qrcodeForm.description"
            type="textarea"
            :rows="3"
            :placeholder="$t('common.descriptionPlaceholder')"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">{{
          $t("qrManagement.cancel")
        }}</el-button>
        <el-button type="primary" :loading="saving" @click="saveQRCode">
          {{ editingQRCode ? $t("common.update") : $t("common.create") }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 二维码显示对话框 -->
    <el-dialog
      v-model="showQRDialog"
      :title="$t('qrManagement.viewQRCode')"
      width="400px"
      center
    >
      <div class="qrcode-display">
        <div class="qrcode-info">
          <h3>{{ currentQRCode?.worksite_name }}</h3>
          <p>
            {{ $t("qrManagement.validRange") }}: {{ currentQRCode?.radius
            }}{{ $t("qrManagement.meters") }}
          </p>
          <p>
            {{ $t("common.createTime") }}:
            {{ currentQRCode ? formatTime(currentQRCode.created_at) : "" }}
          </p>
        </div>
        <div class="qrcode-image">
          <img
            v-if="currentQRCode?.qr_data"
            :src="currentQRCode.qr_data"
            :alt="$t('qrManagement.qrCode')"
          />
        </div>
        <div class="qrcode-url">
          <el-input :value="currentQRCode?.qr_url" readonly class="url-input">
            <template #append>
              <el-button @click="copyURL">{{
                $t("qrManagement.copyUrl")
              }}</el-button>
            </template>
          </el-input>
        </div>
      </div>
    </el-dialog>

    <!-- 签到记录对话框 -->
    <el-dialog
      v-model="showCheckinsDialog"
      :title="$t('qrManagement.checkinRecords')"
      width="80%"
    >
      <el-table v-loading="loadingCheckins" :data="checkinRecords" stripe>
        <el-table-column
          prop="employee_name"
          :label="$t('employee.name')"
          width="120"
        />
        <el-table-column
          prop="phone_number"
          :label="$t('employee.phone')"
          width="120"
        />
        <el-table-column
          prop="checkin_type"
          :label="$t('qrCheckin.checkinType')"
          width="100"
        >
          <template #default="{ row }">
            <el-tag
              :type="row.checkin_type === 'in' ? 'success' : 'danger'"
              size="small"
            >
              {{
                row.checkin_type === "in"
                  ? $t("qrCheckin.checkinIn")
                  : $t("qrCheckin.checkinOut")
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="checkin_time"
          :label="$t('common.checkinTime')"
          width="160"
        >
          <template #default="{ row }">
            {{ formatTime(row.checkin_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" :label="$t('common.status')" width="100">
          <template #default="{ row }">
            <el-tag
              :type="
                row.status === 'approved'
                  ? 'success'
                  : row.status === 'rejected'
                    ? 'danger'
                    : 'warning'
              "
              size="small"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="distance_from_worksite"
          :label="$t('common.distance')"
          width="80"
        >
          <template #default="{ row }">
            {{
              row.distance_from_worksite
                ? `${row.distance_from_worksite}${$t("qrManagement.meters")}`
                : "-"
            }}
          </template>
        </el-table-column>
        <el-table-column prop="is_suspicious" label="异常标记" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.is_suspicious" type="danger" size="small"
              >异常</el-tag
            >
            <el-tag v-else type="success" size="small">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" @click="viewCheckinDetail(row)">{{
              $t("common.detail")
            }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { ref, reactive, onMounted, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useI18n } from "vue-i18n";
import { Plus, View as ViewIcon } from "@element-plus/icons-vue";
import request from "@/utils/request";
import { getQRCodes, createQRCode, updateQRCode } from "@/api/qrcode";
import { getWorksites } from "@/api/worksites";

export default {
  name: "QRCodeManagement",
  components: {
    Plus,
    ViewIcon,
  },
  setup() {
    const { t } = useI18n();

    // 响应式数据
    const loading = ref(false);
    const saving = ref(false);
    const loadingCheckins = ref(false);
    const qrcodes = ref([]);
    const worksites = ref([]);
    const checkinRecords = ref([]);

    const stats = reactive({
      total_qrcodes: 0,
      active_qrcodes: 0,
      today_scans: 0,
      today_checkins: 0,
    });

    const pagination = reactive({
      page: 1,
      limit: 10,
      total: 0,
    });

    const filterForm = reactive({
      worksite_id: "",
      is_active: null,
    });

    // 对话框控制
    const showCreateDialog = ref(false);
    const showQRDialog = ref(false);
    const showCheckinsDialog = ref(false);
    const editingQRCode = ref(null);
    const currentQRCode = ref(null);

    // 表单数据
    const qrcodeForm = reactive({
      worksite_id: "",
      worksite_name: "",
      center_latitude: null,
      center_longitude: null,
      radius: 100,
      require_photo: true,
      require_gps: true,
      face_verification_enabled: false,
      allow_checkin_anytime: true,
      work_start_time: null,
      work_end_time: null,
      description: "",
    });

    const verificationOptions = ref(["require_gps", "require_photo"]);

    const qrcodeRules = {
      worksite_id: [
        { required: true, message: "请选择工地", trigger: "change" },
      ],
      worksite_name: [
        { required: true, message: "请输入工地名称", trigger: "blur" },
      ],
      center_latitude: [
        { required: true, message: "请输入纬度", trigger: "blur" },
      ],
      center_longitude: [
        { required: true, message: "请输入经度", trigger: "blur" },
      ],
      radius: [{ required: true, message: "请输入有效范围", trigger: "blur" }],
    };

    const qrcodeFormRef = ref(null);

    // 方法
    const loadStats = async () => {
      try {
        // 调用实际的API获取统计数据
        const response = await request.get("/qrcode/stats");

        if (response.success) {
          Object.assign(stats, response.data);
        } else {
          ElMessage({ message: "加载统计数据失败", type: "error" });
        }
      } catch (err) {
        console.error("加载统计数据失败:", err);
        ElMessage({ message: "加载统计数据失败", type: "error" });
      }
    };

    const loadWorksites = async () => {
      try {
        // 调用实际的API获取工地数据
        const response = await getWorksites();

        if (response.success) {
          // 修复数据解析路径，与WorksiteManagement.vue保持一致
          const rawWorksites = response.data.worksites || response.data || [];
          console.log("工地数据:", rawWorksites); // 调试信息
          worksites.value = rawWorksites;
        } else {
          ElMessage({ message: "加载工地数据失败", type: "error" });
        }
      } catch (err) {
        console.error("加载工地数据失败:", err);
        ElMessage({ message: "加载工地数据失败", type: "error" });
      }
    };

    const loadQRCodes = async () => {
      try {
        loading.value = true;

        const params = {
          page: pagination.page,
          limit: pagination.limit,
          ...filterForm,
        };

        // 调用实际的API
        const response = await getQRCodes(params);

        if (response.success) {
          qrcodes.value = response.data.qrcodes || [];
          pagination.total = response.data.pagination?.total || 0;
        } else {
          ElMessage({
            message: response.message || t("qrManagement.loadFailed"),
            type: "error",
          });
        }
      } catch (err) {
        console.error("加载二维码列表失败:", err);
        ElMessage({ message: "加载数据失败", type: "error" });
      } finally {
        loading.value = false;
      }
    };

    const resetFilter = () => {
      Object.assign(filterForm, {
        worksite_id: "",
        is_active: null,
      });
      pagination.page = 1;
      loadQRCodes();
    };

    const onWorksiteChange = (worksiteId) => {
      if (worksiteId && worksites.value.length > 0) {
        const selectedWorksite = worksites.value.find(
          (site) => site.worksite_id === worksiteId,
        );
        if (selectedWorksite) {
          qrcodeForm.worksite_name = selectedWorksite.name;
          // 使用正确的字段名
          if (
            selectedWorksite.center_latitude &&
            selectedWorksite.center_longitude
          ) {
            qrcodeForm.center_latitude = selectedWorksite.center_latitude;
            qrcodeForm.center_longitude = selectedWorksite.center_longitude;
          }
        }
      }
    };

    const showQRCode = (qrcode) => {
      currentQRCode.value = qrcode;
      showQRDialog.value = true;
    };

    const editQRCode = (qrcode) => {
      editingQRCode.value = qrcode;
      Object.assign(qrcodeForm, qrcode);

      // 设置验证选项
      verificationOptions.value = [];
      if (qrcode.require_gps) verificationOptions.value.push("require_gps");
      if (qrcode.require_photo) verificationOptions.value.push("require_photo");
      if (qrcode.face_verification_enabled)
        verificationOptions.value.push("face_verification_enabled");

      showCreateDialog.value = true;
    };

    const saveQRCode = async () => {
      try {
        await qrcodeFormRef.value.validate();

        saving.value = true;

        // 处理验证选项
        qrcodeForm.require_gps =
          verificationOptions.value.includes("require_gps");
        qrcodeForm.require_photo =
          verificationOptions.value.includes("require_photo");
        qrcodeForm.face_verification_enabled =
          verificationOptions.value.includes("face_verification_enabled");

        const formData = { ...qrcodeForm };

        if (editingQRCode.value) {
          // 更新
          const response = await updateQRCode(editingQRCode.value.id, formData);
          if (response.success) {
            ElMessage({
              message: response.message || t("qrManagement.updateSuccess"),
              type: "success",
            });
          } else {
            throw new Error(response.message);
          }
        } else {
          // 创建
          const response = await createQRCode(formData);
          if (response.success) {
            ElMessage({
              message: response.message || t("qrManagement.createSuccess"),
              type: "success",
            });
          } else {
            throw new Error(response.message);
          }
        }

        showCreateDialog.value = false;
        resetForm();
        loadQRCodes();
        loadStats();
      } catch (err) {
        console.error("保存二维码失败:", err);
        ElMessage({ message: "保存失败", type: "error" });
      } finally {
        saving.value = false;
      }
    };

    const toggleStatus = async (qrcode) => {
      try {
        const action = qrcode.is_active ? "禁用" : "启用";

        await ElMessageBox.confirm(
          `确定要${action}这个二维码吗？`,
          "确认操作",
          { type: "warning" },
        );

        const response = await updateQRCode(qrcode.id, {
          is_active: !qrcode.is_active,
        });

        if (response.success) {
          qrcode.is_active = !qrcode.is_active;
          ElMessage({ message: `二维码已${action}`, type: "success" });
        } else {
          throw new Error(response.message);
        }

        loadStats();
      } catch (err) {
        if (err !== "cancel") {
          console.error("更新二维码状态失败:", err);
          ElMessage({ message: "操作失败", type: "error" });
        }
      }
    };

    const viewCheckins = async (qrcode) => {
      try {
        loadingCheckins.value = true;
        showCheckinsDialog.value = true;

        // 调用实际的API获取签到记录
        const response = await request.get("/checkins", {
          params: { qrcode_id: qrcode.id },
        });

        if (response.success) {
          checkinRecords.value = response.data.checkins || response.data || [];
        } else {
          ElMessage({
            message: response.message || "Failed to load attendance records",
            type: "error",
          });
        }
      } catch (err) {
        console.error("加载签到记录失败:", err);
        ElMessage({ message: "加载签到记录失败", type: "error" });
      } finally {
        loadingCheckins.value = false;
      }
    };

    const viewCheckinDetail = () => {
      // 显示签到详情
      ElMessage({ message: "签到详情功能开发中", type: "info" });
    };

    const copyURL = () => {
      if (currentQRCode.value?.qr_url) {
        navigator.clipboard.writeText(currentQRCode.value.qr_url).then(() => {
          ElMessage({ message: "链接已复制到剪贴板", type: "success" });
        });
      }
    };

    const deleteQRCode = async (qrcode) => {
      try {
        await ElMessageBox.confirm(
          "确定要删除这个二维码吗？删除后将无法恢复。",
          "警告",
          {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
          },
        );

        const response = await api.delete(`/api/v1/qrcode/${qrcode.id}`);

        if (response.data.success) {
          ElMessage({ message: "二维码删除成功", type: "success" });
          loadQRCodes();
          loadStats();
        } else {
          throw new Error(response.data.message || "Delete failed");
        }
      } catch (error) {
        if (error !== "cancel") {
          ElMessage({
            message: "删除失败: " + (error.message || error),
            type: "error",
          });
          console.error("Error deleting QR code:", error);
        }
      }
    };

    const resetForm = () => {
      Object.assign(qrcodeForm, {
        worksite_id: "",
        worksite_name: "",
        center_latitude: null,
        center_longitude: null,
        radius: 100,
        require_photo: true,
        require_gps: true,
        face_verification_enabled: false,
        allow_checkin_anytime: true,
        work_start_time: null,
        work_end_time: null,
        description: "",
      });
      verificationOptions.value = ["require_gps", "require_photo"];
      editingQRCode.value = null;
    };

    const formatTime = (timeString) => {
      return new Date(timeString).toLocaleString("zh-CN");
    };

    const getStatusText = (status) => {
      const statusMap = {
        approved: "已批准",
        pending: "待审核",
        rejected: "已拒绝",
        flagged: "已标记",
      };
      return statusMap[status] || status;
    };

    // 监听对话框关闭，重置表单
    watch(showCreateDialog, (newVal) => {
      if (!newVal) {
        resetForm();
      }
    });

    // 生命周期
    onMounted(() => {
      loadStats();
      loadWorksites();
      loadQRCodes();
    });

    return {
      loading,
      saving,
      loadingCheckins,
      qrcodes,
      worksites,
      checkinRecords,
      stats,
      pagination,
      filterForm,
      showCreateDialog,
      showQRDialog,
      showCheckinsDialog,
      editingQRCode,
      currentQRCode,
      qrcodeForm,
      qrcodeRules,
      qrcodeFormRef,
      verificationOptions,
      loadQRCodes,
      resetFilter,
      onWorksiteChange,
      showQRCode,
      editQRCode,
      saveQRCode,
      toggleStatus,
      viewCheckins,
      viewCheckinDetail,
      copyURL,
      deleteQRCode,
      formatTime,
      getStatusText,
    };
  },
};
</script>

<style scoped>
.qrcode-management {
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-section h2 {
  margin: 0;
  color: #303133;
}

.stats-section {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 20px 0;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 10px;
}

.stat-label {
  color: #909399;
  font-size: 14px;
}

.filter-section {
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.table-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.config-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.usage-stats {
  font-size: 12px;
  color: #666;
}

.usage-stats div {
  margin-bottom: 2px;
}

.pagination-wrapper {
  padding: 20px;
  text-align: center;
  border-top: 1px solid #ebeef5;
}

.qrcode-display {
  text-align: center;
}

.qrcode-info {
  margin-bottom: 20px;
}

.qrcode-info h3 {
  margin: 0 0 10px 0;
  color: #303133;
}

.qrcode-info p {
  margin: 5px 0;
  color: #606266;
}

.qrcode-image {
  margin-bottom: 20px;
}

.qrcode-image img {
  max-width: 200px;
  height: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.url-input {
  margin-bottom: 10px;
}

@media (max-width: 768px) {
  .qrcode-management {
    padding: 10px;
  }

  .header-section {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .stats-section .el-col {
    margin-bottom: 15px;
  }

  .filter-section .el-form {
    flex-direction: column;
  }

  .filter-section .el-form-item {
    width: 100%;
    margin-right: 0;
  }
}
</style>
