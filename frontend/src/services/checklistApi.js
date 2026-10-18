import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

// Turn API errors into readable Error objects. (Add an auth header here when you add user accounts.)
api.interceptors.response.use(
  (r) => r,
  (err) => {
    const data = err.response?.data;
    const detail = Array.isArray(data?.details) && typeof data.details[0] === 'string' ? ` (${data.details.slice(0, 3).join('; ')})` : '';
    const e = new Error(data?.error ? data.error + detail : err.code === 'ERR_NETWORK' ? 'Cannot reach the backend. Is it running on port 5000?' : err.message);
    e.status = err.response?.status;
    return Promise.reject(e);
  }
);

export const uploadDocuments = async (files, onProgress) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('documents', file)); // must match Multer field name
  const res = await api.post('/documents/upload', formData, {
    onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
  });
  return res.data;
};

export const generateChecklist = async (payload) => (await api.post('/generations', payload)).data;
export const listGenerations = async () => (await api.get('/generations')).data;
export const getGeneration = async (id) => (await api.get(`/generations/${id}`)).data;
export const getChecklistPreview = async (id) => (await api.get(`/generations/${id}/preview`)).data;
export const savePreview = async (id, draft) => (await api.put(`/generations/${id}/preview`, draft)).data;
export const approveChecklist = async (id) => (await api.post(`/generations/${id}/approve`)).data;

export const listChecklists = async () => (await api.get('/checklists')).data;
export const getChecklist = async (id) => (await api.get(`/checklists/${id}`)).data;
export const updateChecklist = async (id, body) => (await api.put(`/checklists/${id}`, body)).data;
export const deleteChecklist = async (id, hard = false) => (await api.delete(`/checklists/${id}`, { params: { hard } })).data;
