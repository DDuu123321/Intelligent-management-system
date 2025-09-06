// src/types/employee.ts - 员工相关类型定义
import { VisaStatus, EmploymentType, EmployeeStatus } from "./common";

export interface Employee {
  // 基本信息
  employee_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  date_of_birth: string;

  // 澳大利亚法规相关
  tfn?: string;
  visa_status: VisaStatus;
  visa_expiry_date?: string;

  // 建筑工地安全要求
  white_card_number: string;
  white_card_expiry: string;
  safety_induction_completed: boolean;
  safety_induction_date?: string;

  // 工作信息
  position: string;
  department: string;
  hourly_rate: number;
  employment_type: EmploymentType;
  start_date: string;
  end_date?: string;

  // 状态管理
  status: EmployeeStatus;
  can_checkin: boolean;

  // 紧急联系人
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;

  // 银行信息
  bank_name?: string;
  bsb?: string;
  account_number?: string;
  account_name?: string;

  // 系统字段
  profile_photo?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

// 员工创建请求接口
export interface CreateEmployeeRequest
  extends Omit<
    Employee,
    "employee_id" | "created_at" | "updated_at" | "deleted_at"
  > {
  worksite_ids?: string[];
}

// 员工更新请求接口
export interface UpdateEmployeeRequest
  extends Partial<
    Omit<Employee, "employee_id" | "created_at" | "updated_at" | "deleted_at">
  > {
  worksite_ids?: string[];
}

// 员工列表查询参数
export interface EmployeeListParams {
  department?: string;
  status?: EmployeeStatus;
  employment_type?: EmploymentType;
  visa_status?: VisaStatus;
  search?: string;
  worksite_id?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// 员工详情（包含关联数据）
export interface EmployeeWithRelations extends Employee {
  Worksites?: Array<{
    worksite_id: string;
    name: string;
    status: string;
  }>;
  EmployeeLicenses?: Array<{
    employee_license_id: number;
    license_type_id: number;
    number?: string;
    issue_date?: string;
    expiry_date: string;
    ocr_status: string;
    LicenseType?: {
      code: string;
      name_en: string;
      name_zh?: string;
    };
  }>;
}

// 批量导入结果
export interface BatchImportResult {
  total_processed: number;
  successful_imports: number;
  failed_imports: number;
  errors: Array<{
    row: number;
    field?: string;
    message: string;
  }>;
  imported_employees: Employee[];
}

// 部门列表
export interface Department {
  name: string;
  employee_count: number;
  active_employees: number;
}
