<template>
  <div class="vehicles-container">
    <el-card class="page-header">
      <div class="header-content">
        <h1>{{ $t("vehicles.title") }}</h1>
        <div class="header-actions">
          <el-button-group>
            <el-button
              :type="viewMode === 'realtime' ? 'primary' : 'default'"
              @click="setViewMode('realtime')"
            >
              {{ $t("vehicles.realtime") }}
            </el-button>
            <el-button
              :type="viewMode === 'track' ? 'primary' : 'default'"
              @click="setViewMode('track')"
            >
              {{ $t("vehicles.track") }}
            </el-button>
          </el-button-group>
          <el-button type="success" @click="refreshData">
            <el-icon><Refresh /></el-icon>
            {{ $t("vehicles.refreshData") }}
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 车辆状态统计 -->
    <el-row :gutter="20" class="stats-section">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon running">
              <el-icon><CaretRight /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ vehicleStats.running }}</div>
              <div class="stat-label">{{ $t("status.running") }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon idle">
              <el-icon><VideoPause /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ vehicleStats.idle }}</div>
              <div class="stat-label">{{ $t("status.idle") }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon maintenance">
              <el-icon><Tools /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ vehicleStats.maintenance }}</div>
              <div class="stat-label">{{ $t("status.maintenance") }}</div>
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
              <div class="stat-number">{{ vehicleStats.offline }}</div>
              <div class="stat-label">{{ $t("status.offline") }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主要内容区域 -->
    <el-row :gutter="20" class="main-content">
      <!-- 地图区域 -->
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>{{ $t("vehicles.mapTitle") }}</span>
              <div class="map-controls">
                <el-select
                  v-model="selectedVehicle"
                  :placeholder="$t('vehicles.selectVehicle')"
                  style="width: 200px"
                >
                  <el-option
                    v-for="vehicle in vehicleList"
                    :key="vehicle.id"
                    :label="`${vehicle.plateNumber} - ${vehicle.driver}`"
                    :value="vehicle.id"
                  />
                </el-select>
                <el-button
                  v-if="viewMode === 'track'"
                  type="primary"
                  style="margin-left: 10px"
                  @click="playTrack"
                >
                  <el-icon><VideoPlay /></el-icon>
                  {{ $t("vehicles.playTrack") }}
                </el-button>
              </div>
            </div>
          </template>

          <div ref="mapContainer" class="map-container"></div>

          <!-- 轨迹回放控制 -->
          <div v-if="viewMode === 'track'" class="track-controls">
            <div class="track-info">
              <span>{{ $t("vehicles.trackPlayback") }}</span>
              <el-date-picker
                v-model="trackDate"
                type="date"
                :placeholder="$t('vehicles.trackDate')"
                style="width: 150px; margin: 0 10px"
              />
              <el-time-picker
                v-model="trackTime"
                format="HH:mm"
                :placeholder="$t('vehicles.trackTime')"
                style="width: 120px; margin-right: 10px"
              />
            </div>
            <div class="track-player">
              <el-button @click="pauseTrack">
                <el-icon><VideoPause /></el-icon>
              </el-button>
              <el-slider
                v-model="trackProgress"
                :max="100"
                style="flex: 1; margin: 0 15px"
              />
              <span>{{ trackProgress }}%</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 车辆列表 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>{{ $t("vehicles.vehicleList") }}</span>
              <el-input
                v-model="searchQuery"
                :placeholder="$t('vehicles.searchPlate')"
                prefix-icon="Search"
                style="width: 150px"
              />
            </div>
          </template>

          <div class="vehicle-list">
            <div
              v-for="vehicle in filteredVehicles"
              :key="vehicle.id"
              class="vehicle-item"
              :class="{ active: selectedVehicle === vehicle.id }"
              @click="selectVehicle(vehicle.id)"
            >
              <div class="vehicle-info">
                <div class="vehicle-header">
                  <span class="plate-number">{{ vehicle.plateNumber }}</span>
                  <el-tag :type="getStatusType(vehicle.status)" size="small">
                    {{ getStatusText(vehicle.status) }}
                  </el-tag>
                </div>
                <div class="vehicle-details">
                  <p>
                    <strong>{{ $t("vehicles.driverLabel") }}</strong
                    >{{ vehicle.driver }}
                  </p>
                  <p>
                    <strong>{{ $t("vehicles.locationLabel") }}</strong
                    >{{ vehicle.location }}
                  </p>
                  <p>
                    <strong>{{ $t("vehicles.speedLabel") }}</strong
                    >{{ vehicle.speed }} km/h
                  </p>
                  <p>
                    <strong>{{ $t("vehicles.updateLabel") }}</strong
                    >{{ vehicle.lastUpdate }}
                  </p>
                </div>
              </div>
              <div class="vehicle-actions">
                <el-button
                  link
                  type="primary"
                  @click.stop="viewDetails(vehicle)"
                >
                  {{ $t("vehicles.details") }}
                </el-button>
                <el-button
                  link
                  type="warning"
                  @click.stop="sendCommand(vehicle)"
                >
                  {{ $t("vehicles.command") }}
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 车辆详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="$t('vehicles.vehicleDetail')"
      width="600px"
    >
      <div v-if="selectedVehicleDetail" class="vehicle-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item :label="$t('vehicles.plateNumber')">
            {{ selectedVehicleDetail.plateNumber }}
          </el-descriptions-item>
          <el-descriptions-item :label="$t('vehicles.model')">
            {{ selectedVehicleDetail.model }}
          </el-descriptions-item>
          <el-descriptions-item :label="$t('vehicles.driver')">
            {{ selectedVehicleDetail.driver }}
          </el-descriptions-item>
          <el-descriptions-item :label="$t('vehicles.phone')">
            {{ selectedVehicleDetail.phone }}
          </el-descriptions-item>
          <el-descriptions-item :label="$t('vehicles.currentStatus')">
            <el-tag :type="getStatusType(selectedVehicleDetail.status)">
              {{ getStatusText(selectedVehicleDetail.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('vehicles.currentSpeed')">
            {{ selectedVehicleDetail.speed }} km/h
          </el-descriptions-item>
          <el-descriptions-item :label="$t('vehicles.fuel')">
            {{ selectedVehicleDetail.fuel }}%
          </el-descriptions-item>
          <el-descriptions-item :label="$t('vehicles.mileage')">
            {{ selectedVehicleDetail.mileage }} km
          </el-descriptions-item>
          <el-descriptions-item :label="$t('vehicles.lastUpdate')" :span="2">
            {{ selectedVehicleDetail.lastUpdate }}
          </el-descriptions-item>
        </el-descriptions>

        <div style="margin-top: 20px">
          <h4>{{ $t("vehicles.todayRecord") }}</h4>
          <div ref="mileageChart" style="height: 200px; margin-top: 10px"></div>
        </div>
      </div>
    </el-dialog>

    <!-- 发送指令对话框 -->
    <el-dialog
      v-model="commandDialogVisible"
      :title="$t('vehicles.commandDialogTitle')"
      width="400px"
    >
      <el-form :model="commandForm" label-width="100px">
        <el-form-item :label="$t('vehicles.commandVehicle')">
          <el-input v-model="commandForm.vehicle" disabled />
        </el-form-item>
        <el-form-item :label="$t('vehicles.commandTypeLabel')">
          <el-select v-model="commandForm.type" style="width: 100%">
            <el-option :label="$t('vehicles.lockVehicle')" value="lock" />
            <el-option :label="$t('vehicles.unlockVehicle')" value="unlock" />
            <el-option :label="$t('vehicles.locate')" value="locate" />
            <el-option :label="$t('vehicles.stopEngine')" value="stop" />
            <el-option :label="$t('vehicles.horn')" value="horn" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('vehicles.commandNoteLabel')">
          <el-input
            v-model="commandForm.note"
            type="textarea"
            rows="3"
            :placeholder="$t('vehicles.commandNote')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="commandDialogVisible = false">{{
            $t("common.cancel")
          }}</el-button>
          <el-button type="primary" @click="sendCommandConfirm">{{
            $t("vehicles.commandSend")
          }}</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from "vue";
import { ElMessage } from "element-plus";
import { useI18n } from "vue-i18n";
import * as echarts from "echarts";

const { t } = useI18n();

// 定义车辆类型
interface Vehicle {
  id: number;
  plateNumber: string;
  model: string;
  driver: string;
  phone: string;
  status: string;
  speed: number;
  fuel: number;
  mileage: number;
  lastUpdate: string;
  location: { lat: number; lng: number };
}

// 响应式数据
const viewMode = ref("realtime");
const selectedVehicle = ref("");
const searchQuery = ref("");
const trackDate = ref(new Date());
const trackTime = ref("");
const trackProgress = ref(0);
const detailDialogVisible = ref(false);
const commandDialogVisible = ref(false);
const selectedVehicleDetail = ref<Vehicle | null>(null);

// 地图相关
const mapContainer = ref<HTMLElement>();
const mapInstance = ref<HTMLCanvasElement | null>(null);
const mileageChart = ref();

// 车辆统计数据
const vehicleStats = reactive({
  running: 35,
  idle: 12,
  maintenance: 3,
  offline: 0,
});

// 指令表单
const commandForm = reactive({
  vehicle: "",
  type: "",
  note: "",
});

// 基础车辆数据（使用键值映射）
const baseVehicleData = [
  {
    id: "V001",
    plateNumber: "WA123ABC",
    driverKey: "zhangsan",
    phone: "0412345678",
    model: "Toyota Hilux",
    status: "running",
    locationKey: "perthCBD",
    speed: 45,
    fuel: 75,
    mileage: 15420,
    lat: -31.9505,
    lng: 115.8605,
    lastUpdate: 2,
  },
  {
    id: "V002",
    plateNumber: "WA456DEF",
    driverKey: "lisi",
    phone: "0423456789",
    model: "Ford Ranger",
    status: "idle",
    locationKey: "fremantle",
    speed: 0,
    fuel: 60,
    mileage: 22100,
    lat: -32.0569,
    lng: 115.744,
    lastUpdate: 5,
  },
  {
    id: "V003",
    plateNumber: "WA789GHI",
    driverKey: "wangwu",
    phone: "0434567890",
    model: "Isuzu D-MAX",
    status: "running",
    locationKey: "joondalup",
    speed: 60,
    fuel: 85,
    mileage: 8750,
    lat: -31.7448,
    lng: 115.7661,
    lastUpdate: 1,
  },
  {
    id: "V004",
    plateNumber: "WA012JKL",
    driverKey: "zhaoliu",
    phone: "0445678901",
    model: "Mitsubishi Triton",
    status: "maintenance",
    locationKey: "malaga",
    speed: 0,
    fuel: 30,
    mileage: 34580,
    lat: -31.8645,
    lng: 115.8985,
    lastUpdate: 120,
  },
  {
    id: "V005",
    plateNumber: "WA345MNO",
    driverKey: "sunqi",
    phone: "0456789012",
    model: "Nissan Navara",
    status: "running",
    locationKey: "rockingham",
    speed: 55,
    fuel: 90,
    mileage: 12340,
    lat: -32.2767,
    lng: 115.7295,
    lastUpdate: 3,
  },
];

// 动态车辆数据（根据语言显示）
const vehicleList = computed(() => {
  return baseVehicleData.map((vehicle) => ({
    ...vehicle,
    driver: t(`vehicles.drivers.${vehicle.driverKey}`),
    location: t(`vehicles.locations.${vehicle.locationKey}`),
    lastUpdate: formatLastUpdate(vehicle.lastUpdate),
  }));
});

// 格式化最后更新时间
const formatLastUpdate = (minutes: number) => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return hours === 1
      ? t("time.hourAgo", { n: hours })
      : t("time.hoursAgo", { n: hours });
  } else {
    return minutes === 1
      ? t("time.minuteAgo", { n: minutes })
      : t("time.minutesAgo", { n: minutes });
  }
};

// 计算属性
const filteredVehicles = computed(() => {
  if (!searchQuery.value) return vehicleList.value;
  return vehicleList.value.filter((vehicle) =>
    vehicle.plateNumber.toLowerCase().includes(searchQuery.value.toLowerCase()),
  );
});

// 方法
const setViewMode = (mode: string) => {
  viewMode.value = mode;
  updateMapView();
};

const refreshData = () => {
  ElMessage({ message: t("vehicles.dataRefreshed"), type: "success" });
  // 这里可以重新获取车辆数据
};

const selectVehicle = (vehicleId: string) => {
  selectedVehicle.value = vehicleId;
  const vehicle = vehicleList.value.find((v) => v.id === vehicleId);
  if (vehicle && mapInstance.value) {
    // 地图聚焦到选中车辆
    focusOnVehicle(vehicle);
  }
};

const viewDetails = (vehicle: any) => {
  selectedVehicleDetail.value = vehicle;
  detailDialogVisible.value = true;
  nextTick(() => {
    initMileageChart();
  });
};

const sendCommand = (vehicle: any) => {
  commandForm.vehicle = `${vehicle.plateNumber} - ${vehicle.driver}`;
  commandDialogVisible.value = true;
};

const sendCommandConfirm = () => {
  ElMessage({
    message: t("vehicles.commandSend") + `: ${commandForm.vehicle}`,
    type: "success",
  });
  commandDialogVisible.value = false;
  // 重置表单
  Object.assign(commandForm, { vehicle: "", type: "", note: "" });
};

const playTrack = () => {
  if (!selectedVehicle.value) {
    ElMessage({ message: t("vehicles.selectVehicleFirst"), type: "warning" });
    return;
  }
  ElMessage({ message: t("vehicles.playTrackStart"), type: "info" });
  // 模拟轨迹播放
  const interval = setInterval(() => {
    trackProgress.value += 5;
    if (trackProgress.value >= 100) {
      clearInterval(interval);
      ElMessage({ message: t("vehicles.playTrackFinished"), type: "success" });
    }
  }, 500);
};

const pauseTrack = () => {
  ElMessage({ message: t("vehicles.playTrackPaused"), type: "info" });
};

const getStatusType = (status: string) => {
  const types: { [key: string]: string } = {
    running: "success",
    idle: "warning",
    maintenance: "danger",
    offline: "info",
  };
  return types[status] || "info";
};

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    running: t("status.running"),
    idle: t("status.idle"),
    maintenance: t("status.maintenance"),
    offline: t("status.offline"),
  };
  return texts[status] || t("common.unknown");
};

// 简化的地图初始化（使用HTML5 Canvas模拟）
const initMap = () => {
  nextTick(() => {
    if (!mapContainer.value) return;

    const canvas = document.createElement("canvas");
    canvas.width = mapContainer.value.offsetWidth;
    canvas.height = 400;
    canvas.style.width = "100%";
    canvas.style.height = "400px";
    canvas.style.border = "1px solid #ddd";
    canvas.style.borderRadius = "4px";
    canvas.style.background = "#f0f0f0";

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 绘制简单的地图背景
    ctx.fillStyle = "#e8f4f8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制珀斯地图轮廓（简化）
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(50, 50, canvas.width - 100, canvas.height - 100);
    ctx.stroke();

    // 绘制标签
    ctx.fillStyle = "#333";
    ctx.font = "16px Arial";
    ctx.fillText("Perth Metropolitan Area", 60, 80);

    // 绘制车辆位置点
    vehicleList.value.forEach((vehicle, index) => {
      const x = 100 + index * 80 + Math.random() * 40;
      const y = 120 + Math.random() * 200;
      // 根据状态设置颜色
      const colors: { [key: string]: string } = {
        running: "#67C23A",
        idle: "#E6A23C",
        maintenance: "#F56C6C",
        offline: "#909399",
      };

      ctx.fillStyle = colors[vehicle.status] || "#909399";
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fill();

      // 绘制车牌号
      ctx.fillStyle = "#333";
      ctx.font = "12px Arial";
      ctx.fillText(vehicle.plateNumber, x - 30, y + 25);
    });

    if (mapContainer.value) {
      mapContainer.value.innerHTML = "";
      mapContainer.value.appendChild(canvas);
    }
    mapInstance.value = canvas;
  });
};

const focusOnVehicle = (vehicle: any) => {
  ElMessage({
    message: t("vehicles.focusVehicle", { plate: vehicle.plateNumber }),
    type: "info",
  });
  // 这里可以实现地图聚焦逻辑
};

const updateMapView = () => {
  ElMessage({
    message:
      viewMode.value === "realtime"
        ? t("vehicles.switchRealtime")
        : t("vehicles.switchTrack"),
    type: "info",
  });
  initMap(); // 重新绘制地图
};

const initMileageChart = () => {
  if (!mileageChart.value) return;

  const chartInstance = echarts.init(mileageChart.value);
  const option = {
    tooltip: {
      trigger: "axis",
    },
    xAxis: {
      type: "category",
      data: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"],
    },
    yAxis: {
      type: "value",
      name: "里程 (km)",
    },
    series: [
      {
        name: "累计里程",
        type: "line",
        data: [0, 15, 45, 120, 180, 220, 250],
        smooth: true,
        itemStyle: {
          color: "#409EFF",
        },
        areaStyle: {
          color: "rgba(64, 158, 255, 0.1)",
        },
      },
    ],
  };
  chartInstance.setOption(option);
};

onMounted(() => {
  initMap();
  // 模拟实时数据更新
  setInterval(() => {
    // 随机更新车辆位置和状态
    baseVehicleData.forEach((vehicle) => {
      if (vehicle.status === "running") {
        vehicle.speed = Math.floor(Math.random() * 80) + 20;
        vehicle.lastUpdate = Math.floor(Math.random() * 5) + 1;
      }
    });
  }, 10000); // 每10秒更新一次
});

// 监听窗口大小变化，重新绘制地图
watch(
  () => mapContainer.value?.offsetWidth,
  () => {
    if (mapInstance.value) {
      setTimeout(initMap, 100);
    }
  },
);
</script>

<style scoped>
.vehicles-container {
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

.stat-icon.running {
  background-color: #67c23a;
}

.stat-icon.idle {
  background-color: #e6a23c;
}

.stat-icon.maintenance {
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

.map-controls {
  display: flex;
  align-items: center;
}

.map-container {
  height: 400px;
  background-color: #f5f5f5;
  border-radius: 4px;
  position: relative;
}

.track-controls {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e6e6e6;
}

.track-info {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.track-player {
  display: flex;
  align-items: center;
}

.vehicle-list {
  max-height: 500px;
  overflow-y: auto;
}

.vehicle-item {
  padding: 15px;
  border: 1px solid #e6e6e6;
  border-radius: 6px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.vehicle-item:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.vehicle-item.active {
  border-color: #409eff;
  background-color: #e6f7ff;
}

.vehicle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.plate-number {
  font-weight: bold;
  font-size: 16px;
  color: #303133;
}

.vehicle-details p {
  margin: 4px 0;
  font-size: 14px;
  color: #606266;
}

.vehicle-actions {
  margin-top: 10px;
  text-align: right;
}

.vehicle-detail {
  padding: 10px 0;
}
</style>
