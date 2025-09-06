// src/types/checkin.ts - 签到相关类型定义
import { CheckinType, CheckinStatus } from "./common";

export interface CheckinLocation {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
}

export interface CheckinPhoto {
  data: string; // Base64 encoded image data
  timestamp: string;
  face_match_confidence?: number;
  face_verification_passed?: boolean;
}

export interface SafetyCheck {
  helmet: boolean;
  vest: boolean;
  boots: boolean;
  gloves: boolean;
  other_equipment?: string[];
  ppe_compliance: boolean;
  safety_briefing_acknowledged: boolean;
}

export interface CheckIn {
  id?: number;

  // 基本签到信息
  employee_id: string;
  checkin_type: CheckinType;
  checkin_time: string;

  // 地理位置信息（防作弊）
  latitude: number;
  longitude: number;
  location_accuracy?: number;
  address?: string;

  // 工地范围验证
  worksite_id: string;
  is_within_worksite: boolean;
  distance_from_worksite?: number;

  // 照片验证（防代打卡）
  photo_url: string;
  face_match_confidence?: number;
  face_verification_passed: boolean;

  // 设备信息
  device_id?: string;
  device_type?: string;
  app_version?: string;
  ip_address?: string;
  user_agent?: string;

  // 天气信息
  weather_condition?: string;
  temperature?: number;

  // 验证状态
  status: CheckinStatus;
  verification_method: "gps_photo" | "gps_only" | "manual_override";
  admin_notes?: string;

  // 异常标记
  is_suspicious: boolean;
  suspicious_reasons?: string[];

  // 工作时长计算
  break_duration?: number;
  work_duration?: number;
  overtime_hours?: number;

  // 安全检查
  safety_checks?: SafetyCheck;

  // 系统字段
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;

  // 关联数据
  Employee?: {
    employee_id: string;
    first_name: string;
    last_name: string;
    department: string;
    position: string;
  };
  Worksite?: {
    worksite_id: string;
    name: string;
    center_latitude: number;
    center_longitude: number;
    radius: number;
  };
}

// 签到创建请求
export interface CreateCheckinRequest {
  employee_id: string;
  worksite_id: string;
  checkin_type: CheckinType;
  latitude: number;
  longitude: number;
  location_accuracy?: number;
  photo_url: string;
  weather_condition?: string;
  temperature?: number;
  safety_checks?: SafetyCheck;
  notes?: string;
}

// 签到查询参数
export interface CheckinListParams {
  employee_id?: string;
  worksite_id?: string;
  checkin_type?: CheckinType;
  status?: CheckinStatus;
  start_date?: string;
  end_date?: string;
  is_suspicious?: boolean;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// 签到统计
export interface CheckinStats {
  today: {
    total_checkins: number;
    present_employees: number;
    late_arrivals: number;
    early_departures: number;
    on_break: number;
    suspicious_checkins: number;
  };
  current_week: {
    total_hours: number;
    average_daily_hours: number;
    attendance_rate: number;
    overtime_hours: number;
  };
  current_month: {
    total_working_days: number;
    average_attendance_rate: number;
    total_overtime: number;
  };
}

// QR码签到请求
export interface QRCodeCheckinRequest {
  qr_token: string;
  employee_id: string;
  location?: CheckinLocation;
  photo?: CheckinPhoto;
  safety_checks?: SafetyCheck;
  notes?: string;
}

// 签到导出参数
export interface CheckinExportParams {
  employee_id?: string;
  worksite_id?: string;
  start_date?: string;
  end_date?: string;
  format: "csv" | "excel" | "pdf";
  include_photos?: boolean;
}
