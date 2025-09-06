// src/directives/permission.ts
import type { Directive, DirectiveBinding } from "vue";
import { usePermissions } from "@/composables/usePermissions";

// 权限指令的值类型
interface PermissionValue {
  permission?: string;
  role?: string;
  permissions?: string[];
  operator?: "AND" | "OR"; // 多权限的逻辑操作符
}

export const permissionDirective: Directive = {
  mounted(
    el: HTMLElement,
    binding: DirectiveBinding<string | PermissionValue>,
  ) {
    checkPermission(el, binding);
  },
  updated(
    el: HTMLElement,
    binding: DirectiveBinding<string | PermissionValue>,
  ) {
    checkPermission(el, binding);
  },
};

function checkPermission(
  el: HTMLElement,
  binding: DirectiveBinding<string | PermissionValue>,
) {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRoleOrHigher,
  } = usePermissions();

  let hasAccess = false;

  if (typeof binding.value === "string") {
    // 简单权限检查: v-permission="'LICENSE_VIEW'"
    hasAccess = hasPermission(binding.value as any);
  } else if (binding.value && typeof binding.value === "object") {
    const value = binding.value;

    if (value.permission) {
      // 单个权限: v-permission="{ permission: 'LICENSE_VIEW' }"
      hasAccess = hasPermission(value.permission as any);
    } else if (value.role) {
      // 角色检查: v-permission="{ role: 'admin' }"
      hasAccess = hasRoleOrHigher(value.role);
    } else if (value.permissions && Array.isArray(value.permissions)) {
      // 多权限检查: v-permission="{ permissions: ['A', 'B'], operator: 'OR' }"
      const operator = value.operator || "OR";
      if (operator === "AND") {
        hasAccess = hasAllPermissions(value.permissions as any);
      } else {
        hasAccess = hasAnyPermission(value.permissions as any);
      }
    }
  }

  // 如果没有权限，隐藏元素
  if (!hasAccess) {
    // 保存原始显示状态
    if (!el.hasAttribute("data-original-display")) {
      el.setAttribute("data-original-display", el.style.display || "");
    }
    el.style.display = "none";
  } else {
    // 恢复显示
    const originalDisplay = el.getAttribute("data-original-display");
    if (originalDisplay !== null) {
      el.style.display = originalDisplay === "none" ? "" : originalDisplay;
    }
  }
}

// 注册指令的函数
export const setupPermissionDirective = (app: any) => {
  app.directive("permission", permissionDirective);
};
