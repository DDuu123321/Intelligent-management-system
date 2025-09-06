import request from "@/utils/request";
import type { ApiResponse } from "@/types/common";

export interface Department {
  id: number;
  name: string;
  description?: string;
  manager_id?: number;
  parent_id?: number;
  is_active: boolean;
  sort_order: number;
  employee_count?: number;
  manager?: {
    id: number;
    first_name: string;
    last_name: string;
    employee_id: string;
  };
  parent?: {
    id: number;
    name: string;
  };
  children?: Department[];
  employees?: Array<{
    id: number;
    first_name: string;
    last_name: string;
    employee_id: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentData {
  name: string;
  description?: string;
  manager_id?: number;
  parent_id?: number;
  sort_order?: number;
}

export interface UpdateDepartmentData extends CreateDepartmentData {
  is_active?: boolean;
}

export interface DepartmentEmployee {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  position: string;
  phone: string;
  email?: string;
  start_date: string;
  status: string;
}

export interface DepartmentAttendanceStats {
  date: string;
  total_employees: number;
  present: number;
  late: number;
  absent: number;
  leave: number;
}

// 获取部门列表
export const getDepartments = (params?: {
  include_inactive?: boolean;
}): Promise<ApiResponse<Department[]>> => {
  return request.get("/departments", { params });
};

// 创建部门
export const createDepartment = (
  data: CreateDepartmentData,
): Promise<ApiResponse<Department>> => {
  return request.post("/departments", data);
};

// 更新部门
export const updateDepartment = (
  id: number,
  data: UpdateDepartmentData,
): Promise<ApiResponse<Department>> => {
  return request.put(`/departments/${id}`, data);
};

// 删除部门
export const deleteDepartment = (id: number): Promise<ApiResponse<null>> => {
  return request.delete(`/departments/${id}`);
};

// 获取部门员工
export const getDepartmentEmployees = (
  id: number,
  params?: {
    page?: number;
    limit?: number;
  },
): Promise<
  ApiResponse<{
    employees: DepartmentEmployee[];
    pagination: {
      current_page: number;
      per_page: number;
      total: number;
      total_pages: number;
    };
  }>
> => {
  return request.get(`/departments/${id}/employees`, { params });
};

// 获取部门考勤统计
export const getDepartmentAttendanceStats = (
  id: number,
  params?: {
    date?: string;
  },
): Promise<ApiResponse<DepartmentAttendanceStats>> => {
  return request.get(`/departments/${id}/attendance-stats`, { params });
};
