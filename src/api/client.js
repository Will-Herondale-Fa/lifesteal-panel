const API_BASE = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
    this.token = localStorage.getItem('panel_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('panel_token', token);
    } else {
      localStorage.removeItem('panel_token');
    }
  }

  getToken() {
    return this.token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    let response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (fetchErr) {
      console.error('[API] Network error:', fetchErr.message);
      throw fetchErr;
    }

    if (response.status === 401) {
      this.setToken(null);
      window.location.href = '/login';
      throw new Error('Authentication expired');
    }

    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        ...data,
      };
    }

    return data;
  }

  // Auth
  login(username, password, totpToken) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, totpToken }),
    });
  }

  getMe() {
    return this.request('/auth/me');
  }

  changePassword(currentPassword, newPassword) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  setup2FA() {
    return this.request('/auth/2fa/setup', { method: 'POST' });
  }

  verify2FA(token) {
    return this.request('/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // Server
  getServerStatus() {
    return this.request('/server/status');
  }

  getServerLogs(lines = 100) {
    return this.request(`/server/logs?lines=${lines}`);
  }

  startServer() {
    return this.request('/server/start', { method: 'POST' });
  }

  stopServer() {
    return this.request('/server/stop', {
      method: 'POST',
      body: JSON.stringify({ confirm: true }),
    });
  }

  restartServer() {
    return this.request('/server/restart', {
      method: 'POST',
      body: JSON.stringify({ confirm: true }),
    });
  }

  sendCommand(command) {
    return this.request('/server/command', {
      method: 'POST',
      body: JSON.stringify({ command }),
    });
  }

  getServerProperties() {
    return this.request('/server/properties');
  }

  updateServerProperties(properties) {
    return this.request('/server/properties', {
      method: 'PUT',
      body: JSON.stringify({ properties, confirm: true }),
    });
  }

  // Files
  browseFiles(path = '') {
    return this.request(`/files/browse?path=${encodeURIComponent(path)}`);
  }

  readFile(path) {
    return this.request(`/files/read?path=${encodeURIComponent(path)}`);
  }

  writeFile(path, content) {
    return this.request('/files/write', {
      method: 'PUT',
      body: JSON.stringify({ path, content }),
    });
  }

  deleteFile(path) {
    return this.request('/files/delete', {
      method: 'DELETE',
      body: JSON.stringify({ path, confirm: true }),
    });
  }

  getFileDiff(path) {
    return this.request(`/files/diff?path=${encodeURIComponent(path)}`);
  }

  async uploadFile(path, file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    const response = await fetch(`${this.baseUrl}/files/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}` },
      body: formData,
    });

    if (!response.ok) throw await response.json();
    return response.json();
  }

  // Plugins
  getPlugins() {
    return this.request('/plugins/list');
  }

  getPluginConfig(name, file = 'config.yml') {
    return this.request(`/plugins/${name}/config?file=${encodeURIComponent(file)}`);
  }

  updatePluginConfig(name, file, content) {
    return this.request(`/plugins/${name}/config`, {
      method: 'PUT',
      body: JSON.stringify({ file, content }),
    });
  }

  togglePlugin(name) {
    return this.request(`/plugins/${name}/toggle`, { method: 'POST' });
  }

  deletePlugin(name, deleteData = false) {
    return this.request(`/plugins/${name}`, {
      method: 'DELETE',
      body: JSON.stringify({ confirm: true, deleteData }),
    });
  }

  getPluginDependencies() {
    return this.request('/plugins/dependencies');
  }

  async uploadPlugin(file, category = '') {
    const formData = new FormData();
    formData.append('plugin', file);
    formData.append('category', category);

    const response = await fetch(`${this.baseUrl}/plugins/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}` },
      body: formData,
    });

    if (!response.ok) throw await response.json();
    return response.json();
  }

  // Players
  getOnlinePlayers() {
    return this.request('/players/online');
  }

  getWhitelist() {
    return this.request('/players/whitelist');
  }

  updateWhitelist(username, action = 'add') {
    return this.request('/players/whitelist', {
      method: 'POST',
      body: JSON.stringify({ username, action }),
    });
  }

  getOps() {
    return this.request('/players/ops');
  }

  opPlayer(username, level = 4) {
    return this.request(`/players/${username}/op`, {
      method: 'POST',
      body: JSON.stringify({ level }),
    });
  }

  deopPlayer(username) {
    return this.request(`/players/${username}/op`, { method: 'DELETE' });
  }

  getBanned() {
    return this.request('/players/banned');
  }

  banPlayer(username, reason) {
    return this.request(`/players/${username}/ban`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  unbanPlayer(username) {
    return this.request(`/players/${username}/ban`, { method: 'DELETE' });
  }

  getPlayerStats(username) {
    return this.request(`/players/${username}/stats`);
  }

  // World
  getWorldInfo() {
    return this.request('/world/info');
  }

  getWorldBorder() {
    return this.request('/world/border');
  }

  updateWorldBorder(size) {
    return this.request('/world/border', {
      method: 'PUT',
      body: JSON.stringify({ size }),
    });
  }

  startPregen(world, radius) {
    return this.request('/world/pregen', {
      method: 'POST',
      body: JSON.stringify({ world, radius }),
    });
  }

  resetWorld(world) {
    return this.request('/world/reset', {
      method: 'POST',
      body: JSON.stringify({ world, confirm: true }),
    });
  }

  getDatapacks() {
    return this.request('/world/datapacks');
  }

  // Backups
  getBackups() {
    return this.request('/backups/list');
  }

  createBackup() {
    return this.request('/backups/create', { method: 'POST' });
  }

  deleteBackup(name) {
    return this.request(`/backups/${name}`, { method: 'DELETE' });
  }

  downloadBackupUrl(name) {
    return `${this.baseUrl}/backups/${name}/download`;
  }

  // Schedules
  getSchedules() {
    return this.request('/schedules/list');
  }

  createSchedule(name, cron, action) {
    return this.request('/schedules/create', {
      method: 'POST',
      body: JSON.stringify({ name, cron, action }),
    });
  }

  deleteSchedule(id) {
    return this.request(`/schedules/${id}`, { method: 'DELETE' });
  }

  toggleSchedule(id) {
    return this.request(`/schedules/${id}/toggle`, { method: 'POST' });
  }

  // ─── VM Control (via SWA serverless API, always available) ─────────────
  async getVmStatus() {
    const res = await fetch('/api/vm-status');
    if (!res.ok) throw new Error('Failed to get VM status');
    return res.json();
  }

  async startVm() {
    const res = await fetch('/api/vm-start', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to start VM');
    return res.json();
  }
}

export const api = new ApiClient();
export default api;
