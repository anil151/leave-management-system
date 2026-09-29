import api from './api';

export const getManagedLeaveRequests = async ({ page = 1, status, employee } = {}) => {
  const params = { page, limit: 8 };
  if (status) params.status = status;
  if (employee) params.employee = employee;

  const { data } = await api.get('/leaves', { params });
  return data;
};

export const approveLeaveRequest = async (id) => {
  const { data } = await api.patch(`/leaves/${id}/approve`);
  return data.data;
};

export const rejectLeaveRequest = async (id, reason) => {
  const { data } = await api.patch(`/leaves/${id}/reject`, reason ? { reason } : {});
  return data.data;
};

export const getManagedLeaveTypes = async ({ page = 1 } = {}) => {
  const { data } = await api.get('/leave-types', { params: { page, limit: 8 } });
  return data;
};

export const createLeaveType = async (payload) => {
  const { data } = await api.post('/leave-types', payload);
  return data.data;
};

export const updateLeaveType = async (id, payload) => {
  const { data } = await api.put(`/leave-types/${id}`, payload);
  return data.data;
};

export const deleteLeaveType = async (id) => {
  await api.delete(`/leave-types/${id}`);
};

export const getManagerApiError = (error, fallback) => {
  const validationErrors = error.response?.data?.errors;
  if (validationErrors) return Object.values(validationErrors).join(' ');
  return error.response?.data?.message || fallback;
};
