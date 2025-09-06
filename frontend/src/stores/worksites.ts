// src/stores/worksites.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import request from "@/utils/request";

export interface Worksite {
  id?: number;
  worksite_id: string;
  name: string;
  location: string;
  address: string;
  latitude?: number;
  longitude?: number;
  status: "active" | "inactive" | "completed";
  start_date: string;
  end_date?: string;
  manager_name?: string;
  manager_phone?: string;
  safety_requirements?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  Employees?: any[];
  active_employees_count?: number;
  total_employees_count?: number;
}

export const useWorksitesStore = defineStore("worksites", () => {
  const worksites = ref<Worksite[]>([]);
  const currentWorksite = ref<Worksite | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 计算属性
  const activeWorksites = computed(() =>
    worksites.value.filter((site) => site.status === "active"),
  );

  const worksiteOptions = computed(() =>
    activeWorksites.value.map((site) => ({
      value: site.worksite_id,
      label: site.name,
      location: site.location,
    })),
  );

  // 获取工地列表
  const fetchWorksites = async (params: any = {}) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await request.get("/worksites", { params });
      worksites.value = response.data;
      return response.data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "获取工地列表失败";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 获取单个工地
  const fetchWorksite = async (worksite_id: string) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await request.get(`/worksites/${worksite_id}`);
      currentWorksite.value = response.data;
      return response.data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "获取工地信息失败";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 创建工地
  const addWorksite = async (
    worksite: Omit<Worksite, "id" | "created_at" | "updated_at">,
  ) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await request.post("/worksites", worksite);
      worksites.value.push(response.data);
      return response.data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "创建工地失败";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 更新工地
  const modifyWorksite = async (
    worksite_id: string,
    updates: Partial<Worksite>,
  ) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await request.put(`/worksites/${worksite_id}`, updates);
      const index = worksites.value.findIndex(
        (site) => site.worksite_id === worksite_id,
      );
      if (index !== -1) {
        worksites.value[index] = response.data;
      }
      if (currentWorksite.value?.worksite_id === worksite_id) {
        currentWorksite.value = response.data;
      }
      return response.data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "更新工地失败";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 删除工地
  const removeWorksite = async (worksite_id: string) => {
    loading.value = true;
    error.value = null;
    try {
      await request.delete(`/worksites/${worksite_id}`);
      worksites.value = worksites.value.filter(
        (site) => site.worksite_id !== worksite_id,
      );
      if (currentWorksite.value?.worksite_id === worksite_id) {
        currentWorksite.value = null;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "删除工地失败";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 分配员工到工地
  const assignEmployeesToWorksite = async (
    worksite_id: string,
    employee_ids: string[],
  ) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await request.post(
        `/worksites/${worksite_id}/employees`,
        { employee_ids },
      );
      return response.data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "分配员工失败";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 从工地移除员工
  const removeEmployeesFromWorksite = async (
    worksite_id: string,
    employee_ids: string[],
  ) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await request.delete(
        `/worksites/${worksite_id}/employees`,
        {
          data: { employee_ids },
        },
      );
      return response.data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "移除员工失败";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 根据ID查找工地
  const findWorksiteById = (worksite_id: string): Worksite | undefined => {
    return worksites.value.find((site) => site.worksite_id === worksite_id);
  };

  // 清除错误
  const clearError = () => {
    error.value = null;
  };

  // 重置当前工地
  const clearCurrentWorksite = () => {
    currentWorksite.value = null;
  };

  return {
    // 状态
    worksites,
    currentWorksite,
    loading,
    error,

    // 计算属性
    activeWorksites,
    worksiteOptions,

    // 方法
    fetchWorksites,
    fetchWorksite,
    addWorksite,
    modifyWorksite,
    removeWorksite,
    assignEmployeesToWorksite,
    removeEmployeesFromWorksite,
    findWorksiteById,
    clearError,
    clearCurrentWorksite,
  };
});
