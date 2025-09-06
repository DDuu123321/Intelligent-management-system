// 日期格式化工具函数

export const formatDateTime = (
  date: string | Date | null | undefined,
): string => {
  if (!date) return "";

  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return "";

  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const formatTime = (date: string | Date | null | undefined): string => {
  if (!date) return "";

  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
};

// 相对时间格式化 (例如: 2小时前)
export const formatRelativeTime = (
  date: string | Date | null | undefined,
): string => {
  if (!date) return "";

  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}天前`;
  } else if (hours > 0) {
    return `${hours}小时前`;
  } else if (minutes > 0) {
    return `${minutes}分钟前`;
  } else {
    return "刚刚";
  }
};

// 获取今天的日期范围 (00:00:00 - 23:59:59)
export const getTodayRange = (): [string, string] => {
  const today = new Date();
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const end = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59,
  );

  return [formatDateTime(start), formatDateTime(end)];
};

// 获取本周的日期范围
export const getThisWeekRange = (): [string, string] => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const start = new Date(today);
  start.setDate(today.getDate() - dayOfWeek + 1); // 周一
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6); // 周日
  end.setHours(23, 59, 59, 999);

  return [formatDateTime(start), formatDateTime(end)];
};

// 获取本月的日期范围
export const getThisMonthRange = (): [string, string] => {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
    23,
    59,
    59,
  );

  return [formatDateTime(start), formatDateTime(end)];
};

// 验证日期字符串是否有效
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

// 计算两个日期之间的天数差
export const getDaysDiff = (
  start: string | Date,
  end: string | Date,
): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return 0;
  }

  const timeDiff = endDate.getTime() - startDate.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};
