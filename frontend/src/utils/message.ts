// Element Plus 消息工具函数
import { ElMessage } from "element-plus";
import type { MessageParams } from "element-plus";

// 统一的消息函数，确保类型安全
export const message = {
  success: (text: string) => ElMessage({ message: text, type: "success" }),
  error: (text: string) => ElMessage({ message: text, type: "error" }),
  warning: (text: string) => ElMessage({ message: text, type: "warning" }),
  info: (text: string) => ElMessage({ message: text, type: "info" }),
};

// 导出默认对象
export default message;
