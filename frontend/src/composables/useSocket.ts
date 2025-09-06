// src/composables/useSocket.ts (WebSocket连接 - 增强版)
import { ref, onMounted, onUnmounted } from "vue";
import { io, Socket } from "socket.io-client";
import { ElMessage, ElNotification } from "element-plus";

export interface LicenseEvent {
  type: "created" | "updated" | "deleted" | "expiring" | "expired";
  data: any;
  message?: string;
}

export const useSocket = () => {
  const socket = ref<Socket | null>(null);
  const connected = ref(false);

  // License事件监听器
  const licenseEventListeners = ref<((event: LicenseEvent) => void)[]>([]);

  const connect = () => {
    if (socket.value) return;

    const baseUrl =
      import.meta.env.VITE_API_BASE_URL?.replace("/api/v1", "") ||
      "http://localhost:3000";
    socket.value = io(baseUrl, {
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.value.on("connect", () => {
      connected.value = true;
      console.log("🔌 WebSocket连接成功");
      ElMessage.success("实时连接已建立");
    });

    socket.value.on("disconnect", () => {
      connected.value = false;
      console.log("🔌 WebSocket连接断开");
    });

    socket.value.on("connect_error", (error) => {
      console.error("🔌 WebSocket连接错误:", error);
    });

    socket.value.on("reconnect", (attemptNumber) => {
      console.log(`🔌 WebSocket重连成功，尝试次数: ${attemptNumber}`);
      ElMessage.success("连接已恢复");
    });

    socket.value.on("reconnect_failed", () => {
      console.error("🔌 WebSocket重连失败");
      ElMessage.error("连接失败，请刷新页面");
    });

    // License相关事件监听
    socket.value.on("license-created", (data) => {
      console.log("📄 证件已创建:", data);
      const event: LicenseEvent = {
        type: "created",
        data,
        message: "新证件已添加",
      };
      notifyLicenseEvent(event);
      ElNotification({
        title: "证件管理",
        message: `新增证件: ${data.licenseType?.name || "未知类型"}`,
        type: "success",
      });
    });

    socket.value.on("license-updated", (data) => {
      console.log("📄 证件已更新:", data);
      const event: LicenseEvent = {
        type: "updated",
        data,
        message: "证件已更新",
      };
      notifyLicenseEvent(event);
    });

    socket.value.on("license-deleted", (data) => {
      console.log("📄 证件已删除:", data);
      const event: LicenseEvent = {
        type: "deleted",
        data,
        message: "证件已删除",
      };
      notifyLicenseEvent(event);
    });

    socket.value.on("license-expiring", (data) => {
      console.log("⚠️ 证件即将到期:", data);
      const event: LicenseEvent = {
        type: "expiring",
        data,
        message: "证件即将到期",
      };
      notifyLicenseEvent(event);
      ElNotification({
        title: "到期提醒",
        message: `${data.employee?.name || "未知员工"} 的 ${data.licenseType?.name || "证件"} 将在 ${data.daysRemaining} 天后到期`,
        type: "warning",
        duration: 8000,
      });
    });

    socket.value.on("license-expired", (data) => {
      console.log("🚨 证件已过期:", data);
      const event: LicenseEvent = {
        type: "expired",
        data,
        message: "证件已过期",
      };
      notifyLicenseEvent(event);
      ElNotification({
        title: "过期警告",
        message: `${data.employee?.name || "未知员工"} 的 ${data.licenseType?.name || "证件"} 已过期`,
        type: "error",
        duration: 10000,
      });
    });

    // OCR确认事件
    socket.value.on("ocr-confirmed", (data) => {
      console.log("✅ OCR确认完成:", data);
      const event: LicenseEvent = {
        type: "updated",
        data,
        message: "OCR确认完成",
      };
      notifyLicenseEvent(event);
      ElNotification({
        title: "OCR确认",
        message: "证件信息确认完成",
        type: "success",
      });
    });

    // 传统事件保持向后兼容
    socket.value.on("vehicle-update", (data) => {
      console.log("🚗 车辆位置更新:", data);
    });

    socket.value.on("attendance-update", (data) => {
      console.log("👥 考勤更新:", data);
    });

    socket.value.on("alert", (data) => {
      ElMessage.warning(`新报警: ${data.data?.title || "未知报警"}`);
      console.log("🚨 新报警:", data);
    });
  };

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
      connected.value = false;
      console.log("🔌 WebSocket已断开");
    }
  };

  const joinRoom = (room: string) => {
    if (socket.value && connected.value) {
      socket.value.emit("join", room);
      console.log(`🏠 加入房间: ${room}`);
    }
  };

  const leaveRoom = (room: string) => {
    if (socket.value && connected.value) {
      socket.value.emit("leave", room);
      console.log(`🏠 离开房间: ${room}`);
    }
  };

  // License事件监听器管理
  const onLicenseEvent = (listener: (event: LicenseEvent) => void) => {
    licenseEventListeners.value.push(listener);

    // 返回取消监听的函数
    return () => {
      const index = licenseEventListeners.value.indexOf(listener);
      if (index > -1) {
        licenseEventListeners.value.splice(index, 1);
      }
    };
  };

  const notifyLicenseEvent = (event: LicenseEvent) => {
    licenseEventListeners.value.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error("License事件监听器执行错误:", error);
      }
    });
  };

  // 发送自定义事件
  const emit = (event: string, data?: any) => {
    if (socket.value && connected.value) {
      socket.value.emit(event, data);
    }
  };

  onMounted(() => {
    connect();
  });

  onUnmounted(() => {
    disconnect();
  });

  return {
    socket,
    connected,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    onLicenseEvent,
    emit,
  };
};
