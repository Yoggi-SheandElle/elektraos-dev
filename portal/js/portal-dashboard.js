/* Portal Dashboard - Activity feed + project cards */
(function() {

  window.PortalDash = {
    async render(container) {
      var user = Portal.user;
      if (!user) return;

      var onboarded = localStorage.getItem('portal_onboarded_' + user.id);
      var html = '';

      // Welcome card
      html += '<div class="p-welcome">';
      html += '<h2>Hey, <span>' + esc(user.display_name) + '</span></h2>';
      if (user.vibe) html += '<div class="p-vibe">' + esc(user.vibe) + '</div>';
      html += '<p>Your creative space is ready. Jump into a project or check the activity feed below.</p>';
      html += '</div>';

      // Onboarding (first visit)
      if (!onboarded) {
        html += '<div class="p-onboarding" id="onboarding" style="display:block;">';
        html += '<p>Welcome to ElektraOS. This is a space where your creativity has no limits. ';
        html += 'No boundaries, no corporate rules - just your mind, your skills, and the people around you. ';
        html += 'ElektraOS and its agents handle the infrastructure. You handle the magic. ';
        html += 'If this resonates and you want to go deeper, that is always your choice.</p>';
        if (user.bio) html += '<p class="p-bio">"' + esc(user.bio) + '"</p>';
        html += '<button class="p-onboarding-dismiss" onclick="PortalDash.dismissOnboarding(' + user.id + ')">Got it, let me explore</button>';
        html += '</div>';
      }

      // Projects
      html += '<div class="p-section-title">Projects <span id="projectCount"></span></div>';
      html += '<div class="p-projects-grid" id="projectsGrid">Loading...</div>';

      // Activity
      html += '<div class="p-section-title" style="margin-top:32px;">Activity <span>recent</span></div>';
      html += '<div class="p-timeline" id="activityFeed">Loading...</div>';

      container.innerHTML = html;

      // Load data
      this.loadProjects();
      this.loadActivity();
    },

    async loadProjects() {
      try {
        var projects = await Portal.request('/portal/projects');
        var grid = document.getElementById('projectsGrid');
        var count = document.getElementById('projectCount');
        if (!projects || projects.length === 0) {
          grid.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">No projects yet.</p>';
          count.textContent = '(0)';
          return;
        }
        count.textContent = '(' + projects.length + ')';
        var html = '';
        projects.forEach(function(p) {
          html += '<div class="p-project-card" onclick="PortalApp.navigate(\'kanban\', ' + p.id + ')">';
          html += '<span class="p-status-badge ' + (p.status || 'idea') + '">' + esc(p.status || 'idea') + '</span>';
          html += '<h3>' + esc(p.name) + '</h3>';
          if (p.vibe_text) html += '<div class="p-card-vibe">' + esc(p.vibe_text) + '</div>';
          if (p.description) html += '<p>' + esc(p.description).substring(0, 120) + '</p>';
          html += '<div class="p-card-meta">';
          html += '<span>' + (p.total_tasks || 0) + ' tasks</span>';
          if (p.deadline) html += '<span>Due: ' + new Date(p.deadline).toLocaleDateString() + '</span>';
          html += '</div>';
          html += '</div>';
        });
        grid.innerHTML = html;
      } catch(e) {
        document.getElementById('projectsGrid').innerHTML = '<p style="color:var(--red);font-size:13px;">Failed to load projects</p>';
      }
    },

    async loadActivity() {
      try {
        var entries = await Portal.request('/portal/activity?limit=20');
        var feed = document.getElementById('activityFeed');
        if (!entries || entries.length === 0) {
          feed.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">No activity yet.</p>';
          return;
        }
        var html = '';
        entries.forEach(function(e) {
          var dt = new Date(e.created_at);
          var timeStr = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          var dateStr = dt.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
          html += '<div class="p-timeline-entry">';
          html += '<div class="p-timeline-header">';
          html += '<span class="p-timeline-actor">' + esc(e.actor_name || 'System') + '</span>';
          html += '<span class="p-timeline-time">' + dateStr + ' ' + timeStr + '</span>';
          html += '</div>';
          html += '<div class="p-timeline-detail">' + esc(e.detail || e.action) + '</div>';
          html += '</div>';
        });
        feed.innerHTML = html;
      } catch(e) {
        document.getElementById('activityFeed').innerHTML = '<p style="color:var(--red);font-size:13px;">Failed to load activity</p>';
      }
    },

    dismissOnboarding: function(userId) {
      localStorage.setItem('portal_onboarded_' + userId, '1');
      var el = document.getElementById('onboarding');
      if (el) el.style.display = 'none';
    },
  };

  function esc(s) { var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

})();
