// src/api/employees.ts
import request from "@/utils/request";
import type {
  Employee,
  EmployeeWithRelations,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  EmployeeListParams,
  BatchImportResult,
  Department,
} from "@/types/employee";
import type { ApiResponse, PaginatedResponse } from "@/types/common";

// 获取员工列表
export const getEmployees = (params?: EmployeeListParams) => {
  return request.get<any, PaginatedResponse<Employee>>("/employees", {
    params,
  });
};

// 获取单个员工详情
export const getEmployee = (employee_id: string) => {
  return request.get<any, ApiResponse<EmployeeWithRelations>>(
    `/employees/${employee_id}`,
  );
};

// 创建员工
export const createEmployee = (data: CreateEmployeeRequest) => {
  return request.post<any, ApiResponse<Employee>>("/employees", data);
};

// 更新员工信息
export const updateEmployee = (
  employee_id: string,
  data: UpdateEmployeeRequest,
) => {
  return request.put<any, ApiResponse<Employee>>(
    `/employees/${employee_id}`,
    data,
  );
};

// 删除员工
export const deleteEmployee = (employee_id: string) => {
  return request.delete<any, ApiResponse<null>>(`/employees/${employee_id}`);
};

// 获取部门列表
export const getDepartments = () => {
  return request.get<any, ApiResponse<Department[]>>(
    "/employees/departments/list",
  );
};

// 批量导入员工
export const batchImportEmployees = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  return request.post<any, ApiResponse<BatchImportResult>>(
    "/employees/batch-import",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
};

// 导出员工数据
export const exportEmployees = (params?: {
  department?: string;
  status?: string;
  format?: "csv" | "excel";
}) => {
  return request.get("/employees/export", {
    params,
    responseType: "blob",
  });
};

// 搜索员工
export const searchEmployees = (query: string) => {
  return request.get<any, ApiResponse<Employee[]>>("/employees/search", {
    params: { q: query },
  });
};
