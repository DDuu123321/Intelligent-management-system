// src/services/licenseSeed.js
// 预置澳大利亚建筑相关常见证件类型
const seedLicenseTypes = async () => {
  const { LicenseType } = require('../models');

  const presets = [
    { code: 'WHITE_CARD', name_en: 'White Card', name_zh: '白卡(建筑安全卡)', category: 'safety', default_advance_days: 30 },
    { code: 'HIGH_RISK_WORK', name_en: 'High Risk Work Licence', name_zh: '高风险作业许可证', category: 'high_risk', default_advance_days: 30 },
    { code: 'WORKING_AT_HEIGHTS', name_en: 'Working at Heights', name_zh: '高处作业培训', category: 'safety', default_advance_days: 30 },
    { code: 'CONFINED_SPACE', name_en: 'Confined Space Entry', name_zh: '受限空间进入', category: 'high_risk', default_advance_days: 30 },
    { code: 'FIRST_AID', name_en: 'First Aid Certificate', name_zh: '急救证书', category: 'health', default_advance_days: 30 },
    { code: 'CPR', name_en: 'CPR Certificate', name_zh: '心肺复苏证书', category: 'health', default_advance_days: 30 },
    { code: 'TRAFFIC_CONTROL', name_en: 'Traffic Control', name_zh: '交通管制', category: 'safety', default_advance_days: 30 },
    { code: 'ASBESTOS_AWARE', name_en: 'Asbestos Awareness', name_zh: '石棉意识', category: 'safety', default_advance_days: 30 },
    { code: 'FORKLIFT', name_en: 'Forklift Licence', name_zh: '叉车证', category: 'equipment', default_advance_days: 30 },
    { code: 'EWP', name_en: 'Elevated Work Platform', name_zh: '高空作业平台', category: 'equipment', default_advance_days: 30 },
    { code: 'SCAFFOLD', name_en: 'Scaffolding Licence', name_zh: '脚手架许可证', category: 'high_risk', default_advance_days: 30 },
    { code: 'DOGGING_RIGGING', name_en: 'Dogging & Rigging', name_zh: '司索吊装', category: 'high_risk', default_advance_days: 30 },
    { code: 'MANUAL_HANDLING', name_en: 'Manual Handling', name_zh: '手动搬运', category: 'safety', default_advance_days: 30 },
    { code: 'FIRE_WARDEN', name_en: 'Fire/Emergency Warden', name_zh: '消防/应急管理员', category: 'safety', default_advance_days: 30 },
    { code: 'ASBESTOS_REMOVAL', name_en: 'Asbestos Removal', name_zh: '石棉清除', category: 'high_risk', default_advance_days: 30 },
    { code: 'GAS_TEST', name_en: 'Gas Test Atmospheres', name_zh: '气体测试', category: 'safety', default_advance_days: 30 },
    { code: 'LVR', name_en: 'Low Voltage Rescue', name_zh: '低压救援', category: 'safety', default_advance_days: 30 },
    { code: 'CRANE_OPERATOR', name_en: 'Crane Operator', name_zh: '起重机操作', category: 'equipment', default_advance_days: 30 },
    { code: 'EXCAVATOR', name_en: 'Excavator Ticket', name_zh: '挖掘机操作', category: 'equipment', default_advance_days: 30 },
    { code: 'ENV_AWARE', name_en: 'Environmental Awareness', name_zh: '环境意识', category: 'environment', default_advance_days: 30 },
    { code: 'RESPIRATOR_FIT', name_en: 'Respirator Fit Test', name_zh: '呼吸器适配测试', category: 'health', default_advance_days: 30 }
  ];

  for (const p of presets) {
    const exist = await LicenseType.findOne({ where: { code: p.code } });
    if (!exist) {
      await LicenseType.create({ ...p, is_system: true });
    }
  }
  console.log('✅ 证件类型预置完成');
};

module.exports = seedLicenseTypes;
