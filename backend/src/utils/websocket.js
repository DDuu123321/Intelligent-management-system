// src/utils/websocket.js
// WebSocket 事件发射工具

/**
 * 发射证件相关事件
 * @param {string} action - 事件动作 (created, updated, deleted, expiring, expired)
 * @param {object} licenseData - 证件数据
 * @param {string} room - 房间名称 (可选)
 */
function emitLicenseEvent(action, licenseData, room = null) {
  const event = `license-${action}`;
  if (global.io) {
    const eventData = {
      timestamp: new Date().toISOString(),
      ...licenseData
    };
    
    if (room) {
      global.io.to(room).emit(event, eventData);
    } else {
      global.io.emit(event, eventData);
    }
    console.log(`📡 WebSocket 事件已发射: ${event}`, licenseData && (licenseData.employee?.name || licenseData.employee_id || licenseData.id || '未知'));
  }
}

/**
 * 发射OCR确认事件
 * @param {object} licenseData - 证件数据
 * @param {string} room - 房间名称 (可选)
 */
function emitOcrConfirmedEvent(licenseData, room = null) {
  if (global.io) {
    const eventData = {
      timestamp: new Date().toISOString(),
      ...licenseData
    };
    
    if (room) {
      global.io.to(room).emit('ocr-confirmed', eventData);
    } else {
      global.io.emit('ocr-confirmed', eventData);
    }
    console.log(`📡 OCR确认事件已发射:`, licenseData && (licenseData.employee?.name || licenseData.employee_id || licenseData.id || '未知'));
  }
}

/**
 * 发射通用事件
 * @param {string} event - 事件名称
 * @param {object} data - 事件数据
 * @param {string} room - 房间名称 (可选)
 */
function emitEvent(event, data, room = null) {
  if (global.io) {
    if (room) {
      global.io.to(room).emit(event, {
        timestamp: new Date().toISOString(),
        ...data
      });
    } else {
      global.io.emit(event, {
        timestamp: new Date().toISOString(),
        ...data
      });
    }
    console.log(`📡 WebSocket 事件已发射: ${event}`);
  }
}

module.exports = {
  emitLicenseEvent,
  emitOcrConfirmedEvent,
  emitEvent
};