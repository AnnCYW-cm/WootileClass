const API_BASE = '/api';

const getToken = () => localStorage.getItem('token');

const request = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '请求失败');
  }

  return data;
};

// Auth API
export const authApi = {
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: () => request('/auth/profile'),
};

// Classes API
export const classesApi = {
  getAll: (status) => request(`/classes${status ? `?status=${status}` : ''}`),
  get: (id) => request(`/classes/${id}`),
  create: (data) => request('/classes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  archive: (id) => request(`/classes/${id}/archive`, { method: 'PUT' }),
  delete: (id) => request(`/classes/${id}`, { method: 'DELETE' }),
};

// Students API
export const studentsApi = {
  getByClass: (classId) => request(`/students/class/${classId}`),
  add: (classId, data) => request(`/students/class/${classId}`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/students/${id}`, { method: 'DELETE' }),
  import: async (classId, file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/students/class/${classId}/import`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '导入失败');
    return data;
  },
};

// Attendance API
export const attendanceApi = {
  get: (classId, date) => request(`/attendance/class/${classId}${date ? `?date=${date}` : ''}`),
  record: (classId, data) => request(`/attendance/class/${classId}`, { method: 'POST', body: JSON.stringify(data) }),
  batchRecord: (classId, data) => request(`/attendance/class/${classId}/batch`, { method: 'POST', body: JSON.stringify(data) }),
  getRandomStudent: (classId) => request(`/attendance/class/${classId}/random`),
  getStats: (classId, startDate, endDate) => {
    let url = `/attendance/class/${classId}/stats`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    return request(url);
  },
};

// Scores API
export const scoresApi = {
  getByClass: (classId) => request(`/scores/class/${classId}`),
  add: (classId, data) => request(`/scores/class/${classId}`, { method: 'POST', body: JSON.stringify(data) }),
  batchAdd: (classId, data) => request(`/scores/class/${classId}/batch`, { method: 'POST', body: JSON.stringify(data) }),
  getRanking: (classId, period) => request(`/scores/class/${classId}/ranking${period ? `?period=${period}` : ''}`),
  getStudentHistory: (studentId) => request(`/scores/student/${studentId}/history`),
  reset: (classId) => request(`/scores/class/${classId}/reset`, { method: 'DELETE' }),
  getPresets: () => request('/scores/presets'),
  createPreset: (data) => request('/scores/presets', { method: 'POST', body: JSON.stringify(data) }),
  deletePreset: (id) => request(`/scores/presets/${id}`, { method: 'DELETE' }),
};

// Assignments API
export const assignmentsApi = {
  getAll: (classId, status) => {
    let url = '/assignments';
    const params = [];
    if (classId) params.push(`class_id=${classId}`);
    if (status) params.push(`status=${status}`);
    if (params.length) url += '?' + params.join('&');
    return request(url);
  },
  get: (id) => request(`/assignments/${id}`),
  create: (data) => request('/assignments', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/assignments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/assignments/${id}`, { method: 'DELETE' }),
  getSubmissions: (id) => request(`/assignments/${id}/submissions`),
  teacherSubmit: (id, data) => request(`/assignments/${id}/submissions`, { method: 'POST', body: JSON.stringify(data) }),
  gradeSubmission: (submissionId, data) => request(`/assignments/submissions/${submissionId}/grade`, { method: 'PUT', body: JSON.stringify(data) }),
  batchGrade: (id, data) => request(`/assignments/${id}/submissions/batch`, { method: 'PUT', body: JSON.stringify(data) }),
  getStatistics: (id) => request(`/assignments/${id}/statistics`),
  getQuickComments: () => request('/assignments/quick-comments'),
  createQuickComment: (data) => request('/assignments/quick-comments', { method: 'POST', body: JSON.stringify(data) }),
  deleteQuickComment: (id) => request(`/assignments/quick-comments/${id}`, { method: 'DELETE' }),
  // Public APIs (no auth)
  getByCode: (code) => request(`/assignments/submit/${code}`),
  submitByCode: (code, data) => request(`/assignments/submit/${code}`, { method: 'POST', body: JSON.stringify(data) }),
};

// Redemption API
export const redemptionApi = {
  getRewards: (classId) => request(`/redemption/classes/${classId}/rewards`),
  createReward: (classId, data) => request(`/redemption/classes/${classId}/rewards`, { method: 'POST', body: JSON.stringify(data) }),
  updateReward: (id, data) => request(`/redemption/rewards/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteReward: (id) => request(`/redemption/rewards/${id}`, { method: 'DELETE' }),
  redeem: (classId, data) => request(`/redemption/classes/${classId}/redeem`, { method: 'POST', body: JSON.stringify(data) }),
  getHistory: (classId) => request(`/redemption/classes/${classId}/redemption-history`),
  getStudentRedemptions: (studentId) => request(`/redemption/students/${studentId}/redemptions`),
};

// Membership API
export const membershipApi = {
  getPlans: () => request('/membership/plans'),
  getStatus: () => request('/membership/status'),
  purchase: (data) => request('/membership/purchase', { method: 'POST', body: JSON.stringify(data) }),
};

// Exams API
export const examsApi = {
  getAll: (classId) => request(`/exams${classId ? `?class_id=${classId}` : ''}`),
  get: (id) => request(`/exams/${id}`),
  create: (data) => request('/exams', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/exams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/exams/${id}`, { method: 'DELETE' }),
  getScores: (examId) => request(`/exams/${examId}/scores`),
  saveScores: (examId, scores) => request(`/exams/${examId}/scores`, { method: 'POST', body: JSON.stringify({ scores }) }),
  getStats: (examId) => request(`/exams/${examId}/stats`),
};

// Reports API
export const reportsApi = {
  getComments: () => request('/reports/comments'),
  getHistory: (classId) => request(`/reports/history?class_id=${classId}`),
  preview: (data) => request('/reports/preview', { method: 'POST', body: JSON.stringify(data) }),
  generate: (data) => request('/reports/generate', { method: 'POST', body: JSON.stringify(data) }),
  generateBatch: (data) => request('/reports/batch', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => request(`/reports/${id}`, { method: 'DELETE' }),
};

// Seating API
export const seatingApi = {
  get: (classId) => request(`/seating/class/${classId}`),
  save: (classId, data) => request(`/seating/class/${classId}`, { method: 'POST', body: JSON.stringify(data) }),
};
