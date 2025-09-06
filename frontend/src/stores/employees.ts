// src/stores/employees.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Employee } from "@/api/employees";
import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getDepartments,
} from "@/api/employees";

export const useEmployeesStore = defineStore("employees", () => {
  const employees = ref<Employee[]>([]);
  const currentEmployee = ref<Employee | null>(null);
  const departments = ref<string[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 分页信息
  const pagination = ref({
    current_page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0,
  });

  // 计算属性
  const activeEmployees = computed(() =>
    employees.value.filter((emp) => emp.status === "active"),
  );

  const employeesByDepartment = computed(() => {
    const grouped: Record<string, Employee[]> = {};
    employees.value.forEach((emp) => {
      if (!grouped[emp.department]) {
        grouped[emp.department] = [];
      }
      grouped[emp.department].push(emp);
    });
    return grouped;
  });

  // 获取员工列表
  const fetchEmployees = async (params: any = {}) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await getEmployees(params);
      employees.value = response.data.employees;
      pagination.value = response.data.pagination;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "获取员工列表失败";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 获取单个员工
  const fetchEmployee = async (employee_id: string) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await getEmployee(employee_id);
      currentEmployee.value = response.data;
      return response.data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "获取员工信息失败";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 创建员工
  const addEmployee = async (employee: Employee) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await createEmployee(employee);
      employees.value.push(response.data);
      return response.data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "创建员工失败";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 更新员工
  const modifyEmployee = async (
    employee_id: string,
    updates: Partial<Employee>,
  ) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await updateEmployee(employee_id, updates);
      const index = employees.value.findIndex(
        (emp) => emp.employee_id === employee_id,
      );
      if (index !== -1) {
        employees.value[index] = response.data;
      }
      if (currentEmployee.value?.employee_id === employee_id) {
        currentEmployee.value = response.data;
      }
      return response.data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "更新员工失败";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 删除员工
  const removeEmployee = async (employee_id: string) => {
    loading.value = true;
    error.value = null;
    try {
      await deleteEmployee(employee_id);
      employees.value = employees.value.filter(
        (emp) => emp.employee_id !== employee_id,
      );
      if (currentEmployee.value?.employee_id === employee_id) {
        currentEmployee.value = null;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "删除员工失败";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 获取部门列表
  const fetchDepartments = async () => {
    try {
      const response = await getDepartments();
      departments.value = response.data;
      return response.data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "获取部门列表失败";
      throw err;
    }
  };

  // 根据ID查找员工
  const findEmployeeById = (employee_id: string): Employee | undefined => {
    return employees.value.find((emp) => emp.employee_id === employee_id);
  };

  // 清除错误
  const clearError = () => {
    error.value = null;
  };

  // 重置当前员工
  const clearCurrentEmployee = () => {
    currentEmployee.value = null;
  };

  return {
    // 状态
    employees,
    currentEmployee,
    departments,
    loading,
    error,
    pagination,

    // 计算属性
    activeEmployees,
    employeesByDepartment,

    // 方法
    fetchEmployees,
    fetchEmployee,
    addEmployee,
    modifyEmployee,
    removeEmployee,
    fetchDepartments,
    findEmployeeById,
    clearError,
    clearCurrentEmployee,
  };
});
