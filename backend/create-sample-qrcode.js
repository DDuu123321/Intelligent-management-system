// 创建QR码样本数据
const { QRCode, Worksite } = require('./src/models');

(async () => {
  try {
    // 首先创建一个工地
    const worksite = await Worksite.findOrCreate({
      where: { worksite_id: 'SITE001' },
      defaults: {
        worksite_id: 'SITE001',
        name: '测试工地A',
        description: '用于测试的工地',
        center_latitude: -31.9505,
        center_longitude: 115.8605,
        radius: 100,
        street_address: '123 Test Street',
        suburb: 'Perth',
        state: 'WA',
        postcode: '6000',
        country: 'Australia',
        status: 'active',
        require_photo: true,
        require_gps: true
      }
    });

    console.log('工地创建/找到:', worksite[0].name);

    // 创建QR码
    const qrCodeData = {
      worksite_id: 'SITE001',
      worksite_name: '测试工地A',
      qr_token: '7d7c0dff9b20d506503c920c84b2d5ce0874b42ebfa9dd900f5aadcfb0c7313c',
      qr_url: 'http://localhost:5173/checkin/7d7c0dff9b20d506503c920c84b2d5ce0874b42ebfa9dd900f5aadcfb0c7313c',
      qr_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      center_latitude: -31.9505,
      center_longitude: 115.8605,
      radius: 100,
      require_photo: true,
      require_gps: true,
      face_verification_enabled: false,
      allow_checkin_anytime: true,
      is_active: true,
      created_by: 'admin'
    };

    const existingQRCode = await QRCode.findOne({ 
      where: { qr_token: qrCodeData.qr_token } 
    });

    if (existingQRCode) {
      console.log('QR码已存在:', existingQRCode.worksite_name);
    } else {
      const newQRCode = await QRCode.create(qrCodeData);
      console.log('QR码创建成功:', {
        id: newQRCode.id,
        worksite_name: newQRCode.worksite_name,
        qr_token: newQRCode.qr_token.substring(0, 20) + '...',
        is_active: newQRCode.is_active
      });
    }

    // 验证创建的数据
    const allQRCodes = await QRCode.findAll();
    console.log(`\n总共 ${allQRCodes.length} 个QR码:`);
    allQRCodes.forEach((qr, index) => {
      console.log(`${index + 1}. ${qr.worksite_name} - ${qr.is_active ? '激活' : '禁用'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('创建失败:', error);
    process.exit(1);
  }
})();
