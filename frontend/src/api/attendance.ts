import request from "@/utils/request";
import type { ApiResponse } from "@/types/common";

export interface AttendanceRecord {
  id: number;
  date: string;
  check_in?: string;
  check_out?: string;
  work_hours?: number;
  status: "present" | "late" | "absent" | "leave";
  User: {
    id: number;
    employee_id: string;
    name: string;
    department: string;
  };
}

export interface AttendanceStats {
  present: number;
  late: number;
  absent: number;
  leave: number;
}

export interface AttendanceListResponse {
  records: AttendanceRecord[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// 获取考勤统计
export const getAttendanceStats = (): Promise<ApiResponse<AttendanceStats>> => {
  return request.get("/attendance/stats");
};

// 获取考勤记录列表
export const getAttendanceRecords = (params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<AttendanceListResponse>> => {
  return request.get("/attendance/records", { params });
};

// 员工打卡
export const checkinOrOut = (data: {
  type: "in" | "out";
  location?: string;
}): Promise<ApiResponse<any>> => {
  return request.post("/attendance/checkin", data);
};
