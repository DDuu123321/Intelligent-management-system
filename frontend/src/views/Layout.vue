<template>
  <el-container class="layout-container">
    <el-header class="layout-header">
      <div class="header-left">
        <div class="logo-section">
          <div class="logo-icon">
            <el-icon size="32" color="#409EFF"><Monitor /></el-icon>
          </div>
          <h1 class="site-title">{{ $t("login.title") }}</h1>
        </div>
      </div>
      <div class="header-right">
        <!-- 语言切换器 -->
        <div class="header-controls">
          <el-select
            v-model="selectedLanguage"
            class="language-selector"
            size="default"
            @change="handleLanguageChange"
          >
            <el-option label="中文" value="zh-CN" />
            <el-option label="English" value="en-US" />
          </el-select>

          <el-dropdown trigger="hover" class="user-dropdown">
            <div class="user-info">
              <el-avatar :size="36" :src="currentUser?.avatar || undefined">
                <el-icon><User /></el-icon>
              </el-avatar>
              <span class="username">{{
                currentUser?.name || $t("menu.admin")
              }}</span>
              <el-icon class="dropdown-arrow"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>
                  <el-icon><Setting /></el-icon>
                  {{ $t("common.settings") }}
                </el-dropdown-item>
                <el-dropdown-item divided @click="logout">
                  <el-icon><SwitchButton /></el-icon>
                  {{ $t("common.logout") }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>

    <el-container>
      <el-aside class="layout-sidebar" width="260px">
        <div class="sidebar-brand">
          <el-icon size="24" color="#409EFF"><Monitor /></el-icon>
          <span class="brand-text">{{ $t("menu.system") }}</span>
        </div>
        <el-menu
          :default-active="$route.path"
          router
          background-color="#2c3e50"
          text-color="#bdc3c7"
          active-text-color="#fff"
          class="sidebar-menu"
        >
          <el-menu-item index="/admin/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>{{ $t("menu.dashboard") }}</span>
          </el-menu-item>
          <el-menu-item index="/admin/attendance">
            <el-icon><Clock /></el-icon>
            <span>{{ $t("menu.attendance") }}</span>
          </el-menu-item>
          <el-menu-item index="/admin/checkin-records">
            <el-icon><Document /></el-icon>
            <span>{{ $t("checkinRecords.title") }}</span>
          </el-menu-item>
          <el-menu-item
            v-if="hasPermission('VEHICLE_VIEW')"
            index="/admin/vehicles"
          >
            <el-icon><Location /></el-icon>
            <span>{{ $t("menu.vehicles") }}</span>
          </el-menu-item>
          <el-menu-item
            v-if="hasPermission('MONITORING_VIEW')"
            index="/admin/monitoring"
          >
            <el-icon><VideoCamera /></el-icon>
            <span>{{ $t("menu.monitoring") }}</span>
          </el-menu-item>
          <el-menu-item
            v-if="hasPermission('EMPLOYEE_VIEW')"
            index="/admin/employees"
          >
            <el-icon><User /></el-icon>
            <span>{{ $t("employee.management") }}</span>
          </el-menu-item>
          <el-menu-item index="/admin/departments">
            <el-icon><OfficeBuilding /></el-icon>
            <span>{{ $t("departments.title") }}</span>
          </el-menu-item>
          <el-menu-item
            v-if="hasPermission('WORKSITE_VIEW')"
            index="/admin/worksites"
          >
            <el-icon><OfficeBuilding /></el-icon>
            <span>{{ $t("worksite.management") }}</span>
          </el-menu-item>
          <el-menu-item
            v-if="hasPermission('QRCODE_VIEW')"
            index="/admin/qrcode"
          >
            <el-icon><CollectionTag /></el-icon>
            <span>{{ $t("menu.qrCodeCheckin") }}</span>
          </el-menu-item>
          <el-menu-item
            v-if="hasPermission('LICENSE_VIEW')"
            index="/admin/licenses"
          >
            <el-icon><CollectionTag /></el-icon>
            <span>{{ $t("license.title") }}</span>
          </el-menu-item>
          <el-menu-item
            v-if="hasPermission('LICENSE_EDIT')"
            index="/admin/licenses/ocr-confirmation"
          >
            <el-icon><Check /></el-icon>
            <span>{{ $t("license.ocrConfirmation") }}</span>
          </el-menu-item>
          <el-menu-item
            v-if="hasPermission('LICENSE_VIEW')"
            index="/admin/licenses/expiring"
          >
            <el-icon><Clock /></el-icon>
            <span>{{ $t("license.widgetTitle") }}</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "@/stores/auth";
import { useLocaleStore } from "@/stores/locale";
import { usePermissions } from "@/composables/usePermissions";
import {
  User,
  Odometer,
  Clock,
  Location,
  VideoCamera,
  CollectionTag,
  OfficeBuilding,
  Check,
  Document,
  Monitor,
  ArrowDown,
  Setting,
  SwitchButton,
} from "@element-plus/icons-vue";

const router = useRouter();
const { t } = useI18n();
const authStore = useAuthStore();
const localeStore = useLocaleStore();
const { hasPermission } = usePermissions();

const selectedLanguage = ref(localeStore.currentLocale);
const currentUser = authStore.user;

const handleLanguageChange = (locale: string) => {
  localeStore.setLocale(locale);
  selectedLanguage.value = locale;
};

const logout = () => {
  // 清除登录状态
  authStore.clearAuth();
  router.push("/login");
};
</script>

<style scoped>
/* 主容器动画 */
.layout-container {
  height: 100vh;
  transition: all 0.3s ease;
}

/* 头部样式优化 */
.layout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 0 24px;
  height: 70px;
  position: relative;
  z-index: 1000;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  padding: 8px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.logo-icon:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.site-title {
  margin: 0;
  color: white;
  font-size: 24px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 头部右侧控件 */
.header-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

.language-selector {
  width: 130px;
}

.language-selector :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.language-selector :deep(.el-input__wrapper:hover) {
  background: white;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

/* 用户信息样式 */
.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.user-info:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.username {
  color: white;
  font-weight: 500;
  font-size: 14px;
}

.dropdown-arrow {
  color: rgba(255, 255, 255, 0.7);
  transition: transform 0.3s ease;
}

.user-dropdown:hover .dropdown-arrow {
  transform: rotate(180deg);
}

/* 侧边栏样式 */
.layout-sidebar {
  background: linear-gradient(180deg, #2c3e50 0%, #34495e 100%);
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
  border-right: none;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 10px;
}

.brand-text {
  color: white;
  font-size: 16px;
  font-weight: 600;
}

.sidebar-menu {
  border: none !important;
}

.sidebar-menu :deep(.el-menu-item) {
  margin: 4px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background: rgba(64, 158, 255, 0.15) !important;
  color: #409eff !important;
  transform: translateX(4px);
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, #409eff, #36a3f7) !important;
  color: white !important;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
  transform: translateX(8px);
}

.sidebar-menu :deep(.el-menu-item.is-active::before) {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 4px;
  background: linear-gradient(180deg, #fff, rgba(255, 255, 255, 0.8));
}

.sidebar-menu :deep(.el-icon) {
  font-size: 18px;
  margin-right: 8px;
}

/* 主内容区域 */
.layout-main {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 24px;
  min-height: calc(100vh - 70px);
  position: relative;
}

.layout-main::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="%23ffffff" fill-opacity="0.05"><circle cx="30" cy="30" r="2"/></g></g></svg>');
  pointer-events: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .layout-header {
    padding: 0 16px;
    height: 60px;
  }

  .site-title {
    font-size: 20px;
  }

  .header-controls {
    gap: 12px;
  }

  .language-selector {
    width: 100px;
  }

  .username {
    display: none;
  }

  .layout-sidebar {
    width: 200px !important;
  }

  .layout-main {
    padding: 16px;
  }
}

/* 动画效果 */
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

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.layout-sidebar {
  animation: slideInLeft 0.6s ease;
}

.layout-main {
  animation: fadeInUp 0.8s ease;
}
</style>
