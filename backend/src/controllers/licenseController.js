// src/controllers/licenseController.js
const { EmployeeLicense, LicenseType, Employee } = require('../models');
const { resolveError } = require('../utils/errorCodes');
const { Op } = require('sequelize');

function sendError(res, code, overrideMessage, details) {
  const { status, message, payload } = resolveError(code, overrideMessage, details);
  return res.standard(payload, { message, status });
}

// 获取所有许可证记录
const getAllLicenses = async (req, res) => {
  try {
    const { page = 1, limit = 20, employee_id, license_type_id, expiring_soon, expired } = req.query;
    const pageNum = parseInt(page); const perPage = parseInt(limit); const offset = (pageNum - 1) * perPage;
    const whereClause = {};
    if (employee_id) whereClause.employee_id = employee_id;
    if (license_type_id) whereClause.license_type_id = license_type_id;
    if (expiring_soon === 'true') {
      const thirtyDaysFromNow = new Date(); thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      whereClause.expiry_date = { [Op.between]: [new Date(), thirtyDaysFromNow] };
    }
    if (expired === 'true') whereClause.expiry_date = { [Op.lt]: new Date() };

    const licenses = await EmployeeLicense.findAndCountAll({
      where: whereClause,
      include: [
        { model: Employee, attributes: ['employee_id', 'first_name', 'last_name', 'position'] },
        { model: LicenseType, attributes: ['code', 'name_en', 'name_zh', 'category'] }
      ],
      limit: perPage,
      offset,
      order: [['expiry_date', 'ASC']]
    });

    return res.standard({ licenses: licenses.rows, pagination: { current_page: pageNum, per_page: perPage, total: licenses.count, total_pages: Math.ceil(licenses.count / perPage) } }, { message: '获取许可证列表成功' });
  } catch (err) {
    console.error('Get licenses error:', err);
    return sendError(res, 'INTERNAL_ERROR', '获取许可证列表失败', err.message);
  }
};

// 根据ID获取许可证详情
const getLicenseById = async (req, res) => {
  try {
    const { id } = req.params;
    const license = await EmployeeLicense.findByPk(id, { include: [ { model: Employee, attributes: ['employee_id', 'first_name', 'last_name', 'position', 'department'] }, { model: LicenseType, attributes: ['code', 'name_en', 'name_zh', 'category', 'default_advance_days'] } ] });
    if (!license) return sendError(res, 'NOT_FOUND', '许可证记录未找到');
    return res.standard(license, { message: '获取许可证详情成功' });
  } catch (err) {
    console.error('Get license by id error:', err);
    return sendError(res, 'INTERNAL_ERROR', '获取许可证详情失败', err.message);
  }
};

// 创建新许可证记录
const createLicense = async (req, res) => {
  try {
    const licenseData = req.body;
    const requiredFields = ['employee_id', 'license_type_id', 'expiry_date'];
    for (const field of requiredFields) if (!licenseData[field]) return sendError(res, 'VALIDATION_ERROR', `缺少必填字段: ${field}`, { field });

    const employee = await Employee.findOne({ where: { employee_id: licenseData.employee_id } });
    if (!employee) return sendError(res, 'NOT_FOUND', '员工未找到');
    const licenseType = await LicenseType.findByPk(licenseData.license_type_id);
    if (!licenseType) return sendError(res, 'NOT_FOUND', '许可证类型未找到');

    const existingLicense = await EmployeeLicense.findOne({ where: { employee_id: licenseData.employee_id, license_type_id: licenseData.license_type_id } });
    if (existingLicense) return sendError(res, 'CONFLICT', '该员工已拥有此类型的许可证');

    const license = await EmployeeLicense.create(licenseData);
    const newLicense = await EmployeeLicense.findByPk(license.employee_license_id, { include: [ { model: Employee, attributes: ['employee_id', 'first_name', 'last_name'] }, { model: LicenseType, attributes: ['code', 'name_en', 'name_zh'] } ] });
    return res.standard(newLicense, { message: '许可证记录创建成功', status: 201 });
  } catch (err) {
    console.error('Create license error:', err);
    if (err.name === 'SequelizeValidationError') return sendError(res, 'VALIDATION_ERROR', '创建许可证记录失败', err.errors.map(e => ({ field: e.path, message: e.message })));
    return sendError(res, 'INTERNAL_ERROR', '创建许可证记录失败', err.message);
  }
};

// 更新许可证记录
const updateLicense = async (req, res) => {
  try {
    const { id } = req.params; const updateData = req.body;
    const license = await EmployeeLicense.findByPk(id);
    if (!license) return sendError(res, 'NOT_FOUND', '许可证记录未找到');
    await license.update(updateData);
    const updatedLicense = await EmployeeLicense.findByPk(id, { include: [ { model: Employee, attributes: ['employee_id', 'first_name', 'last_name'] }, { model: LicenseType, attributes: ['code', 'name_en', 'name_zh'] } ] });
    return res.standard(updatedLicense, { message: '许可证记录更新成功' });
  } catch (err) {
    console.error('Update license error:', err);
    if (err.name === 'SequelizeValidationError') return sendError(res, 'VALIDATION_ERROR', '更新许可证记录失败', err.errors.map(e => ({ field: e.path, message: e.message })));
    return sendError(res, 'INTERNAL_ERROR', '更新许可证记录失败', err.message);
  }
};

// 删除许可证记录
const deleteLicense = async (req, res) => {
  try {
    const { id } = req.params;
    const license = await EmployeeLicense.findByPk(id);
    if (!license) return sendError(res, 'NOT_FOUND', '许可证记录未找到');
    await license.destroy();
    return res.standard(null, { message: '许可证记录删除成功' });
  } catch (err) {
    console.error('Delete license error:', err);
    return sendError(res, 'INTERNAL_ERROR', '删除许可证记录失败', err.message);
  }
};

// 获取许可证统计信息
const getLicenseStats = async (req, res) => {
  try {
    const totalLicenses = await EmployeeLicense.count();
    const thirtyDaysFromNow = new Date(); thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringSoon = await EmployeeLicense.count({ where: { expiry_date: { [Op.between]: [new Date(), thirtyDaysFromNow] } } });
    const expired = await EmployeeLicense.count({ where: { expiry_date: { [Op.lt]: new Date() } } });
    const typeStats = await EmployeeLicense.findAll({ attributes: ['license_type_id', [EmployeeLicense.sequelize.fn('COUNT', EmployeeLicense.sequelize.col('employee_license_id')), 'count']], include: [ { model: LicenseType, attributes: ['code', 'name_en'] } ], group: ['license_type_id'], raw: true });
    const departmentStats = await EmployeeLicense.findAll({ attributes: [[EmployeeLicense.sequelize.fn('COUNT', EmployeeLicense.sequelize.col('EmployeeLicense.employee_license_id')), 'count']], include: [ { model: Employee, attributes: ['department'] } ], group: ['Employee.department'], raw: true });
    return res.standard({ total: totalLicenses, expiringSoon, expired, valid: totalLicenses - expired, byType: typeStats, byDepartment: departmentStats }, { message: '获取许可证统计成功' });
  } catch (err) {
    console.error('Get license stats error:', err);
    return sendError(res, 'INTERNAL_ERROR', '获取许可证统计失败', err.message);
  }
};

// 获取所有许可证类型
const getLicenseTypes = async (req, res) => {
  try {
    const licenseTypes = await LicenseType.findAll({ where: { active: true }, order: [['category', 'ASC'], ['name_en', 'ASC']] });
    return res.standard(licenseTypes, { message: '获取许可证类型成功' });
  } catch (err) {
    console.error('Get license types error:', err);
    return sendError(res, 'INTERNAL_ERROR', '获取许可证类型失败', err.message);
  }
};

// 上传许可证文件
const uploadLicenseFile = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return sendError(res, 'VALIDATION_ERROR', '没有上传文件');
    const license = await EmployeeLicense.findByPk(id);
    if (!license) return sendError(res, 'NOT_FOUND', '许可证记录未找到');
    await license.update({ file_path: req.file.path, scan_status: 'uploaded' });
    return res.standard({ file_path: req.file.path, filename: req.file.filename }, { message: '文件上传成功' });
  } catch (err) {
    console.error('Upload license file error:', err);
    return sendError(res, 'INTERNAL_ERROR', '文件上传失败', err.message);
  }
};

module.exports = { getAllLicenses, getLicenseById, createLicense, updateLicense, deleteLicense, getLicenseStats, getLicenseTypes, uploadLicenseFile };
