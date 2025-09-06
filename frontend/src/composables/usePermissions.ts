// src/composables/usePermissions.ts
import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";

// 权限配置
const PERMISSIONS = {
  // 员工管理权限
  EMPLOYEE_VIEW: ["admin", "manager"],
  EMPLOYEE_CREATE: ["admin", "manager"],
  EMPLOYEE_EDIT: ["admin", "manager"],
  EMPLOYEE_DELETE: ["admin"],

  // 证件管理权限
  LICENSE_VIEW: ["admin", "manager", "employee"],
  LICENSE_VIEW_ALL: ["admin", "manager"], // 查看所有员工证件
  LICENSE_CREATE: ["admin", "manager"],
  LICENSE_EDIT: ["admin", "manager"],
  LICENSE_DELETE: ["admin", "manager"],
  LICENSE_BATCH_IMPORT: ["admin", "manager"],

  // 签到管理权限
  CHECKIN_VIEW: ["admin", "manager"],
  CHECKIN_VIEW_OWN: ["admin", "manager", "employee"], // 查看自己的签到
  CHECKIN_EDIT: ["admin", "manager"],
  CHECKIN_DELETE: ["admin"],

  // 工地管理权限
  WORKSITE_VIEW: ["admin", "manager", "employee"],
  WORKSITE_CREATE: ["admin", "manager"],
  WORKSITE_EDIT: ["admin", "manager"],
  WORKSITE_DELETE: ["admin"],

  // QR码管理权限
  QRCODE_VIEW: ["admin", "manager"],
  QRCODE_CREATE: ["admin", "manager"],
  QRCODE_EDIT: ["admin", "manager"],
  QRCODE_DELETE: ["admin"],

  // 监控权限
  MONITORING_VIEW: ["admin", "manager", "driver"],

  // 车辆管理权限
  VEHICLE_VIEW: ["admin", "manager", "driver"],
  VEHICLE_CREATE: ["admin", "manager"],
  VEHICLE_EDIT: ["admin", "manager"],
  VEHICLE_DELETE: ["admin"],

  // 系统管理权限
  SYSTEM_SETTINGS: ["admin"],
  USER_MANAGEMENT: ["admin"],
  REPORTS: ["admin", "manager"],
};

export const usePermissions = () => {
  const authStore = useAuthStore();

  // 检查是否有指定权限
  const hasPermission = (permission: keyof typeof PERMISSIONS): boolean => {
    if (!authStore.user?.role) return false;

    const allowedRoles = PERMISSIONS[permission];
    return allowedRoles.includes(authStore.user.role);
  };

  // 检查是否有任一权限
  const hasAnyPermission = (
    permissions: (keyof typeof PERMISSIONS)[],
  ): boolean => {
    return permissions.some((permission) => hasPermission(permission));
  };

  // 检查是否有所有权限
  const hasAllPermissions = (
    permissions: (keyof typeof PERMISSIONS)[],
  ): boolean => {
    return permissions.every((permission) => hasPermission(permission));
  };

  // 当前用户角色
  const userRole = computed(() => authStore.user?.role || "");

  // 角色等级检查
  const isAdmin = computed(() => userRole.value === "admin");
  const isManager = computed(() => userRole.value === "manager");
  const isEmployee = computed(() => userRole.value === "employee");
  const isDriver = computed(() => userRole.value === "driver");

  // 角色等级比较 (admin > manager > employee/driver)
  const hasRoleOrHigher = (role: string): boolean => {
    const currentRole = userRole.value;
    const roleHierarchy = ["admin", "manager", "employee", "driver"];
    const currentLevel = roleHierarchy.indexOf(currentRole);
    const requiredLevel = roleHierarchy.indexOf(role);

    return currentLevel <= requiredLevel && currentLevel !== -1;
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRoleOrHigher,
    userRole,
    isAdmin,
    isManager,
    isEmployee,
    isDriver,
    PERMISSIONS,
  };
};

// 导出权限常量供组件使用
export { PERMISSIONS };
