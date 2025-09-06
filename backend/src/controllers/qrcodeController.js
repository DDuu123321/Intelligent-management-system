// src/controllers/qrcodeController.js
const QRCode = require('qrcode');
const crypto = require('crypto');
const { QRCode: QRCodeModel, Worksite, Employee, CheckIn, sequelize } = require('../models');
const { Op } = require('sequelize');

// 计算两点间距离（米）的辅助函数
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // 地球半径（米）
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

class QRCodeController {
  // 创建二维码
  async createQRCode(req, res) {
    try {
      const { 
        worksite_id, 
        worksite_name, 
        center_latitude, 
        center_longitude, 
        radius = 100,
        require_photo = true,
        require_gps = true,
        face_verification_enabled = false,
        allow_checkin_anytime = true,
        work_start_time,
        work_end_time,
        description
      } = req.body;

      // 生成唯一的令牌
      const qr_token = crypto.randomBytes(32).toString('hex');
      
      // 构建二维码URL - 指向前端签到页面
      const qr_url = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkin/${qr_token}`;
      
      // 生成二维码图片（Base64）
      const qr_data = await QRCode.toDataURL(qr_url, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 300
      });

      // 创建二维码记录
      const qrcode = await QRCodeModel.create({
        worksite_id,
        worksite_name,
        qr_token,
        qr_url,
        qr_data,
        center_latitude,
        center_longitude,
        radius,
        require_photo,
        require_gps,
        face_verification_enabled,
        allow_checkin_anytime,
        work_start_time,
        work_end_time,
        description,
        created_by: req.user?.username || 'admin'
      });

      return res.standard(qrcode, { message: '二维码创建成功', status: 201 });
    } catch (err) {
      console.error('创建二维码失败:', err);
      return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: '创建二维码失败', status: 500 });
    }
  }

  // 获取所有二维码
  async getAllQRCodes(req, res) {
    try {
      const { page = 1, limit = 10, worksite_id, is_active } = req.query;
      
      const whereClause = {};
      if (worksite_id && worksite_id !== '') whereClause.worksite_id = worksite_id;
      if (is_active !== undefined && is_active !== '' && is_active !== null && is_active !== 'null') whereClause.is_active = is_active === 'true';

      const qrcodes = await QRCodeModel.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [['created_at', 'DESC']],
        include: [{
          model: Worksite,
          attributes: ['worksite_id', 'name', 'street_address']
        }]
      });

      return res.standard({
        qrcodes: qrcodes.rows,
        pagination: { current_page: parseInt(page), per_page: parseInt(limit), total: qrcodes.count, total_pages: Math.ceil(qrcodes.count / parseInt(limit)) }
      }, { message: '获取二维码列表成功' });
    } catch (err) {
      console.error('获取二维码列表失败:', err);
      return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: '获取二维码列表失败', status: 500 });
    }
  }

  // 获取单个二维码信息
  async getQRCodeByToken(req, res) {
    try {
      const { token } = req.params;
      
      const qrcode = await QRCodeModel.findOne({
        where: { qr_token: token },
        include: [{
          model: Worksite,
          attributes: ['worksite_id', 'name', 'street_address', 'description']
        }]
      });

      if (!qrcode) {
        return res.standard({ error: { code: 'NOT_FOUND' } }, { message: '二维码不存在或已过期', status: 404 });
      }

      if (!qrcode.is_active) {
        return res.standard({ error: { code: 'FORBIDDEN' } }, { message: '二维码已被禁用', status: 403 });
      }

      if (qrcode.expires_at && new Date() > qrcode.expires_at) {
        return res.standard({ error: { code: 'GONE' } }, { message: '二维码已过期', status: 410 });
      }

      // 增加扫描次数
      await qrcode.increment('scan_count');

      return res.standard({ 
        id: qrcode.id, 
        worksite_id: qrcode.worksite_id, 
        worksite_name: qrcode.worksite_name, 
        center_latitude: qrcode.center_latitude, 
        center_longitude: qrcode.center_longitude, 
        radius: qrcode.radius, 
        require_photo: qrcode.require_photo, 
        require_gps: qrcode.require_gps, 
        face_verification_enabled: qrcode.face_verification_enabled, 
        allow_checkin_anytime: qrcode.allow_checkin_anytime, 
        work_start_time: qrcode.work_start_time, 
        work_end_time: qrcode.work_end_time, 
        Worksite: qrcode.Worksite 
      }, { message: '获取二维码信息成功' });
    } catch (err) {
      console.error('获取二维码信息失败:', err);
      return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: '获取二维码信息失败', status: 500 });
    }
  }

  // 员工签到
  async checkin(req, res) {
    try {
      const { token } = req.params;
      const { 
        phone_number, // 使用手机号作为员工ID
        checkin_type, // 'in' 或 'out'
        latitude,
        longitude,
        location_accuracy,
        address,
        photo_data, // Base64图片数据
        device_info = {}
      } = req.body;

      // 验证二维码
      const qrcode = await QRCodeModel.findOne({
        where: { qr_token: token, is_active: true }
      });

      if (!qrcode) {
        return res.standard({ error: { code: 'INVALID_QR' } }, { message: '无效的签到二维码', status: 400 });
      }

      if (qrcode.expires_at && new Date() > qrcode.expires_at) {
        return res.standard({ error: { code: 'GONE' } }, { message: '签到二维码已过期', status: 410 });
      }

      // 验证员工是否存在（使用手机号，支持多种格式）
      let employee = await Employee.findOne({
        where: { phone: phone_number, status: 'active' }
      });

      // 如果找不到，尝试去掉开头的0
      if (!employee && phone_number.startsWith('0')) {
        employee = await Employee.findOne({
          where: { phone: phone_number.substring(1), status: 'active' }
        });
      }

      // 如果还是找不到，尝试添加开头的0
      if (!employee && !phone_number.startsWith('0')) {
        employee = await Employee.findOne({
          where: { phone: '0' + phone_number, status: 'active' }
        });
      }

      if (!employee) {
        return res.standard({ error: { code: 'NOT_FOUND' } }, { message: '员工不存在或已被禁用', status: 400 });
      }

      if (!employee.can_checkin) {
        return res.standard({ error: { code: 'FORBIDDEN' } }, { message: '该员工被禁止签到', status: 403 });
      }

      // 验证GPS位置（如果启用）
      let is_within_worksite = true;
      let distance_from_worksite = null;
      
      if (qrcode.require_gps && latitude && longitude) {
        distance_from_worksite = calculateDistance(
          qrcode.center_latitude,
          qrcode.center_longitude,
          latitude,
          longitude
        );
        is_within_worksite = distance_from_worksite <= qrcode.radius;
      }

      // 验证照片（如果启用）
      if (qrcode.require_photo && !photo_data) {
        return res.standard({ error: { code: 'VALIDATION_ERROR' } }, { message: '需要拍照进行身份验证', status: 400 });
      }

      // 检查是否在允许的时间内签到（如果不是任何时间都允许）
      const now = new Date();
      const currentTime = now.toTimeString().split(' ')[0];
      
      let time_validation_passed = qrcode.allow_checkin_anytime;
      if (!qrcode.allow_checkin_anytime && qrcode.work_start_time && qrcode.work_end_time) {
        time_validation_passed = currentTime >= qrcode.work_start_time && currentTime <= qrcode.work_end_time;
      }

      // 创建签到记录
      const checkinData = {
        employee_id: employee.employee_id,
        checkin_type: checkin_type || 'in',
        checkin_time: now,
        latitude: latitude,
        longitude: longitude,
        location_accuracy,
        address,
        worksite_id: qrcode.worksite_id,
        is_within_worksite,
        distance_from_worksite,
        photo_url: photo_data,
        device_id: device_info.device_id,
        device_type: device_info.device_type,
        app_version: device_info.app_version,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        status: (is_within_worksite && time_validation_passed) ? 'approved' : 'pending',
        verification_method: 'gps_photo',
        is_suspicious: false,
        suspicious_reasons: []
      };

      // 添加可疑标记
      if (!is_within_worksite) {
        checkinData.is_suspicious = true;
        checkinData.suspicious_reasons.push('GPS位置超出工地范围');
      }

      if (!time_validation_passed && !qrcode.allow_checkin_anytime) {
        checkinData.is_suspicious = true;
        checkinData.suspicious_reasons.push('签到时间超出规定范围');
      }

      const checkin = await CheckIn.create(checkinData);

      // 更新二维码统计
      if (checkin.status === 'approved') {
        await qrcode.increment('successful_checkins');
      }
      await qrcode.update({ last_used_at: now });

      return res.standard({
        checkin_id: checkin.id,
        checkin_type: checkin.checkin_type,
        checkin_time: checkin.checkin_time,
        status: checkin.status,
        is_within_worksite,
        distance_from_worksite,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        worksite_name: qrcode.worksite_name
      }, { message: '签到成功' });
    } catch (err) {
      console.error('签到失败:', err);
      return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: '签到失败', status: 500 });
    }
  }

  // 更新二维码
  async updateQRCode(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const qrcode = await QRCodeModel.findByPk(id);
      if (!qrcode) {
        return res.standard({ error: { code: 'NOT_FOUND' } }, { message: '二维码不存在', status: 404 });
      }

      updateData.updated_by = req.user?.username || 'admin';
      
      await qrcode.update(updateData);

      return res.standard(qrcode, { message: '二维码更新成功' });
    } catch (err) {
      console.error('更新二维码失败:', err);
      return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: '更新二维码失败', status: 500 });
    }
  }

  // 删除二维码
  async deleteQRCode(req, res) {
    try {
      const { id } = req.params;
      
      const qrcode = await QRCodeModel.findByPk(id);
      if (!qrcode) {
        return res.standard({ error: { code: 'NOT_FOUND' } }, { message: '二维码不存在', status: 404 });
      }

      await qrcode.destroy();

      return res.standard(null, { message: '二维码删除成功' });
    } catch (err) {
      console.error('删除二维码失败:', err);
      return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: '删除二维码失败', status: 500 });
    }
  }

  // 获取签到统计
  async getCheckinStats(req, res) {
    try {
      // 获取今天的开始时间
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // 1. 总二维码数量
      const totalQRCodes = await QRCodeModel.count();

      // 2. 活跃二维码数量
      const activeQRCodes = await QRCodeModel.count({
        where: { is_active: true }
      });

      // 3. 今日扫描数（更新scan_count的记录）
      const todayScans = await QRCodeModel.sum('scan_count', {
        where: {
          updatedAt: {
            [Op.between]: [todayStart, todayEnd]
          }
        }
      }) || 0;

      // 4. 今日签到数
      const todayCheckins = await CheckIn.count({
        where: {
          checkin_time: {
            [Op.between]: [todayStart, todayEnd]
          }
        }
      });

      const stats = {
        total_qrcodes: totalQRCodes,
        active_qrcodes: activeQRCodes,
        today_scans: todayScans,
        today_checkins: todayCheckins
      };

      return res.standard(stats, { message: '获取统计数据成功' });
    } catch (err) {
      console.error('获取统计数据失败:', err);
      return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: '获取统计数据失败', status: 500 });
    }
  }
}

module.exports = new QRCodeController();