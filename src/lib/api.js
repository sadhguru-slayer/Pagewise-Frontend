'use client';

export const getApiBase = () => {
  if (typeof window !== 'undefined') {
    // In browser, connect directly to FastAPI to prevent Node.js proxy socket hangup on multipart file streams
    return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
  }
  return '/api';
};

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('resumo_token');
}

export function setToken(token) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('resumo_token', token);
  } else {
    localStorage.removeItem('resumo_token');
  }
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('resumo_token');
}

// ─── Admin Dedicated Session Management ─────────────────────────────────────
export function getAdminToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('resumo_admin_token') || localStorage.getItem('resumo_token');
}

export function setAdminToken(token) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('resumo_admin_token', token);
  } else {
    localStorage.removeItem('resumo_admin_token');
  }
}

export function clearAdminToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('resumo_admin_token');
}

export async function fetchAdminApi(endpoint, options = {}) {
  const token = getAdminToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const apiBase = getApiBase();
  let res;
  try {
    res = await fetch(`${apiBase}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err) {
    if (apiBase !== '/api') {
      res = await fetch(`/api${endpoint}`, {
        ...options,
        headers,
      });
    } else {
      throw err;
    }
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg = data?.detail || data?.error || res.statusText || 'An unexpected error occurred';
    throw new Error(errorMsg);
  }

  return data;
}

export async function fetchApi(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const apiBase = getApiBase();
  let res;
  try {
    res = await fetch(`${apiBase}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err) {
    // If direct call fails, try via Next.js proxy
    if (apiBase !== '/api') {
      res = await fetch(`/api${endpoint}`, {
        ...options,
        headers,
      });
    } else {
      throw err;
    }
  }

  if (res.status === 401 && typeof window !== 'undefined') {
    clearToken();
    if (window.location.pathname.startsWith('/dashboard') || window.location.pathname.startsWith('/builder')) {
      window.location.href = '/login';
    }
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg = data?.detail || data?.error || res.statusText || 'An unexpected error occurred';
    throw new Error(errorMsg);
  }

  return data;
}

// ─── Auth API ────────────────────────────────────────────────────────────────
export const authApi = {
  // Anti-spam registration email verification
  async requestRegisterOTP(email) {
    return fetchApi('/auth/request-register-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async verifyRegisterOTP(email, otp) {
    return fetchApi('/auth/verify-register-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  async register({ name, email, password, register_token }) {
    const data = await fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, register_token }),
    });
    if (data?.access_token) {
      setToken(data.access_token);
    }
    return data;
  },

  // Passwordless login with OTP
  async requestLoginOTP(email) {
    return fetchApi('/auth/request-login-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async verifyLoginOTP(email, otp) {
    const data = await fetchApi('/auth/verify-login-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
    if (data?.access_token) {
      setToken(data.access_token);
    }
    return data;
  },

  async login({ email, password }) {
    const data = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data?.access_token) {
      setToken(data.access_token);
    }
    return data;
  },

  async getMe() {
    return fetchApi('/auth/me');
  },

  async updatePreferences({ name, allowBoldText }) {
    const payload = {};
    if (name !== undefined) payload.name = name;
    if (allowBoldText !== undefined) payload.allow_bold_text = allowBoldText;
    return fetchApi('/auth/preferences', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  logout() {
    clearToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  // Forgot password flow (unauthenticated)
  async requestPasswordReset(email) {
    return fetchApi('/auth/request-password-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async verifyResetOTP(email, otp) {
    return fetchApi('/auth/verify-reset-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  async resetPassword(reset_token, new_password) {
    return fetchApi('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ reset_token, new_password }),
    });
  },

  // Profile password reset flow (authenticated)
  async profileRequestResetOTP() {
    return fetchApi('/auth/profile/request-reset-otp', {
      method: 'POST',
    });
  },

  async profileVerifyResetOTP(otp) {
    return fetchApi('/auth/profile/verify-reset-otp', {
      method: 'POST',
      body: JSON.stringify({ otp }),
    });
  },

  async profileResetPassword(reset_token, new_password) {
    return fetchApi('/auth/profile/reset-password', {
      method: 'POST',
      body: JSON.stringify({ reset_token, new_password }),
    });
  },
};

// ─── Resumes API ─────────────────────────────────────────────────────────────
export const resumesApi = {
  async list() {
    return fetchApi('/resumes');
  },

  async get(id) {
    return fetchApi(`/resumes/${id}`);
  },

  async create(payload) {
    return fetchApi('/resumes', {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name || 'Untitled Resume',
        header_json: payload.headerJson || payload.header_json || {},
        settings_json: payload.settingsJson || payload.settings_json || {},
        sections_json: payload.sectionsJson || payload.sections_json || [],
      }),
    });
  },

  async update(id, payload) {
    return fetchApi(`/resumes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: payload.name,
        header_json: payload.headerJson || payload.header_json,
        settings_json: payload.settingsJson || payload.settings_json,
        sections_json: payload.sectionsJson || payload.sections_json,
      }),
    });
  },

  async delete(id) {
    return fetchApi(`/resumes/${id}`, {
      method: 'DELETE',
    });
  },

  async parsePdf({ file, createResume = false, resumeName = '' }) {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    if (createResume) formData.append('create_resume', 'true');
    if (resumeName) formData.append('resume_name', resumeName);

    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const apiBase = getApiBase();
    let res;
    try {
      res = await fetch(`${apiBase}/resumes/parse-pdf`, {
        method: 'POST',
        headers,
        body: formData,
      });
    } catch (err) {
      if (apiBase !== '/api') {
        res = await fetch('/api/resumes/parse-pdf', {
          method: 'POST',
          headers,
          body: formData,
        });
      } else {
        throw err;
      }
    }

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.detail || data?.error || 'Failed to parse resume PDF');
    }
    return data;
  },

  async analyzeJobDescription({ resumeId, jobDescription, currentResumeOverride = null }) {
    return fetchApi('/resumes/analyze-jd', {
      method: 'POST',
      body: JSON.stringify({
        resume_id: resumeId || null,
        job_description: jobDescription,
        current_resume_override: currentResumeOverride,
        include_all_user_resumes: true,
      }),
    });
  },

  async analyzeStandaloneAts({ resumeId, currentResumeOverride = null }) {
    return fetchApi('/resumes/analyze-ats', {
      method: 'POST',
      body: JSON.stringify({
        resume_id: resumeId || null,
        current_resume_override: currentResumeOverride,
      }),
    });
  },

  async setPrimary(resumeId) {
    if (!resumeId) {
      throw new Error('Valid resume ID is required');
    }
    const cleanId = parseInt(resumeId, 10);
    if (isNaN(cleanId)) {
      throw new Error(`Invalid resume ID: ${resumeId}`);
    }
    return fetchApi(`/resumes/${cleanId}/set-primary`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  async cloneResume(resumeId, { newName, targetJobTitle, targetCompany, targetJobDescription, targetAtsScore } = {}) {
    return fetchApi(`/resumes/${resumeId}/clone`, {
      method: 'POST',
      body: JSON.stringify({
        new_name: newName || null,
        target_job_title: targetJobTitle || null,
        target_company: targetCompany || null,
        target_job_description: targetJobDescription || null,
        target_ats_score: targetAtsScore || null,
      }),
    });
  },

  async getUsageStats(params = {}) {
    const query = new URLSearchParams();
    if (params.period) query.set('period', params.period);
    if (params.startDate) query.set('start_date', params.startDate);
    if (params.endDate) query.set('end_date', params.endDate);
    const queryString = query.toString();
    return fetchApi(`/resumes/usage-stats${queryString ? `?${queryString}` : ''}`);
  },

  async updateJobTarget(resumeId, { targetJobTitle, targetCompany, targetJobDescription, targetAtsScore }) {
    return fetchApi(`/resumes/${resumeId}`, {
      method: 'PUT',
      body: JSON.stringify({
        target_job_title: targetJobTitle,
        target_company: targetCompany,
        target_job_description: targetJobDescription,
        target_ats_score: targetAtsScore,
      }),
    });
  },
};

// ─── Templates API ────────────────────────────────────────────────────────────
export const templatesApi = {
  async list() {
    return fetchApi('/templates');
  },

  async save({ name, description, settingsJson, headerStyleJson, sectionDefaultsJson }) {
    return fetchApi('/templates', {
      method: 'POST',
      body: JSON.stringify({
        name,
        description: description || null,
        settings_json: settingsJson || {},
        header_style_json: headerStyleJson || {},
        section_defaults_json: sectionDefaultsJson || {},
      }),
    });
  },

  async delete(templateId) {
    return fetchApi(`/templates/${templateId}`, { method: 'DELETE' });
  },
};

// ─── Exports API ─────────────────────────────────────────────────────────────
export const exportsApi = {
  async list() {
    return fetchApi('/exports');
  },

  async exportPdf({ resumeId, name, html }) {
    return fetchApi('/exports/pdf', {
      method: 'POST',
      body: JSON.stringify({
        resume_id: resumeId,
        name,
        html,
      }),
    });
  },

  async exportImage({ resumeId, name, html }) {
    return fetchApi('/exports/image', {
      method: 'POST',
      body: JSON.stringify({
        resume_id: resumeId,
        name,
        html,
      }),
    });
  },

  async exportHtml({ resumeId, name, html }) {
    return fetchApi('/exports/html', {
      method: 'POST',
      body: JSON.stringify({
        resume_id: resumeId,
        name,
        html,
      }),
    });
  },

  async exportDocx({ resumeId, name, headerJson, settingsJson, sectionsJson }) {
    return fetchApi('/exports/docx', {
      method: 'POST',
      body: JSON.stringify({
        resume_id: resumeId,
        name,
        header_json: headerJson,
        settings_json: settingsJson,
        sections_json: sectionsJson,
      }),
    });
  },

  getDownloadUrl(exportId) {
    const token = getToken();
    const query = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${getApiBase()}/exports/download/${exportId}${query}`;
  },

  async downloadFile(exportId, defaultFilename = 'resume.pdf') {
    const token = getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(this.getDownloadUrl(exportId), {
      headers,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.detail || data?.error || 'Failed to download file');
    }

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  },

  async delete(exportId) {
    return fetchApi(`/exports/${exportId}`, {
      method: 'DELETE',
    });
  },
};

// ─── Payment & Subscription API ──────────────────────────────────────────────
export const paymentsApi = {
  async getConfig() {
    return fetchApi('/payments/config');
  },

  async getStatus() {
    return fetchApi('/payments/status');
  },

  async createOrder(planType) {
    return fetchApi('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ plan_type: planType }),
    });
  },

  async verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    return fetchApi('/payments/verify', {
      method: 'POST',
      body: JSON.stringify({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      }),
    });
  },
};

// ─── Admin API ───────────────────────────────────────────────────────────────
export const adminApi = {
  async login(usernameOrEmail, password) {
    const res = await fetchApi('/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        username_or_email: usernameOrEmail,
        password,
      }),
    });
    if (res?.access_token) {
      setAdminToken(res.access_token);
    }
    return res;
  },

  async getMe() {
    return fetchAdminApi('/admin/me');
  },

  logout() {
    clearAdminToken();
  },

  async listUsers(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.plan) query.set('plan', params.plan);
    if (params.role) query.set('role', params.role);
    if (params.sortBy) query.set('sort_by', params.sortBy);
    if (params.sortOrder) query.set('sort_order', params.sortOrder);
    if (params.skip !== undefined) query.set('skip', params.skip);
    if (params.limit !== undefined) query.set('limit', params.limit);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return fetchAdminApi(`/admin/users${qs}`);
  },

  async getUserDetail(userId) {
    return fetchAdminApi(`/admin/users/${userId}`);
  },

  async createUser(payload) {
    return fetchAdminApi('/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateUser(userId, payload) {
    return fetchAdminApi(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteUser(userId) {
    return fetchAdminApi(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  },

  async getInsights() {
    return fetchAdminApi('/admin/insights');
  },

  async updateSelfSecurity(payload) {
    return fetchAdminApi('/admin/me/security', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
};

