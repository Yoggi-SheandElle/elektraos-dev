/* Portal Auth - Token management + API wrapper */
(function() {
  var API = localStorage.getItem('portal_api') || '';

  window.Portal = {
    token: localStorage.getItem('portal_token'),
    user: null,

    setAPI: function(url) {
      API = url.replace(/\/+$/, '');
      localStorage.setItem('portal_api', API);
    },

    getAPI: function() { return API; },

    async request(path, opts) {
      opts = opts || {};
      var headers = opts.headers || {};
      headers['Content-Type'] = 'application/json';
      if (this.token) headers['Authorization'] = 'Bearer ' + this.token;

      var url = API + path;
      var res = await fetch(url, {
        method: opts.method || 'GET',
        headers: headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined,
      });

      if (res.status === 401) {
        this.logout();
        return null;
      }
      if (!res.ok) {
        var err = await res.json().catch(function() { return { detail: 'Request failed' }; });
        throw new Error(err.detail || 'Request failed');
      }
      return res.json();
    },

    async login(username, password) {
      var data = await this.request('/portal/auth/login', {
        method: 'POST',
        body: { username: username, password: password },
      });
      if (data && data.token) {
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('portal_token', data.token);
        return data.user;
      }
      return null;
    },

    async getMe() {
      if (!this.token) return null;
      try {
        this.user = await this.request('/portal/auth/me');
        return this.user;
      } catch(e) {
        this.logout();
        return null;
      }
    },

    logout: function() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('portal_token');
      window.location.reload();
    },

    isAdmin: function() {
      return this.user && this.user.role === 'admin';
    },

    isLoggedIn: function() {
      return !!this.token;
    },
  };
})();
