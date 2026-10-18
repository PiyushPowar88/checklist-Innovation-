import * as service from '../services/checklist.service.js';

export async function list(req, res) {
  res.json({ success: true, checklists: await service.list() });
}
export async function getOne(req, res) {
  res.json({ success: true, checklist: await service.get(Number(req.params.id)) });
}
export async function update(req, res) {
  res.json({ success: true, checklist: await service.update(Number(req.params.id), req.body) });
}
export async function remove(req, res) {
  await service.remove(Number(req.params.id), req.query.hard === 'true');
  res.json({ success: true });
}
