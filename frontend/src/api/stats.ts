// src/api/stats.ts
import request from "@/utils/request";
import {
  requestCache,
  CACHE_CONFIG,
  THROTTLE_CONFIG,
} from "@/utils/requestCache";

// 考勤统计接口
export interface AttendanceStats {
  present: number;
  late: number;
  absent: number;
  leave: number;
}

export const getAttendanceStats = async () => {
  const url = "/attendance/stats";

  // 检查缓存
  const cached = requestCache.get(url);
  if (cached) {
    console.log("📋 使用缓存数据: attendance/stats");
    return cached;
  }

  // 等待节流
  await requestCache.waitForThrottle(url, THROTTLE_CONFIG.STATS);

  const result = await request.get<any, { data: AttendanceStats }>(url);

  // 缓存结果
  requestCache.set(url, result, CACHE_CONFIG.STATS);

  return result;
};

// 车辆统计接口
export interface VehicleStats {
  running: number;
  idle: number;
  maintenance: number;
  offline: number;
}

export const getVehicleStats = async () => {
  const url = "/vehicles/stats";

  // 检查缓存
  const cached = requestCache.get(url);
  if (cached) {
    console.log("📋 使用缓存数据: vehicles/stats");
    return cached;
  }

  // 等待节流
  await requestCache.waitForThrottle(url, THROTTLE_CONFIG.STATS);

  const result = await request.get<any, { data: VehicleStats }>(url);

  // 缓存结果
  requestCache.set(url, result, CACHE_CONFIG.STATS);

  return result;
};

// 监控统计接口
export interface MonitorStats {
  online: number;
  recording: number;
  alert: number;
  offline: number;
}

export const getMonitorStats = async () => {
  const url = "/monitoring/stats";

  // 检查缓存
  const cached = requestCache.get(url);
  if (cached) {
    console.log("📋 使用缓存数据: monitoring/stats");
    return cached;
  }

  // 等待节流
  await requestCache.waitForThrottle(url, THROTTLE_CONFIG.STATS);

  const result = await request.get<any, { data: MonitorStats }>(url);

  // 缓存结果
  requestCache.set(url, result, CACHE_CONFIG.STATS);

  return result;
};
