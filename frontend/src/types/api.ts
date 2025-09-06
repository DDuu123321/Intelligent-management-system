// API 响应类型定义
export interface BaseResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  status: number;
}

// 认证相关类型
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    name: string;
    email: string | null;
    role: "admin" | "manager" | "employee" | "driver";
    status: "active" | "inactive";
  };
}

export interface UserProfile {
  id: number;
  employee_id: string;
  username: string;
  name: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  position: string | null;
  role: "admin" | "manager" | "employee" | "driver";
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

// 员工相关类型
export interface Employee {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  date_of_birth: string | null;
  hire_date: string | null;
  position: string | null;
  department_id: number | null;
  salary: number | null;
  tfn: string | null;
  abn: string | null;
  white_card_number: string | null;
  white_card_expiry: string | null;
  visa_type: string | null;
  visa_expiry: string | null;
  status: "active" | "inactive" | "terminated";
  created_at: string;
  updated_at: string;
  Department?: Department;
}

export interface Department {
  id: number;
  name: string;
  description: string | null;
  manager_id: number | null;
  created_at: string;
  updated_at: string;
}

// 签到相关类型
export interface CheckinData {
  phone_number: string;
  checkin_type: "in" | "out";
  latitude: number | null;
  longitude: number | null;
  location_accuracy: number | null;
  address: string;
  photo_data: string | null;
  device_info: {
    device_type: string;
    app_version: string;
  };
}

export interface CheckinResponse {
  id: number;
  employee_name: string;
  employee_id: string;
  worksite_name: string;
  checkin_time: string;
  checkin_type: "in" | "out";
  status: "approved" | "pending" | "rejected";
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export interface QRCodeInfo {
  id: number;
  worksite_name: string;
  token: string;
  center_latitude: number;
  center_longitude: number;
  radius: number;
  require_gps: boolean;
  require_photo: boolean;
  allow_checkin_anytime: boolean;
  work_start_time: string | null;
  work_end_time: string | null;
  status: "active" | "inactive";
  Worksite?: {
    id: number;
    name: string;
    address: string;
  };
}

// 考勤统计类型
export interface AttendanceStats {
  date: string;
  total_employees: number;
  present: number;
  late: number;
  absent: number;
  leave: number;
}

export interface AttendanceRecord {
  id: number;
  employee_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  work_hours: number | null;
  status: "present" | "late" | "absent" | "leave";
  User: {
    id: number;
    employee_id: string;
    name: string;
    department: string | null;
  };
}

// 分页相关类型
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedResponse<T> {
  records: T[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// 错误类型
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// 工地相关类型
export interface Worksite {
  id: number;
  name: string;
  address: string;
  center_latitude: number;
  center_longitude: number;
  radius: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

// 车辆相关类型
export interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  status: "available" | "in_use" | "maintenance" | "retired";
  current_driver_id: number | null;
  created_at: string;
  updated_at: string;
}

// 许可证相关类型
export interface License {
  id: number;
  employee_id: number;
  license_type: string;
  license_number: string;
  issue_date: string;
  expiry_date: string;
  status: "active" | "expired" | "suspended";
  file_path: string | null;
  created_at: string;
  updated_at: string;
  Employee?: Employee;
}
