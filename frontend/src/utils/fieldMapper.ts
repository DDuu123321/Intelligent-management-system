// src/utils/fieldMapper.ts - 前后端字段映射工具
import type { Worksite } from "@/types/worksite";
import type { CheckIn } from "@/types/checkin";

// 工地字段映射（数据库 <-> 前端显示）
export interface WorksiteDisplayFields {
  worksite_id: string;
  name: string;
  description?: string;

  // 前端显示用的简化字段
  latitude: number;
  longitude: number;
  address: string;
  location: string;

  // 状态和时间
  status: string;
  start_date: string;
  end_date?: string;

  // 管理信息
  manager_name?: string;
  manager_phone?: string;

  // 统计
  total_employees: number;
  active_employees: number;

  created_at?: string;
  updated_at?: string;
}

// 签到字段映射
export interface CheckinDisplayFields {
  id?: number;
  employee_id: string;
  worksite_id: string;

  // 前端显示用的简化字段
  check_type: string; // 映射自 checkin_type
  timestamp: string; // 映射自 checkin_time

  location: {
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
  };

  photo_url?: string;
  status: string;
  notes?: string;

  // 关联信息
  employee_name?: string;
  worksite_name?: string;

  created_at?: string;
}

// 工地字段映射器
export class WorksiteMapper {
  // 从数据库格式转换为前端显示格式
  static toDisplayFormat(worksite: Worksite): WorksiteDisplayFields {
    return {
      worksite_id: worksite.worksite_id,
      name: worksite.name,
      description: worksite.description,

      // 地理坐标映射
      latitude: worksite.center_latitude,
      longitude: worksite.center_longitude,

      // 地址映射
      address: this.formatAddress(worksite),
      location: this.formatLocation(worksite),

      status: worksite.status,
      start_date: worksite.start_date,
      end_date: worksite.estimated_end_date || worksite.actual_end_date,

      manager_name: worksite.project_manager,
      manager_phone: worksite.project_manager_phone,

      total_employees: worksite.total_employees,
      active_employees: worksite.active_employees,

      created_at: worksite.created_at,
      updated_at: worksite.updated_at,
    };
  }

  // 从前端格式转换为数据库格式
  static toDatabaseFormat(display: WorksiteDisplayFields): Partial<Worksite> {
    return {
      worksite_id: display.worksite_id,
      name: display.name,
      description: display.description,

      // 地理坐标映射
      center_latitude: display.latitude,
      center_longitude: display.longitude,

      // 地址解析（简化版，实际可能需要更复杂的解析）
      street_address: display.address || "",
      suburb: "",
      state: "",
      postcode: "",

      status: display.status as any,
      start_date: display.start_date,
      estimated_end_date: display.end_date,

      project_manager: display.manager_name,
      project_manager_phone: display.manager_phone,
    };
  }

  // 格式化完整地址
  private static formatAddress(worksite: Worksite): string {
    const parts = [
      worksite.street_address,
      worksite.suburb,
      worksite.state,
      worksite.postcode,
    ].filter(Boolean);

    return parts.join(", ");
  }

  // 格式化位置描述
  private static formatLocation(worksite: Worksite): string {
    return `${worksite.suburb || ""}, ${worksite.state || ""}`
      .replace(/^,\s*/, "")
      .replace(/,\s*$/, "");
  }

  // 批量转换
  static toDisplayFormatBatch(worksites: Worksite[]): WorksiteDisplayFields[] {
    return worksites.map((worksite) => this.toDisplayFormat(worksite));
  }
}

// 签到字段映射器
export class CheckinMapper {
  // 从数据库格式转换为前端显示格式
  static toDisplayFormat(checkin: CheckIn): CheckinDisplayFields {
    return {
      id: checkin.id,
      employee_id: checkin.employee_id,
      worksite_id: checkin.worksite_id,

      // 字段名称映射
      check_type: checkin.checkin_type,
      timestamp: checkin.checkin_time,

      location: {
        latitude: checkin.latitude,
        longitude: checkin.longitude,
        address: checkin.address,
        accuracy: checkin.location_accuracy,
      },

      photo_url: checkin.photo_url,
      status: checkin.status,
      notes: checkin.admin_notes,

      // 关联信息
      employee_name: checkin.Employee
        ? `${checkin.Employee.first_name} ${checkin.Employee.last_name}`
        : undefined,
      worksite_name: checkin.Worksite?.name,

      created_at: checkin.created_at,
    };
  }

  // 从前端格式转换为数据库格式
  static toDatabaseFormat(display: CheckinDisplayFields): Partial<CheckIn> {
    return {
      id: display.id,
      employee_id: display.employee_id,
      worksite_id: display.worksite_id,

      // 字段名称映射
      checkin_type: display.check_type as any,
      checkin_time: display.timestamp,

      latitude: display.location.latitude,
      longitude: display.location.longitude,
      location_accuracy: display.location.accuracy,
      address: display.location.address,

      photo_url: display.photo_url || "",
      status: display.status as any,
      admin_notes: display.notes,
    };
  }

  // 批量转换
  static toDisplayFormatBatch(checkins: CheckIn[]): CheckinDisplayFields[] {
    return checkins.map((checkin) => this.toDisplayFormat(checkin));
  }
}

// 通用字段映射器
export class FieldMapper {
  // 将 snake_case 转换为 camelCase
  static snakeToCamel(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
        letter.toUpperCase(),
      );

      if (value && typeof value === "object" && !Array.isArray(value)) {
        result[camelKey] = this.snakeToCamel(value);
      } else if (Array.isArray(value)) {
        result[camelKey] = value.map((item) =>
          typeof item === "object" && item !== null
            ? this.snakeToCamel(item)
            : item,
        );
      } else {
        result[camelKey] = value;
      }
    }

    return result;
  }

  // 将 camelCase 转换为 snake_case
  static camelToSnake(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(
        /[A-Z]/g,
        (letter) => `_${letter.toLowerCase()}`,
      );

      if (value && typeof value === "object" && !Array.isArray(value)) {
        result[snakeKey] = this.camelToSnake(value);
      } else if (Array.isArray(value)) {
        result[snakeKey] = value.map((item) =>
          typeof item === "object" && item !== null
            ? this.camelToSnake(item)
            : item,
        );
      } else {
        result[snakeKey] = value;
      }
    }

    return result;
  }

  // 地理坐标标准化
  static normalizeGeoCoordinates(data: any): any {
    if (!data || typeof data !== "object") return data;

    const normalized = { ...data };

    // 标准化坐标字段名
    if ("center_latitude" in normalized) {
      normalized.latitude = normalized.center_latitude;
    }
    if ("center_longitude" in normalized) {
      normalized.longitude = normalized.center_longitude;
    }

    // 反向映射
    if ("latitude" in normalized && !("center_latitude" in normalized)) {
      normalized.center_latitude = normalized.latitude;
    }
    if ("longitude" in normalized && !("center_longitude" in normalized)) {
      normalized.center_longitude = normalized.longitude;
    }

    return normalized;
  }

  // 地址字段标准化
  static normalizeAddressFields(data: any): any {
    if (!data || typeof data !== "object") return data;

    const normalized = { ...data };

    // 如果有完整地址，尝试拆分
    if ("address" in normalized && !("street_address" in normalized)) {
      // 简化的地址拆分逻辑
      const addressParts = normalized.address?.split(",") || [];
      normalized.street_address = addressParts[0]?.trim() || "";
      normalized.suburb = addressParts[1]?.trim() || "";
      normalized.state = addressParts[2]?.trim() || "";
      normalized.postcode = addressParts[3]?.trim() || "";
    }

    // 如果有拆分地址，合成完整地址
    if (!("address" in normalized) && "street_address" in normalized) {
      const parts = [
        normalized.street_address,
        normalized.suburb,
        normalized.state,
        normalized.postcode,
      ].filter(Boolean);

      normalized.address = parts.join(", ");
    }

    return normalized;
  }
}

// 导出便捷方法
export const fieldMappers = {
  worksite: WorksiteMapper,
  checkin: CheckinMapper,
  general: FieldMapper,
};

// 在组件中使用的便捷方法
export function useFieldMapper() {
  return {
    // 工地映射
    formatWorksite: WorksiteMapper.toDisplayFormat,
    parseWorksite: WorksiteMapper.toDatabaseFormat,

    // 签到映射
    formatCheckin: CheckinMapper.toDisplayFormat,
    parseCheckin: CheckinMapper.toDatabaseFormat,

    // 通用映射
    snakeToCamel: FieldMapper.snakeToCamel,
    camelToSnake: FieldMapper.camelToSnake,
    normalizeGeo: FieldMapper.normalizeGeoCoordinates,
    normalizeAddress: FieldMapper.normalizeAddressFields,
  };
}
