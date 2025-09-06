// src/types/worksite.ts - 工地相关类型定义
import {
  WorksiteStatus,
  GeoLocation,
  Address,
  WorkSchedule,
  SafetyRequirements,
} from "./common";

export interface Worksite
  extends GeoLocation,
    Address,
    WorkSchedule,
    SafetyRequirements {
  // 基本信息
  worksite_id: string;
  name: string;
  description?: string;

  // 签到规则
  early_checkin_buffer: number;
  late_checkin_tolerance: number;

  // 项目信息
  project_manager?: string;
  project_manager_phone?: string;
  contractor_name?: string;
  client_name?: string;

  // 项目状态
  status: WorksiteStatus;
  start_date: string;
  estimated_end_date?: string;
  actual_end_date?: string;

  // 天气监控
  weather_restrictions?: Record<string, any>;

  // 系统设置
  timezone: string;
  allow_remote_checkin: boolean;

  // 统计信息
  total_employees: number;
  active_employees: number;

  // 系统字段
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

// 工地详情（包含员工信息）
export interface WorksiteWithEmployees extends Worksite {
  Employees?: Array<{
    employee_id: string;
    first_name: string;
    last_name: string;
    department: string;
    position: string;
    status: string;
    white_card_expiry: string;
    safety_induction_completed: boolean;
  }>;
}

// 工地创建请求
export interface CreateWorksiteRequest
  extends Omit<
    Worksite,
    | "worksite_id"
    | "total_employees"
    | "active_employees"
    | "created_at"
    | "updated_at"
    | "deleted_at"
  > {
  employee_ids?: string[];
}

// 工地更新请求
export interface UpdateWorksiteRequest
  extends Partial<
    Omit<Worksite, "worksite_id" | "created_at" | "updated_at" | "deleted_at">
  > {}

// 工地查询参数
export interface WorksiteListParams {
  status?: WorksiteStatus;
  state?: string;
  project_manager?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// 员工分配请求
export interface AssignEmployeesRequest {
  employee_ids: string[];
}

// 员工移除请求
export interface RemoveEmployeesRequest {
  employee_ids: string[];
}
