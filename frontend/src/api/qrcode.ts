// src/api/qrcode.ts
import request from "@/utils/request";

export interface QRCode {
  id?: number;
  worksite_id: string;
  worksite_name: string;
  center_latitude: number;
  center_longitude: number;
  radius: number;
  is_active: boolean;
  scan_count?: number;
  successful_checkins?: number;
  require_gps: boolean;
  require_photo: boolean;
  face_verification_enabled: boolean;
  allow_checkin_anytime?: boolean;
  work_start_time?: string;
  work_end_time?: string;
  description?: string;
  qr_url?: string;
  qr_data?: string;
  last_used_at?: string;
  created_at?: string;
}

export interface QRCodeResponse {
  data: QRCode[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
}

// 获取二维码列表
export const getQRCodes = (params: any) => {
  return request.get<any, QRCodeResponse>("/qrcode", { params });
};

// 获取单个二维码详情
export const getQRCode = (id: number) => {
  return request.get<any, { data: QRCode }>(`/qrcode/${id}`);
};

// 创建二维码
export const createQRCode = (data: QRCode) => {
  return request.post<any, { data: QRCode }>("/qrcode", data);
};

// 更新二维码信息
export const updateQRCode = (id: number, data: Partial<QRCode>) => {
  return request.put<any, { data: QRCode }>(`/qrcode/${id}`, data);
};

// 删除二维码
export const deleteQRCode = (id: number) => {
  return request.delete(`/qrcode/${id}`);
};

// 获取二维码统计数据
export const getQRCodeStats = () => {
  return request.get("/qrcode/stats");
};

// 扫描二维码
export const scanQRCode = (token: string) => {
  return request.get(`/qrcode/scan/${token}`);
};

// 二维码签到
export const checkinQRCode = (token: string, data: any) => {
  return request.post(`/qrcode/checkin/${token}`, data);
};
