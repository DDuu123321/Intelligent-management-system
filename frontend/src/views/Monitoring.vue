<template>
  <div class="monitoring-container">
    <el-card class="page-header">
      <div class="header-content">
        <h1>{{ $t("monitoring.title") }}</h1>
        <div class="header-actions">
          <el-button-group>
            <el-button
              :type="viewMode === 'live' ? 'primary' : 'default'"
              @click="setViewMode('live')"
            >
              {{ $t("monitoring.live") }}
            </el-button>
            <el-button
              :type="viewMode === 'playback' ? 'primary' : 'default'"
              @click="setViewMode('playback')"
            >
              {{ $t("monitoring.playback") }}
            </el-button>
          </el-button-group>
          <el-select v-model="gridMode" style="width: 120px">
            <el-option :label="$t('monitoring.grid4')" value="4" />
            <el-option :label="$t('monitoring.grid9')" value="9" />
            <el-option :label="$t('monitoring.grid16')" value="16" />
            <el-option :label="$t('monitoring.grid25')" value="25" />
          </el-select>
          <el-button type="success" @click="refreshAll">
            <el-icon><Refresh /></el-icon>
            {{ $t("monitoring.refreshAll") }}
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 监控状态统计 -->
    <el-row :gutter="20" class="stats-section">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon online">
              <el-icon><VideoCamera /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">95</div>
              <div class="stat-label">{{ $t("monitoring.onlineDevices") }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon recording">
              <el-icon><VideoCameraFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">85</div>
              <div class="stat-label">{{ $t("status.recording") }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon alert">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">3</div>
              <div class="stat-label">{{ $t("status.alert") }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon offline">
              <el-icon><Close /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">5</div>
              <div class="stat-label">
                {{ $t("monitoring.offlineDevices") }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主要内容区域 -->
    <el-row :gutter="20" class="main-content">
      <!-- 视频画面区域 -->
      <el-col :span="18">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>{{ $t("monitoring.monitoringView") }}</span>
              <div class="video-controls">
                <el-tooltip :content="$t('monitoring.screenshot')">
                  <el-button @click="takeScreenshot">
                    <el-icon><Camera /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip :content="$t('monitoring.startRecording')">
                  <el-button @click="startRecording">
                    <el-icon><VideoCameraFilled /></el-icon>
                  </el-button>
                </el-tooltip>
              </div>
            </div>
          </template>

          <div class="video-grid" :class="`grid-${gridMode}`">
            <div
              v-for="(camera, index) in displayedCameras"
              :key="camera.id"
              class="video-item"
              :class="{
                active: selectedCamera === camera.id,
                offline: camera.status === 'offline',
              }"
              @click="selectCamera(camera)"
            >
              <div class="video-player">
                <div v-if="camera.status === 'online'" class="video-content">
                  <div class="video-placeholder">
                    <p>{{ camera.name }}</p>
                    <p>{{ camera.location }}</p>
                  </div>
                </div>
                <div v-else class="video-offline">
                  <el-icon><Close /></el-icon>
                  <p>{{ $t("monitoring.deviceOffline") }}</p>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 摄像头列表和控制面板 -->
      <el-col :span="6">
        <!-- 摄像头列表 -->
        <el-card style="margin-bottom: 20px">
          <template #header>
            <div class="card-header">
              <span>{{ $t("monitoring.cameraList") }}</span>
              <el-input
                v-model="searchQuery"
                :placeholder="$t('common.search')"
                prefix-icon="Search"
                style="width: 120px"
              />
            </div>
          </template>

          <div class="camera-list">
            <div
              v-for="group in cameraGroups"
              :key="group.name"
              class="camera-group"
            >
              <h4>{{ group.name }} ({{ group.count }})</h4>
              <div class="camera-items">
                <div
                  v-for="camera in group.cameras"
                  :key="camera.name"
                  class="camera-item"
                >
                  <span>{{ camera.name }}</span>
                  <el-tag type="success" size="small">{{
                    $t("status.online")
                  }}</el-tag>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 报警信息 -->
        <el-card>
          <template #header>
            <span>{{ $t("monitoring.latestAlerts") }}</span>
          </template>

          <div class="alert-list">
            <div class="alert-item high">
              <div class="alert-header">
                <el-icon><Warning /></el-icon>
                <span class="alert-title">{{
                  $t("monitoring.abnormalIntrusion")
                }}</span>
                <el-tag type="danger" size="small">{{
                  $t("monitoring.high")
                }}</el-tag>
              </div>
              <p class="alert-description">
                {{ $t("monitoring.siteArea") }}
                {{ $t("monitoring.abnormalIntrusion") }}
              </p>
              <div class="alert-info">
                <span>{{ $t("monitoring.siteArea") }}1</span>
                <span>2m</span>
              </div>
              <div class="alert-actions">
                <el-button link type="primary">{{
                  $t("monitoring.view")
                }}</el-button>
                <el-button link type="success">{{
                  $t("monitoring.handle")
                }}</el-button>
              </div>
            </div>

            <div class="alert-item">
              <div class="alert-header">
                <el-icon><InfoFilled /></el-icon>
                <span class="alert-title">{{
                  $t("monitoring.vehicleOverspeed")
                }}</span>
                <el-tag type="warning" size="small">{{
                  $t("monitoring.medium")
                }}</el-tag>
              </div>
              <p class="alert-description">
                {{ $t("monitoring.gateArea") }}
                {{ $t("monitoring.vehicleOverspeed") }}
              </p>
              <div class="alert-info">
                <span>{{ $t("monitoring.gateArea") }}</span>
                <span>5m</span>
              </div>
              <div class="alert-actions">
                <el-button link type="primary">{{
                  $t("monitoring.view")
                }}</el-button>
                <el-button link type="success">{{
                  $t("monitoring.handle")
                }}</el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

// 响应式数据
const viewMode = ref("live");
const gridMode = ref("9");
const selectedCamera = ref("");
const searchQuery = ref("");

// 基础摄像头数据（键值映射）
const baseCameras = [
  {
    id: "cam1",
    areaKey: "siteArea",
    number: 1,
    locationKey: "siteArea1",
    status: "online",
  },
  {
    id: "cam2",
    areaKey: "siteArea",
    number: 2,
    locationKey: "siteArea1",
    status: "online",
  },
  {
    id: "cam3",
    areaKey: "officeArea",
    number: 1,
    locationKey: "office1F",
    status: "online",
  },
  {
    id: "cam4",
    areaKey: "officeArea",
    number: 2,
    locationKey: "office2F",
    status: "offline",
  },
  {
    id: "cam5",
    areaKey: "gateArea",
    number: 1,
    locationKey: "eastGate",
    status: "online",
  },
  {
    id: "cam6",
    areaKey: "gateArea",
    number: 2,
    locationKey: "westGate",
    status: "online",
  },
  {
    id: "cam7",
    areaKey: "perimeter",
    number: 1,
    locationKey: "perimeter1",
    status: "online",
  },
  {
    id: "cam8",
    areaKey: "perimeter",
    number: 2,
    locationKey: "perimeter2",
    status: "online",
  },
  {
    id: "cam9",
    areaKey: "parking",
    number: 1,
    locationKey: "undergroundParking",
    status: "online",
  },
];

// 动态摄像头数据（根据语言显示）
const cameras = computed(() => {
  return baseCameras.map((camera) => ({
    ...camera,
    name: t(`monitoring.${camera.areaKey}`) + ` ${camera.number}`,
    location: getLocationName(camera.locationKey),
  }));
});

// 获取位置名称的辅助函数
const getLocationName = (locationKey: string) => {
  const locationMap: { [key: string]: string } = {
    siteArea1: t("monitoring.siteArea") + " 1",
    office1F: t("monitoring.officeArea") + " 1F",
    office2F: t("monitoring.officeArea") + " 2F",
    eastGate: t("monitoring.eastGate"),
    westGate: t("monitoring.westGate"),
    perimeter1: t("monitoring.perimeter") + " 1",
    perimeter2: t("monitoring.perimeter") + " 2",
    undergroundParking:
      t("monitoring.underground") + " " + t("monitoring.parking"),
  };
  return locationMap[locationKey] || locationKey;
};

// 摄像头分组数据
const cameraGroups = computed(() => [
  {
    name: t("monitoring.siteArea"),
    count: 30,
    cameras: [1, 2, 3, 4, 5].map((i) => ({
      name: `${t("monitoring.siteArea")} ${i}`,
      status: "online",
    })),
  },
  {
    name: t("monitoring.officeArea"),
    count: 25,
    cameras: [1, 2, 3, 4, 5].map((i) => ({
      name: `${t("monitoring.officeArea")} ${i}`,
      status: "online",
    })),
  },
  {
    name: t("monitoring.gateArea"),
    count: 15,
    cameras: [1, 2, 3].map((i) => ({
      name: `${t("monitoring.gateArea")} ${i}`,
      status: "online",
    })),
  },
]);

// 当前显示的摄像头
const displayedCameras = computed(() => {
  const gridSize = parseInt(gridMode.value);
  return cameras.value.slice(0, gridSize);
});

// 方法
const setViewMode = (mode: string) => {
  viewMode.value = mode;
  ElMessage({
    message:
      mode === "live"
        ? t("monitoring.switchLive")
        : t("monitoring.switchPlayback"),
    type: "info",
  });
};

const refreshAll = () => {
  ElMessage({ message: t("monitoring.allRefreshed"), type: "success" });
};

const selectCamera = (camera: any) => {
  selectedCamera.value = camera.id;
  ElMessage({
    message: t("monitoring.selectCamera", { name: camera.name }),
    type: "info",
  });
};

const takeScreenshot = () => {
  ElMessage({ message: t("monitoring.screenshotSaved"), type: "success" });
};

const startRecording = () => {
  ElMessage({ message: t("monitoring.recordingStarted"), type: "success" });
};
</script>

<style scoped>
.monitoring-container {
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

.stat-icon.online {
  background-color: #67c23a;
}
.stat-icon.recording {
  background-color: #409eff;
}
.stat-icon.alert {
  background-color: #f56c6c;
}
.stat-icon.offline {
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

.main-content {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.video-controls {
  display: flex;
  gap: 5px;
}

.video-grid {
  display: grid;
  gap: 10px;
  min-height: 500px;
}

.grid-4 {
  grid-template-columns: repeat(2, 1fr);
}
.grid-9 {
  grid-template-columns: repeat(3, 1fr);
}
.grid-16 {
  grid-template-columns: repeat(4, 1fr);
}
.grid-25 {
  grid-template-columns: repeat(5, 1fr);
}

.video-item {
  border: 2px solid #e6e6e6;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.video-item:hover {
  border-color: #409eff;
}

.video-item.active {
  border-color: #409eff;
  box-shadow: 0 0 10px rgba(64, 158, 255, 0.3);
}

.video-item.offline {
  border-color: #f56c6c;
}

.video-player {
  height: 120px;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(45deg, #1a1a1a, #2d2d2d);
}

.video-placeholder {
  text-align: center;
  color: #fff;
}

.video-placeholder p {
  margin: 5px 0;
  font-size: 12px;
}

.video-offline {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  background: #2d2d2d;
}

.video-offline p {
  margin: 5px 0 0 0;
  font-size: 12px;
}

.camera-list {
  max-height: 300px;
  overflow-y: auto;
}

.camera-group {
  margin-bottom: 15px;
}

.camera-group h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #303133;
}

.camera-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 5px;
  font-size: 12px;
}

.alert-list {
  max-height: 400px;
  overflow-y: auto;
}

.alert-item {
  padding: 12px;
  border: 1px solid #e6e6e6;
  border-radius: 6px;
  margin-bottom: 10px;
  transition: all 0.3s;
}

.alert-item:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.alert-item.high {
  border-color: #f56c6c;
  background-color: #fef0f0;
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.alert-title {
  font-weight: bold;
  flex: 1;
}

.alert-description {
  margin: 8px 0;
  font-size: 14px;
  color: #606266;
}

.alert-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.alert-actions {
  text-align: right;
}
</style>
