/* Portal Kanban - Drag-and-drop task board */
(function() {

  var currentProjectId = null;
  var isAdmin = false;
  var columns = ['backlog', 'todo', 'in_progress', 'review', 'done'];
  var colNames = { backlog: 'Backlog', todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };

  window.PortalKanban = {
    async render(container, projectId) {
      currentProjectId = projectId;
      isAdmin = Portal.isAdmin();

      // Load project info
      var project;
      try { project = await Portal.request('/portal/projects/' + projectId); }
      catch(e) { container.innerHTML = '<p style="color:var(--red);">Project not found or access denied.</p>'; return; }

      var html = '';
      html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">';
      html += '<div>';
      html += '<a href="#" onclick="PortalApp.navigate(\'dashboard\');return false;" style="color:var(--text-muted);font-size:12px;text-decoration:none;">&larr; Back to dashboard</a>';
      html += '<h2 style="margin:4px 0 0;font-size:20px;">' + esc(project.name) + '</h2>';
      if (project.vibe_text) html += '<div style="font-family:var(--font-mono);font-size:11px;color:var(--purple);margin-top:2px;">' + esc(project.vibe_text) + '</div>';
      html += '</div>';
      if (isAdmin) {
        html += '<button class="p-form-btn" onclick="PortalKanban.showAddTask()">+ Add Task</button>';
      }
      html += '</div>';

      // Kanban columns
      html += '<div class="p-kanban" id="kanbanBoard">';
      columns.forEach(function(col) {
        html += '<div class="p-kanban-col" data-status="' + col + '" ondragover="PortalKanban.dragOver(event)" ondrop="PortalKanban.drop(event, \'' + col + '\')" ondragleave="PortalKanban.dragLeave(event)">';
        html += '<div class="p-kanban-col-header"><span>' + colNames[col] + '</span><span class="p-kanban-col-count" id="count-' + col + '">0</span></div>';
        html += '<div class="p-kanban-cards" id="cards-' + col + '"></div>';
        html += '</div>';
      });
      html += '</div>';

      container.innerHTML = html;
      this.loadTasks();
    },

    async loadTasks() {
      try {
        var kanban = await Portal.request('/portal/projects/' + currentProjectId + '/tasks');
        columns.forEach(function(col) {
          var cards = kanban[col] || [];
          var el = document.getElementById('cards-' + col);
          var countEl = document.getElementById('count-' + col);
          countEl.textContent = cards.length;
          if (cards.length === 0) { el.innerHTML = ''; return; }
          var html = '';
          cards.forEach(function(t) {
            html += '<div class="p-kanban-card" draggable="true" data-task-id="' + t.id + '" ondragstart="PortalKanban.dragStart(event, ' + t.id + ')" onclick="PortalKanban.showTask(' + t.id + ')">';
            html += '<h4>' + esc(t.title) + '</h4>';
            if (t.assignee_name) html += '<div class="p-card-assignee">' + esc(t.assignee_name) + '</div>';
            if (t.tags && t.tags.length) {
              html += '<div class="p-card-tags">';
              t.tags.forEach(function(tag) { html += '<span class="p-card-tag">' + esc(tag) + '</span>'; });
              html += '</div>';
            }
            if (t.due_date) html += '<div class="p-card-due">Due: ' + new Date(t.due_date).toLocaleDateString() + '</div>';
            if (t.comment_count) html += '<div style="font-size:10px;color:var(--text-muted);margin-top:4px;">' + t.comment_count + ' comment' + (t.comment_count > 1 ? 's' : '') + '</div>';
            if (isAdmin && t.suggested_assignee_id && !t.assigned_to) {
              html += '<div style="font-size:10px;color:var(--green);margin-top:4px;">AI match: ' + (t.match_score ? Math.round(t.match_score * 100) + '%' : 'pending') + '</div>';
            }
            html += '</div>';
          });
          el.innerHTML = html;
        });
      } catch(e) {
        console.error('Failed to load tasks:', e);
      }
    },

    // Drag and drop
    dragStart: function(e, taskId) {
      e.dataTransfer.setData('text/plain', taskId);
      e.target.classList.add('dragging');
    },

    dragOver: function(e) {
      e.preventDefault();
      var col = e.currentTarget;
      col.classList.add('drag-over');
    },

    dragLeave: function(e) {
      e.currentTarget.classList.remove('drag-over');
    },

    async drop(e, newStatus) {
      e.preventDefault();
      e.currentTarget.classList.remove('drag-over');
      var taskId = e.dataTransfer.getData('text/plain');
      if (!taskId) return;

      try {
        await Portal.request('/portal/tasks/' + taskId + '/move', {
          method: 'PUT',
          body: { status: newStatus, sort_order: 0 },
        });
        this.loadTasks();
      } catch(err) {
        alert('Cannot move task: ' + err.message);
      }
    },

    showAddTask: function() {
      var html = '<h3>New Task</h3>';
      html += '<div class="p-form-group"><label class="p-form-label">Title</label><input class="p-form-input" id="newTaskTitle" placeholder="What needs doing?"></div>';
      html += '<div class="p-form-group"><label class="p-form-label">Description</label><textarea class="p-form-input p-form-textarea" id="newTaskDesc" placeholder="Details..."></textarea></div>';
      html += '<div class="p-form-group"><label class="p-form-label">Tags (comma separated)</label><input class="p-form-input" id="newTaskTags" placeholder="frontend, design, urgent"></div>';
      html += '<div class="p-form-group"><label class="p-form-label">Due Date</label><input class="p-form-input" id="newTaskDue" type="date"></div>';
      html += '<button class="p-form-btn" onclick="PortalKanban.createTask()">Create Task</button>';
      PortalApp.showModal(html);
    },

    async createTask() {
      var title = document.getElementById('newTaskTitle').value.trim();
      if (!title) { alert('Title required'); return; }
      var tags = document.getElementById('newTaskTags').value.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
      var due = document.getElementById('newTaskDue').value || null;
      var desc = document.getElementById('newTaskDesc').value.trim();

      try {
        await Portal.request('/portal/projects/' + currentProjectId + '/tasks', {
          method: 'POST',
          body: { title: title, description: desc || null, tags: tags.length ? tags : null, due_date: due },
        });
        PortalApp.closeModal();
        this.loadTasks();
      } catch(e) { alert('Error: ' + e.message); }
    },

    async showTask(taskId) {
      try {
        var comments = await Portal.request('/portal/tasks/' + taskId + '/comments');
        var html = '<h3>Task Details</h3>';
        html += '<div id="taskDetailContent">Loading...</div>';

        // Comments section
        html += '<div style="margin-top:20px;border-top:1px solid var(--border);padding-top:16px;">';
        html += '<div class="p-section-title">Comments <span>(' + comments.length + ')</span></div>';
        if (comments.length) {
          comments.forEach(function(c) {
            html += '<div style="margin-bottom:12px;padding:10px;background:var(--bg-tertiary);border-radius:var(--radius-sm);">';
            html += '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">';
            html += '<span style="font-size:12px;font-weight:600;color:var(--cyan);">' + esc(c.author_name) + '</span>';
            html += '<span style="font-size:10px;color:var(--text-muted);">' + new Date(c.created_at).toLocaleString() + '</span>';
            html += '</div>';
            html += '<div style="font-size:13px;color:var(--text-secondary);line-height:1.5;">' + esc(c.body) + '</div>';
            html += '</div>';
          });
        }
        html += '<div class="p-form-group"><textarea class="p-form-input p-form-textarea" id="commentBody" placeholder="Add a comment..."></textarea></div>';
        html += '<button class="p-form-btn" onclick="PortalKanban.addComment(' + taskId + ')">Post Comment</button>';
        html += '</div>';

        PortalApp.showModal(html);
      } catch(e) { alert('Error: ' + e.message); }
    },

    async addComment(taskId) {
      var body = document.getElementById('commentBody').value.trim();
      if (!body) return;
      try {
        await Portal.request('/portal/tasks/' + taskId + '/comments', {
          method: 'POST',
          body: { body: body },
        });
        this.showTask(taskId); // Refresh
      } catch(e) { alert('Error: ' + e.message); }
    },
  };

  function esc(s) { var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

})();
