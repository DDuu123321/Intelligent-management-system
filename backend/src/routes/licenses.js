// src/routes/licenses.js
const express = require('express');
const { Op } = require('sequelize');
const { LicenseType, EmployeeLicense, Employee, LicenseReminderLog } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { uploadLimiter, batchImportLimiter } = require('../middleware/rateLimits');
const { sanitizeFileName, isAllowedFileType, generateUniqueFileName } = require('../utils/fileSecurityUtils');
const { cleanupOldFile } = require('../utils/fileCleanup');
const { emitLicenseEvent, emitOcrConfirmedEvent } = require('../utils/websocket');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// 新增角色校验中间件
function requireRole(roles){
  return (req,res,next)=>{
    if(!req.user || !roles.includes(req.user.role)) return res.standard({ error: { code: 'FORBIDDEN' } }, { message: 'forbidden', status: 403 });
    next();
  };
}

// 上传存储配置 - 安全加固版本
const uploadDir = path.join(__dirname, '../../uploads/licenses');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// 上传限制配置
const MAX_SIZE = parseInt(process.env.LICENSE_MAX_FILE_MB||'5')*1024*1024;

const storage = multer.diskStorage({
  destination: function(req, file, cb) { 
    cb(null, uploadDir); 
  },
  filename: function(req, file, cb) { 
    // 使用安全的文件名生成
    const safeFileName = generateUniqueFileName(file.originalname);
    cb(null, safeFileName);
  }
});

const upload = multer({ 
  storage, 
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    // 使用安全的文件类型检查
    if (!isAllowedFileType(file.mimetype, file.originalname)) {
      return cb(new Error('不支持的文件类型'));
    }
    cb(null, true);
  }
});

// 封装构造文件完整 URL
function buildFileUrl(req, relative){ if(!relative) return null; return `${req.protocol}://${req.get('host')}/${relative.replace(/^(\\|\/)/, '')}`; }

// 修改返回增加 file_url + ocr 状态
function enrichLicense(req, rec){
  if(!rec) return rec;
  const json = rec.toJSON();
  json.file_url = json.file_path ? buildFileUrl(req, json.file_path) : null;
  json.ocr_status = json.ocr_raw_text ? (json.parse_confidence!=null ? (json.parse_confidence < 0.5 ? 'low_confidence' : 'parsed') : 'parsed') : 'none';
  json.scan_status = json.scan_status || 'pending';
  return json;
}

// 创建或列出 LicenseType
router.get('/types', authenticateToken, async (req, res) => {
  try {
    const types = await LicenseType.findAll({ where: { active: true }, order: [['category','ASC'], ['code','ASC']] });
    return res.standard(types, { message: 'License types retrieved' });
  } catch (e) { return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: 'Failed to fetch license types', status: 500 }); }
});

router.post('/types', authenticateToken, async (req, res) => {
  try {
    const { code, name_en, name_zh, category, default_advance_days } = req.body;
    if (!code || !name_en) return res.standard({ error: { code: 'VALIDATION_ERROR', field: !code ? 'code' : 'name_en' } }, { message: 'code & name_en required', status: 400 });
    const exist = await LicenseType.findOne({ where: { code } });
    if (exist) return res.standard({ error: { code: 'CONFLICT' } }, { message: 'code exists', status: 400 });
    const t = await LicenseType.create({ code, name_en, name_zh, category, default_advance_days });
    res.standard(t, { message: 'created' });
  } catch (e) { return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: 'Failed to create license type', status: 500 }); }
});

// EmployeeLicense CRUD
router.get('/employee/:employee_id', authenticateToken, async (req,res)=> {
  try {
    const list = await EmployeeLicense.findAll({ where: { employee_id: req.params.employee_id }, include: [LicenseType] });
    res.standard(list.map(r=>enrichLicense(req,r)), { message: 'Employee licenses retrieved' });
  } catch (e) { return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: 'Failed to fetch employee licenses', status: 500 }); }
});

router.post('/employee/:employee_id', authenticateToken, requireRole(['admin','manager']), async (req,res)=> {
  try {
    console.log('Creating license for employee:', req.params.employee_id);
    console.log('Request body:', req.body);
    
    const { license_type_id, number, issue_date, expiry_date, custom_advance_days } = req.body;
    if (!license_type_id || !expiry_date) return res.standard({ error: { code: 'VALIDATION_ERROR' } }, { message: 'license_type_id & expiry_date required', status: 400 });
    
    const rec = await EmployeeLicense.create({ 
      employee_id: req.params.employee_id, 
      license_type_id, 
      number, 
      issue_date, 
      expiry_date, 
      custom_advance_days 
    });
    
    // 获取完整的证件信息用于WebSocket事件
    const enrichedLicense = await EmployeeLicense.findByPk(rec.id, {
      include: [
        { model: Employee, attributes: ['employee_id', 'first_name', 'last_name'] },
        { model: LicenseType, attributes: ['name', 'description'] }
      ]
    });
    
    console.log('Enriched license:', enrichedLicense ? enrichedLicense.dataValues : 'null');
    
    // 发送WebSocket事件
    if (enrichedLicense) {
      emitLicenseEvent('created', enrichedLicense);
    } else {
      console.log('Using fallback license data for websocket');
      // 如果查询失败，使用基本信息
      emitLicenseEvent('created', {
        ...rec.dataValues,
        employee_id: req.params.employee_id
      });
    }
    
    res.standard(enrichLicense(req,rec), { message: 'created' });
  } catch (e) { 
    console.error('创建证件失败:', e);
    return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: 'Failed to create employee license', status: 500 }); 
  }
});

router.put('/employee-license/:id', authenticateToken, requireRole(['admin','manager']), async (req,res)=> {
  try {
    const rec = await EmployeeLicense.findByPk(req.params.id);
    if (!rec) return res.standard({ error: { code: 'NOT_FOUND' } }, { message: 'not found', status: 404 });
    
    await rec.update(req.body);
    
    // 获取完整的证件信息用于WebSocket事件
    const enrichedLicense = await EmployeeLicense.findByPk(rec.id, {
      include: [
        { model: Employee, attributes: ['employee_id', 'first_name', 'last_name'] },
        { model: LicenseType, attributes: ['name', 'description'] }
      ]
    });
    
    // 发送WebSocket事件
    if (enrichedLicense) {
      emitLicenseEvent('updated', enrichedLicense);
    } else {
      console.log('警告：无法获取完整的证件信息用于WebSocket事件');
      // 使用基本信息作为后备
      emitLicenseEvent('updated', {
        ...rec.dataValues,
        employee_id: rec.employee_id
      });
    }
    
    res.standard(enrichLicense(req,rec), { message: 'updated' });
  } catch (e) { 
    console.error('更新证件失败:', e);
    return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: 'Failed to update employee license', status: 500 }); 
  }
});

router.delete('/employee-license/:id', authenticateToken, requireRole(['admin','manager']), async (req,res)=> {
  try {
    const rec = await EmployeeLicense.findByPk(req.params.id, {
      include: [
        { model: Employee, attributes: ['employee_id', 'first_name', 'last_name'] },
        { model: LicenseType, attributes: ['name', 'description'] }
      ]
    });
    if (!rec) return res.standard({ error: { code: 'NOT_FOUND' } }, { message: 'not found', status: 404 });
    
    // 记录文件路径用于清理
    const oldFilePath = rec.file_path;
    
    // 发送WebSocket事件（在删除前发送，包含完整信息）
    emitLicenseEvent('deleted', rec);
    
    // 删除数据库记录
    await rec.destroy();
    
    // 清理关联文件
    if (oldFilePath) {
      await cleanupOldFile(oldFilePath);
    }
    
    res.standard(null, { message: 'deleted' });
  } catch (e) { 
    console.error('删除证件失败:', e);
    return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: 'Failed to delete employee license', status: 500 }); 
  }
});

// 上传+创建 (含 OCR 占位) multipart/form-data
router.post('/employee/:employee_id/upload', authenticateToken, uploadLimiter, requireRole(['admin','manager']), (req,res,next)=>{
  upload.single('file')(req,res,(err)=>{ 
    if(err) {
      console.error('Upload error:', err.message);
      return res.standard({ error: { code: 'UPLOAD_ERROR', details: err.message==='File too large'?'文件过大':err.message } }, { message: '上传失败', status: 400 }); 
    }
    next(); 
  });
}, async (req,res)=>{
  try {
    const { license_type_id, number, issue_date, expiry_date, custom_advance_days } = req.body;
    if (!license_type_id) return res.standard({ error: { code: 'VALIDATION_ERROR' } }, { message: 'license_type_id required', status: 400 });
    if (!expiry_date) return res.standard({ error: { code: 'VALIDATION_ERROR' } }, { message: 'expiry_date required', status: 400 });
    const file_path = req.file ? path.relative(path.join(__dirname,'../../'), req.file.path).replace(/\\/g,'/') : null;
    // 模拟 OCR 结果（未来接入真实 OCR 服务）
    const ocr_raw_text = req.file ? `SIMULATED OCR TEXT from ${req.file.originalname}` : null;
    let parsed_expiry_date = null; let parse_confidence = null;
    if (expiry_date) { parsed_expiry_date = expiry_date; parse_confidence = 0.3; }
    const rec = await EmployeeLicense.create({ employee_id: req.params.employee_id, license_type_id, number, issue_date, expiry_date, custom_advance_days, file_path, ocr_raw_text, parsed_expiry_date, parse_confidence, scan_status:'pending' });
    res.standard(enrichLicense(req,rec), { message: 'created' });
  } catch(e){ console.error(e); return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: 'Failed to upload & create employee license', status: 500 }); }
});

// 更新（可带文件）
router.put('/employee-license/:id/upload', authenticateToken, uploadLimiter, requireRole(['admin','manager']), (req,res,next)=>{
  upload.single('file')(req,res,(err)=>{ 
    if(err) {
      console.error('Upload error:', err.message);
      return res.standard({ error: { code: 'UPLOAD_ERROR', details: err.message==='File too large'?'文件过大':err.message } }, { message: '上传失败', status: 400 }); 
    }
    next(); 
  });
}, async (req,res)=>{
  try {
    const rec = await EmployeeLicense.findByPk(req.params.id);
    if(!rec) return res.standard({ error: { code: 'NOT_FOUND' } }, { message: 'not found', status: 404 });
    
    // 记录旧文件路径
    const oldFilePath = rec.file_path;
    
    const { license_type_id, number, issue_date, expiry_date, custom_advance_days } = req.body;
    let payload = { license_type_id, number, issue_date, expiry_date, custom_advance_days };
    
    if (req.file){
      const file_path = path.relative(path.join(__dirname,'../../'), req.file.path).replace(/\\/g,'/');
      payload.file_path = file_path;
      payload.ocr_raw_text = `SIMULATED OCR TEXT updated ${req.file.originalname}`;
      if (expiry_date){ payload.parsed_expiry_date = expiry_date; payload.parse_confidence = 0.35; }
      payload.scan_status = 'pending';
      
      // 清理旧文件
      if (oldFilePath && oldFilePath !== file_path) {
        await cleanupOldFile(oldFilePath);
      }
    }
    
    await rec.update(payload);
    res.standard(enrichLicense(req,rec), { message: 'updated' });
  } catch(e){ console.error(e); return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: 'Failed to update employee license with file', status: 500 }); }
});

// 批量导入占位（CSV + 可选 ZIP）
router.post('/import', authenticateToken, requireRole(['admin','manager']), upload.fields([{ name:'csv', maxCount:1 }, { name:'files', maxCount:1 }]), async (req,res)=>{
  try{
    const results = await importLicensesFromCSV(req.files);
    return res.standard(results, { message: 'import completed' });
  }catch(e){ console.error('Batch import failed:', e); return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: 'import failed', status: 500 }); }
});

// 即将到期 / 已过期查询 & CSV 导出
function calcStatus(row){
  const today = new Date();
  const exp = new Date(row.expiry_date);
  const diff = Math.floor((exp - today)/(24*3600*1000));
  const advance = row.custom_advance_days || row.LicenseType?.default_advance_days || 30;
  let status = 'normal';
  if (diff < 0) status = 'expired'; else if (diff <= advance) status = 'expiring';
  return { days_remaining: diff, status };
}

router.get('/expiring', authenticateToken, async (req,res)=> {
  try {
    const { 
      within = 30, 
      includeExpired = 'true',
      page = 1,
      limit = 20,
      sortBy = 'expiry_date',
      sortOrder = 'ASC',
      search = '',
      employeeId = '',
      licenseTypeId = '',
      status = '' // 'expired', 'expiring', 'normal'
    } = req.query;
    
    const today = new Date();
    const end = new Date(); 
    end.setDate(end.getDate() + parseInt(within));
      // 基础时间过滤 - 优化状态过滤性能
    const where = {};
    if (status === 'expired') {
      // 只查询已过期的证件
      where.expiry_date = { [Op.lt]: today };
    } else if (status === 'expiring') {
      // 查询即将到期但未过期的证件（需要结合custom_advance_days或default_advance_days）
      // 这里先做基础查询，状态计算仍在应用层，但这样可以减少数据量
      where.expiry_date = { 
        [Op.and]: [
          { [Op.gte]: today },
          { [Op.lte]: end }
        ]
      };
    } else if (status === 'normal') {
      // 查询正常的证件（未到期且不在警告期内）
      where.expiry_date = { [Op.gt]: end };
    } else {
      // 没有状态过滤，使用原来的逻辑
      where.expiry_date = { [Op.lte]: end };
      if (includeExpired !== 'true') {
        where.expiry_date[Op.gte] = today;
      }
    }
    
    // 员工ID过滤
    if (employeeId) {
      where.employee_id = employeeId;
    }
    
    // 证件类型过滤
    if (licenseTypeId) {
      where.license_type_id = parseInt(licenseTypeId);
    }
      // 搜索过滤 - 增强搜索功能，支持证件编号
    const includeWhere = {};
    const licenseWhere = {};
    if (search) {
      // 搜索员工信息
      includeWhere[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { employee_id: { [Op.like]: `%${search}%` } }
      ];
      
      // 也搜索证件编号
      licenseWhere[Op.or] = [
        { number: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // 分页参数
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // 排序参数处理
    let orderClause = [['expiry_date', 'ASC']];
    if (sortBy === 'employee_name') {
      orderClause = [[{ model: Employee }, 'first_name', sortOrder]];
    } else if (sortBy === 'license_type') {
      orderClause = [[{ model: LicenseType }, 'name_en', sortOrder]];
    } else if (['expiry_date', 'number', 'createdAt'].includes(sortBy)) {
      orderClause = [[sortBy, sortOrder]];
    }
      // 合并证件搜索条件到主查询中
    if (search && licenseWhere[Op.or]) {
      if (where[Op.or]) {
        where[Op.or] = where[Op.or].concat(licenseWhere[Op.or]);
      } else {
        where[Op.or] = licenseWhere[Op.or];
      }
    }
    
    const { count, rows } = await EmployeeLicense.findAndCountAll({ 
      where, 
      include: [
        { 
          model: LicenseType,
          attributes: ['id', 'code', 'name_en', 'name_zh', 'category']
        }, 
        { 
          model: Employee, 
          attributes: ['employee_id','first_name','last_name','email'],
          where: Object.keys(includeWhere).length > 0 ? includeWhere : undefined
        }
      ],
      order: orderClause,
      limit: parseInt(limit),
      offset: offset,
      distinct: true
    });
      let mapped = rows.map(r => { 
      const s = calcStatus(r); 
      return { 
        id: r.employee_license_id, 
        employee_id: r.employee_id, 
        name: r.Employee ? `${r.Employee.first_name} ${r.Employee.last_name}` : '', 
        license: r.LicenseType, 
        number: r.number, 
        expiry_date: r.expiry_date, 
        days_remaining: s.days_remaining, 
        status: s.status, 
        file_url: r.file_path ? buildFileUrl(req, r.file_path) : null,
        ocr_status: r.ocr_status || 'none'
      }; 
    });
    
    // 仅对 'expiring' 状态进行精确过滤（因为advance_days是动态的）
    if (status === 'expiring') {
      mapped = mapped.filter(item => item.status === 'expiring');
    }    // 更新总数以反映过滤后的结果
    const actualTotal = status === 'expiring' ? mapped.length + offset : count;
    
    res.standard({
      licenses: mapped,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: actualTotal,
        total_pages: Math.ceil(actualTotal / parseInt(limit)),
        has_next_page: offset + mapped.length < actualTotal,
        has_prev_page: parseInt(page) > 1
      },
      filters: {
        within: parseInt(within),
        includeExpired: includeExpired === 'true',
        search,
        employeeId,
        licenseTypeId: licenseTypeId ? parseInt(licenseTypeId) : null,
        status,
        sortBy,
        sortOrder
      }
    }, { message: '获取成功' });
  } catch (e) { 
    console.error('获取即将到期证件失败:', e); 
    return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: '获取即将到期证件失败', status: 500 }); 
  }
});

router.get('/expiring/export', authenticateToken, async (req,res)=> {
  try {
    const { lang='en', within=60 } = req.query;
    const end = new Date(); end.setDate(end.getDate()+ parseInt(within));
    const list = await EmployeeLicense.findAll({ 
      where: { expiry_date: { [Op.lte]: end } }, 
      include: [LicenseType, { model: Employee }] 
    });
    
    // 使用安全的CSV转义工具
    const { generateCsvContent, setCsvResponseHeaders } = require('../utils/csvSecurityUtils');
    
    // 定义表头
    const headers = [
      'employee_id', 'name', 'license_code', 'license_name', 
      'number', 'expiry_date', 'days_remaining', 'status', 'file_url'
    ];
    
    // 构建数据行
    const rows = [];
    for (const r of list) {
      const { days_remaining, status } = calcStatus(r);
      const license_name = lang === 'zh' 
        ? (r.LicenseType.name_zh || r.LicenseType.name_en) 
        : r.LicenseType.name_en;
      const name = r.Employee 
        ? `${r.Employee.first_name} ${r.Employee.last_name}` 
        : '';
      const file_url = r.file_path 
        ? buildFileUrl(req, r.file_path) 
        : '';
      
      rows.push([
        r.employee_id,
        name,
        r.LicenseType.code,
        license_name,
        r.number || '',
        r.expiry_date,
        days_remaining,
        status,
        file_url
      ]);
    }
    
    // 生成安全的CSV内容
    const csvContent = generateCsvContent(headers, rows);
    
    // 设置响应头
    setCsvResponseHeaders(res, 'licenses_expiring.csv');
    
    res.send(csvContent);
  } catch (e) { 
    console.error('CSV导出失败:', e); 
    return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: 'Failed to export CSV', status: 500 }); 
  }
});

// 批量导入处理函数
async function importLicensesFromCSV(files) {
  const csvParse = require('csv-parse');
  const AdmZip = require('adm-zip');
  const { sequelize } = require('../models');
  const { emitLicenseEvent } = require('../utils/websocket');
  
  const report = {
    total: 0,
    success: 0,
    failed: 0,
    errors: []
  };
  
  if (!files || !files.csv || !files.csv[0]) {
    throw new Error('No CSV file provided');
  }
  
  const csvFile = files.csv[0];
  let zipFiles = null;
  
  // 处理 ZIP 文件（如果提供）
  if (files.files && files.files[0]) {
    const zipFile = files.files[0];
    const zip = new AdmZip(zipFile.buffer || fs.readFileSync(zipFile.path));
    zipFiles = {};
    zip.getEntries().forEach(entry => {
      if (!entry.isDirectory) {
        zipFiles[entry.entryName] = entry.getData();
      }
    });
  }
  
  // 预加载缓存
  const licenseTypeCache = new Map();
  const employeeCache = new Map();
  
  const licenseTypes = await LicenseType.findAll();
  licenseTypes.forEach(lt => {
    licenseTypeCache.set(lt.code.toUpperCase(), lt);
    licenseTypeCache.set(lt.name_en.toUpperCase(), lt);
    if (lt.name_zh) licenseTypeCache.set(lt.name_zh.toUpperCase(), lt);
  });
  
  const employees = await Employee.findAll();
  employees.forEach(emp => {
    employeeCache.set(emp.employee_id.toUpperCase(), emp);
  });
  
  return new Promise((resolve, reject) => {
    const records = [];
    
    fs.createReadStream(csvFile.path)
      .pipe(csvParse.parse({ columns: true, skip_empty_lines: true }))
      .on('data', (row) => {
        records.push(row);
      })
      .on('error', reject)
      .on('end', async () => {
        const transaction = await sequelize.transaction();
        
        try {
          for (const row of records) {
            report.total++;
            
            try {
              // 验证必填字段
              const required = ['employee_id', 'license_type', 'number', 'expiry_date'];
              const missing = required.filter(field => !row[field] || row[field].trim() === '');
              
              if (missing.length > 0) {
                report.failed++;
                report.errors.push({
                  row: report.total,
                  employee_id: row.employee_id || 'N/A',
                  error: `Missing required fields: ${missing.join(', ')}`
                });
                continue;
              }
              
              // 查找员工
              const employee = employeeCache.get(row.employee_id.trim().toUpperCase());
              if (!employee) {
                report.failed++;
                report.errors.push({
                  row: report.total,
                  employee_id: row.employee_id,
                  error: 'Employee not found'
                });
                continue;
              }
              
              // 查找证件类型
              let licenseType = licenseTypeCache.get(row.license_type.trim().toUpperCase());
              if (!licenseType) {
                report.failed++;
                report.errors.push({
                  row: report.total,
                  employee_id: row.employee_id,
                  error: `License type not found: ${row.license_type}`
                });
                continue;
              }
              
              // 检查重复
              const existing = await EmployeeLicense.findOne({
                where: {
                  employee_id: employee.employee_id,
                  license_type_id: licenseType.id,
                  number: row.number.trim()
                }
              });
              
              if (existing) {
                report.failed++;
                report.errors.push({
                  row: report.total,
                  employee_id: row.employee_id,
                  error: `Duplicate license: ${row.license_type} ${row.number}`
                });
                continue;
              }
              
              // 准备数据
              const licenseData = {
                employee_id: employee.employee_id,
                license_type_id: licenseType.id,
                number: row.number.trim(),
                issue_date: row.issue_date ? new Date(row.issue_date) : null,
                expiry_date: new Date(row.expiry_date),
                issuing_authority: row.issuing_authority || null,
                notes: row.notes || null,
                ocr_status: 'none'
              };
              
              // 处理文件（如果有ZIP和匹配的文件名）
              if (zipFiles && row.file_name) {
                const fileName = row.file_name.trim();
                if (zipFiles[fileName]) {
                  const fileExt = path.extname(fileName);
                  const savedFileName = `${Date.now()}_${Math.random().toString(16).slice(2)}${fileExt}`;
                  const filePath = path.join(uploadDir, savedFileName);
                  
                  fs.writeFileSync(filePath, zipFiles[fileName]);
                  licenseData.file_path = `licenses/${savedFileName}`;
                }
              }
              
              // 创建记录
              await EmployeeLicense.create(licenseData, { transaction });
              report.success++;
              
            } catch (error) {
              report.failed++;
              report.errors.push({
                row: report.total,
                employee_id: row.employee_id || 'N/A',
                error: error.message
              });
            }
          }
          
          await transaction.commit();
          
          // 发送 WebSocket 事件
          emitLicenseEvent('license:changed', {
            type: 'batch_import',
            action: 'completed',
            report
          });
          
          resolve({ report });
          
        } catch (error) {
          await transaction.rollback();
          reject(error);
        }
      });
  });
}

// OCR 人工确认相关路由

// 获取待确认的 OCR 记录
router.get('/ocr/pending', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const { count, rows } = await EmployeeLicense.findAndCountAll({
      where: {
        ocr_status: ['parsed', 'low_confidence']
      },
      include: [
        {
          model: Employee,
          attributes: ['employee_id', 'first_name', 'last_name']
        },
        {
          model: LicenseType,
          attributes: ['name_en', 'name_zh']
        }
      ],
      order: [['parse_confidence', 'ASC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.standard({
      licenses: rows,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: count,
        total_pages: Math.ceil(count / limit)
      }
    }, { message: '获取成功' });
    
  } catch (error) {
    console.error('获取待确认OCR记录失败:', error);
    return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: '获取待确认OCR记录失败', status: 500 });
  }
});

// 确认 OCR 解析结果
router.post('/:id/ocr/confirm', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, expiry_date, notes } = req.body; // action: 'confirm' | 'reject' | 'modify'
    
    const license = await EmployeeLicense.findByPk(id, {
      include: [
        { model: Employee, attributes: ['employee_id', 'first_name', 'last_name'] },
        { model: LicenseType, attributes: ['name', 'description'] }
      ]
    });
    if (!license) {
      return res.standard({ error: { code: 'NOT_FOUND' } }, { message: '证件不存在', status: 404 });
    }
    
    const updates = { ocr_status: 'confirmed' };
    
    if (action === 'confirm') {
      // 确认使用 OCR 解析的日期
      if (license.parsed_expiry_date) {
        updates.expiry_date = license.parsed_expiry_date;
      }
      updates.ocr_status = 'confirmed';
    } else if (action === 'reject') {
      // 拒绝 OCR 结果
      updates.ocr_status = 'rejected';
    } else if (action === 'modify' && expiry_date) {
      // 手动修改日期
      updates.expiry_date = expiry_date;
      updates.ocr_status = 'confirmed';
    }
    
    await license.update(updates);
    
    // 重新获取更新后的数据
    const updatedLicense = await EmployeeLicense.findByPk(id, {
      include: [
        { model: Employee, attributes: ['employee_id', 'first_name', 'last_name'] },
        { model: LicenseType, attributes: ['name', 'description'] }
      ]
    });
    
    // 发送 WebSocket 事件
    emitOcrConfirmedEvent(updatedLicense);
    emitLicenseEvent('updated', updatedLicense);
    
    return res.standard(null, { message: `OCR确认操作完成: ${action}` });
    
  } catch (error) {
    console.error('OCR确认失败:', error);
    return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: 'OCR确认失败', status: 500 });
  }
});

// 批量确认 OCR 结果
router.post('/ocr/batch-confirm', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { licenses } = req.body; // [{ id, action, expiry_date?, notes? }]
    
    if (!licenses || !Array.isArray(licenses)) {
      return res.status(400).json(error('请提供有效的证件列表'));
    }
    
    const results = [];
    
    for (const item of licenses) {
      try {
        const license = await EmployeeLicense.findByPk(item.id, { transaction });
        if (!license) {
          results.push({ id: item.id, success: false, error: '证件不存在' });
          continue;
        }
        
        const updates = {};
        
        if (item.action === 'confirm') {
          if (license.parsed_expiry_date) {
            updates.expiry_date = license.parsed_expiry_date;
          }
          updates.ocr_status = 'confirmed';
        } else if (item.action === 'reject') {
          updates.ocr_status = 'rejected';
        } else if (item.action === 'modify' && item.expiry_date) {
          updates.expiry_date = item.expiry_date;
          updates.ocr_status = 'confirmed';
        }
        
        await license.update(updates, { transaction });
        results.push({ id: item.id, success: true, action: item.action });
        
      } catch (itemError) {
        results.push({ id: item.id, success: false, error: itemError.message });
      }
    }
    
    await transaction.commit();
    
    // 发送 WebSocket 通知
    emitLicenseEvent('license:batch_ocr_confirmed', {
      type: 'batch_ocr_confirmation',
      count: results.filter(r => r.success).length,
      total: results.length
    });
    
    res.json(success('批量OCR确认完成', { results }));
    
  } catch (error) {
    await transaction.rollback();
    console.error('批量OCR确认失败:', error);
    return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: '批量OCR确认失败', status: 500 });
  }
});

// 批量导入证件 (CSV + ZIP)
router.post('/batch-import', authenticateToken, batchImportLimiter, requireRole(['admin','manager']), 
  multer({ 
    dest: uploadDir,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB for batch files
  }).fields([
    { name: 'csv', maxCount: 1 },
    { name: 'files', maxCount: 1 }
  ]), 
  async (req, res) => {
  try {
    console.log('批量导入开始...');
    console.log('文件:', req.files);
    
    const files = req.files;
    const result = await importLicensesFromCSV(files);
    
    console.log('批量导入完成:', result.report);
    return res.standard(result.report, { message: '批量导入完成' });
    
  } catch (error) {
    console.error('批量导入失败:', error);
    return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: `批量导入失败: ${error.message}`, status: 500 });
  }
});

module.exports = router;
