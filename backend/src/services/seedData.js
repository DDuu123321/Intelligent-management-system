// src/services/seedData.js
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    console.log('🌱 开始初始化数据...');
    
    // 先导入数据库连接
    const db = require('../models');
    console.log('✅ 数据库连接成功');
    
    // 等待数据库同步
    await db.sequelize.sync({ force: false });
    console.log('✅ 数据库同步完成');
    
    const { User, Vehicle, Camera } = db;
    
    // 检查是否已有用户
    const existingUser = await User.findOne({ where: { username: 'admin' } });
    if (existingUser) {
      console.log('✅ 用户已存在，跳过创建');
      return;
    }

    // 创建管理员账户
    const adminPassword = await bcrypt.hash('123456', 10);
    const admin = await User.create({
      employee_id: 'E0001',
      username: 'admin',
      password: adminPassword,
      name: '系统管理员',
      email: 'admin@company.com',
      department: 'IT部',
      role: 'admin',
      status: 'active'
    });

    console.log('✅ 管理员账户创建成功:', admin.username);

    // 创建测试员工
    const employeePassword = await bcrypt.hash('123456', 10);
    const employee = await User.create({
      employee_id: 'E0002',
      username: 'zhang.san',
      password: employeePassword,
      name: '张三',
      email: 'zhang.san@company.com',
      department: '技术部',
      role: 'employee',
      status: 'active'
    });

    console.log('✅ 测试员工创建成功:', employee.username);

    console.log('🎉 数据初始化完成！');
    console.log('🔑 登录账户: admin / 123456');
    console.log('🔑 登录账户: zhang.san / 123456');
    
  } catch (error) {
    console.error('❌ 数据初始化失败:', error);
    console.error('错误堆栈:', error.stack);
    throw error;
  }
};

// 如果直接运行此文件
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('✅ 种子数据脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 种子数据脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = seedData;