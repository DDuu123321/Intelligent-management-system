// src/services/seedCheckinSystem.js
const { Employee, Worksite, CheckIn } = require('../models');

const seedCheckinSystem = async () => {
  console.log('🌱 开始初始化签到系统数据...');
  
  try {
    // 创建工地数据
    const worksites = [
      {
        worksite_id: 'WS001',
        name: 'Perth CBD Office Complex',
        description: '珀斯市中心办公楼建设项目',
        center_latitude: -31.9505,
        center_longitude: 115.8605,
        radius: 100,
        street_address: '123 St Georges Terrace',
        suburb: 'Perth',
        state: 'WA',
        postcode: '6000',
        country: 'Australia',
        standard_work_start: '07:00:00',
        standard_work_end: '17:00:00',
        break_start: '12:00:00',
        break_end: '13:00:00',
        early_checkin_buffer: 30,
        late_checkin_tolerance: 15,
        require_photo: true,
        require_gps: true,
        max_gps_accuracy: 20,
        require_white_card: true,
        require_safety_induction: true,
        ppe_requirements: ['hard_hat', 'safety_vest', 'steel_boots', 'safety_glasses'],
        project_manager: 'John Smith',
        project_manager_phone: '0412345678',
        contractor_name: 'ABC Construction Pty Ltd',
        client_name: 'Perth City Council',
        status: 'active',
        start_date: '2024-01-01',
        estimated_end_date: '2024-12-31',
        timezone: 'Australia/Perth'
      },
      {
        worksite_id: 'WS002',
        name: 'Fremantle Residential Development',
        description: '弗里曼特尔住宅开发项目',
        center_latitude: -32.0569,
        center_longitude: 115.7440,
        radius: 150,
        street_address: '456 High Street',
        suburb: 'Fremantle',
        state: 'WA',
        postcode: '6160',
        country: 'Australia',
        standard_work_start: '07:30:00',
        standard_work_end: '16:30:00',
        break_start: '12:30:00',
        break_end: '13:30:00',
        early_checkin_buffer: 45,
        late_checkin_tolerance: 10,
        require_photo: true,
        require_gps: true,
        max_gps_accuracy: 25,
        require_white_card: true,
        require_safety_induction: true,
        ppe_requirements: ['hard_hat', 'safety_vest', 'steel_boots'],
        project_manager: 'Sarah Johnson',
        project_manager_phone: '0423456789',
        contractor_name: 'XYZ Builders',
        client_name: 'Fremantle Housing Authority',
        status: 'active',
        start_date: '2024-03-01',
        estimated_end_date: '2025-02-28',
        timezone: 'Australia/Perth'
      },
      {
        worksite_id: 'WS003',
        name: 'Joondalup Shopping Center Extension',
        description: '朱恩达鲁普购物中心扩建工程',
        center_latitude: -31.7448,
        center_longitude: 115.7661,
        radius: 200,
        street_address: '789 Joondalup Drive',
        suburb: 'Joondalup',
        state: 'WA',
        postcode: '6027',
        country: 'Australia',
        standard_work_start: '06:30:00',
        standard_work_end: '16:30:00',
        break_start: '12:00:00',
        break_end: '13:00:00',
        early_checkin_buffer: 60,
        late_checkin_tolerance: 20,
        require_photo: true,
        require_gps: true,
        max_gps_accuracy: 30,
        require_white_card: true,
        require_safety_induction: true,
        ppe_requirements: ['hard_hat', 'safety_vest', 'steel_boots', 'safety_glasses', 'ear_protection'],
        project_manager: 'Mike Brown',
        project_manager_phone: '0434567890',
        contractor_name: 'MegaBuild Construction',
        client_name: 'Westfield Corporation',
        status: 'active',
        start_date: '2024-06-01',
        estimated_end_date: '2025-05-31',
        timezone: 'Australia/Perth'
      }
    ];
    
    console.log('📍 创建工地数据...');
    for (const worksiteData of worksites) {
      const existingWorksite = await Worksite.findOne({
        where: { worksite_id: worksiteData.worksite_id }
      });
      
      if (!existingWorksite) {
        await Worksite.create(worksiteData);
        console.log(`✅ 创建工地: ${worksiteData.name}`);
      } else {
        console.log(`⏭️  工地已存在: ${worksiteData.name}`);
      }
    }
    
    // 创建员工数据
    const employees = [
      {
        employee_id: 'EMP001',
        first_name: 'John',
        last_name: 'Smith',
        email: 'john.smith@abcconstruction.com.au',
        phone: '0412345678',
        date_of_birth: '1985-03-15',
        tfn: '123456789',
        visa_status: 'citizen',
        white_card_number: 'WC001234567',
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
        bsb: '062000',
        account_number: '12345678',
        account_name: 'John Smith'
      },
      {
        employee_id: 'EMP002',
        first_name: 'David',
        last_name: 'Wilson',
        email: 'david.wilson@abcconstruction.com.au',
        phone: '0423456789',
        date_of_birth: '1990-07-22',
        tfn: '234567890',
        visa_status: 'permanent_resident',
        white_card_number: 'WC002345678',
        white_card_expiry: '2025-08-15',
        safety_induction_completed: true,
        safety_induction_date: '2024-02-01',
        position: 'Carpenter',
        department: 'Construction',
        hourly_rate: 38.75,
        employment_type: 'full_time',
        start_date: '2024-02-01',
        status: 'active',
        can_checkin: true,
        emergency_contact_name: 'Mary Wilson',
        emergency_contact_phone: '0434567890',
        emergency_contact_relationship: 'Mother',
        bank_name: 'Westpac',
        bsb: '033000',
        account_number: '23456789',
        account_name: 'David Wilson'
      },
      {
        employee_id: 'EMP003',
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.johnson@abcconstruction.com.au',
        phone: '0434567890',
        date_of_birth: '1988-11-08',
        tfn: '345678901',
        visa_status: 'citizen',
        white_card_number: 'WC003456789',
        white_card_expiry: '2026-03-20',
        safety_induction_completed: true,
        safety_induction_date: '2024-01-20',
        position: 'Project Manager',
        department: 'Management',
        hourly_rate: 52.00,
        employment_type: 'full_time',
        start_date: '2024-01-20',
        status: 'active',
        can_checkin: true,
        emergency_contact_name: 'Robert Johnson',
        emergency_contact_phone: '0445678901',
        emergency_contact_relationship: 'Husband',
        bank_name: 'ANZ',
        bsb: '016000',
        account_number: '34567890',
        account_name: 'Sarah Johnson'
      },
      {
        employee_id: 'EMP004',
        first_name: 'Michael',
        last_name: 'Brown',
        email: 'michael.brown@abcconstruction.com.au',
        phone: '0445678901',
        date_of_birth: '1992-05-30',
        tfn: '456789012',
        visa_status: 'working_holiday',
        visa_expiry_date: '2025-05-30',
        white_card_number: 'WC004567890',
        white_card_expiry: '2025-07-10',
        safety_induction_completed: true,
        safety_induction_date: '2024-03-01',
        position: 'Electrician',
        department: 'Electrical',
        hourly_rate: 42.25,
        employment_type: 'casual',
        start_date: '2024-03-01',
        status: 'active',
        can_checkin: true,
        emergency_contact_name: 'Lisa Brown',
        emergency_contact_phone: '0456789012',
        emergency_contact_relationship: 'Sister',
        bank_name: 'NAB',
        bsb: '084000',
        account_number: '45678901',
        account_name: 'Michael Brown'
      },
      {
        employee_id: 'EMP005',
        first_name: 'Jessica',
        last_name: 'Davis',
        email: 'jessica.davis@abcconstruction.com.au',
        phone: '0456789012',
        date_of_birth: '1995-09-12',
        tfn: '567890123',
        visa_status: 'citizen',
        white_card_number: 'WC005678901',
        white_card_expiry: '2025-11-25',
        safety_induction_completed: true,
        safety_induction_date: '2024-04-15',
        position: 'Safety Officer',
        department: 'Safety',
        hourly_rate: 48.90,
        employment_type: 'full_time',
        start_date: '2024-04-15',
        status: 'active',
        can_checkin: true,
        emergency_contact_name: 'Tom Davis',
        emergency_contact_phone: '0467890123',
        emergency_contact_relationship: 'Father',
        bank_name: 'Bendigo Bank',
        bsb: '633000',
        account_number: '56789012',
        account_name: 'Jessica Davis'
      }
    ];
    
    console.log('👷 创建员工数据...');
    for (const employeeData of employees) {
      const existingEmployee = await Employee.findOne({
        where: { employee_id: employeeData.employee_id }
      });
      
      if (!existingEmployee) {
        await Employee.create(employeeData);
        console.log(`✅ 创建员工: ${employeeData.first_name} ${employeeData.last_name}`);
      } else {
        console.log(`⏭️  员工已存在: ${employeeData.first_name} ${employeeData.last_name}`);
      }
    }
    
    // 建立员工与工地的关联关系
    console.log('🔗 建立员工与工地关联关系...');
    const employeeWorksiteAssignments = [
      { employee_id: 'EMP001', worksite_ids: ['WS001', 'WS002'] },
      { employee_id: 'EMP002', worksite_ids: ['WS001'] },
      { employee_id: 'EMP003', worksite_ids: ['WS002', 'WS003'] },
      { employee_id: 'EMP004', worksite_ids: ['WS003'] },
      { employee_id: 'EMP005', worksite_ids: ['WS001', 'WS002', 'WS003'] }
    ];
    
    for (const assignment of employeeWorksiteAssignments) {
      const employee = await Employee.findOne({
        where: { employee_id: assignment.employee_id }
      });
      
      if (employee) {
        const worksites = await Worksite.findAll({
          where: { worksite_id: assignment.worksite_ids }
        });
        
        await employee.setWorksites(worksites);
        console.log(`✅ 关联员工 ${assignment.employee_id} 到工地 ${assignment.worksite_ids.join(', ')}`);
      }
    }
    
    // 创建一些示例签到记录
    console.log('📝 创建示例签到记录...');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const sampleCheckins = [
      {
        employee_id: 'EMP001',
        checkin_type: 'in',
        checkin_time: new Date(today.setHours(7, 0, 0, 0)),
        latitude: -31.9505,
        longitude: 115.8605,
        location_accuracy: 5,
        address: '123 St Georges Terrace, Perth WA 6000',
        worksite_id: 'WS001',
        is_within_worksite: true,
        distance_from_worksite: 10,
        photo_url: 'data:image/jpeg;base64,/9j/sample...',
        face_verification_passed: true,
        face_match_confidence: 0.95,
        device_type: 'Android',
        status: 'approved',
        ppe_compliance: true,
        safety_briefing_acknowledged: true
      },
      {
        employee_id: 'EMP002',
        checkin_type: 'in',
        checkin_time: new Date(today.setHours(7, 15, 0, 0)),
        latitude: -31.9500,
        longitude: 115.8600,
        location_accuracy: 8,
        address: '123 St Georges Terrace, Perth WA 6000',
        worksite_id: 'WS001',
        is_within_worksite: true,
        distance_from_worksite: 15,
        photo_url: 'data:image/jpeg;base64,/9j/sample...',
        face_verification_passed: true,
        face_match_confidence: 0.88,
        device_type: 'iOS',
        status: 'flagged',
        is_suspicious: true,
        suspicious_reasons: ['Late check-in'],
        ppe_compliance: true,
        safety_briefing_acknowledged: true
      }
    ];
    
    for (const checkinData of sampleCheckins) {
      const existingCheckin = await CheckIn.findOne({
        where: {
          employee_id: checkinData.employee_id,
          checkin_type: checkinData.checkin_type,
          checkin_time: checkinData.checkin_time
        }
      });
      
      if (!existingCheckin) {
        await CheckIn.create(checkinData);
        console.log(`✅ 创建签到记录: ${checkinData.employee_id} - ${checkinData.checkin_type}`);
      }
    }
    
    console.log('🎉 签到系统数据初始化完成!');
    
    // 显示统计信息
    const employeeCount = await Employee.count();
    const worksiteCount = await Worksite.count();
    const checkinCount = await CheckIn.count();
    
    console.log('📊 数据统计:');
    console.log(`   员工总数: ${employeeCount}`);
    console.log(`   工地总数: ${worksiteCount}`);
    console.log(`   签到记录: ${checkinCount}`);
    
  } catch (error) {
    console.error('❌ 签到系统数据初始化失败:', error);
    throw error;
  }
};

module.exports = seedCheckinSystem;

// 如果直接运行此文件
if (require.main === module) {
  seedCheckinSystem()
    .then(() => {
      console.log('✅ 签到系统种子数据脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 签到系统种子数据脚本执行失败:', error);
      process.exit(1);
    });
}