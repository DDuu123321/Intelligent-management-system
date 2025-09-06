<template>
  <div class="checkin-result-container">
    <!-- 语言切换器 -->
    <div class="language-selector">
      <el-dropdown @command="handleLanguageChange">
        <el-button text>
          <el-icon><Setting /></el-icon>
          {{ currentLanguageLabel }}
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="en-US">English</el-dropdown-item>
            <el-dropdown-item command="zh-CN">中文</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 结果显示 -->
    <div class="result-content">
      <div v-if="result" class="success-result">
        <!-- 成功图标 -->
        <div class="success-icon">
          <el-icon size="80" color="#67C23A"><CircleCheck /></el-icon>
        </div>

        <!-- 成功标题 -->
        <h1 class="success-title">{{ $t("checkinResult.success") }}</h1>

        <!-- 员工信息 -->
        <div class="employee-info">
          <h2>{{ result.employee_name }}</h2>
          <p class="employee-id">{{ result.employee_id }}</p>
        </div>

        <!-- 签到详情 -->
        <div class="checkin-details">
          <div class="detail-item">
            <span class="label">{{ $t("checkinResult.time") }}:</span>
            <span class="value">{{ formatTime(result.checkin_time) }}</span>
          </div>

          <div class="detail-item">
            <span class="label">{{ $t("checkinResult.type") }}:</span>
            <span class="value">{{
              getCheckinTypeLabel(result.checkin_type)
            }}</span>
          </div>

          <div class="detail-item">
            <span class="label">{{ $t("checkinResult.worksite") }}:</span>
            <span class="value">{{ result.worksite_name }}</span>
          </div>

          <div class="detail-item">
            <span class="label">{{ $t("checkinResult.status") }}:</span>
            <el-tag :type="getStatusType(result.status)" size="large">
              {{ getStatusLabel(result.status) }}
            </el-tag>
          </div>
        </div>

        <!-- 位置信息 -->
        <div v-if="result.address" class="location-info">
          <div class="detail-item">
            <span class="label">{{ $t("checkinResult.location") }}:</span>
            <span class="value">{{ result.address }}</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button type="primary" size="large" @click="checkinAgain">
            {{ $t("checkinResult.checkinAgain") }}
          </el-button>
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-result">
        <div class="error-icon">
          <el-icon size="80" color="#F56C6C"><CircleClose /></el-icon>
        </div>
        <h1 class="error-title">{{ $t("checkinResult.failed") }}</h1>
        <p class="error-message">{{ error }}</p>
        <div class="action-buttons">
          <el-button type="primary" size="large" @click="goBack">
            {{ $t("checkinResult.goBack") }}
          </el-button>
        </div>
      </div>

      <!-- 无结果状态 -->
      <div v-else class="no-result">
        <div class="no-result-icon">
          <el-icon size="80" color="#909399"><QuestionFilled /></el-icon>
        </div>
        <h1>{{ $t("checkinResult.noResult") }}</h1>
        <div class="action-buttons">
          <el-button type="primary" size="large" @click="goToCheckin">
            {{ $t("checkinResult.goToCheckin") }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 页脚信息 -->
    <div class="footer-info">
      <p>{{ $t("checkinResult.currentTime") }}: {{ currentTime }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  ElButton,
  ElTag,
  ElIcon,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
} from "element-plus";
import {
  CircleCheck,
  CircleClose,
  QuestionFilled,
  Setting,
  ArrowDown,
} from "@element-plus/icons-vue";

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();

// 响应式数据
const result = ref(null);
const error = ref(null);
const currentTime = ref("");

// 计算属性
const currentLanguageLabel = computed(() => {
  return locale.value === "zh-CN" ? "中文" : "English";
});

// 方法
const formatTime = (timeString) => {
  const date = new Date(timeString);
  return date.toLocaleString(locale.value === "zh-CN" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const getCheckinTypeLabel = (type) => {
  return type === "in"
    ? t("checkinResult.checkinIn")
    : t("checkinResult.checkinOut");
};

const getStatusLabel = (status) => {
  const statusMap = {
    approved: t("checkinResult.approved"),
    pending: t("checkinResult.pending"),
    rejected: t("checkinResult.rejected"),
  };
  return statusMap[status] || status;
};

const getStatusType = (status) => {
  const typeMap = {
    approved: "success",
    pending: "warning",
    rejected: "danger",
  };
  return typeMap[status] || "info";
};

const handleLanguageChange = (lang) => {
  locale.value = lang;
  localStorage.setItem("language", lang);
};

const checkinAgain = () => {
  // 去掉结果参数，返回签到页面
  const token = route.params.token;
  router.push(`/checkin/${token}`);
};

const goBack = () => {
  router.go(-1);
};

const goToCheckin = () => {
  // 如果有token参数，跳转到签到页面，否则跳转到首页
  const token = route.params.token;
  if (token) {
    router.push(`/checkin/${token}`);
  } else {
    router.push("/");
  }
};

const updateCurrentTime = () => {
  currentTime.value = new Date().toLocaleString(
    locale.value === "zh-CN" ? "zh-CN" : "en-US",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    },
  );
};

// 生命周期
onMounted(() => {
  // 从路由查询参数或状态获取签到结果
  if (route.query.result) {
    try {
      result.value = JSON.parse(decodeURIComponent(route.query.result));
    } catch (e) {
      console.error("解析签到结果失败:", e);
      error.value = t("checkinResult.parseError");
    }
  } else if (route.query.error) {
    error.value = decodeURIComponent(route.query.error);
  }

  // 从localStorage获取保存的语言设置
  const savedLanguage = localStorage.getItem("language");
  if (savedLanguage) {
    locale.value = savedLanguage;
  } else {
    // 默认英文
    locale.value = "en-US";
    localStorage.setItem("language", "en-US");
  }

  // 更新时间
  updateCurrentTime();
  const timeInterval = setInterval(updateCurrentTime, 1000);

  // 清理定时器
  onUnmounted(() => {
    clearInterval(timeInterval);
  });
});
</script>

<style scoped>
.checkin-result-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, sans-serif;
}

.language-selector {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.language-selector .el-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  backdrop-filter: blur(10px);
}

.language-selector .el-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.result-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 48px 40px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.15);
  text-align: center;
  max-width: 520px;
  width: 100%;
  margin: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  animation: slideInUp 0.8s ease-out;
  position: relative;
  overflow: hidden;
}

.result-content::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #67c23a 0%, #409eff 50%, #e6a23c 100%);
  border-radius: 24px 24px 0 0;
}

.success-icon,
.error-icon,
.no-result-icon {
  margin-bottom: 24px;
  animation: bounceIn 1s ease-out 0.3s both;
}

.success-title {
  color: #67c23a;
  font-size: 2.8rem;
  font-weight: 800;
  margin: 0 0 32px 0;
  text-shadow: 0 2px 4px rgba(103, 194, 58, 0.2);
  animation: fadeInScale 0.8s ease-out 0.5s both;
}

.error-title {
  color: #f56c6c;
  font-size: 2.8rem;
  font-weight: 800;
  margin: 0 0 24px 0;
  text-shadow: 0 2px 4px rgba(245, 108, 108, 0.2);
  animation: fadeInScale 0.8s ease-out 0.5s both;
}

.employee-info {
  background: linear-gradient(
    135deg,
    rgba(103, 194, 58, 0.1) 0%,
    rgba(64, 158, 255, 0.1) 100%
  );
  padding: 28px;
  border-radius: 20px;
  margin-bottom: 32px;
  border: 1px solid rgba(103, 194, 58, 0.2);
  animation: fadeInUp 0.8s ease-out 0.7s both;
  transform: translateY(20px);
}

.employee-info h2 {
  color: #2c3e50;
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 12px 0;
  letter-spacing: -0.5px;
}

.employee-id {
  color: #7f8c8d;
  font-size: 1.2rem;
  font-weight: 500;
  margin: 0;
  opacity: 0.9;
}

.checkin-details {
  text-align: left;
  margin-bottom: 32px;
  animation: fadeInUp 0.8s ease-out 0.9s both;
  transform: translateY(20px);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  background: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.detail-item:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.detail-item:last-child {
  margin-bottom: 0;
}

.label {
  font-weight: 700;
  color: #34495e;
  flex: 1;
  font-size: 1.1rem;
}

.value {
  color: #2c3e50;
  flex: 2;
  text-align: right;
  font-weight: 600;
  font-size: 1.1rem;
}

.location-info {
  background: linear-gradient(
    135deg,
    rgba(240, 249, 255, 0.8) 0%,
    rgba(240, 249, 255, 0.6) 100%
  );
  padding: 24px;
  border-radius: 18px;
  margin-bottom: 32px;
  border: 1px solid rgba(64, 158, 255, 0.2);
  animation: fadeInUp 0.8s ease-out 1.1s both;
  transform: translateY(20px);
}

.action-buttons {
  margin-top: 32px;
  animation: fadeInUp 0.8s ease-out 1.3s both;
  transform: translateY(20px);
}

.action-buttons .el-button {
  width: 100%;
  height: 56px;
  font-size: 1.2rem;
  font-weight: 700;
  border-radius: 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
}

.action-buttons .el-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
}

.action-buttons .el-button:active {
  transform: translateY(-1px);
}

.error-message {
  color: #7f8c8d;
  font-size: 1.2rem;
  margin-bottom: 32px;
  line-height: 1.7;
  font-weight: 500;
  animation: fadeInUp 0.8s ease-out 0.7s both;
}

.footer-info {
  margin-top: 30px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

/* 动画效果 */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(60px);
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

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    transform: scale(1.1);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
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

/* 响应式设计 */
@media (max-width: 768px) {
  .checkin-result-container {
    padding: 12px;
  }

  .result-content {
    padding: 36px 24px;
    margin: 12px;
    border-radius: 20px;
  }

  .success-title,
  .error-title {
    font-size: 2.2rem;
  }

  .employee-info h2 {
    font-size: 1.7rem;
  }

  .employee-info {
    padding: 24px;
  }

  .detail-item {
    padding: 16px 18px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .value {
    text-align: left;
  }

  .action-buttons .el-button {
    height: 52px;
    font-size: 1.1rem;
  }

  .language-selector {
    top: 12px;
    right: 12px;
  }
}

@media (max-width: 480px) {
  .result-content {
    padding: 28px 20px;
    margin: 8px;
  }

  .success-title,
  .error-title {
    font-size: 2rem;
  }

  .employee-info {
    padding: 20px;
  }

  .employee-info h2 {
    font-size: 1.5rem;
  }

  .label,
  .value {
    font-size: 1rem;
  }

  .detail-item {
    padding: 14px 16px;
  }

  .action-buttons .el-button {
    height: 48px;
    font-size: 1rem;
  }

  .language-selector {
    top: 8px;
    right: 8px;
  }
}
</style>
