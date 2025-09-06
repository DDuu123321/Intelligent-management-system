// src/controllers/vehicleController.js
const { Vehicle, User } = require('../models');
const { resolveError } = require('../utils/errorCodes');
const { Op, sequelize } = require('sequelize');

function sendError(res, code, overrideMessage, details){
  const { status, message, payload } = resolveError(code, overrideMessage, details);
  return res.standard(payload, { message, status });
}

const getVehicleStats = async (req,res)=>{
  try {
    const stats = await Vehicle.findAll({
      attributes: ['status', [Vehicle.sequelize.fn('COUNT', Vehicle.sequelize.col('status')), 'count']],
      group: ['status'],
      raw: true
    });
    const base = { running:0, idle:0, maintenance:0, offline:0 };
    stats.forEach(s=>{ base[s.status]=parseInt(s.count); });
    return res.standard(base, { message: '车辆统计获取成功' });
  } catch (e) { return sendError(res,'INTERNAL_ERROR','获取车辆统计失败', e.message); }
};

const listVehicles = async (req,res)=>{
  try {
    const { search, status } = req.query;
    const where = {};
    if (search) where[Op.or] = [ { plate_number: { [Op.like]: `%${search}%` } }, { vehicle_id: { [Op.like]: `%${search}%` } } ];
    if (status && status !== 'all') where.status = status;
    const vehicles = await Vehicle.findAll({
      where,
      include: [{ model: User, attributes: ['id','name','phone'], required:false }],
      order: [['updated_at','DESC']]
    });
    return res.standard(vehicles, { message: '车辆列表获取成功' });
  } catch (e) { return sendError(res,'INTERNAL_ERROR','获取车辆列表失败', e.message); }
};

const updateLocation = async (req,res)=>{
  try {
    const { vehicleId, lat, lng, speed, fuel } = req.body;
    if (!vehicleId || lat==null || lng==null) return sendError(res,'VALIDATION_ERROR','缺少必填字段',{ fields:['vehicleId','lat','lng'] });
    const vehicle = await Vehicle.findOne({ where: { vehicle_id: vehicleId } });
    if (!vehicle) return sendError(res,'NOT_FOUND','车辆不存在');
    await vehicle.update({ current_location:{ lat, lng }, speed: speed||0, fuel_level: fuel||vehicle.fuel_level, last_update: new Date() });
    return res.standard(vehicle, { message: '位置更新成功' });
  } catch (e) { return sendError(res,'INTERNAL_ERROR','更新车辆位置失败', e.message); }
};

const sendCommand = async (req,res)=>{
  try {
    const { vehicleId, command, note } = req.body;
    if(!vehicleId || !command) return sendError(res,'VALIDATION_ERROR','缺少必填字段',{ fields:['vehicleId','command'] });
    const vehicle = await Vehicle.findOne({ where: { vehicle_id: vehicleId } });
    if (!vehicle) return sendError(res,'NOT_FOUND','车辆不存在');
    // 指令下发逻辑可后续扩展
    return res.standard({ vehicleId, command, note, timestamp: new Date() }, { message: `指令 ${command} 已发送` });
  } catch (e) { return sendError(res,'INTERNAL_ERROR','发送指令失败', e.message); }
};

module.exports = { getVehicleStats, listVehicles, updateLocation, sendCommand };