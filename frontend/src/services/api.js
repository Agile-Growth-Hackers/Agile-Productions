const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('admin_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('admin_token', token);
    } else {
      localStorage.removeItem('admin_token');
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

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
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
    return data;
  }

  clearAuth() {
    this.setToken(null);
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
  async getAllSliderImages() {
    return this.request('/api/admin/slider');
  }

  async getAdminSlider() {
    return this.getAllSliderImages();
  }

  async uploadSliderImage(file, objectPosition = 'center center') {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('objectPosition', objectPosition);

    return this.request('/api/admin/slider', {
      method: 'POST',
      body: formData,
    });
  }

  async addSlider(data) {
    // Handle both file upload and existing image selection
    if (data instanceof File) {
      // New file upload
      return this.uploadSliderImage(data);
    } else {
      // Selecting from existing storage
      return this.request('/api/admin/slider', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
  }

  async updateSlider(id, data) {
    // Handle both file upload and existing image selection
    if (data instanceof File) {
      // New file upload
      const formData = new FormData();
      formData.append('image', data);

      return this.request(`/api/admin/slider/${id}`, {
        method: 'PUT',
        body: formData,
      });
    } else {
      // Selecting from existing storage
      return this.request(`/api/admin/slider/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    }
  }

  async deleteSliderImage(id) {
    return this.request(`/api/admin/slider/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteSlider(id) {
    return this.deleteSliderImage(id);
  }

  async reorderSlider(order) {
    return this.request('/api/admin/slider/reorder', {
      method: 'POST',
      body: JSON.stringify({ order }),
    });
  }

  // Admin - Gallery
  async getAllGalleryImages() {
    return this.request('/api/admin/gallery');
  }

  async getAdminGallery() {
    return this.getAllGalleryImages();
  }

  async uploadGalleryImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    return this.request('/api/admin/gallery', {
      method: 'POST',
      body: formData,
    });
  }

  async addGalleryImage(data) {
    // Handle both file upload and existing image selection
    if (data instanceof File) {
      // New file upload
      return this.uploadGalleryImage(data);
    } else {
      // Selecting from existing storage
      return this.request('/api/admin/gallery', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
  }

  async updateGalleryImage(id, fileOrData) {
    // Handle both file upload and existing image selection
    if (fileOrData instanceof File) {
      // New file upload
      const formData = new FormData();
      formData.append('image', fileOrData);

      return this.request(`/api/admin/gallery/${id}`, {
        method: 'PUT',
        body: formData,
      });
    } else {
      // Selecting from existing storage
      return this.request(`/api/admin/gallery/${id}`, {
        method: 'PUT',
        body: JSON.stringify(fileOrData),
      });
    }
  }

  async toggleGalleryMobileVisibility(id, visible) {
    return this.request(`/api/admin/gallery/${id}/mobile-visibility`, {
      method: 'PUT',
      body: JSON.stringify({ visible }),
    });
  }

  async deleteGalleryImage(id) {
    return this.request(`/api/admin/gallery/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin - Logos
  async getAllLogos() {
    return this.request('/api/admin/logos');
  }

  async getAdminLogos() {
    return this.getAllLogos();
  }

  async uploadLogo(file, altText) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('altText', altText);

    return this.request('/api/admin/logos', {
      method: 'POST',
      body: formData,
    });
  }

  async addLogo(data) {
    // Handle both file upload and existing image selection
    if (data instanceof File) {
      // New file upload
      return this.uploadLogo(data);
    } else {
      // Selecting from existing storage
      return this.request('/api/admin/logos', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
  }

  async deleteLogo(id) {
    return this.request(`/api/admin/logos/${id}`, {
      method: 'DELETE',
    });
  }

  async deactivateLogos(ids) {
    return this.request('/api/admin/logos/deactivate', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  async activateLogos(ids) {
    return this.request('/api/admin/logos/activate', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  async reorderLogos(order) {
    return this.request('/api/admin/logos/reorder', {
      method: 'POST',
      body: JSON.stringify({ order }),
    });
  }

  async deleteMultipleLogos(ids) {
    return this.request('/api/admin/logos/delete-multiple', {
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
}

export default new ApiService();
