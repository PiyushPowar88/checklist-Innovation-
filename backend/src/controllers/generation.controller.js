import * as service from '../services/generation.service.js';
import * as genRepo from '../repositories/generation.repository.js';

export async function create(req, res) {
  const id = await service.startGeneration(req.body);
  res.status(202).json({ success: true, id, status: 'pending' });
}
export async function list(req, res) {
  res.json({ success: true, generations: await genRepo.list() });
}
export async function getOne(req, res) {
  res.json({ success: true, generation: await service.getGeneration(Number(req.params.id)) });
}
export async function getPreview(req, res) {
  res.json({ success: true, ...(await service.getPreview(Number(req.params.id))) });
}
export async function savePreview(req, res) {
  res.json({ success: true, draft: await service.savePreview(Number(req.params.id), req.body) });
}
export async function approve(req, res) {
  res.status(201).json({ success: true, checklistId: await service.approve(Number(req.params.id)) });
}
