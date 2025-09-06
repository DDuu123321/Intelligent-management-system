// src/services/seedQRCodeData.js
const crypto = require('crypto');
const QRCode = require('qrcode');
const { QRCode: QRCodeModel, Worksite, Employee } = require('../models');

const seedQRCodeData = async () => {
  try {
    console.log('开始初始化二维码签到数据...');

    // 创建测试工地
    const worksite1 = await Worksite.findOrCreate({
      where: { worksite_id: 'WS001' },
      defaults: {
        worksite_id: 'WS001',
        name: 'Perth CBD Office Complex',
        street_address: '123 St Georges Terrace',
        suburb: 'Perth',
        state: 'WA',
        postcode: '6000',
        description: 'Perth CBD办公楼建设项目',
        center_latitude: -31.9505,
        center_longitude: 115.8605,
        project_manager: 'John Manager',
        project_manager_phone: '0412345678',
        start_date: '2024-01-01'
      }
    });

    const worksite2 = await Worksite.findOrCreate({
      where: { worksite_id: 'WS002' },
      defaults: {
        worksite_id: 'WS002',
        name: 'Fremantle Residential Development',
        street_address: '456 High Street',
        suburb: 'Fremantle',
        state: 'WA',
        postcode: '6160',
        description: 'Fremantle住宅开发项目',
        center_latitude: -32.0569,
        center_longitude: 115.7423,
        project_manager: 'Sarah Williams',
        project_manager_phone: '0423456789',
        start_date: '2024-01-01'
      }
    });

    const worksite3 = await Worksite.findOrCreate({
      where: { worksite_id: 'WS003' },
      defaults: {
        worksite_id: 'WS003',
        name: 'Joondalup Shopping Center Extension',
        street_address: '789 Joondalup Drive',
        suburb: 'Joondalup',
        state: 'WA',
        postcode: '6027',
        description: 'Joondalup购物中心扩建项目',
        center_latitude: -31.7448,
        center_longitude: 115.7661,
        project_manager: 'Mike Johnson',
        project_manager_phone: '0434567890',
        start_date: '2024-01-01'
      }
    });

    // 创建测试员工
    const employees = [
      {
        employee_id: 'EMP001',
        first_name: 'John',
        last_name: 'Smith',
        phone: '0412345678',
        date_of_birth: '1985-03-15',
        visa_status: 'citizen',
        white_card_number: 'WC12345678',
        white_card_expiry: '2025-12-31',
        safety_induction_completed: true,
        safety_induction_date: '2024-01-15',
        position: 'Site Supervisor',
        department: 'Construction',
        hourly_rate: 45.50,
        employment_type: 'full_time',
        start_date: '2024-01-01',
        status: 'active',
        can_checkin: true,
        emergency_contact_name: 'Jane Smith',
        emergency_contact_phone: '0423456789',
        emergency_contact_relationship: 'Wife',
        bank_name: 'Commonwealth Bank',
        bsb: '062-001',
        account_number: '12345678',
        account_name: 'John Smith'
      },
      {
        employee_id: 'EMP002',
        first_name: 'Sarah',
        last_name: 'Williams',
        phone: '0423456789',
        date_of_birth: '1990-07-22',
        visa_status: 'permanent_resident',
        white_card_number: 'WC23456789',
        white_card_expiry: '2025-06-30',
        safety_induction_completed: true,
        safety_induction_date: '2024-02-01',
        position: 'Electrician',
        department: 'Electrical',
        hourly_rate: 42.00,
        employment_type: 'full_time',
        start_date: '2024-02-01',
        status: 'active',
        can_checkin: true,
        emergency_contact_name: 'Tom Williams',
        emergency_contact_phone: '0434567890',
        emergency_contact_relationship: 'Husband',
        bank_name: 'ANZ Bank',
        bsb: '013-001',
        account_number: '23456789',
        account_name: 'Sarah Williams'
      },
      {
        employee_id: 'EMP003',
        first_name: 'Mike',
        last_name: 'Johnson',
        phone: '0434567890',
        date_of_birth: '1988-11-08',
        visa_status: 'working_holiday',
        visa_expiry_date: '2025-03-15',
        white_card_number: 'WC34567890',
        white_card_expiry: '2025-09-30',
        safety_induction_completed: true,
        safety_induction_date: '2024-01-20',
        position: 'Carpenter',
        department: 'Construction',
        hourly_rate: 38.75,
        employment_type: 'casual',
        start_date: '2024-01-20',
        status: 'active',
        can_checkin: true,
        emergency_contact_name: 'Lisa Johnson',
        emergency_contact_phone: '0445678901',
        emergency_contact_relationship: 'Sister',
        bank_name: 'Westpac Bank',
        bsb: '032-001',
        account_number: '34567890',
        account_name: 'Michael Johnson'
      }
    ];

    // 创建员工记录
    for (const empData of employees) {
      await Employee.findOrCreate({
        where: { employee_id: empData.employee_id },
        defaults: empData
      });
    }

    // 创建二维码
    const qrCodeConfigs = [
      {
        worksite_id: 'WS001',
        worksite_name: 'Perth CBD Office Complex',
        center_latitude: -31.9505,
        center_longitude: 115.8605,
        radius: 100,
        require_photo: true,
        require_gps: true,
        face_verification_enabled: false,
        allow_checkin_anytime: true,
        description: 'Perth CBD项目主要签到点'
      },
      {
        worksite_id: 'WS002',
        worksite_name: 'Fremantle Residential Development',
        center_latitude: -32.0569,
        center_longitude: 115.7423,
        radius: 150,
        require_photo: true,
        require_gps: true,
        face_verification_enabled: false,
        allow_checkin_anytime: false,
        work_start_time: '07:00:00',
        work_end_time: '17:00:00',
        description: 'Fremantle住宅项目签到点'
      },
      {
        worksite_id: 'WS003',
        worksite_name: 'Joondalup Shopping Center Extension',
        center_latitude: -31.7448,
        center_longitude: 115.7661,
        radius: 80,
        require_photo: true,
        require_gps: true,
        face_verification_enabled: true,
        allow_checkin_anytime: true,
        description: 'Joondalup购物中心扩建项目签到点'
      }
    ];

    for (const config of qrCodeConfigs) {
      // 生成唯一的令牌
      const qr_token = crypto.randomBytes(32).toString('hex');
      
      // 构建二维码URL
      const qr_url = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkin/${qr_token}`;
      
      try {
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

        await QRCodeModel.findOrCreate({
          where: { worksite_id: config.worksite_id },
          defaults: {
            ...config,
            qr_token,
            qr_url,
            qr_data,
            created_by: 'system',
            is_active: true
          }
        });

        console.log(`为工地 ${config.worksite_name} 创建二维码成功`);
      } catch (qrError) {
        console.error(`为工地 ${config.worksite_name} 创建二维码失败:`, qrError);
      }
    }

    console.log('二维码签到数据初始化完成！');
    console.log('');
    console.log('测试账户信息:');
    console.log('员工1: John Smith (0412345678)');
    console.log('员工2: Sarah Williams (0423456789)');
    console.log('员工3: Mike Johnson (0434567890)');
    console.log('');
    console.log('工地信息:');
    console.log('WS001: Perth CBD Office Complex');
    console.log('WS002: Fremantle Residential Development');
    console.log('WS003: Joondalup Shopping Center Extension');

  } catch (error) {
    console.error('初始化二维码签到数据失败:', error);
    throw error;
  }
};

module.exports = seedQRCodeData;