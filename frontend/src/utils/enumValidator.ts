// src/utils/enumValidator.ts - 枚举值同步验证工具
import type {
  VisaStatus,
  EmploymentType,
  EmployeeStatus,
  CheckinType,
  CheckinStatus,
  WorksiteStatus,
  LicenseOCRStatus,
} from "@/types/common";

// 枚举值定义（与后端数据库模型保持同步）
export const ENUM_VALUES = {
  // 员工签证状态
  VISA_STATUS: [
    "citizen",
    "permanent_resident",
    "temporary_visa",
    "working_holiday",
  ] as const,

  // 雇佣类型
  EMPLOYMENT_TYPE: ["full_time", "part_time", "casual", "contractor"] as const,

  // 员工状态
  EMPLOYEE_STATUS: ["active", "inactive", "suspended", "terminated"] as const,

  // 签到类型
  CHECKIN_TYPE: ["in", "out", "break_start", "break_end"] as const,

  // 签到状态
  CHECKIN_STATUS: ["pending", "approved", "rejected", "flagged"] as const,

  // 工地状态
  WORKSITE_STATUS: [
    "planning",
    "active",
    "suspended",
    "completed",
    "cancelled",
  ] as const,

  // 证件OCR状态
  LICENSE_OCR_STATUS: [
    "none",
    "parsed",
    "low_confidence",
    "confirmed",
    "rejected",
  ] as const,

  // 签到验证方式
  VERIFICATION_METHOD: ["gps_photo", "gps_only", "manual_override"] as const,

  // 用户角色
  USER_ROLE: ["admin", "manager", "employee"] as const,
} as const;

// 枚举验证函数
export function validateEnum<T extends keyof typeof ENUM_VALUES>(
  enumType: T,
  value: string,
): value is (typeof ENUM_VALUES)[T][number] {
  return ENUM_VALUES[enumType].includes(value as any);
}

// 获取枚举选项（用于下拉框等UI组件）
export function getEnumOptions<T extends keyof typeof ENUM_VALUES>(
  enumType: T,
): Array<{ label: string; value: (typeof ENUM_VALUES)[T][number] }> {
  return ENUM_VALUES[enumType].map((value) => ({
    label: getEnumLabel(enumType, value),
    value,
  }));
}

// 获取枚举显示标签
export function getEnumLabel<T extends keyof typeof ENUM_VALUES>(
  enumType: T,
  value: (typeof ENUM_VALUES)[T][number],
): string {
  const labels: Record<string, Record<string, string>> = {
    VISA_STATUS: {
      citizen: "公民",
      permanent_resident: "永久居民",
      temporary_visa: "临时签证",
      working_holiday: "打工度假签证",
    },
    EMPLOYMENT_TYPE: {
      full_time: "全职",
      part_time: "兼职",
      casual: "临时工",
      contractor: "承包商",
    },
    EMPLOYEE_STATUS: {
      active: "在职",
      inactive: "离职",
      suspended: "停职",
      terminated: "解雇",
    },
    CHECKIN_TYPE: {
      in: "上班",
      out: "下班",
      break_start: "休息开始",
      break_end: "休息结束",
    },
    CHECKIN_STATUS: {
      pending: "待审核",
      approved: "已批准",
      rejected: "已拒绝",
      flagged: "已标记",
    },
    WORKSITE_STATUS: {
      planning: "筹划中",
      active: "进行中",
      suspended: "暂停",
      completed: "已完成",
      cancelled: "已取消",
    },
    LICENSE_OCR_STATUS: {
      none: "未处理",
      parsed: "已解析",
      low_confidence: "低置信度",
      confirmed: "已确认",
      rejected: "已拒绝",
    },
    VERIFICATION_METHOD: {
      gps_photo: "GPS+照片",
      gps_only: "仅GPS",
      manual_override: "手动覆盖",
    },
    USER_ROLE: {
      admin: "管理员",
      manager: "经理",
      employee: "员工",
    },
  };

  const typeLabels = labels[enumType];
  return typeLabels?.[value] || value;
}

// 枚举同步检查器
export class EnumSyncChecker {
  private errors: Array<{ type: string; issue: string; details?: any }> = [];

  // 检查前端枚举与传入值的一致性
  checkValues<T extends keyof typeof ENUM_VALUES>(
    enumType: T,
    values: string[],
    source: string = "unknown",
  ): boolean {
    const expectedValues = [...ENUM_VALUES[enumType]];
    const missingValues = expectedValues.filter((v) => !values.includes(v));
    const extraValues = values.filter(
      (v) => !expectedValues.includes(v as any),
    );

    if (missingValues.length > 0) {
      this.errors.push({
        type: enumType,
        issue: `Missing values from ${source}`,
        details: {
          missing: missingValues,
          expected: expectedValues,
          actual: values,
        },
      });
    }

    if (extraValues.length > 0) {
      this.errors.push({
        type: enumType,
        issue: `Extra values in ${source}`,
        details: {
          extra: extraValues,
          expected: expectedValues,
          actual: values,
        },
      });
    }

    return missingValues.length === 0 && extraValues.length === 0;
  }

  // 获取所有错误
  getErrors(): typeof this.errors {
    return [...this.errors];
  }

  // 清除错误
  clearErrors(): void {
    this.errors = [];
  }

  // 生成同步报告
  generateReport(): { isSync: boolean; errors: typeof this.errors } {
    return {
      isSync: this.errors.length === 0,
      errors: this.getErrors(),
    };
  }
}

// 运行时枚举验证（可在开发环境中使用）
export function runEnumValidation(): void {
  if (process.env.NODE_ENV !== "development") return;

  const checker = new EnumSyncChecker();

  console.group("🔍 枚举值同步验证");

  // 这里可以添加与后端API的枚举值对比
  // 例如：获取后端枚举定义并进行比较

  const report = checker.generateReport();

  if (report.isSync) {
    console.log("✅ 所有枚举值已同步");
  } else {
    console.warn("⚠️ 发现枚举值不同步问题:");
    report.errors.forEach((error) => {
      console.error(`- ${error.type}: ${error.issue}`, error.details);
    });
  }

  console.groupEnd();
}

// 导出常用的验证器
export const enumValidators = {
  visaStatus: (value: string): value is VisaStatus =>
    validateEnum("VISA_STATUS", value),

  employmentType: (value: string): value is EmploymentType =>
    validateEnum("EMPLOYMENT_TYPE", value),

  employeeStatus: (value: string): value is EmployeeStatus =>
    validateEnum("EMPLOYEE_STATUS", value),

  checkinType: (value: string): value is CheckinType =>
    validateEnum("CHECKIN_TYPE", value),

  checkinStatus: (value: string): value is CheckinStatus =>
    validateEnum("CHECKIN_STATUS", value),

  worksiteStatus: (value: string): value is WorksiteStatus =>
    validateEnum("WORKSITE_STATUS", value),

  licenseOCRStatus: (value: string): value is LicenseOCRStatus =>
    validateEnum("LICENSE_OCR_STATUS", value),
};
