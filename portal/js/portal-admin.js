/* Portal Admin - User management + AI matching */
(function() {

  window.PortalAdmin = {
    async render(container) {
      if (!Portal.isAdmin()) {
        container.innerHTML = '<p style="color:var(--red);">Admin access required.</p>';
        return;
      }

      var html = '';
      html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">';
      html += '<h2 style="margin:0;font-size:20px;">Admin Panel</h2>';
      html += '<button class="p-form-btn" onclick="PortalAdmin.showCreateUser()">+ Invite Collaborator</button>';
      html += '</div>';

      html += '<div class="p-section-title">Team Members</div>';
      html += '<div id="usersTable">Loading...</div>';

      html += '<div class="p-section-title" style="margin-top:32px;">AI Matching Queue</div>';
      html += '<div id="matchingQueue">Loading...</div>';

      container.innerHTML = html;
      this.loadUsers();
      this.loadMatchingQueue();
    },

    async loadUsers() {
      try {
        var users = await Portal.request('/portal/admin/users');
        var html = '<table class="p-admin-table"><thead><tr>';
        html += '<th>Name</th><th>Vibe</th><th>Role</th><th>Last Login</th><th>Actions</th>';
        html += '</tr></thead><tbody>';
        users.forEach(function(u) {
          html += '<tr style="opacity:' + (u.is_active ? '1' : '0.5') + '">';
          html += '<td><strong>' + esc(u.display_name) + '</strong><br><span style="font-size:11px;color:var(--text-muted);">@' + esc(u.username) + '</span></td>';
          html += '<td style="font-family:var(--font-mono);font-size:11px;color:var(--purple);">' + esc(u.vibe || '-') + '</td>';
          html += '<td><span class="p-status-badge ' + (u.role === 'admin' ? 'active' : 'idea') + '">' + esc(u.role) + '</span></td>';
          html += '<td style="font-size:12px;color:var(--text-muted);">' + (u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never') + '</td>';
          html += '<td>';
          html += '<button class="p-form-btn secondary" style="padding:4px 10px;font-size:10px;margin-right:4px;" onclick="PortalAdmin.showEditUser(' + u.id + ')">Edit</button>';
          html += '<button class="p-form-btn secondary" style="padding:4px 10px;font-size:10px;margin-right:4px;" onclick="PortalAdmin.showSkillExtract(' + u.id + ',\'' + esc(u.display_name) + '\')">Skills</button>';
          html += '<button class="p-form-btn secondary" style="padding:4px 10px;font-size:10px;" onclick="PortalAdmin.viewProfile(' + u.id + ')">Profile</button>';
          html += '</td>';
          html += '</tr>';
        });
        html += '</tbody></table>';
        document.getElementById('usersTable').innerHTML = html;
      } catch(e) {
        document.getElementById('usersTable').innerHTML = '<p style="color:var(--red);">Failed to load users</p>';
      }
    },

    async loadMatchingQueue() {
      // Show all projects with unassigned tasks
      try {
        var projects = await Portal.request('/portal/projects');
        var html = '';
        if (!projects.length) {
          html = '<p style="color:var(--text-muted);font-size:13px;">No projects yet.</p>';
          document.getElementById('matchingQueue').innerHTML = html;
          return;
        }
        for (var i = 0; i < projects.length; i++) {
          var p = projects[i];
          var kanban = await Portal.request('/portal/projects/' + p.id + '/tasks');
          var unassigned = [];
          ['backlog', 'todo', 'in_progress', 'review'].forEach(function(col) {
            (kanban[col] || []).forEach(function(t) {
              if (!t.assigned_to) unassigned.push(t);
            });
          });
          if (unassigned.length === 0) continue;
          html += '<div style="margin-bottom:16px;">';
          html += '<div style="font-size:14px;font-weight:600;margin-bottom:8px;">' + esc(p.name) + ' <span style="color:var(--text-muted);font-weight:400;">(' + unassigned.length + ' unassigned)</span></div>';
          unassigned.forEach(function(t) {
            html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:6px;">';
            html += '<span style="flex:1;font-size:13px;">' + esc(t.title) + '</span>';
            if (t.match_score) {
              html += '<span style="font-family:var(--font-mono);font-size:10px;color:var(--green);">' + Math.round(t.match_score * 100) + '% match</span>';
              html += '<button class="p-form-btn" style="padding:4px 12px;font-size:10px;" onclick="PortalAdmin.approveMatch(' + t.id + ')">Approve</button>';
            } else {
              html += '<button class="p-form-btn secondary" style="padding:4px 12px;font-size:10px;" onclick="PortalAdmin.triggerMatch(' + t.id + ')">Find Match</button>';
            }
            html += '</div>';
          });
          html += '</div>';
        }
        document.getElementById('matchingQueue').innerHTML = html || '<p style="color:var(--text-muted);font-size:13px;">All tasks assigned.</p>';
      } catch(e) {
        document.getElementById('matchingQueue').innerHTML = '<p style="color:var(--red);">Failed to load</p>';
      }
    },

    showCreateUser: function() {
      var html = '<h3>Invite a Collaborator</h3>';
      html += '<div class="p-form-group"><label class="p-form-label">Username</label><input class="p-form-input" id="cuUsername" placeholder="lowercase, no spaces"></div>';
      html += '<div class="p-form-group"><label class="p-form-label">Display Name</label><input class="p-form-input" id="cuDisplayName" placeholder="Their real name"></div>';
      html += '<div class="p-form-group"><label class="p-form-label">Password</label><input class="p-form-input" id="cuPassword" placeholder="You set this, share it privately"></div>';
      html += '<div class="p-form-group"><label class="p-form-label">LinkedIn URL</label><input class="p-form-input" id="cuLinkedin" placeholder="https://linkedin.com/in/..."></div>';
      html += '<div class="p-form-group"><label class="p-form-label">Why you invited them (personal note)</label><textarea class="p-form-input p-form-textarea" id="cuBio" placeholder="What makes them special to you..."></textarea></div>';
      html += '<div class="p-form-group"><label class="p-form-label">Vibe / Tagline</label><input class="p-form-input" id="cuVibe" placeholder="e.g. The Data Whisperer, Pixel Alchemist"></div>';
      html += '<button class="p-form-btn" onclick="PortalAdmin.createUser()">Send Invitation</button>';
      PortalApp.showModal(html);
    },

    async createUser() {
      var username = document.getElementById('cuUsername').value.trim();
      var displayName = document.getElementById('cuDisplayName').value.trim();
      var password = document.getElementById('cuPassword').value;
      if (!username || !displayName || !password) { alert('Username, name, and password are required'); return; }

      try {
        await Portal.request('/portal/admin/users', {
          method: 'POST',
          body: {
            username: username,
            display_name: displayName,
            password: password,
            linkedin_url: document.getElementById('cuLinkedin').value.trim() || null,
            bio: document.getElementById('cuBio').value.trim() || null,
            vibe: document.getElementById('cuVibe').value.trim() || null,
          },
        });
        PortalApp.closeModal();
        this.loadUsers();
      } catch(e) { alert('Error: ' + e.message); }
    },

    showEditUser: function(userId) {
      // Fetch user then show edit form
      Portal.request('/portal/admin/users').then(function(users) {
        var u = users.find(function(x) { return x.id === userId; });
        if (!u) { alert('User not found'); return; }
        var html = '<h3>Edit: ' + esc(u.display_name) + '</h3>';
        html += '<div class="p-form-group"><label class="p-form-label">Display Name</label><input class="p-form-input" id="euDisplayName" value="' + esc(u.display_name) + '"></div>';
        html += '<div class="p-form-group"><label class="p-form-label">Email</label><input class="p-form-input" id="euEmail" value="' + esc(u.email || '') + '"></div>';
        html += '<div class="p-form-group"><label class="p-form-label">LinkedIn</label><input class="p-form-input" id="euLinkedin" value="' + esc(u.linkedin_url || '') + '"></div>';
        html += '<div class="p-form-group"><label class="p-form-label">Bio</label><textarea class="p-form-input p-form-textarea" id="euBio">' + esc(u.bio || '') + '</textarea></div>';
        html += '<div class="p-form-group"><label class="p-form-label">Vibe</label><input class="p-form-input" id="euVibe" value="' + esc(u.vibe || '') + '"></div>';
        html += '<div style="display:flex;gap:8px;">';
        html += '<button class="p-form-btn" onclick="PortalAdmin.updateUser(' + userId + ')">Save</button>';
        html += '<button class="p-form-btn secondary" onclick="PortalAdmin.changePassword(' + userId + ')">Change Password</button>';
        html += '</div>';
        PortalApp.showModal(html);
      });
    },

    async updateUser(userId) {
      try {
        await Portal.request('/portal/admin/users/' + userId, {
          method: 'PUT',
          body: {
            display_name: document.getElementById('euDisplayName').value.trim() || null,
            email: document.getElementById('euEmail').value.trim() || null,
            linkedin_url: document.getElementById('euLinkedin').value.trim() || null,
            bio: document.getElementById('euBio').value.trim() || null,
            vibe: document.getElementById('euVibe').value.trim() || null,
          },
        });
        PortalApp.closeModal();
        this.loadUsers();
      } catch(e) { alert('Error: ' + e.message); }
    },

    changePassword: function(userId) {
      var pw = prompt('Enter new password:');
      if (!pw) return;
      Portal.request('/portal/admin/users/' + userId + '/password', {
        method: 'PUT',
        body: { password: pw },
      }).then(function() { alert('Password changed'); }).catch(function(e) { alert('Error: ' + e.message); });
    },

    showSkillExtract: function(userId, name) {
      var html = '<h3>Extract Skills: ' + esc(name) + '</h3>';
      html += '<p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">Paste their LinkedIn About, Experience, and Skills sections below. The AI will generate a structured skill profile.</p>';
      html += '<div class="p-form-group"><textarea class="p-form-input p-form-textarea" id="linkedinText" style="min-height:200px;" placeholder="Paste LinkedIn profile text here..."></textarea></div>';
      html += '<button class="p-form-btn" id="extractBtn" onclick="PortalAdmin.extractSkills(' + userId + ')">Extract with AI</button>';
      PortalApp.showModal(html);
    },

    async extractSkills(userId) {
      var text = document.getElementById('linkedinText').value.trim();
      if (!text) { alert('Paste some LinkedIn text first'); return; }
      var btn = document.getElementById('extractBtn');
      btn.textContent = 'Extracting...';
      btn.disabled = true;
      try {
        var result = await Portal.request('/portal/admin/users/' + userId + '/extract-skills', {
          method: 'POST',
          body: { linkedin_text: text },
        });
        var html = '<h3>Skills Extracted</h3>';
        if (result.creative_angle) html += '<p style="color:var(--purple);font-style:italic;margin-bottom:12px;">' + esc(result.creative_angle) + '</p>';
        if (result.summary) html += '<p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">' + esc(result.summary) + '</p>';
        if (result.skills && result.skills.length) {
          html += '<div class="p-skill-tags">';
          result.skills.forEach(function(s) {
            html += '<span class="p-skill-tag ' + (s.level === 'expert' ? 'expert' : '') + '">' + esc(s.skill) + (s.years ? ' (' + s.years + 'y)' : '') + '</span>';
          });
          html += '</div>';
        }
        if (result.strengths && result.strengths.length) {
          html += '<div style="margin-top:12px;"><strong style="font-size:11px;color:var(--text-muted);">Strengths:</strong>';
          html += '<div style="margin-top:4px;font-size:13px;color:var(--text-secondary);">' + result.strengths.join(' - ') + '</div></div>';
        }
        html += '<button class="p-form-btn" style="margin-top:16px;" onclick="PortalApp.closeModal()">Done</button>';
        PortalApp.showModal(html);
      } catch(e) {
        alert('Extraction failed: ' + e.message);
        btn.textContent = 'Extract with AI';
        btn.disabled = false;
      }
    },

    async triggerMatch(taskId) {
      try {
        var result = await Portal.request('/portal/admin/match/' + taskId, { method: 'POST' });
        if (result.matches && result.matches.length) {
          var top = result.matches[0];
          alert('Top match: ' + (top.reason || 'Score: ' + Math.round(top.score * 100) + '%'));
        } else {
          alert('No matches found. Make sure team members have skill profiles.');
        }
        this.loadMatchingQueue();
      } catch(e) { alert('Matching failed: ' + e.message); }
    },

    async approveMatch(taskId) {
      try {
        await Portal.request('/portal/admin/match/' + taskId + '/approve', { method: 'POST' });
        this.loadMatchingQueue();
      } catch(e) { alert('Error: ' + e.message); }
    },

    viewProfile: function(userId) {
      Portal.request('/portal/users/' + userId + '/skills').then(function(data) {
        var html = '<h3>' + esc(data.display_name || 'Profile') + '</h3>';
        if (data.vibe) html += '<div style="font-family:var(--font-mono);font-size:11px;color:var(--purple);margin-bottom:12px;">' + esc(data.vibe) + '</div>';
        if (data.creative_angle) html += '<p style="font-style:italic;color:var(--cyan);margin-bottom:12px;">' + esc(data.creative_angle) + '</p>';
        if (data.summary) html += '<p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">' + esc(data.summary) + '</p>';
        if (data.skills && data.skills.length) {
          html += '<div class="p-section-title">Skills</div><div class="p-skill-tags">';
          data.skills.forEach(function(s) {
            html += '<span class="p-skill-tag ' + (s.level === 'expert' ? 'expert' : '') + '">' + esc(s.skill) + '</span>';
          });
          html += '</div>';
        }
        if (data.strengths && data.strengths.length) {
          html += '<div class="p-section-title" style="margin-top:16px;">Strengths</div>';
          html += '<div style="font-size:13px;color:var(--text-secondary);">' + data.strengths.join(' - ') + '</div>';
        }
        html += '<div style="margin-top:12px;font-family:var(--font-mono);font-size:10px;color:var(--text-muted);">Availability: ' + esc(data.availability || 'unknown') + '</div>';
        html += '<button class="p-form-btn secondary" style="margin-top:16px;" onclick="PortalApp.closeModal()">Close</button>';
        PortalApp.showModal(html);
      }).catch(function(e) { alert('Error: ' + e.message); });
    },
  };

  function esc(s) { var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

})();
