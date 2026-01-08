const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('admin_token');
    this.csrfToken = localStorage.getItem('csrf_token');
    this.csrfHeader = 'x-csrf-token';
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('admin_token', token);
    } else {
      localStorage.removeItem('admin_token');
    }
  }

  setCsrfToken(token, header = 'x-csrf-token') {
    this.csrfToken = token;
    this.csrfHeader = header;
    if (token) {
      localStorage.setItem('csrf_token', token);
    } else {
      localStorage.removeItem('csrf_token');
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      ...options.headers,
    };

    // Only add Content-Type if not FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token && !options.skipAuth) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Add CSRF token for state-changing requests
    const isStateChangingRequest = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase());
    if (this.csrfToken && !options.skipAuth && isStateChangingRequest) {
      headers[this.csrfHeader] = this.csrfToken;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include', // Required for cross-origin cookies (CSRF)
      });

      if (!response.ok) {
        if (response.status === 401 && !options.skipAuth) {
          this.setToken(null);
          window.location.href = '/admin/login';
        }

        // Try to get detailed error message from response
        let errorMessage = `API Error: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // If can't parse JSON, use status code
        }

        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth
  async login(username, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      skipAuth: true,
    });
    this.setToken(data.token);

    // Store CSRF token if provided
    if (data.csrfToken) {
      this.setCsrfToken(data.csrfToken, data.csrfHeader);
    }

    return data;
  }

  clearAuth() {
    this.setToken(null);
    this.setCsrfToken(null);
  }

  async logout() {
    return this.request('/api/auth/logout', { method: 'POST' });
  }

  // Public endpoints
  async getSliderImages() {
    return this.request('/api/slider', { skipAuth: true });
  }

  async getGalleryImages(type = '') {
    const endpoint = type === 'mobile' ? '/api/gallery/mobile' : '/api/gallery';
    return this.request(endpoint, { skipAuth: true });
  }

  async getLogos() {
    return this.request('/api/logos', { skipAuth: true });
  }

  // Admin - Regions
  async getAvailableRegions() {
    return this.request('/api/admin/regions/me');
  }

  async getAllRegions() {
    return this.request('/api/admin/regions');
  }

  async createRegion(regionData) {
    return this.request('/api/admin/regions', {
      method: 'POST',
      body: JSON.stringify(regionData),
    });
  }

  async deleteRegion(code) {
    return this.request(`/api/admin/regions/${code}`, {
      method: 'DELETE',
    });
  }

  async toggleRegionStatus(code, isActive) {
    return this.request(`/api/admin/regions/${code}/status`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: isActive ? 1 : 0 }),
    });
  }

  // Admin - Storage
  async getStorageImages(category) {
    return this.request(`/api/admin/storage/${encodeURIComponent(category)}`);
  }

  async uploadToStorage(file, category) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('category', category);

    return this.request('/api/admin/storage', {
      method: 'POST',
      body: formData,
    });
  }

  async uploadStorage(file, category) {
    return this.uploadToStorage(file, category);
  }

  async deleteStorageImage(id) {
    return this.request(`/api/admin/storage/${id}`, {
      method: 'DELETE',
    });
  }

  async renameStorageImage(id, newFilename) {
    return this.request(`/api/admin/storage/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ filename: newFilename }),
    });
  }

  getDownloadUrl(r2Key) {
    // Returns the download URL for an image
    return `${this.baseURL}/api/admin/storage/download/${encodeURIComponent(r2Key)}`;
  }

  // Admin - Slider
  async getAllSliderImages(region) {
    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/slider${query}`);
  }

  async getAdminSlider(region) {
    return this.getAllSliderImages(region);
  }

  async uploadSliderImage(file, objectPosition = 'center center', region) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('objectPosition', objectPosition);

    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/slider${query}`, {
      method: 'POST',
      body: formData,
    });
  }

  async addSlider(data, region) {
    // Handle both file upload and existing image selection
    if (data instanceof File) {
      // New file upload
      return this.uploadSliderImage(data, 'center center', region);
    } else {
      // Selecting from existing storage
      const query = region ? `?region=${region}` : '';
      return this.request(`/api/admin/slider${query}`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
  }

  async updateSlider(id, data, region) {
    const query = region ? `?region=${region}` : '';
    // Handle both file upload and existing image selection
    if (data instanceof File) {
      // New file upload
      const formData = new FormData();
      formData.append('image', data);

      return this.request(`/api/admin/slider/${id}${query}`, {
        method: 'PUT',
        body: formData,
      });
    } else {
      // Selecting from existing storage
      return this.request(`/api/admin/slider/${id}${query}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    }
  }

  async updateSliderPosition(id, objectPosition, region) {
    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/slider/${id}${query}`, {
      method: 'PATCH',
      body: JSON.stringify({ object_position: objectPosition }),
    });
  }

  async deleteSliderImage(id, region) {
    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/slider/${id}${query}`, {
      method: 'DELETE',
    });
  }

  async deleteSlider(id, region) {
    return this.deleteSliderImage(id, region);
  }

  async reorderSlider(order, region) {
    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/slider/reorder${query}`, {
      method: 'POST',
      body: JSON.stringify({ order }),
    });
  }

  // Admin - Gallery
  async getAllGalleryImages(region) {
    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/gallery${query}`);
  }

  async getAdminGallery(region) {
    return this.getAllGalleryImages(region);
  }

  async uploadGalleryImage(file, region) {
    const formData = new FormData();
    formData.append('image', file);

    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/gallery${query}`, {
      method: 'POST',
      body: formData,
    });
  }

  async addGalleryImage(data, region) {
    // Handle both file upload and existing image selection
    if (data instanceof File) {
      // New file upload
      return this.uploadGalleryImage(data, region);
    } else {
      // Selecting from existing storage
      const query = region ? `?region=${region}` : '';
      return this.request(`/api/admin/gallery${query}`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
  }

  async updateGalleryImage(id, fileOrData, region) {
    const query = region ? `?region=${region}` : '';
    // Handle both file upload and existing image selection
    if (fileOrData instanceof File) {
      // New file upload
      const formData = new FormData();
      formData.append('image', fileOrData);

      return this.request(`/api/admin/gallery/${id}${query}`, {
        method: 'PUT',
        body: formData,
      });
    } else {
      // Selecting from existing storage
      return this.request(`/api/admin/gallery/${id}${query}`, {
        method: 'PUT',
        body: JSON.stringify(fileOrData),
      });
    }
  }

  async toggleGalleryMobileVisibility(id, visible, region) {
    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/gallery/${id}/mobile-visibility${query}`, {
      method: 'PUT',
      body: JSON.stringify({ visible }),
    });
  }

  async deleteGalleryImage(id, region) {
    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/gallery/${id}${query}`, {
      method: 'DELETE',
    });
  }

  // Admin - Logos
  async getAllLogos(region) {
    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/logos${query}`);
  }

  async getAdminLogos(region) {
    return this.getAllLogos(region);
  }

  async uploadLogo(file, altText, region) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('altText', altText);

    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/logos${query}`, {
      method: 'POST',
      body: formData,
    });
  }

  async addLogo(data, region) {
    // Handle both file upload and existing image selection
    if (data instanceof File) {
      // New file upload
      return this.uploadLogo(data, '', region);
    } else {
      // Selecting from existing storage
      const query = region ? `?region=${region}` : '';
      return this.request(`/api/admin/logos${query}`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
  }

  async deleteLogo(id, region) {
    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/logos/${id}${query}`, {
      method: 'DELETE',
    });
  }

  async deactivateLogos(ids, region) {
    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/logos/deactivate${query}`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  async activateLogos(ids, region) {
    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/logos/activate${query}`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  async reorderLogos(order, region) {
    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/logos/reorder${query}`, {
      method: 'POST',
      body: JSON.stringify({ order }),
    });
  }

  async deleteMultipleLogos(ids, region) {
    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/logos/delete-multiple${query}`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  // Admin - Usage
  async getUsageStats() {
    return this.request('/api/admin/usage');
  }

  // Admin - User Management (Super Admin only)
  async getUsers() {
    return this.request('/api/admin/users');
  }

  async createUser(userData) {
    return this.request('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId, userData) {
    return this.request(`/api/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId) {
    return this.request(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Admin - Activity Logs (Super Admin only)
  async getActivityLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/admin/activity-logs?${query}`);
  }

  async getActivityLog(id) {
    return this.request(`/api/admin/activity-logs/${id}`);
  }

  // Admin - Profile
  async getProfile() {
    return this.request('/api/admin/profile');
  }

  async updateProfile(data) {
    return this.request('/api/admin/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updatePassword(currentPassword, newPassword) {
    return this.request('/api/admin/profile/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async uploadProfilePicture(file) {
    const formData = new FormData();
    formData.append('image', file);

    return this.request('/api/admin/profile/picture', {
      method: 'POST',
      body: formData,
    });
  }

  async deleteProfilePicture() {
    return this.request('/api/admin/profile/picture', {
      method: 'DELETE',
    });
  }

  // Public - Content
  async getPublicPageContent() {
    return this.request('/api/page-content', { skipAuth: true });
  }

  async getPublicServices() {
    return this.request('/api/services', { skipAuth: true });
  }

  async getPublicSectionImages() {
    return this.request('/api/section-images', { skipAuth: true });
  }

  async getPublicTeam() {
    return this.request('/api/team', { skipAuth: true });
  }

  // Admin - Page Content
  async getPageContent(region) {
    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/page-content${query}`);
  }

  async updatePageContent(key, content, region) {
    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/page-content/${key}${query}`, {
      method: 'PUT',
      body: JSON.stringify({ content_text: content }),
    });
  }

  async createPageContent(key, content, region) {
    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/page-content${query}`, {
      method: 'POST',
      body: JSON.stringify({ content_key: key, content_text: content }),
    });
  }

  async deletePageContent(key, region) {
    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/page-content/${key}${query}`, {
      method: 'DELETE',
    });
  }

  // Admin - Services
  async getServices(region) {
    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/services${query}`);
  }

  async createService(data, region) {
    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/services${query}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateService(id, data, region) {
    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/services/${id}${query}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteService(id, region) {
    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/services/${id}${query}`, {
      method: 'DELETE',
    });
  }

  async uploadServiceIcon(id, file, region) {
    const formData = new FormData();
    formData.append('image', file);

    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/services/${id}/icon${query}`, {
      method: 'POST',
      body: formData,
    });
  }

  async reorderServices(order, region) {
    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/services/reorder${query}`, {
      method: 'POST',
      body: JSON.stringify({ order }),
    });
  }

  // Admin - Team
  async getTeam(region) {
    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/team${query}`);
  }

  async createTeamMember(data, region) {
    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/team${query}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTeamMember(id, data, region) {
    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/team/${id}${query}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTeamMember(id, region) {
    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/team/${id}${query}`, {
      method: 'DELETE',
    });
  }

  async uploadTeamPhoto(id, file, region) {
    const formData = new FormData();
    formData.append('image', file);

    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/team/${id}/photo${query}`, {
      method: 'POST',
      body: formData,
    });
  }

  async reorderTeam(order, region) {
    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/team/reorder${query}`, {
      method: 'POST',
      body: JSON.stringify({ order }),
    });
  }

  // Admin - Section Images
  async getSectionImages(region) {
    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/section-images${query}`);
  }

  async uploadSectionImage(sectionKey, file, region) {
    const formData = new FormData();
    formData.append('image', file);

    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/section-images/${sectionKey}${query}`, {
      method: 'POST',
      body: formData,
    });
  }

  async updateSectionImage(sectionKey, data, region) {
    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/section-images/${sectionKey}${query}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSectionImage(sectionKey, region) {
    const query = region ? `?region=${region}` : '';
    return this.request(`/api/admin/section-images/${sectionKey}${query}`, {
      method: 'DELETE',
    });
  }
}

export default new ApiService();
