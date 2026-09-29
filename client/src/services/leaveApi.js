import api from './api';

export const getLeaveBalance = async () => {
  const { data } = await api.get('/leaves/balance');
  return data.data;
};

export const getLeaveTypes = async () => {
  const { data } = await api.get('/leave-types', { params: { page: 1, limit: 100 } });
  return data.data;
};

export const createLeaveRequest = async (payload) => {
  const { data } = await api.post('/leaves', payload);
  return data.data;
};

export const getMyLeaveRequests = async ({ page = 1, limit = 8, status } = {}) => {
  const params = { page, limit };
  if (status) params.status = status;

  const { data } = await api.get('/leaves/mine', { params });
  return data;
};

export const cancelLeaveRequest = async (id) => {
  await api.delete(`/leaves/${id}`);
};

export const getApiErrorMessage = (error, fallback) => {
  const validationErrors = error.response?.data?.errors;
  if (validationErrors) return Object.values(validationErrors).join(' ');
  return error.response?.data?.message || fallback;
};
