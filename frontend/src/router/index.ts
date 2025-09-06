import { createRouter, createWebHistory } from "vue-router";
import Layout from "@/views/Layout.vue";
import { useAuthStore } from "@/stores/auth";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/admin/dashboard",
    },
    {
      path: "/login",
      name: "Login",
      component: () => import("@/views/Login.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/checkin/:token",
      name: "QRCodeCheckin",
      component: () => import("@/views/QRCodeCheckin.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/checkin-result/:token?",
      name: "CheckinResult",
      component: () => import("@/views/CheckinResult.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/admin",
      component: Layout,
      redirect: "/admin/dashboard",
      children: [
        {
          path: "dashboard",
          name: "Dashboard",
          component: () => import("@/views/Dashboard.vue"),
          meta: { requiresAuth: true },
        },
        {
          path: "attendance",
          name: "Attendance",
          component: () => import("@/views/Attendance.vue"),
          meta: { requiresAuth: true },
        },
        {
          path: "checkin-records",
          name: "CheckinRecords",
          component: () => import("@/views/CheckinRecords.vue"),
          meta: { requiresAuth: true },
        },
        {
          path: "vehicles",
          name: "Vehicles",
          component: () => import("@/views/Vehicles.vue"),
          meta: { requiresAuth: true },
        },
        {
          path: "monitoring",
          name: "Monitoring",
          component: () => import("@/views/Monitoring.vue"),
          meta: { requiresAuth: true },
        },
        {
          path: "employees",
          name: "EmployeeManagement",
          component: () => import("@/views/EmployeeManagement.vue"),
          meta: { requiresAuth: true },
        },
        {
          path: "qrcode",
          name: "QRCodeManagement",
          component: () => import("@/views/QRCodeManagement.vue"),
          meta: { requiresAuth: true },
        },
        {
          path: "worksites",
          name: "WorksiteManagement",
          component: () => import("@/views/WorksiteManagement.vue"),
          meta: { requiresAuth: true },
        },
        {
          path: "licenses",
          name: "EmployeeLicenseManagement",
          component: () => import("@/views/EmployeeLicenseManagement.vue"),
          meta: { requiresAuth: true },
        },
        {
          path: "licenses/ocr-confirmation",
          name: "LicenseOcrConfirmation",
          component: () => import("@/views/LicenseOcrConfirmation.vue"),
          meta: { requiresAuth: true },
        },
        {
          path: "licenses/expiring",
          name: "ExpiringLicenses",
          component: () => import("@/views/ExpiringLicenses.vue"),
          meta: { requiresAuth: true },
        },
        {
          path: "departments",
          name: "Departments",
          component: () => import("@/views/Departments.vue"),
          meta: { requiresAuth: true },
        },
      ],
    },
  ],
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  // 初始化认证状态
  authStore.initAuth();

  // 检查是否是签到相关路径（不需要认证）
  if (
    to.path.startsWith("/checkin/") ||
    to.path.startsWith("/checkin-result/")
  ) {
    next();
    return;
  }

  // 检查是否是登录页面
  if (to.path === "/login") {
    if (authStore.isLoggedIn) {
      // 已登录用户访问登录页面，重定向到仪表盘
      next({ path: "/admin/dashboard" });
    } else {
      next();
    }
    return;
  }

  // 检查其他路径是否需要认证
  if (to.meta.requiresAuth === false) {
    next();
    return;
  }

  // 默认需要认证的路径
  if (!authStore.isLoggedIn) {
    next({ name: "Login", query: { redirect: to.fullPath } });
  } else {
    next();
  }
});

export default router;
