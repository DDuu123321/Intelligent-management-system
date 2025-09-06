// src/utils/idGenerator.js
// 统一ID生成：支持 EMP / WS / LIC / VEH / QR 前缀
// 利用 sequences 表保证并发安全（数据库事务递增）

const { sequelize, Sequence } = require('../models');

async function nextSequence(key) {
  return sequelize.transaction(async (t) => {
    const [rec] = await Sequence.findOrCreate({ where: { key }, defaults: { value: 0 }, transaction: t });
    rec.value += 1;
    await rec.save({ transaction: t });
    return rec.value;
  });
}

function format(prefix, num, width = 3) {
  return `${prefix}${String(num).padStart(width, '0')}`;
}

async function generateEmployeeId() {
  const n = await nextSequence('EMP');
  return format('EMP', n, 3);
}

async function generateWorksiteId() {
  const n = await nextSequence('WS');
  return format('WS', n, 3);
}

async function generateLicenseId() {
  const n = await nextSequence('LIC');
  return format('LIC', n, 4);
}

async function generateVehicleId() {
  const n = await nextSequence('VEH');
  return format('VEH', n, 3);
}

async function generateQRCodeId() {
  const n = await nextSequence('QR');
  return format('QR', n, 5);
}

module.exports = {
  generateEmployeeId,
  generateWorksiteId,
  generateLicenseId,
  generateVehicleId,
  generateQRCodeId
};
