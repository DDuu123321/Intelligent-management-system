import request from "@/utils/request";

export interface CheckinRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  phone_number: string;
  qr_code_id: string;
  worksite_name: string;
  checkin_type: "in" | "out";
  checkin_time: string;
  latitude?: number;
  longitude?: number;
  location_accuracy?: number;
  address?: string;
  photo_data?: string;
  device_info?: any;
  status: "success" | "failed";
  created_at: string;
  updated_at: string;
}

export interface CheckinRecordsQuery {
  page?: number;
  limit?: number;
  employee_id?: string;
  worksite_id?: string;
  checkin_type?: "in" | "out";
  status?: "success" | "failed";
  start_date?: string;
  end_date?: string;
  search?: string;
}

export interface CheckinRecordsResponse {
  records: CheckinRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 获取签到记录列表
export const getCheckinRecords = (
  params: CheckinRecordsQuery = {},
): Promise<CheckinRecordsResponse> => {
  return request({
    url: "/checkins/records",
    method: "get",
    params,
  });
};

// 获取单个签到记录详情
export const getCheckinRecord = (id: string): Promise<CheckinRecord> => {
  return request({
    url: `/checkins/records/${id}`,
    method: "get",
  });
};

// 获取员工的签到统计
export const getEmployeeCheckinStats = (
  employeeId: string,
  params: { start_date?: string; end_date?: string } = {},
) => {
  return request({
    url: `/checkins/stats/employee/${employeeId}`,
    method: "get",
    params,
  });
};

// 导出签到记录
export const exportCheckinRecords = (params: CheckinRecordsQuery = {}) => {
  return request({
    url: "/checkins/records/export",
    method: "get",
    params,
    responseType: "blob",
  });
};
