<template>
  <div class="login-container">
    <div class="login-background">
      <div class="background-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
        <div class="shape shape-5"></div>
      </div>
    </div>

    <div class="login-content">
      <!-- 左侧品牌区域 -->
      <div class="brand-section">
        <div class="brand-container">
          <div class="brand-logo">
            <el-icon size="80" color="#fff"><Monitor /></el-icon>
          </div>
          <h1 class="brand-title">{{ $t("login.title") }}</h1>
          <p class="brand-subtitle">
            {{ $t("login.subtitle") || "Smart Construction Management System" }}
          </p>
          <div class="features-list">
            <div class="feature-item">
              <el-icon><Check /></el-icon>
              <span>{{
                $t("login.feature1") || "Real-time Site Monitoring"
              }}</span>
            </div>
            <div class="feature-item">
              <el-icon><Check /></el-icon>
              <span>{{
                $t("login.feature2") || "Worker Attendance System"
              }}</span>
            </div>
            <div class="feature-item">
              <el-icon><Check /></el-icon>
              <span>{{
                $t("login.feature3") || "Vehicle Tracking System"
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧登录表单 -->
      <div class="form-section">
        <div class="login-form">
          <!-- 语言选择器 -->
          <div class="language-selector">
            <el-select
              v-model="selectedLanguage"
              size="default"
              class="lang-select"
              @change="handleLanguageChange"
            >
              <el-option label="中文" value="zh-CN">
                <span class="lang-option">🇨🇳 中文</span>
              </el-option>
              <el-option label="English" value="en-US">
                <span class="lang-option">🇺🇸 English</span>
              </el-option>
            </el-select>
          </div>

          <div class="form-header">
            <h2 class="form-title">{{ $t("login.welcome") || "Welcome" }}</h2>
            <p class="form-subtitle">
              {{ $t("login.formSubtitle") || "Please enter your credentials" }}
            </p>
          </div>

          <el-form
            ref="formRef"
            :model="loginForm"
            :rules="rules"
            class="login-form-content"
          >
            <el-form-item prop="username" class="form-item">
              <div class="input-label">{{ $t("login.username") }}</div>
              <el-input
                v-model="loginForm.username"
                :placeholder="
                  $t('login.usernamePlaceholder') || 'Enter your username'
                "
                size="large"
                class="form-input"
              >
                <template #prefix>
                  <el-icon class="input-icon"><User /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item prop="password" class="form-item">
              <div class="input-label">{{ $t("login.password") }}</div>
              <el-input
                v-model="loginForm.password"
                type="password"
                :placeholder="
                  $t('login.passwordPlaceholder') || 'Enter your password'
                "
                size="large"
                class="form-input"
                show-password
                @keyup.enter="handleLogin"
              >
                <template #prefix>
                  <el-icon class="input-icon"><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item class="form-item">
              <el-button
                type="primary"
                size="large"
                class="login-button"
                :loading="loading"
                @click="handleLogin"
              >
                <span v-if="!loading">{{ $t("login.loginButton") }}</span>
                <span v-else>{{
                  $t("login.loginLoading") || "Logging in..."
                }}</span>
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { useI18n } from "vue-i18n";
import {
  Monitor,
  Check,
  User,
  Lock,
  InfoFilled,
} from "@element-plus/icons-vue";
import { login } from "@/api/auth";
import { useAuthStore } from "@/stores/auth";
import { useLocaleStore } from "@/stores/locale";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const localeStore = useLocaleStore();
const { t } = useI18n();

const formRef = ref();
const loading = ref(false);
const selectedLanguage = ref(localeStore.currentLocale);

const loginForm = reactive({
  username: "",
  password: "",
});

const rules = {
  username: [
    {
      required: true,
      message: () => t("login.username") + " is required",
      trigger: "blur",
    },
  ],
  password: [
    {
      required: true,
      message: () => t("login.password") + " is required",
      trigger: "blur",
    },
  ],
};

const handleLanguageChange = (locale: string) => {
  localeStore.setLocale(locale);
  selectedLanguage.value = locale;
};

const handleLogin = async () => {
  try {
    const valid = await formRef.value.validate();
    if (!valid) return;

    loading.value = true;

    console.log("正在登录...", loginForm.username);

    const response = await login(loginForm);

    console.log("登录响应:", response);

    // 保存用户信息到store
    authStore.setAuth(response.data);
    ElMessage({ message: t("login.loginSuccess"), type: "success" });

    // 获取重定向路径或默认跳转到仪表盘
    const redirect = (route.query.redirect as string) || "/admin/dashboard";
    router.push(redirect);
  } catch (error: any) {
    console.error("登录失败:", error);
    ElMessage({
      message: error.message || t("login.loginFailed"),
      type: "error",
    });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* 主容器 */
.login-container {
  height: 100vh;
  position: relative;
  overflow: hidden;
}

/* 动态背景 */
.login-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  z-index: 1;
}

.background-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 200px;
  height: 200px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 150px;
  height: 150px;
  top: 20%;
  right: 15%;
  animation-delay: 1s;
}

.shape-3 {
  width: 100px;
  height: 100px;
  bottom: 20%;
  left: 20%;
  animation-delay: 2s;
}

.shape-4 {
  width: 80px;
  height: 80px;
  bottom: 30%;
  right: 25%;
  animation-delay: 1.5s;
}

.shape-5 {
  width: 120px;
  height: 120px;
  top: 50%;
  left: 50%;
  animation-delay: 0.5s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) scale(1);
  }
  50% {
    transform: translateY(-20px) scale(1.1);
  }
}

/* 登录内容容器 */
.login-content {
  position: relative;
  z-index: 2;
  display: flex;
  height: 100vh;
}

/* 左侧品牌区域 */
.brand-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 60px;
  color: white;
}

.brand-container {
  max-width: 500px;
  text-align: center;
  animation: slideInLeft 1s ease-out;
}

.brand-logo {
  margin-bottom: 32px;
  animation: pulse 2s ease-in-out infinite;
}

.brand-title {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 16px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  background: linear-gradient(45deg, #fff, #e8f4f8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-subtitle {
  font-size: 18px;
  margin-bottom: 48px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 300;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(8px);
}

.feature-item .el-icon {
  font-size: 20px;
  color: #4ade80;
}

.feature-item span {
  font-size: 16px;
  font-weight: 500;
}

/* 右侧表单区域 */
.form-section {
  width: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
}

.login-form {
  width: 100%;
  max-width: 400px;
  padding: 60px 40px;
  position: relative;
  animation: slideInRight 1s ease-out;
}

/* 语言选择器 */
.language-selector {
  position: absolute;
  top: 20px;
  right: 20px;
}

.lang-select {
  width: 140px;
}

.lang-select :deep(.el-input__wrapper) {
  border-radius: 8px;
  border: 1px solid #e0e6ed;
  transition: all 0.3s ease;
}

.lang-select :deep(.el-input__wrapper:hover) {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.lang-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 表单头部 */
.form-header {
  text-align: center;
  margin-bottom: 40px;
}

.form-title {
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #2c3e50, #3498db);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.form-subtitle {
  color: #7f8c8d;
  font-size: 16px;
  font-weight: 400;
  margin: 0;
}

/* 表单内容 */
.login-form-content {
  margin-bottom: 32px;
}

.form-item {
  margin-bottom: 24px;
}

.input-label {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.form-input {
  transition: all 0.3s ease;
}

.form-input :deep(.el-input__wrapper) {
  border-radius: 12px;
  border: 2px solid #e9ecef;
  box-shadow: none;
  transition: all 0.3s ease;
  padding: 12px 16px;
}

.form-input :deep(.el-input__wrapper:hover) {
  border-color: #409eff;
}

.form-input :deep(.el-input__wrapper.is-focus) {
  border-color: #409eff;
  box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.1);
}

.input-icon {
  color: #7f8c8d;
  font-size: 18px;
}

.login-button {
  width: 100%;
  height: 50px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
  background: linear-gradient(135deg, #764ba2, #667eea);
}

.login-button:active {
  transform: translateY(0);
}

/* 测试账号提示 */
.login-tips {
  margin-top: 32px;
}

.tips-divider {
  color: #7f8c8d;
  font-size: 12px;
}

.tips-divider :deep(.el-divider__text) {
  background: transparent;
  color: #7f8c8d;
  font-weight: 500;
}

.test-accounts {
  margin-top: 16px;
}

.account-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin-bottom: 8px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.account-item:hover {
  background: #e3f2fd;
  border-color: #2196f3;
  transform: translateX(4px);
}

.account-info {
  font-size: 14px;
  color: #495057;
  font-family: "Courier New", monospace;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .login-content {
    flex-direction: column;
  }

  .brand-section {
    flex: none;
    height: 40vh;
    padding: 40px 20px;
  }

  .brand-title {
    font-size: 36px;
  }

  .features-list {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }

  .feature-item {
    flex: 0 0 calc(50% - 10px);
    justify-content: center;
    text-align: center;
  }

  .form-section {
    width: 100%;
    height: 60vh;
  }
}

@media (max-width: 768px) {
  .brand-section {
    height: 30vh;
    padding: 20px;
  }

  .brand-title {
    font-size: 24px;
  }

  .brand-subtitle {
    font-size: 14px;
  }

  .feature-item {
    flex: 1;
    padding: 12px;
    font-size: 12px;
  }

  .form-section {
    height: 70vh;
  }

  .login-form {
    padding: 40px 20px;
  }

  .form-title {
    font-size: 24px;
  }
}

/* 动画定义 */
@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}
</style>
