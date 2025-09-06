// src/types/common.ts - 共享类型定义
export type VisaStatus =
  | "citizen"
  | "permanent_resident"
  | "temporary_visa"
  | "working_holiday";

export type EmploymentType =
  | "full_time"
  | "part_time"
  | "casual"
  | "contractor";

export type EmployeeStatus = "active" | "inactive" | "suspended" | "terminated";

export type CheckinType = "in" | "out" | "break_start" | "break_end";

export type CheckinStatus = "pending" | "approved" | "rejected" | "flagged";

export type WorksiteStatus =
  | "planning"
  | "active"
  | "suspended"
  | "completed"
  | "cancelled";

export type LicenseOCRStatus =
  | "none"
  | "parsed"
  | "low_confidence"
  | "confirmed"
  | "rejected";

export type UserRole = "admin" | "manager" | "employee";

// 通用分页接口
export interface Pagination {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

// 通用API响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

// 分页响应接口
export interface PaginatedResponse<T = any> {
  success: boolean;
  message: string;
  data: {
    items: T[];
    pagination: Pagination;
  };
  timestamp?: string;
}

// 错误响应接口
export interface ErrorResponse {
  success: false;
  message: string;
  error?: {
    id?: string;
    code?: string;
    details?: any;
    fields?: Record<string, string>;
  };
  timestamp: string;
}

// 地理位置接口
export interface GeoLocation {
  center_latitude: number;
  center_longitude: number;
  radius?: number;
  accuracy?: number;
}

// 地址接口
export interface Address {
  street_address: string;
  suburb: string;
  state: string;
  postcode: string;
  country?: string;
}

// 工作时间接口
export interface WorkSchedule {
  standard_work_start: string;
  standard_work_end: string;
  break_start?: string;
  break_end?: string;
}

// 安全要求接口
export interface SafetyRequirements {
  require_white_card: boolean;
  require_safety_induction: boolean;
  require_photo: boolean;
  require_gps: boolean;
  max_gps_accuracy: number;
  ppe_requirements?: string[];
}
