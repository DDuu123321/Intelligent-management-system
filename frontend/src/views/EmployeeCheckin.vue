<template>
  <div class="checkin-container">
    <!-- 头部信息 -->
    <div class="header-section">
      <div class="site-info">
        <h2>{{ currentWorksite?.name || $t("checkin.selectWorksite") }}</h2>
        <p v-if="currentWorksite">{{ currentWorksite.street_address }}</p>
      </div>
      <div v-if="weatherInfo" class="weather-info">
        <span>{{ weatherInfo.condition }}</span>
        <span>{{ weatherInfo.temperature }}°C</span>
      </div>
    </div>

    <!-- 员工信息 -->
    <div v-if="currentEmployee" class="employee-section">
      <div class="employee-card">
        <div class="employee-avatar">
          <img
            v-if="currentEmployee.profile_photo"
            :src="currentEmployee.profile_photo"
            :alt="currentEmployee.first_name"
          />
          <el-icon v-else><User /></el-icon>
        </div>
        <div class="employee-info">
          <h3>
            {{ `${currentEmployee.first_name} ${currentEmployee.last_name}` }}
          </h3>
          <p>{{ $t("employee.id") }}: {{ currentEmployee.employee_id }}</p>
          <p>
            {{ $t("employee.department") }}:
            {{ $t(`department.${currentEmployee.department.toLowerCase()}`) }}
          </p>
          <p>{{ $t("employee.position") }}: {{ currentEmployee.position }}</p>
        </div>
      </div>
    </div>

    <!-- 今日签到状态 -->
    <div v-if="todayStatus" class="status-section">
      <el-card class="status-card">
        <div class="status-header">
          <h3>{{ $t("checkin.todayStatus") }}</h3>
          <el-tag :type="getStatusTagType(todayStatus.current_status)">
            {{ $t(`checkin.${todayStatus.current_status}`) }}
          </el-tag>
        </div>

        <div v-if="todayStatus.has_checked_in" class="status-details">
          <div class="time-info">
            <div class="time-item">
              <span class="label">{{ $t("checkin.checkinTime") }}:</span>
              <span class="time">{{ formatTime(getCheckinTime("in")) }}</span>
            </div>
            <div v-if="todayStatus.has_checked_out" class="time-item">
              <span class="label">{{ $t("checkin.checkoutTime") }}:</span>
              <span class="time">{{ formatTime(getCheckinTime("out")) }}</span>
            </div>
          </div>
          <div class="duration-info">
            <span
              >{{ $t("checkin.workDuration") }}:
              {{ formatDuration(todayStatus.work_duration) }}</span
            >
            <span v-if="todayStatus.break_duration > 0">
              {{ $t("checkin.breakDuration") }}:
              {{ formatDuration(todayStatus.break_duration) }}
            </span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 工地选择 -->
    <div v-if="!currentWorksite" class="worksite-section">
      <el-card>
        <h3>{{ $t("checkin.selectWorksite") }}</h3>
        <el-select
          v-model="selectedWorksiteId"
          :placeholder="$t('checkin.selectWorksitePlaceholder')"
          style="width: 100%"
        >
          <el-option
            v-for="site in availableWorksites"
            :key="site.worksite_id"
            :label="site.name"
            :value="site.worksite_id"
          />
        </el-select>
        <el-button
          type="primary"
          style="width: 100%; margin-top: 10px"
          :disabled="!selectedWorksiteId"
          @click="setWorksite"
        >
          {{ $t("common.confirm") }}
        </el-button>
      </el-card>
    </div>

    <!-- 签到按钮区域 -->
    <div v-if="currentWorksite" class="action-section">
      <!-- GPS和位置信息 -->
      <el-card v-if="locationInfo" class="location-card">
        <div class="location-header">
          <h4>{{ $t("checkin.currentLocation") }}</h4>
          <el-tag :type="locationInfo.isWithinRange ? 'success' : 'warning'">
            <el-icon><LocationInformation /></el-icon>
            {{
              locationInfo.isWithinRange
                ? $t("checkin.withinRange")
                : $t("checkin.outsideRange")
            }}
          </el-tag>
        </div>
        <div class="location-details">
          <p>{{ $t("checkin.accuracy") }}: {{ locationInfo.accuracy }}m</p>
          <p>{{ $t("checkin.distance") }}: {{ locationInfo.distance }}m</p>
          <p class="address">{{ locationInfo.address }}</p>
        </div>
      </el-card>

      <!-- 签到相机 -->
      <div class="camera-section">
        <el-card>
          <h4>{{ $t("checkin.takePhoto") }}</h4>
          <div class="camera-container">
            <video
              v-if="cameraActive"
              ref="videoRef"
              class="camera-video"
              autoplay
              playsinline
            ></video>
            <canvas
              ref="canvasRef"
              class="camera-canvas"
              style="display: none"
            ></canvas>
            <div
              v-if="!cameraActive && !capturedImage"
              class="camera-placeholder"
            >
              <el-icon><Camera /></el-icon>
              <p>{{ $t("checkin.cameraPlaceholder") }}</p>
            </div>
            <img
              v-if="capturedImage"
              :src="capturedImage"
              class="captured-image"
              alt="Captured photo"
            />
          </div>

          <div class="camera-controls">
            <el-button
              v-if="!cameraActive"
              :disabled="processingCamera"
              @click="startCamera"
            >
              <el-icon><VideoCamera /></el-icon>
              {{ $t("checkin.startCamera") }}
            </el-button>
            <el-button v-if="cameraActive" type="primary" @click="capturePhoto">
              <el-icon><Camera /></el-icon>
              {{ $t("checkin.takePhoto") }}
            </el-button>
            <el-button v-if="capturedImage" @click="retakePhoto">
              <el-icon><RefreshLeft /></el-icon>
              {{ $t("checkin.retake") }}
            </el-button>
          </div>
        </el-card>
      </div>

      <!-- 安全检查 -->
      <div class="safety-section">
        <el-card>
          <h4>{{ $t("checkin.safetyCheck") }}</h4>
          <div class="safety-checklist">
            <el-checkbox v-model="safetyChecks.ppe_compliance">
              {{ $t("checkin.ppeCompliance") }}
            </el-checkbox>
            <el-checkbox v-model="safetyChecks.safety_briefing">
              {{ $t("checkin.safetyBriefing") }}
            </el-checkbox>
            <el-checkbox v-model="safetyChecks.health_declaration">
              {{ $t("checkin.healthDeclaration") }}
            </el-checkbox>
          </div>
        </el-card>
      </div>

      <!-- 签到按钮 -->
      <div class="checkin-buttons">
        <el-button
          v-if="!todayStatus?.has_checked_in"
          type="success"
          size="large"
          :disabled="!canCheckin"
          :loading="processingCheckin"
          class="checkin-btn"
          @click="performCheckin('in')"
        >
          <el-icon><ArrowRight /></el-icon>
          {{ $t("checkin.checkin") }}
        </el-button>

        <el-button
          v-if="todayStatus?.has_checked_in && !todayStatus?.has_checked_out"
          type="warning"
          size="large"
          :disabled="todayStatus?.is_on_break || processingCheckin"
          :loading="processingCheckin"
          class="checkin-btn"
          @click="performCheckin('break_start')"
        >
          <el-icon><Coffee /></el-icon>
          {{ $t("checkin.startBreak") }}
        </el-button>

        <el-button
          v-if="todayStatus?.is_on_break"
          type="primary"
          size="large"
          :disabled="processingCheckin"
          :loading="processingCheckin"
          class="checkin-btn"
          @click="performCheckin('break_end')"
        >
          <el-icon><ArrowLeft /></el-icon>
          {{ $t("checkin.endBreak") }}
        </el-button>

        <el-button
          v-if="
            todayStatus?.has_checked_in &&
            !todayStatus?.has_checked_out &&
            !todayStatus?.is_on_break
          "
          type="danger"
          size="large"
          :disabled="processingCheckin"
          :loading="processingCheckin"
          class="checkin-btn"
          @click="performCheckin('out')"
        >
          <el-icon><ArrowLeft /></el-icon>
          {{ $t("checkin.checkout") }}
        </el-button>
      </div>
    </div>

    <!-- 最近签到记录 -->
    <div class="history-section">
      <el-card>
        <h4>{{ $t("checkin.recentRecords") }}</h4>
        <div v-if="recentCheckins.length > 0" class="history-list">
          <div
            v-for="record in recentCheckins"
            :key="record.id"
            class="history-item"
          >
            <div class="history-time">
              {{ formatDateTime(record.checkin_time) }}
            </div>
            <div class="history-type">
              <el-tag :type="getCheckinTypeTag(record.checkin_type)">
                {{ $t(`checkin.${record.checkin_type}`) }}
              </el-tag>
            </div>
            <div class="history-status">
              <el-tag
                :type="record.status === 'approved' ? 'success' : 'warning'"
                size="small"
              >
                {{ $t(`checkin.${record.status}`) }}
              </el-tag>
            </div>
          </div>
        </div>
        <div v-else class="no-history">
          {{ $t("common.noData") }}
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { ElMessage, ElLoading } from "element-plus";
import {
  User,
  LocationInformation,
  VideoCamera,
  Camera,
  ArrowRight,
  ArrowLeft,
  Coffee,
  RefreshLeft,
} from "@element-plus/icons-vue";

// 响应式数据
const currentEmployee = ref(null);
const currentWorksite = ref(null);
const selectedWorksiteId = ref("");
const availableWorksites = ref([]);
const todayStatus = ref(null);
const recentCheckins = ref([]);
const weatherInfo = ref(null);
const locationInfo = ref(null);
const processingCheckin = ref(false);
const processingCamera = ref(false);

// 相机相关
const videoRef = ref<HTMLVideoElement>();
const canvasRef = ref<HTMLCanvasElement>();
const cameraActive = ref(false);
const capturedImage = ref("");
const cameraStream = ref<MediaStream>();

// 安全检查
const safetyChecks = reactive({
  ppe_compliance: false,
  safety_briefing: false,
  health_declaration: false,
});

// 计算属性
const canCheckin = computed(() => {
  return (
    locationInfo.value &&
    capturedImage.value &&
    safetyChecks.ppe_compliance &&
    safetyChecks.safety_briefing &&
    safetyChecks.health_declaration
  );
});

// 方法
const initializeApp = async () => {
  // 模拟加载员工信息
  currentEmployee.value = {
    employee_id: "EMP001",
    first_name: "John",
    last_name: "Smith",
    department: "Construction",
    position: "Site Supervisor",
    profile_photo: null,
  };

  // 加载可用工地
  availableWorksites.value = [
    { worksite_id: "WS001", name: "Perth CBD Office Complex" },
    { worksite_id: "WS002", name: "Fremantle Residential Development" },
    { worksite_id: "WS003", name: "Joondalup Shopping Center Extension" },
  ];

  // 获取位置
  getCurrentLocation();

  // 获取天气信息
  getWeatherInfo();

  // 加载今日状态和历史记录
  await loadTodayStatus();
  await loadRecentCheckins();
};

const getCurrentLocation = () => {
  if ("geolocation" in navigator) {
    const loading = ElLoading.service({
      lock: true,
      text: "获取位置信息中...",
      background: "rgba(0, 0, 0, 0.7)",
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        // 模拟地理编码获取地址
        const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

        // 计算与工地的距离（模拟）
        const distance = Math.floor(Math.random() * 200) + 10;
        const isWithinRange = distance <= 100;

        locationInfo.value = {
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          address,
          distance,
          isWithinRange,
        };

        loading.close();

        if (!isWithinRange) {
          ElMessage({
            message: "您当前不在工地范围内，签到可能被标记为异常",
            type: "warning",
          });
        }
      },
      (error) => {
        loading.close();
        ElMessage({
          message: "无法获取位置信息，请确保已授权位置权限",
          type: "error",
        });
        console.error("Geolocation error:", error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  } else {
    ElMessage({ message: "您的设备不支持GPS定位", type: "error" });
  }
};

const getWeatherInfo = async () => {
  // 模拟天气API
  weatherInfo.value = {
    condition: "多云",
    temperature: 22,
  };
};

const loadTodayStatus = async () => {
  // 模拟API调用
  todayStatus.value = {
    has_checked_in: false,
    has_checked_out: false,
    is_on_break: false,
    current_status: "not_checked_in",
    checkins: [],
    work_duration: 0,
    break_duration: 0,
  };
};

const loadRecentCheckins = async () => {
  // 模拟最近的签到记录
  recentCheckins.value = [];
};

const setWorksite = () => {
  const selected = availableWorksites.value.find(
    (w) => w.worksite_id === selectedWorksiteId.value,
  );
  if (selected) {
    currentWorksite.value = {
      ...selected,
      street_address: "123 Example Street, Perth WA 6000",
    };
  }
};

const startCamera = async () => {
  try {
    processingCamera.value = true;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
    });

    cameraStream.value = stream;

    if (videoRef.value) {
      videoRef.value.srcObject = stream;
      cameraActive.value = true;
    }
  } catch (error) {
    ElMessage({
      message: "无法访问摄像头，请确保已授权摄像头权限",
      type: "error",
    });
    console.error("Camera error:", error);
  } finally {
    processingCamera.value = false;
  }
};

const capturePhoto = () => {
  if (!videoRef.value || !canvasRef.value) return;

  const canvas = canvasRef.value;
  const video = videoRef.value;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.drawImage(video, 0, 0);
    capturedImage.value = canvas.toDataURL("image/jpeg", 0.8);

    // 停止摄像头
    if (cameraStream.value) {
      cameraStream.value.getTracks().forEach((track) => track.stop());
    }
    cameraActive.value = false;
  }
};

const retakePhoto = () => {
  capturedImage.value = "";
  startCamera();
};

const performCheckin = async (type: string) => {
  if (!currentEmployee.value || !currentWorksite.value || !locationInfo.value) {
    ElMessage({ message: "缺少必要信息", type: "error" });
    return;
  }

  processingCheckin.value = true;

  try {
    const checkinData = {
      employee_id: currentEmployee.value.employee_id,
      checkin_type: type,
      latitude: locationInfo.value.latitude,
      longitude: locationInfo.value.longitude,
      location_accuracy: locationInfo.value.accuracy,
      address: locationInfo.value.address,
      worksite_id: currentWorksite.value.worksite_id,
      photo_url: capturedImage.value,
      weather_condition: weatherInfo.value?.condition,
      temperature: weatherInfo.value?.temperature,
      ppe_compliance: safetyChecks.ppe_compliance,
      safety_briefing_acknowledged: safetyChecks.safety_briefing,
    };

    // 这里应该调用实际的API
    // const response = await fetch('/api/v1/checkins', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(checkinData)
    // })

    // 模拟API响应
    await new Promise((resolve) => setTimeout(resolve, 2000));

    ElMessage({
      message: `${getCheckinTypeName(type)}成功！`,
      type: "success",
    });

    // 重新加载状态
    await loadTodayStatus();
    await loadRecentCheckins();

    // 重置照片
    capturedImage.value = "";
  } catch (error) {
    ElMessage({ message: "签到失败，请重试", type: "error" });
    console.error("Checkin error:", error);
  } finally {
    processingCheckin.value = false;
  }
};

// 辅助函数
const getCheckinTypeName = (type: string) => {
  const names = {
    in: "上班签到",
    out: "下班签退",
    break_start: "休息开始",
    break_end: "休息结束",
  };
  return names[type] || type;
};

const getStatusTagType = (status: string) => {
  const types = {
    not_checked_in: "info",
    working: "success",
    on_break: "warning",
    checked_out: "info",
  };
  return types[status] || "info";
};

const getCheckinTypeTag = (type: string) => {
  const types = {
    in: "success",
    out: "danger",
    break_start: "warning",
    break_end: "primary",
  };
  return types[type] || "info";
};

const getCheckinTime = (type: string) => {
  const record = todayStatus.value?.checkins.find(
    (c) => c.checkin_type === type,
  );
  return record?.checkin_time || null;
};

const formatTime = (dateString: string | null) => {
  if (!dateString) return "--:--";
  return new Date(dateString).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("zh-CN");
};

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}小时${mins}分钟`;
};

// 生命周期
onMounted(() => {
  initializeApp();
});

onUnmounted(() => {
  // 清理摄像头资源
  if (cameraStream.value) {
    cameraStream.value.getTracks().forEach((track) => track.stop());
  }
});
</script>

<style scoped>
.checkin-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  padding-bottom: 80px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  margin-bottom: 20px;
}

.site-info h2 {
  margin: 0 0 5px 0;
  font-size: 24px;
}

.site-info p {
  margin: 0;
  opacity: 0.8;
}

.weather-info {
  text-align: right;
}

.weather-info span {
  display: block;
  margin-bottom: 5px;
}

.employee-section {
  margin-bottom: 20px;
}

.employee-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.employee-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  overflow: hidden;
}

.employee-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.employee-avatar .el-icon {
  font-size: 24px;
  color: #999;
}

.employee-info h3 {
  margin: 0 0 5px 0;
  font-size: 18px;
}

.employee-info p {
  margin: 2px 0;
  color: #666;
  font-size: 14px;
}

.status-section {
  margin-bottom: 20px;
}

.status-card {
  border-radius: 12px;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.status-header h3 {
  margin: 0;
}

.status-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.time-info {
  display: flex;
  justify-content: space-between;
}

.time-item {
  display: flex;
  flex-direction: column;
}

.time-item .label {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.time-item .time {
  font-size: 16px;
  font-weight: bold;
}

.duration-info {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #666;
}

.worksite-section,
.action-section {
  margin-bottom: 20px;
}

.location-card {
  border-radius: 12px;
  margin-bottom: 15px;
}

.location-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.location-header h4 {
  margin: 0;
}

.location-details {
  font-size: 14px;
  color: #666;
}

.location-details p {
  margin: 5px 0;
}

.address {
  font-style: italic;
}

.camera-section {
  margin-bottom: 15px;
}

.camera-container {
  position: relative;
  width: 100%;
  max-width: 400px;
  margin: 15px auto;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
  min-height: 200px;
}

.camera-video,
.captured-image {
  width: 100%;
  height: auto;
  display: block;
}

.camera-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #999;
}

.camera-placeholder .el-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.camera-controls {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 15px;
}

.safety-section {
  margin-bottom: 20px;
}

.safety-checklist {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

.checkin-buttons {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.checkin-btn {
  width: 100%;
  height: 50px;
  font-size: 18px;
  border-radius: 25px;
}

.history-section {
  margin-bottom: 20px;
}

.history-list {
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.history-item:last-child {
  border-bottom: none;
}

.history-time {
  font-size: 14px;
  color: #666;
  flex: 1;
}

.history-type {
  flex: 1;
  text-align: center;
}

.history-status {
  text-align: right;
  flex: 1;
}

.no-history {
  text-align: center;
  color: #999;
  padding: 20px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .checkin-container {
    padding: 10px;
  }

  .header-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .weather-info {
    text-align: left;
  }

  .employee-card {
    padding: 15px;
  }

  .employee-avatar {
    width: 50px;
    height: 50px;
  }

  .employee-info h3 {
    font-size: 16px;
  }

  .time-info {
    flex-direction: column;
    gap: 10px;
  }

  .duration-info {
    flex-direction: column;
    gap: 5px;
  }

  .history-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .history-type,
  .history-status {
    text-align: left;
  }
}
</style>
