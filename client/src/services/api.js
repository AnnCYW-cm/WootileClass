const API_BASE = '/api';
// 直接连接后端，用于大文件上传（绕过 Vite 代理以支持进度显示）
const UPLOAD_BASE = import.meta.env.DEV ? 'http://localhost:3002/api' : '/api';

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
    // 创建包含更多信息的错误对象
    const error = new Error(data.error || '请求失败');
    error.code = data.code;
    error.status = response.status;
    error.current = data.current;
    error.limit = data.limit;
    error.remaining = data.remaining;
    error.needed = data.needed;
    throw error;
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
  getPlansDetail: () => request('/membership/plans-detail'),  // 获取详细方案和限制
  getStatus: () => request('/membership/status'),
  getUsage: () => request('/membership/usage'),  // 获取使用量统计
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

// Courses API
export const coursesApi = {
  getAll: (status) => request(`/courses${status ? `?status=${status}` : ''}`),
  getById: (id) => request(`/courses/${id}`),
  getByShareCode: (code) => request(`/courses/share/${code}`),
  create: (data) => request('/courses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/courses/${id}`, { method: 'DELETE' }),
  publish: (id) => request(`/courses/${id}/publish`, { method: 'PUT' }),
  unpublish: (id) => request(`/courses/${id}/unpublish`, { method: 'PUT' }),
  // Sections
  createSection: (courseId, data) => request(`/courses/${courseId}/sections`, { method: 'POST', body: JSON.stringify(data) }),
  updateSection: (courseId, sectionId, data) => request(`/courses/${courseId}/sections/${sectionId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSection: (courseId, sectionId) => request(`/courses/${courseId}/sections/${sectionId}`, { method: 'DELETE' }),
  reorderSections: (courseId, sectionIds) => request(`/courses/${courseId}/sections/reorder`, { method: 'PUT', body: JSON.stringify({ sectionIds }) }),
  // Comments
  getComments: (courseId) => request(`/courses/${courseId}/comments`),
  createComment: (courseId, content, parentId) => request(`/courses/${courseId}/comments`, { method: 'POST', body: JSON.stringify({ content, parentId }) }),
  deleteComment: (courseId, commentId) => request(`/courses/${courseId}/comments/${commentId}`, { method: 'DELETE' }),
};

// Animations API
export const animationsApi = {
  create: (data) => request('/animations', { method: 'POST', body: JSON.stringify(data) }),
  get: (id) => request(`/animations/${id}`),
  update: (id, data) => request(`/animations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/animations/${id}`, { method: 'DELETE' }),
  reorder: (sectionId, animationIds) => request(`/animations/section/${sectionId}/reorder`, { method: 'PUT', body: JSON.stringify({ animationIds }) }),
  // Built-in animations
  getBuiltin: (category) => request(`/animations/builtin${category ? `?category=${category}` : ''}`),
  getBuiltinCategories: () => request('/animations/builtin/categories'),
  getBuiltinById: (id) => request(`/animations/builtin/${id}`),
  seedBuiltin: () => request('/animations/builtin/seed', { method: 'POST' }),
};

// Dashboard API
export const dashboardApi = {
  getTodos: () => request('/dashboard/todos'),
  getClassSummary: (classId) => request(`/dashboard/class/${classId}/summary`),
  getAttendanceTrend: (classId) => request(`/dashboard/class/${classId}/attendance-trend`),
  getScoreRanking: (classId) => request(`/dashboard/class/${classId}/score-ranking`),
  getAssignmentStats: (classId) => request(`/dashboard/class/${classId}/assignment-stats`),
  getStudentSummary: (studentId) => request(`/dashboard/student/${studentId}/summary`),
};

// AI API
export const aiApi = {
  getStudentComment: (studentId) => request(`/ai/comment/student/${studentId}`),
  generateLessonPlan: (data) => request('/ai/lesson-plan', { method: 'POST', body: JSON.stringify(data) }),
  getClassSummary: (classId) => request(`/ai/summary/class/${classId}`),
  getCurriculum: (grade, subject) => request(`/ai/curriculum/${encodeURIComponent(grade)}/${encodeURIComponent(subject)}`),
  getRelatedAnimations: (grade, subject) => request(`/ai/related-animations/${encodeURIComponent(grade)}/${encodeURIComponent(subject)}`),
  uploadPpt: async (file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('ppt', file);
    const response = await fetch(`${API_BASE}/ai/upload-ppt`, {
      method: 'POST',
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '上传失败');
    return data;
  },
};

// Videos API
export const videosApi = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.grade) params.append('grade', filters.grade);
    if (filters.subject) params.append('subject', filters.subject);
    if (filters.status) params.append('status', filters.status);
    const query = params.toString();
    return request(`/videos${query ? `?${query}` : ''}`);
  },
  get: (id) => request(`/videos/${id}`),
  getByShareCode: (code) => request(`/videos/share/${code}`),
  getStorageUsage: () => request('/videos/storage'),
  upload: (file, data = {}, onProgress) => {
    return new Promise((resolve, reject) => {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('video', file);
      if (data.title) formData.append('title', data.title);
      if (data.description) formData.append('description', data.description);
      if (data.grade) formData.append('grade', data.grade);
      if (data.subject) formData.append('subject', data.subject);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${UPLOAD_BASE}/videos/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        try {
          const result = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(result);
          } else {
            const error = new Error(result.error || '上传失败');
            error.code = result.code;
            error.current = result.current;
            error.limit = result.limit;
            reject(error);
          }
        } catch {
          reject(new Error('上传失败'));
        }
      };

      xhr.onerror = () => reject(new Error('网络错误'));
      xhr.send(formData);
    });
  },
  update: (id, data) => request(`/videos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateThumbnail: async (id, file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('thumbnail', file);

    const response = await fetch(`${API_BASE}/videos/${id}/thumbnail`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '上传失败');
    return result;
  },
  delete: (id) => request(`/videos/${id}`, { method: 'DELETE' }),
  publish: (id) => request(`/videos/${id}/publish`, { method: 'PUT' }),
  unpublish: (id) => request(`/videos/${id}/unpublish`, { method: 'PUT' }),
  // Related videos and comments
  getRelated: (id) => request(`/videos/${id}/related`),
  getComments: (id) => request(`/videos/${id}/comments`),
  addComment: (id, content, parentId) => request(`/videos/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content, parentId })
  }),
  deleteComment: (commentId) => request(`/videos/comments/${commentId}`, { method: 'DELETE' }),
  // Danmaku
  getDanmaku: (id) => request(`/videos/${id}/danmaku`),
  addDanmaku: (id, content, timeSeconds, color) => request(`/videos/${id}/danmaku`, {
    method: 'POST',
    body: JSON.stringify({ content, timeSeconds, color })
  }),
};
