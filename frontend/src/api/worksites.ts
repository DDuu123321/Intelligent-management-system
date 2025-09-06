// src/api/worksites.ts
import request from "@/utils/request";
import type {
  Worksite,
  WorksiteWithEmployees,
  CreateWorksiteRequest,
  UpdateWorksiteRequest,
  WorksiteListParams,
  AssignEmployeesRequest,
  RemoveEmployeesRequest,
} from "@/types/worksite";
import type { ApiResponse, PaginatedResponse } from "@/types/common";

// 获取工地列表
export const getWorksites = (params?: WorksiteListParams) => {
  return request.get<any, PaginatedResponse<WorksiteWithEmployees>>(
    "/worksites",
    { params },
  );
};

// 获取单个工地详情
export const getWorksite = (worksite_id: string) => {
  return request.get<any, ApiResponse<WorksiteWithEmployees>>(
    `/worksites/${worksite_id}`,
  );
};

// 创建工地
export const createWorksite = (data: CreateWorksiteRequest) => {
  return request.post<any, ApiResponse<Worksite>>("/worksites", data);
};

// 更新工地信息
export const updateWorksite = (
  worksite_id: string,
  data: UpdateWorksiteRequest,
) => {
  return request.put<any, ApiResponse<Worksite>>(
    `/worksites/${worksite_id}`,
    data,
  );
};

// 删除工地
export const deleteWorksite = (worksite_id: string) => {
  return request.delete<any, ApiResponse<null>>(`/worksites/${worksite_id}`);
};

// 分配员工到工地
export const assignEmployeesToWorksite = (
  worksite_id: string,
  data: AssignEmployeesRequest,
) => {
  return request.post<any, ApiResponse<null>>(
    `/worksites/${worksite_id}/employees`,
    data,
  );
};

// 从工地移除员工
export const removeEmployeesFromWorksite = (
  worksite_id: string,
  data: RemoveEmployeesRequest,
) => {
  return request.delete<any, ApiResponse<null>>(
    `/worksites/${worksite_id}/employees`,
    { data },
  );
};

// 获取工地的员工列表
export const getWorksiteEmployees = (worksite_id: string) => {
  return request.get<any, ApiResponse<WorksiteWithEmployees["Employees"]>>(
    `/worksites/${worksite_id}/employees`,
  );
};
