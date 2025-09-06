// src/controllers/monitoringController.js
const { Camera, Alert } = require('../models');
const { resolveError } = require('../utils/errorCodes');
const { Op } = require('sequelize');

function sendError(res, code, overrideMessage, details){
  const { status, message, payload } = resolveError(code, overrideMessage, details);
  return res.standard(payload, { message, status });
}

const getMonitoringStats = async (req,res)=>{
  try {
    const [cameraStats, activeAlerts] = await Promise.all([
      Camera.findAll({ attributes: ['status', [Camera.sequelize.fn('COUNT', Camera.sequelize.col('status')), 'count']], group: ['status'], raw: true }),
      Alert.findAll({ where: { status: 'active' }, attributes: ['level', [Alert.sequelize.fn('COUNT', Alert.sequelize.col('level')), 'count']], group: ['level'], raw: true })
    ]);
    const cameras = { online:0, offline:0, maintenance:0 };
    cameraStats.forEach(s=>{ cameras[s.status]=parseInt(s.count); });
    const recording = await Camera.count({ where: { is_recording: true } });
    const alerts = activeAlerts.reduce((a,c)=> a + parseInt(c.count), 0);
    return res.standard({ online: cameras.online, recording, alert: alerts, offline: cameras.offline }, { message: '监控统计获取成功' });
  } catch (e) { return sendError(res,'INTERNAL_ERROR','获取监控统计失败', e.message); }
};

const listCameras = async (req,res)=>{
  try {
    const { area, status } = req.query;
    const where = {};
    if (area && area !== 'all') where.area = area;
    if (status && status !== 'all') where.status = status;
    const cameras = await Camera.findAll({ where, order: [['area','ASC'], ['name','ASC']] });
    const grouped = cameras.reduce((acc, c)=>{ (acc[c.area] = acc[c.area] || []).push(c); return acc; }, {});
    return res.standard(grouped, { message: '摄像头列表获取成功' });
  } catch (e) { return sendError(res,'INTERNAL_ERROR','获取摄像头列表失败', e.message); }
};

const listAlerts = async (req,res)=>{
  try {
    const { page=1, limit=10, status='active', level } = req.query;
    const where = { status };
    if (level && level !== 'all') where.level = level;
    const pageNum = parseInt(page); const perPage = parseInt(limit); const offset = (pageNum-1)*perPage;
    const alerts = await Alert.findAndCountAll({ where, include: [{ model: Camera, attributes: ['name','location'], required:false }], offset, limit:perPage, order:[['triggered_at','DESC']] });
    return res.standard({ alerts: alerts.rows, pagination: { current_page: pageNum, per_page: perPage, total: alerts.count, total_pages: Math.ceil(alerts.count/perPage) } }, { message: '报警列表获取成功' });
  } catch (e) { return sendError(res,'INTERNAL_ERROR','获取报警列表失败', e.message); }
};

const resolveAlert = async (req,res)=>{
  try {
    const { id } = req.params; const { note } = req.body; const userId = req.user?.userId;
    const alert = await Alert.findByPk(id);
    if (!alert) return sendError(res,'NOT_FOUND','报警不存在');
    await alert.update({ status: 'resolved', resolved_at: new Date(), resolved_by: userId, metadata: { ...(alert.metadata||{}), note } });
    return res.standard(alert, { message: '报警已处理' });
  } catch (e) { return sendError(res,'INTERNAL_ERROR','处理报警失败', e.message); }
};

module.exports = { getMonitoringStats, listCameras, listAlerts, resolveAlert };