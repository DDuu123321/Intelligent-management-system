<template>
  <div class="dashboard">
    <h1>{{ $t("dashboard.title") }}</h1>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div
        class="stats-card"
        :class="{ loading: statsLoading }"
        @click="animateCard"
      >
        <div class="stats-content">
          <div class="stats-icon stats-icon-primary">
            <el-icon size="48"><User /></el-icon>
          </div>
          <div class="stats-info">
            <div class="stats-number">{{ attendanceStats.present }}</div>
            <div class="stats-label">{{ $t("dashboard.onlineEmployees") }}</div>
          </div>
          <div class="stats-trend">
            <el-icon color="#67C23A"><TrendCharts /></el-icon>
            <span class="trend-text">+12%</span>
          </div>
        </div>
        <div class="stats-background"></div>
      </div>

      <div
        class="stats-card"
        :class="{ loading: statsLoading }"
        @click="animateCard"
      >
        <div class="stats-content">
          <div class="stats-icon stats-icon-success">
            <el-icon size="48"><Location /></el-icon>
          </div>
          <div class="stats-info">
            <div class="stats-number">
              {{ vehicleStats.running + vehicleStats.idle }}
            </div>
            <div class="stats-label">{{ $t("dashboard.runningVehicles") }}</div>
          </div>
          <div class="stats-trend">
            <el-icon color="#67C23A"><TrendCharts /></el-icon>
            <span class="trend-text">+8%</span>
          </div>
        </div>
        <div class="stats-background"></div>
      </div>

      <div
        class="stats-card"
        :class="{ loading: statsLoading }"
        @click="animateCard"
      >
        <div class="stats-content">
          <div class="stats-icon stats-icon-warning">
            <el-icon size="48"><VideoCamera /></el-icon>
          </div>
          <div class="stats-info">
            <div class="stats-number">{{ monitorStats.online }}</div>
            <div class="stats-label">
              {{ $t("dashboard.recordingCameras") }}
            </div>
          </div>
          <div class="stats-trend">
            <el-icon color="#E6A23C"><Minus /></el-icon>
            <span class="trend-text">-2%</span>
          </div>
        </div>
        <div class="stats-background"></div>
      </div>

      <div
        class="stats-card"
        :class="{ loading: statsLoading }"
        @click="animateCard"
      >
        <div class="stats-content">
          <div class="stats-icon stats-icon-danger">
            <el-icon size="48"><Warning /></el-icon>
          </div>
          <div class="stats-info">
            <div class="stats-number">{{ monitorStats.alert }}</div>
            <div class="stats-label">{{ $t("dashboard.alertMessages") }}</div>
          </div>
          <div class="stats-trend">
            <el-icon color="#F56C6C"><Bottom /></el-icon>
            <span class="trend-text">-15%</span>
          </div>
        </div>
        <div class="stats-background"></div>
      </div>
    </div>

    <!-- 详细统计 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="8">
        <el-card v-loading="statsLoading">
          <template #header>
            <div class="card-header">
              <span>{{ $t("dashboard.attendanceStats") }}</span>
              <el-button
                type="primary"
                size="small"
                :loading="statsLoading"
                @click="refreshStats"
              >
                {{ $t("common.refresh") }}
              </el-button>
            </div>
          </template>
          <div class="quick-stats">
            <div class="stat-item">
              <span class="stat-dot present"></span>
              <span
                >{{ $t("status.present") }}:
                <strong
                  >{{ attendanceStats.present }}{{ $t("units.person") }}</strong
                ></span
              >
            </div>
            <div class="stat-item">
              <span class="stat-dot late"></span>
              <span
                >{{ $t("status.late") }}:
                <strong
                  >{{ attendanceStats.late }}{{ $t("units.person") }}</strong
                ></span
              >
            </div>
            <div class="stat-item">
              <span class="stat-dot absent"></span>
              <span
                >{{ $t("status.absent") }}:
                <strong
                  >{{ attendanceStats.absent }}{{ $t("units.person") }}</strong
                ></span
              >
            </div>
            <div class="stat-item">
              <span class="stat-dot leave"></span>
              <span
                >{{ $t("status.leave") }}:
                <strong
                  >{{ attendanceStats.leave }}{{ $t("units.person") }}</strong
                ></span
              >
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card v-loading="statsLoading">
          <template #header>
            <span>{{ $t("dashboard.vehicleStats") }}</span>
          </template>
          <div class="quick-stats">
            <div class="stat-item">
              <span class="stat-dot running"></span>
              <span
                >{{ $t("status.running") }}:
                <strong
                  >{{ vehicleStats.running }}{{ $t("units.vehicle") }}</strong
                ></span
              >
            </div>
            <div class="stat-item">
              <span class="stat-dot idle"></span>
              <span
                >{{ $t("status.idle") }}:
                <strong
                  >{{ vehicleStats.idle }}{{ $t("units.vehicle") }}</strong
                ></span
              >
            </div>
            <div class="stat-item">
              <span class="stat-dot maintenance"></span>
              <span
                >{{ $t("status.maintenance") }}:
                <strong
                  >{{ vehicleStats.maintenance
                  }}{{ $t("units.vehicle") }}</strong
                ></span
              >
            </div>
            <div class="stat-item">
              <span class="stat-dot offline"></span>
              <span
                >{{ $t("status.offline") }}:
                <strong
                  >{{ vehicleStats.offline }}{{ $t("units.vehicle") }}</strong
                ></span
              >
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card v-loading="statsLoading">
          <template #header>
            <span>{{ $t("dashboard.monitorStats") }}</span>
          </template>
          <div class="quick-stats">
            <div class="stat-item">
              <span class="stat-dot online"></span>
              <span
                >{{ $t("status.online") }}:
                <strong
                  >{{ monitorStats.online }}{{ $t("units.device") }}</strong
                ></span
              >
            </div>
            <div class="stat-item">
              <span class="stat-dot recording"></span>
              <span
                >{{ $t("status.recording") }}:
                <strong
                  >{{ monitorStats.recording }}{{ $t("units.device") }}</strong
                ></span
              >
            </div>
            <div class="stat-item">
              <span class="stat-dot offline"></span>
              <span
                >{{ $t("status.offline") }}:
                <strong
                  >{{ monitorStats.offline }}{{ $t("units.device") }}</strong
                ></span
              >
            </div>
            <div class="stat-item">
              <span class="stat-dot alert"></span>
              <span
                >{{ $t("status.alert") }}:
                <strong
                  >{{ monitorStats.alert }}{{ $t("units.alert") }}</strong
                ></span
              >
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 系统状态 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>{{ $t("dashboard.systemStatus") }}</span>
          </template>
          <div class="system-status">
            <div class="status-item">
              <span class="status-label">{{ $t("dashboard.apiStatus") }}:</span>
              <el-tag :type="apiStatus ? 'success' : 'danger'">
                {{ apiStatus ? $t("status.normal") : $t("status.disconnect") }}
              </el-tag>
            </div>
            <div class="status-item">
              <span class="status-label"
                >{{ $t("dashboard.dataUpdateTime") }}:</span
              >
              <span class="status-value">{{ lastUpdateTime }}</span>
            </div>
            <div class="status-item">
              <span class="status-label"
                >{{ $t("dashboard.currentUser") }}:</span
              >
              <span class="status-value"
                >{{ currentUser?.name || $t("common.unknown") }} ({{
                  currentUser?.role || $t("common.unknown")
                }})</span
              >
            </div>
            <div class="status-item">
              <span class="status-label"
                >{{ $t("dashboard.systemRunning") }}:</span
              >
              <el-tag type="success">{{
                $t("dashboard.normalRunning")
              }}</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 证件到期小部件 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>{{ $t("license.widgetTitle") }}</span>
              <div>
                <el-input
                  v-model="licenseSearch"
                  :placeholder="$t('license.searchPlaceholder')"
                  size="small"
                  style="width: 220px; margin-right: 8px"
                  clearable
                  @clear="fetchExpiring"
                  @keyup.enter="fetchExpiring"
                />
                <el-button size="small" @click="fetchExpiring">{{
                  $t("license.refresh")
                }}</el-button>
                <el-button size="small" type="primary" @click="doExportCsv">{{
                  $t("license.exportCsv")
                }}</el-button>
              </div>
            </div>
          </template>
          <el-table
            :data="expiringDisplay"
            size="small"
            :row-class-name="licenseRowClass"
            style="width: 100%"
          >
            <el-table-column
              prop="name"
              :label="$t('license.employee')"
              width="160"
            />
            <el-table-column
              prop="licenseName"
              :label="$t('license.type')"
              width="200"
            />
            <el-table-column
              prop="number"
              :label="$t('license.number')"
              width="160"
            />
            <el-table-column
              prop="expiry_date"
              :label="$t('license.expiryDate')"
              width="130"
            />
            <el-table-column
              prop="days_remaining"
              :label="$t('license.daysRemaining')"
              width="120"
            />
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
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from "vue";
import { ElMessage } from "element-plus";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "@/stores/auth";
import {
  getAttendanceStats,
  getVehicleStats,
  getMonitorStats,
} from "@/api/stats";
import {
  Location,
  User,
  VideoCamera,
  Bell,
  TrendCharts,
  Warning,
  Minus,
  Bottom,
} from "@element-plus/icons-vue";
import { getExpiringLicenses, exportExpiringCsv } from "@/api/licenses";

const { t, locale } = useI18n();

// 使用认证store
const authStore = useAuthStore();
const currentUser = authStore.user;

// 响应式数据
const statsLoading = ref(false);
const apiStatus = ref(true);
const lastUpdateTime = ref("");

// 统计数据
const attendanceStats = reactive({
  present: 0,
  late: 0,
  absent: 0,
  leave: 0,
});

const vehicleStats = reactive({
  running: 0,
  idle: 0,
  maintenance: 0,
  offline: 0,
});

const monitorStats = reactive({
  online: 0,
  recording: 0,
  alert: 0,
  offline: 0,
});

// 获取所有统计数据
const fetchAllStats = async () => {
  try {
    statsLoading.value = true;
    apiStatus.value = true;
    const [attendanceRes, vehicleRes, monitorRes] = await Promise.all([
      getAttendanceStats(),
      getVehicleStats(),
      getMonitorStats(),
    ]);
    Object.assign(attendanceStats, attendanceRes.data);
    Object.assign(vehicleStats, vehicleRes.data);
    Object.assign(monitorStats, monitorRes.data);
    updateLastUpdateTime();
    ElMessage({ message: t("dashboard.dataFetchSuccess"), type: "success" });
  } catch (error) {
    apiStatus.value = false;
    ElMessage({ message: t("dashboard.dataFetchFailed"), type: "error" });
  } finally {
    statsLoading.value = false;
  }
};

// 手动刷新数据
const refreshStats = () => {
  fetchAllStats();
};

// 更新最后更新时间
const updateLastUpdateTime = () => {
  const l = locale.value === "en-US" ? "en-US" : "zh-CN";
  lastUpdateTime.value = new Date().toLocaleString(l);
};

// 监听语言切换，更新时间展示格式
watch(locale, () => {
  updateLastUpdateTime();
});

// 证件到期小部件相关
const expiringLicenses = ref<any[]>([]);
const licenseSearch = ref("");

const fetchExpiring = async () => {
  try {
    const res = await getExpiringLicenses({ within: 60 });
    const isZh = (locale.value || "").startsWith("zh");
    expiringLicenses.value = (res.data || []).map((r: any) => {
      const days = r.days_remaining;
      let statusTag: any = "";
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
  } catch (e) {
    /* ignore */
  }
};

const expiringDisplay = computed(() => {
  if (!licenseSearch.value) return expiringLicenses.value;
  return expiringLicenses.value.filter(
    (r) =>
      (r.name || "")
        .toLowerCase()
        .includes(licenseSearch.value.toLowerCase()) ||
      (r.license?.code || "")
        .toLowerCase()
        .includes(licenseSearch.value.toLowerCase()),
  );
});

const licenseRowClass = ({ row }: any) => {
  if (row.status === "expired") return "row-expired";
  if (row.status === "expiring") return "row-expiring";
  return "";
};

const doExportCsv = async () => {
  const isZh = (locale.value || "").startsWith("zh");
  const lang = isZh ? "zh" : "en";
  const res: any = await exportExpiringCsv(60, lang);
  const blob =
    res instanceof Blob
      ? res
      : new Blob([res], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "licenses_expiring.csv";
  a.click();
  window.URL.revokeObjectURL(url);
};

// 添加卡片动画
const animateCard = (event: Event) => {
  const card = event.currentTarget as HTMLElement;
  card.style.transform = "scale(0.95)";
  setTimeout(() => {
    card.style.transform = "scale(1)";
  }, 150);
};

onMounted(() => {
  fetchAllStats();
  setInterval(fetchAllStats, 30000);
  fetchExpiring();
  setInterval(fetchExpiring, 60000);
});
</script>

<style scoped>
.dashboard {
  padding: 24px;
  background: transparent;
  min-height: 100vh;
}

.dashboard h1 {
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 32px;
  position: relative;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dashboard h1::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -8px;
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, #409eff, #36a3f7);
  border-radius: 2px;
}

/* 统计卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

/* 统计卡片样式 */
.stats-card {
  position: relative;
  background: white;
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.8);
  overflow: hidden;
  animation: fadeInUp 0.8s ease forwards;
  opacity: 0;
  transform: translateY(30px);
}

.stats-card:nth-child(1) {
  animation-delay: 0.1s;
}
.stats-card:nth-child(2) {
  animation-delay: 0.2s;
}
.stats-card:nth-child(3) {
  animation-delay: 0.3s;
}
.stats-card:nth-child(4) {
  animation-delay: 0.4s;
}

.stats-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.stats-card.loading {
  pointer-events: none;
  opacity: 0.6;
}

/* 统计卡片背景 */
.stats-background {
  position: absolute;
  top: 0;
  right: -20px;
  width: 120px;
  height: 120px;
  background: linear-gradient(
    135deg,
    rgba(64, 158, 255, 0.1),
    rgba(64, 158, 255, 0.05)
  );
  border-radius: 50%;
  transform: scale(1.2);
  transition: transform 0.3s ease;
}

.stats-card:hover .stats-background {
  transform: scale(1.4);
}

/* 统计内容布局 */
.stats-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

/* 统计图标 */
.stats-icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 48px;
  margin-right: 20px;
  position: relative;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.stats-card:hover .stats-icon {
  transform: rotate(5deg) scale(1.1);
}

.stats-icon-primary {
  background: linear-gradient(135deg, #409eff, #36a3f7);
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.3);
}

.stats-icon-success {
  background: linear-gradient(135deg, #67c23a, #85ce61);
  box-shadow: 0 8px 20px rgba(103, 194, 58, 0.3);
}

.stats-icon-warning {
  background: linear-gradient(135deg, #e6a23c, #ebb563);
  box-shadow: 0 8px 20px rgba(230, 162, 60, 0.3);
}

.stats-icon-danger {
  background: linear-gradient(135deg, #f56c6c, #f78989);
  box-shadow: 0 8px 20px rgba(245, 108, 108, 0.3);
}

/* 统计信息 */
.stats-info {
  flex: 1;
  text-align: left;
}

.stats-number {
  font-size: 36px;
  font-weight: 800;
  color: #2c3e50;
  line-height: 1;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #2c3e50, #3498db);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stats-label {
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* 趋势指示器 */
.stats-trend {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.trend-text {
  font-size: 12px;
  font-weight: 600;
  color: #67c23a;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quick-stats {
  padding: 10px 0;
}

.stat-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
}

.stat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
  display: inline-block;
}

.stat-dot.present,
.stat-dot.online,
.stat-dot.running {
  background-color: #67c23a;
}
.stat-dot.late,
.stat-dot.recording,
.stat-dot.idle {
  background-color: #e6a23c;
}
.stat-dot.absent,
.stat-dot.alert,
.stat-dot.maintenance {
  background-color: #f56c6c;
}
.stat-dot.leave,
.stat-dot.offline {
  background-color: #909399;
}

.system-status {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px 0;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #409eff;
}

.status-label {
  font-weight: 500;
  color: #606266;
}

.status-value {
  color: #303133;
  font-weight: bold;
}

/* 详细统计卡片优化 */
:deep(.el-card) {
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  background: white;
}

:deep(.el-card:hover) {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

:deep(.el-card__header) {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-bottom: 1px solid #e9ecef;
  border-radius: 12px 12px 0 0;
}

:deep(.el-button) {
  transition: all 0.3s ease;
  border-radius: 8px;
}

:deep(.el-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

/* 系统状态卡片 */
.system-status {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px 0;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.status-item::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #409eff, #36a3f7);
  transition: width 0.3s ease;
}

.status-item:hover::before {
  width: 8px;
}

.status-item:hover {
  border-color: rgba(64, 158, 255, 0.2);
  transform: translateX(4px);
  box-shadow: 0 4px 15px rgba(64, 158, 255, 0.1);
}

.status-label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
}

.status-value {
  color: #409eff;
  font-weight: 700;
  font-size: 14px;
}

/* 证件到期表格 */
:deep(.el-table) {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

:deep(.el-table th) {
  background: linear-gradient(135deg, #f1f3f4, #e8eaf6);
  color: #2c3e50;
  font-weight: 600;
  border: none;
}

:deep(.el-table td) {
  border-bottom: 1px solid #f0f2f5;
  transition: background-color 0.3s ease;
}

:deep(.el-table tbody tr:hover td) {
  background-color: #f8f9ff !important;
}

.row-expired td {
  background: linear-gradient(135deg, #ffe6e6, #ffebee) !important;
  animation: pulse 2s infinite;
}

.row-expiring td {
  background: linear-gradient(135deg, #fff7e6, #fff8e1) !important;
}

/* 快速统计样式 */
.quick-stats {
  padding: 16px 0;
}

.stat-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  padding: 8px 0;
  transition: all 0.3s ease;
  border-radius: 6px;
}

.stat-item:hover {
  background: rgba(64, 158, 255, 0.05);
  padding-left: 8px;
  transform: translateX(4px);
}

.stat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
  display: inline-block;
  position: relative;
}

.stat-dot::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-item:hover .stat-dot::after {
  opacity: 0.3;
  animation: ripple 0.6s ease-out;
}

.stat-dot.present,
.stat-dot.online,
.stat-dot.running {
  background-color: #67c23a;
}
.stat-dot.present::after,
.stat-dot.online::after,
.stat-dot.running::after {
  background-color: #67c23a;
}

.stat-dot.late,
.stat-dot.recording,
.stat-dot.idle {
  background-color: #e6a23c;
}
.stat-dot.late::after,
.stat-dot.recording::after,
.stat-dot.idle::after {
  background-color: #e6a23c;
}

.stat-dot.absent,
.stat-dot.alert,
.stat-dot.maintenance {
  background-color: #f56c6c;
}
.stat-dot.absent::after,
.stat-dot.alert::after,
.stat-dot.maintenance::after {
  background-color: #f56c6c;
}

.stat-dot.leave,
.stat-dot.offline {
  background-color: #909399;
}
.stat-dot.leave::after,
.stat-dot.offline::after {
  background-color: #909399;
}

/* 动画定义 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

@keyframes ripple {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dashboard {
    padding: 16px;
  }

  .dashboard h1 {
    font-size: 24px;
    margin-bottom: 24px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .stats-card {
    padding: 20px;
  }

  .stats-number {
    font-size: 28px;
  }

  .stats-icon {
    width: 60px;
    height: 60px;
    font-size: 36px;
    margin-right: 16px;
  }

  .system-status {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    gap: 12px;
  }

  .stats-card {
    padding: 16px;
  }

  .stats-content {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .stats-icon {
    margin-right: 0;
    margin-bottom: 8px;
  }
}
</style>
