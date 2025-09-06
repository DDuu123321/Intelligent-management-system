// src/api/checkins.ts
import request from "@/utils/request";
import type {
  CheckIn,
  CreateCheckinRequest,
  CheckinListParams,
  CheckinStats,
  QRCodeCheckinRequest,
  CheckinExportParams,
  CheckinLocation,
  CheckinPhoto,
  SafetyCheck,
} from "@/types/checkin";
import type { ApiResponse, PaginatedResponse } from "@/types/common";

// 重新导出类型以保持向后兼容
export type {
  CheckinLocation as CheckInLocation,
  CheckinPhoto as CheckInPhoto,
  SafetyCheck,
  CheckIn,
  CheckinStats as CheckInStats,
};

// 员工签到
export const createCheckIn = (data: CreateCheckinRequest) => {
  return request.post<any, ApiResponse<CheckIn>>("/checkins", data);
};

// QR码签到
export const qrcodeCheckIn = (data: QRCodeCheckinRequest) => {
  return request.post<any, ApiResponse<CheckIn>>("/qrcode/checkin", data);
};

// 获取签到记录列表
export const getCheckIns = (params?: CheckinListParams) => {
  return request.get<any, PaginatedResponse<CheckIn>>("/checkins", { params });
};

// 获取单个签到记录
export const getCheckIn = (id: number) => {
  return request.get<any, ApiResponse<CheckIn>>(`/checkins/${id}`);
};

// 更新签到记录
export const updateCheckIn = (id: number, data: Partial<CheckIn>) => {
  return request.put<any, ApiResponse<CheckIn>>(`/checkins/${id}`, data);
};

// 删除签到记录
export const deleteCheckIn = (id: number) => {
  return request.delete<any, ApiResponse<null>>(`/checkins/${id}`);
};

// 获取员工今日签到状态
export const getTodayCheckInStatus = (employee_id: string) => {
  return request.get<any, ApiResponse<CheckIn | null>>(
    `/checkins/today/${employee_id}`,
  );
};

// 获取签到统计信息
export const getCheckInStats = (
  params?: Pick<
    CheckinListParams,
    "employee_id" | "worksite_id" | "start_date" | "end_date"
  >,
) => {
  return request.get<any, ApiResponse<CheckinStats>>("/checkins/stats", {
    params,
  });
};

// 获取员工最近的签到记录
export const getRecentCheckIns = (employee_id: string, limit: number = 10) => {
  return request.get<any, ApiResponse<CheckIn[]>>(
    `/checkins/recent/${employee_id}`,
    {
      params: { limit },
    },
  );
};

// 批量导出签到记录
export const exportCheckIns = (params?: CheckinExportParams) => {
  return request.get("/checkins/export", {
    params,
    responseType: "blob",
  });
};
