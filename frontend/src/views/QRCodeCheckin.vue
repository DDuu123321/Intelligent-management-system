<template>
  <div class="qr-checkin-container">
    <!-- 头部 -->
    <div class="header">
      <h1>{{ $t("qrCheckin.title") }}</h1>
      <div v-if="qrcodeInfo" class="worksite-info">
        <h3>{{ qrcodeInfo.worksite_name }}</h3>
        <p v-if="qrcodeInfo.Worksite">{{ qrcodeInfo.Worksite.address }}</p>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <el-icon class="is-loading" size="large"><Loading /></el-icon>
      <p>{{ $t("qrCheckin.loading") }}</p>
    </div>

    <!-- 错误信息 -->
    <div v-if="error" class="error-container">
      <el-alert :title="error" type="error" :closable="false" center />
    </div>

    <!-- 签到表单 -->
    <div v-if="!loading && !error && qrcodeInfo" class="checkin-form">
      <el-form
        ref="checkinForm"
        :model="checkinData"
        :rules="rules"
        label-position="top"
      >
        <!-- 员工手机号 -->
        <el-form-item :label="$t('qrCheckin.phoneNumber')" prop="phone_number">
          <el-input
            v-model="checkinData.phone_number"
            :placeholder="$t('qrCheckin.phonePlaceholder')"
            size="large"
            type="tel"
            maxlength="11"
            show-word-limit
          />
        </el-form-item>

        <!-- 签到类型 -->
        <el-form-item :label="$t('qrCheckin.checkinType')" prop="checkin_type">
          <el-radio-group v-model="checkinData.checkin_type" size="large">
            <el-radio-button label="in">{{
              $t("qrCheckin.checkinIn")
            }}</el-radio-button>
            <el-radio-button label="out">{{
              $t("qrCheckin.checkinOut")
            }}</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <!-- GPS位置信息 -->
        <div v-if="qrcodeInfo.require_gps" class="location-section">
          <el-form-item :label="$t('qrCheckin.locationInfo')">
            <div class="location-info">
              <el-icon v-if="gpsLoading"><Loading /></el-icon>
              <span v-if="locationInfo.address">{{
                locationInfo.address
              }}</span>
              <span v-else-if="gpsLoading">{{
                $t("qrCheckin.gettingLocation")
              }}</span>
              <span v-else class="error-text">{{
                $t("qrCheckin.cannotGetLocation")
              }}</span>
            </div>
            <div
              v-if="locationInfo.latitude && locationInfo.longitude"
              class="coordinates"
            >
              {{ $t("qrCheckin.coordinates") }}:
              {{ locationInfo.latitude.toFixed(6) }},
              {{ locationInfo.longitude.toFixed(6) }}
              <br />
              {{ $t("qrCheckin.accuracy") }}:
              {{
                locationInfo.accuracy
                  ? `${locationInfo.accuracy}${$t("qrCheckin.meters")}`
                  : $t("qrCheckin.unknown")
              }}
            </div>
            <div v-if="distanceFromWorksite !== null" class="distance-info">
              <span :class="withinWorksite ? 'success-text' : 'warning-text'">
                {{ $t("qrCheckin.distanceFromWorksite") }}:
                {{ distanceFromWorksite }}{{ $t("qrCheckin.meters") }}
                <el-icon v-if="withinWorksite" class="success-text"
                  ><Check
                /></el-icon>
                <el-icon v-else class="warning-text"><Warning /></el-icon>
              </span>
            </div>
          </el-form-item>
        </div>

        <!-- 拍照验证 -->
        <div v-if="qrcodeInfo.require_photo" class="photo-section">
          <el-form-item
            :label="$t('qrCheckin.photoVerification')"
            prop="photo_data"
          >
            <div class="camera-container">
              <video
                v-if="!photoTaken"
                ref="video"
                autoplay
                playsinline
                class="camera-preview"
              ></video>
              <canvas v-show="false" ref="canvas"></canvas>
              <div v-if="photoTaken" class="photo-preview">
                <img :src="photoDataUrl" alt="签到照片" />
              </div>

              <div class="camera-controls">
                <el-button
                  v-if="!cameraStarted && !photoTaken"
                  type="primary"
                  size="large"
                  @click="startCamera"
                >
                  <el-icon><Camera /></el-icon>
                  {{ $t("qrCheckin.startCamera") }}
                </el-button>

                <div
                  v-if="cameraStarted && !photoTaken"
                  class="capture-controls"
                >
                  <el-button type="success" size="large" @click="takePhoto">
                    <el-icon><Camera /></el-icon>
                    {{ $t("qrCheckin.takePhoto") }}
                  </el-button>
                  <el-button type="info" size="large" @click="stopCamera">
                    {{ $t("qrCheckin.stopCamera") }}
                  </el-button>
                </div>

                <div v-if="photoTaken" class="photo-controls">
                  <el-button type="warning" size="large" @click="retakePhoto">
                    {{ $t("qrCheckin.retakePhoto") }}
                  </el-button>
                </div>
              </div>
            </div>
          </el-form-item>
        </div>

        <!-- 签到按钮 -->
        <div class="submit-section">
          <el-button
            type="primary"
            size="large"
            :loading="submitting"
            :disabled="!canSubmit"
            class="submit-button"
            @click="submitCheckin"
          >
            {{
              submitting ? $t("qrCheckin.submitting") : $t("qrCheckin.submit")
            }}
          </el-button>
        </div>

        <!-- 时间信息 -->
        <div class="time-info">
          <p>{{ $t("common.currentTime", { time: currentTime }) }}</p>
          <p
            v-if="
              !qrcodeInfo.allow_checkin_anytime &&
              qrcodeInfo.work_start_time &&
              qrcodeInfo.work_end_time
            "
          >
            {{
              $t("common.workTime", {
                start: qrcodeInfo.work_start_time,
                end: qrcodeInfo.work_end_time,
              })
            }}
          </p>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, onMounted, computed, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { scanQRCode, checkinQRCode } from "@/api/qrcode";
import {
  ElMessage,
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElAlert,
  ElRadioGroup,
  ElRadioButton,
  ElIcon,
} from "element-plus";
import { Loading, Camera, Check, Warning } from "@element-plus/icons-vue";

export default {
  name: "QRCodeCheckin",
  components: {
    ElForm,
    ElFormItem,
    ElInput,
    ElButton,
    ElAlert,
    ElRadioGroup,
    ElRadioButton,
    ElIcon,
    Loading,
    Camera,
    Check,
    Warning,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const { t } = useI18n();
    const token = route.params.token;

    // 响应式数据
    const loading = ref(true);
    const error = ref("");
    const qrcodeInfo = ref(null);
    const gpsLoading = ref(false);
    const submitting = ref(false);
    const currentTime = ref("");

    // 签到表单数据
    const checkinData = ref({
      phone_number: "",
      checkin_type: "in",
      latitude: null,
      longitude: null,
      location_accuracy: null,
      address: "",
      photo_data: null,
    });

    // 位置信息
    const locationInfo = ref({
      latitude: null,
      longitude: null,
      accuracy: null,
      address: "",
    });

    // 摄像头相关
    const cameraStarted = ref(false);
    const photoTaken = ref(false);
    const photoDataUrl = ref("");
    const video = ref(null);
    const canvas = ref(null);
    const stream = ref(null);

    // 表单验证规则
    const rules = {
      phone_number: [
        { required: true, message: "请输入手机号码", trigger: "blur" },
        {
          pattern: /^1[3-9]\d{9}$/,
          message: "请输入正确的手机号码",
          trigger: "blur",
        },
      ],
      checkin_type: [
        { required: true, message: "请选择签到类型", trigger: "change" },
      ],
    };

    // 计算属性
    const distanceFromWorksite = computed(() => {
      if (
        !qrcodeInfo.value ||
        !locationInfo.value.latitude ||
        !locationInfo.value.longitude
      ) {
        return null;
      }

      return calculateDistance(
        qrcodeInfo.value.center_latitude,
        qrcodeInfo.value.center_longitude,
        locationInfo.value.latitude,
        locationInfo.value.longitude,
      ).toFixed(0);
    });

    const withinWorksite = computed(() => {
      return (
        distanceFromWorksite.value !== null &&
        distanceFromWorksite.value <= qrcodeInfo.value?.radius
      );
    });

    const canSubmit = computed(() => {
      const hasPhone = checkinData.value.phone_number.length > 0;
      const hasLocation =
        !qrcodeInfo.value?.require_gps ||
        (locationInfo.value.latitude && locationInfo.value.longitude);
      const hasPhoto = !qrcodeInfo.value?.require_photo || photoTaken.value;

      return hasPhone && hasLocation && hasPhoto && !submitting.value;
    });

    // 方法
    const updateCurrentTime = () => {
      currentTime.value = new Date().toLocaleString("zh-CN");
    };

    const loadQRCodeInfo = async () => {
      try {
        loading.value = true;
        error.value = "";

        const response = await scanQRCode(token);

        if (response && response.success && response.data) {
          qrcodeInfo.value = response.data;

          // 如果需要GPS，立即获取位置
          if (qrcodeInfo.value.require_gps) {
            await getCurrentLocation();
          }
        } else {
          error.value =
            response?.message || "Failed to load check-in information";
        }
      } catch (err) {
        console.error("加载二维码信息失败:", err);
        error.value =
          err.response?.data?.message || "Network error, please try again";
      } finally {
        loading.value = false;
      }
    };

    const getCurrentLocation = () => {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          ElMessage({ message: "您的浏览器不支持位置获取", type: "error" });
          reject("不支持地理位置");
          return;
        }

        gpsLoading.value = true;

        const options = {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        };

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            locationInfo.value = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            };

            // 尝试获取地址信息（使用反向地理编码）
            try {
              const address = await reverseGeocode(
                position.coords.latitude,
                position.coords.longitude,
              );
              locationInfo.value.address = address;
            } catch (err) {
              console.warn("获取地址失败:", err);
              locationInfo.value.address = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
            }

            checkinData.value.latitude = position.coords.latitude;
            checkinData.value.longitude = position.coords.longitude;
            checkinData.value.location_accuracy = position.coords.accuracy;
            checkinData.value.address = locationInfo.value.address;

            gpsLoading.value = false;
            resolve();
          },
          (error) => {
            gpsLoading.value = false;
            let errorMessage = "无法获取位置信息";

            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = "位置权限被拒绝，请允许获取位置信息";
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = "位置信息不可用";
                break;
              case error.TIMEOUT:
                errorMessage = "获取位置超时";
                break;
            }

            ElMessage({ message: errorMessage, type: "error" });
            reject(errorMessage);
          },
          options,
        );
      });
    };

    // 简单的反向地理编码（这里可以集成更好的地图服务）
    const reverseGeocode = async (lat, lng) => {
      // 这里可以集成Google Maps、百度地图等服务
      // 现在返回坐标格式的地址
      return `纬度: ${lat.toFixed(6)}, 经度: ${lng.toFixed(6)}`;
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371e3; // 地球半径（米）
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return R * c;
    };

    // 摄像头相关方法
    const startCamera = async () => {
      try {
        stream.value = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
            facingMode: "user", // 前置摄像头
          },
        });
        video.value.srcObject = stream.value;
        cameraStarted.value = true;
      } catch (err) {
        ElMessage({ message: "无法启动摄像头: " + err.message, type: "error" });
      }
    };

    const stopCamera = () => {
      if (stream.value) {
        stream.value.getTracks().forEach((track) => track.stop());
        stream.value = null;
      }
      cameraStarted.value = false;
    };

    const takePhoto = () => {
      if (!video.value || !canvas.value) return;

      const context = canvas.value.getContext("2d");
      canvas.value.width = video.value.videoWidth;
      canvas.value.height = video.value.videoHeight;

      context.drawImage(video.value, 0, 0);

      photoDataUrl.value = canvas.value.toDataURL("image/jpeg", 0.8);
      checkinData.value.photo_data = photoDataUrl.value;

      photoTaken.value = true;
      stopCamera();
    };

    const retakePhoto = () => {
      photoTaken.value = false;
      photoDataUrl.value = "";
      checkinData.value.photo_data = null;
    };

    // 提交签到
    const submitCheckin = async () => {
      try {
        submitting.value = true;

        const payload = {
          phone_number: checkinData.value.phone_number,
          checkin_type: checkinData.value.checkin_type,
          latitude: checkinData.value.latitude,
          longitude: checkinData.value.longitude,
          location_accuracy: checkinData.value.location_accuracy,
          address: checkinData.value.address,
          photo_data: checkinData.value.photo_data,
          device_info: {
            device_type: getDeviceType(),
            app_version: "1.0.0",
          },
        };

        const response = await checkinQRCode(token, payload);

        if (response && response.success && response.data) {
          // 跳转到结果页面
          const resultData = encodeURIComponent(JSON.stringify(response.data));
          router.push(`/checkin-result/${token}?result=${resultData}`);
        } else {
          // 跳转到结果页面显示错误
          const errorMessage = encodeURIComponent(
            response?.message || t("qrCheckin.checkinFailed"),
          );
          router.push(`/checkin-result/${token}?error=${errorMessage}`);
        }
      } catch (err) {
        console.error("签到失败:", err);
        // 跳转到结果页面显示错误
        const errorMessage = encodeURIComponent(
          err.response?.data?.message || t("qrCheckin.networkError"),
        );
        router.push(`/checkin-result/${token}?error=${errorMessage}`);
      } finally {
        submitting.value = false;
      }
    };

    const getDeviceType = () => {
      const userAgent = navigator.userAgent;
      if (/iPad|iPhone|iPod/.test(userAgent)) return "iOS";
      if (/Android/.test(userAgent)) return "Android";
      return "Web";
    };

    const formatTime = (timeString) => {
      return new Date(timeString).toLocaleString("zh-CN");
    };

    const resetForm = () => {
      checkinData.value = {
        phone_number: "",
        checkin_type: "in",
        latitude: null,
        longitude: null,
        location_accuracy: null,
        address: "",
        photo_data: null,
      };
      photoTaken.value = false;
      photoDataUrl.value = "";

      // 重新获取位置（如果需要）
      if (qrcodeInfo.value?.require_gps) {
        getCurrentLocation();
      }
    };

    // 生命周期
    onMounted(() => {
      loadQRCodeInfo();

      // 更新时间
      updateCurrentTime();
      const timeInterval = setInterval(updateCurrentTime, 1000);

      onUnmounted(() => {
        clearInterval(timeInterval);
        stopCamera();
      });
    });

    return {
      loading,
      error,
      qrcodeInfo,
      gpsLoading,
      submitting,
      currentTime,
      checkinData,
      locationInfo,
      cameraStarted,
      photoTaken,
      photoDataUrl,
      video,
      canvas,
      rules,
      distanceFromWorksite,
      withinWorksite,
      canSubmit,
      startCamera,
      stopCamera,
      takePhoto,
      retakePhoto,
      submitCheckin,
      formatTime,
      resetForm,
      getCurrentLocation,
    };
  },
};
</script>

<style scoped>
.qr-checkin-container {
  max-width: 480px;
  margin: 0 auto;
  padding: 16px;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
}

.header {
  text-align: center;
  margin-bottom: 32px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 28px 24px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: fadeInDown 0.6s ease-out;
}

.header h1 {
  margin: 0 0 16px 0;
  color: #667eea;
  font-size: 32px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.worksite-info h3 {
  margin: 12px 0 8px 0;
  color: #303133;
  font-size: 22px;
  font-weight: 600;
}

.worksite-info p {
  margin: 0;
  color: #666;
  font-size: 15px;
  opacity: 0.8;
}

.loading {
  text-align: center;
  padding: 60px 40px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: pulse 2s ease-in-out infinite;
}

.error-container {
  margin-bottom: 24px;
  animation: shake 0.5s ease-in-out;
}

.checkin-form {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 32px 28px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: fadeInUp 0.6s ease-out;
}

.location-section {
  margin: 24px 0;
  padding: 20px;
  background: linear-gradient(
    135deg,
    rgba(103, 194, 58, 0.1) 0%,
    rgba(64, 158, 255, 0.1) 100%
  );
  border-radius: 12px;
  border: 1px solid rgba(103, 194, 58, 0.2);
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;
}

.location-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(103, 194, 58, 0.2);
}

.location-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 15px;
  font-weight: 500;
}

.coordinates {
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  font-family: "Monaco", monospace;
}

.distance-info {
  font-weight: 600;
  font-size: 16px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.7);
}

.success-text {
  color: #67c23a;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.warning-text {
  color: #e6a23c;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.error-text {
  color: #f56c6c;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.photo-section {
  margin: 24px 0;
}

.camera-container {
  text-align: center;
  padding: 20px;
  background: rgba(64, 158, 255, 0.05);
  border-radius: 12px;
  border: 2px dashed rgba(64, 158, 255, 0.2);
  transition: all 0.3s ease;
}

.camera-container:hover {
  background: rgba(64, 158, 255, 0.1);
  border-color: rgba(64, 158, 255, 0.4);
}

.camera-preview {
  width: 100%;
  max-width: 320px;
  height: auto;
  border-radius: 12px;
  border: 3px solid #409eff;
  margin-bottom: 20px;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
}

.camera-preview:hover {
  transform: scale(1.02);
}

.photo-preview img {
  width: 100%;
  max-width: 320px;
  height: auto;
  border-radius: 12px;
  border: 3px solid #67c23a;
  box-shadow: 0 4px 16px rgba(103, 194, 58, 0.3);
  animation: zoomIn 0.5s ease-out;
}

.camera-controls,
.capture-controls,
.photo-controls {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 16px;
}

.submit-section {
  margin: 32px 0;
  text-align: center;
}

.submit-button {
  width: 100%;
  height: 56px;
  font-size: 18px;
  font-weight: 700;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
}

.submit-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.submit-button:active {
  transform: translateY(0);
}

.submit-button:disabled {
  opacity: 0.6;
  transform: none;
  cursor: not-allowed;
}

.time-info {
  text-align: center;
  padding: 20px;
  background: rgba(240, 249, 255, 0.8);
  backdrop-filter: blur(5px);
  border-radius: 12px;
  margin-top: 24px;
  border: 1px solid rgba(64, 158, 255, 0.2);
  animation: fadeIn 1s ease-out;
}

.time-info p {
  margin: 8px 0;
  color: #555;
  font-size: 15px;
  font-weight: 500;
}

/* 动画效果 */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 响应式设计 */
@media (max-width: 600px) {
  .qr-checkin-container {
    padding: 12px;
  }

  .header {
    padding: 20px 16px;
    margin-bottom: 24px;
  }

  .header h1 {
    font-size: 28px;
  }

  .checkin-form {
    padding: 24px 20px;
  }

  .location-section {
    padding: 16px;
  }

  .camera-container {
    padding: 16px;
  }

  .camera-controls,
  .capture-controls,
  .photo-controls {
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .camera-controls .el-button,
  .capture-controls .el-button,
  .photo-controls .el-button {
    width: 100%;
    max-width: 250px;
    height: 48px;
    font-size: 16px;
  }

  .submit-button {
    height: 52px;
    font-size: 16px;
  }
}

@media (max-width: 400px) {
  .qr-checkin-container {
    padding: 8px;
  }

  .header {
    padding: 16px 12px;
  }

  .header h1 {
    font-size: 24px;
  }

  .checkin-form {
    padding: 20px 16px;
  }
}
</style>
