// Element Plus 类型扩展声明
// 解决严格类型检查下的 Element Plus 组件属性类型兼容性问题

declare module '@element-plus/icons-vue';

// 扩展 Element Plus 消息类型以兼容字符串参数
declare global {
  namespace ElementPlus {
    interface MessageOptions {
      message?: string;
      type?: 'success' | 'warning' | 'info' | 'error';
    }
  }
}

// 重新声明 ElMessage 以支持更灵活的参数类型
declare module 'element-plus' {
  interface ElMessageProps {
    message?: string;
    type?: 'success' | 'warning' | 'info' | 'error';
  }
  
  // 扩展 el-alert 组件属性类型
  interface ElAlertProps {
    title?: string;
    description?: string;
    type?: 'success' | 'warning' | 'info' | 'error';
  }
}

export {};