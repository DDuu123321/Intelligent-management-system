// src/api/licenses.ts
import axios from "axios";
import request from "@/utils/request";

const base = "/licenses";

export function getLicenseTypes() {
  return request.get(`${base}/types`);
}

export function getEmployeeLicenses(employeeId: string) {
  return request.get(`${base}/employee/${employeeId}`);
}

export function createEmployeeLicense(employeeId: string, data: any) {
  return request.post(`${base}/employee/${employeeId}`, data);
}

export function updateEmployeeLicense(id: number, data: any) {
  return request.put(`${base}/employee-license/${id}`, data);
}

export function deleteEmployeeLicense(id: number) {
  return request.delete(`${base}/employee-license/${id}`);
}

// 获取即将到期的证件（增强版，支持分页和过滤）
export function getExpiringLicenses(params?: {
  within?: number;
  includeExpired?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  search?: string;
  employeeId?: string;
  licenseTypeId?: number;
  status?: "expired" | "expiring" | "normal";
}) {
  return request.get(`${base}/expiring`, { params });
}

export async function exportExpiringCsv(within = 60, lang: string) {
  const token = localStorage.getItem("token");
  const resp = await axios.get(`${base}/expiring/export`, {
    baseURL:
      import.meta.env["VITE_API_BASE_URL"] || "http://localhost:3000/api/v1",
    params: { within, lang },
    responseType: "blob",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return resp.data; // Blob
}

export function uploadCreateEmployeeLicense(
  employeeId: string,
  data: FormData,
) {
  return request.post(`${base}/employee/${employeeId}/upload`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export function uploadUpdateEmployeeLicense(id: number, data: FormData) {
  return request.put(`${base}/employee-license/${id}/upload`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export function importLicenses(formData: FormData) {
  return request.post(`${base}/import`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

// OCR 人工确认相关接口

// 获取待确认的 OCR 记录
export const getPendingOcrLicenses = (params?: {
  page?: number;
  limit?: number;
}) => {
  return request.get(`${base}/ocr/pending`, { params });
};

// 确认单个 OCR 解析结果
export const confirmOcrResult = (
  id: number,
  data: {
    action: "confirm" | "reject" | "modify";
    expiry_date?: string;
    notes?: string;
  },
) => {
  return request.post(`${base}/${id}/ocr/confirm`, data);
};

// 批量确认 OCR 结果
export const batchConfirmOcr = (
  licenses: Array<{
    id: number;
    action: "confirm" | "reject" | "modify";
    expiry_date?: string;
    notes?: string;
  }>,
) => {
  return request.post(`${base}/ocr/batch-confirm`, { licenses });
};
