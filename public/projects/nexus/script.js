document.addEventListener('DOMContentLoaded', () => {
  // --- View Toggle Logic ---
  const viewBoardBtn = document.getElementById('view-board-btn');
  const viewAnalyticsBtn = document.getElementById('view-analytics-btn');
  const boardView = document.getElementById('board-view');
  const analyticsView = document.getElementById('analytics-view');

  viewBoardBtn.addEventListener('click', () => {
    viewBoardBtn.classList.add('active');
    viewAnalyticsBtn.classList.remove('active');
    boardView.classList.add('active');
    analyticsView.classList.remove('active');
    updateAnalytics(); // Refresh analytics when switching view
  });

  viewAnalyticsBtn.addEventListener('click', () => {
    viewAnalyticsBtn.classList.add('active');
    viewBoardBtn.classList.remove('active');
    analyticsView.classList.add('active');
    boardView.classList.remove('active');
    updateAnalytics();
  });

  // --- Modal Logic ---
  const taskModal = document.getElementById('task-modal');
  const addTaskBtn = document.getElementById('add-task-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const cancelTaskBtn = document.getElementById('cancel-task-btn');
  const taskForm = document.getElementById('task-form');

  addTaskBtn.addEventListener('click', () => taskModal.classList.add('active'));
  closeModalBtn.addEventListener('click', () => taskModal.classList.remove('active'));
  cancelTaskBtn.addEventListener('click', () => taskModal.classList.remove('active'));

  taskModal.addEventListener('click', (e) => {
    if (e.target === taskModal) taskModal.classList.remove('active');
  });

  // --- Task Operations & States ---
  let tasks = [
    { id: 1, title: 'Set up MongoDB schemas', desc: 'Define schemas for design rooms, collaborative history logs, and user credentials.', priority: 'medium', category: 'Backend', status: 'backlog' },
    { id: 2, title: 'Figma wireframes review', desc: 'Verify user experience flows for the manga reader panel and mobile navigation layouts.', priority: 'low', category: 'Design', status: 'todo' },
    { id: 3, title: 'Aurora real-time sync', desc: 'Implement WebSockets connection to handle cursor sync coordinates and drawing history.', priority: 'high', category: 'Frontend', status: 'progress' },
    { id: 4, title: 'Design Zen animations', desc: 'Polish CSS transitions for widget selections and focus page transitions.', priority: 'medium', category: 'Design', status: 'review' },
    { id: 5, title: 'Optimize Vite configuration', desc: 'Configure manual chunking, Gzip compressions, and cache control mechanisms.', priority: 'low', category: 'Devops', status: 'done' }
  ];

  const columns = ['backlog', 'todo', 'progress', 'review', 'done'];

  // Render Kanban cards
  function renderBoard() {
    // Clear all columns
    columns.forEach(col => {
      document.getElementById(`col-${col}`).innerHTML = '';
      document.getElementById(`count-${col}`).textContent = '0';
    });

    tasks.forEach(task => {
      const colBody = document.getElementById(`col-${task.status}`);
      const card = document.createElement('div');
      card.className = `task-card priority-${task.priority}`;
      card.draggable = true;
      card.dataset.id = task.id;

      card.innerHTML = `
        <h4>${task.title}</h4>
        <p>${task.desc}</p>
        <div class="card-footer">
          <span class="card-tag">${task.category}</span>
          <div class="card-actions">
            <button class="card-action-btn move-left-btn" title="Move Left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button class="card-action-btn delete-btn" title="Delete Task">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-danger"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
            <button class="card-action-btn move-right-btn" title="Move Right">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>
      `;

      // Drag and Drop Listeners
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', task.id);
        card.style.opacity = '0.5';
      });

      card.addEventListener('dragend', () => {
        card.style.opacity = '1';
      });

      // Left / Right controls (Mobile-friendly)
      card.querySelector('.move-left-btn').addEventListener('click', () => moveTask(task.id, -1));
      card.querySelector('.move-right-btn').addEventListener('click', () => moveTask(task.id, 1));
      card.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));

      colBody.appendChild(card);
    });

    // Update count labels
    columns.forEach(col => {
      const count = tasks.filter(t => t.status === col).length;
      document.getElementById(`count-${col}`).textContent = count;
    });
  }

  // Setup Column Drag Overlays
  columns.forEach(col => {
    const colBody = document.getElementById(`col-${col}`);
    
    colBody.addEventListener('dragover', (e) => {
      e.preventDefault();
      colBody.classList.add('drag-over');
    });

    colBody.addEventListener('dragleave', () => {
      colBody.classList.remove('drag-over');
    });

    colBody.addEventListener('drop', (e) => {
      e.preventDefault();
      colBody.classList.remove('drag-over');
      const taskId = parseInt(e.dataTransfer.getData('text/plain'));
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        task.status = col;
        renderBoard();
        updateAnalytics();
      }
    });
  });

  // Shift task index
  function moveTask(id, dir) {
    const task = tasks.find(t => t.id === id);
    if (task) {
      let idx = columns.indexOf(task.status);
      idx += dir;
      if (idx >= 0 && idx < columns.length) {
        task.status = columns[idx];
        renderBoard();
        updateAnalytics();
      }
    }
  }

  // Delete Task
  function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
      tasks = tasks.filter(t => t.id !== id);
      renderBoard();
      updateAnalytics();
    }
  }

  // Form Submit Add Task
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
    const newTask = {
      id: newId,
      title: document.getElementById('task-title').value.trim(),
      desc: document.getElementById('task-desc').value.trim(),
      priority: document.getElementById('task-priority').value,
      category: document.getElementById('task-category').value,
      status: 'backlog'
    };

    tasks.push(newTask);
    taskForm.reset();
    taskModal.classList.remove('active');
    renderBoard();
    updateAnalytics();
  });

  // --- Analytics Gauge & Bars Calculation ---
  function updateAnalytics() {
    const totalCount = tasks.length;
    const doneCount = tasks.filter(t => t.status === 'done').length;
    
    // 1. Calculate Sprint Completeness
    const percentage = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
    document.getElementById('completeness-val').textContent = `${percentage}%`;

    // Circular progress stroke offset
    const circle = document.getElementById('progress-circle');
    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    const offset = circumference - (percentage / 100) * circumference;
    circle.style.strokeDashoffset = offset;

    // 2. Resource Distribution bar ratios
    const resourceContainer = document.getElementById('resource-bars-container');
    const categories = ['Design', 'Frontend', 'Backend', 'Devops'];
    
    resourceContainer.innerHTML = '';
    categories.forEach(cat => {
      const catCount = tasks.filter(t => t.category === cat).length;
      const catPercent = totalCount > 0 ? Math.round((catCount / totalCount) * 100) : 0;
      
      const row = document.createElement('div');
      row.className = 'res-row';
      row.innerHTML = `
        <div class="res-meta">
          <span class="res-name">${cat} Tasks</span>
          <span class="res-count">${catCount} (${catPercent}%)</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width: ${catPercent}%"></div>
        </div>
      `;
      resourceContainer.appendChild(row);
    });

    // 3. Render Burndown trend line path
    // Day 1 total count, then descending down to Done ratio
    const burndownPath = document.getElementById('burndown-path');
    const dotsGroup = document.getElementById('burndown-dots');
    dotsGroup.innerHTML = '';

    // Simulate sprint progress timeline coordinates (x, y)
    // 5 days coordinates across SVG box (width: 500, height: 220, margins: X[40, 480], Y[20, 170])
    const points = [
      { x: 40, y: 40 }, // Day 1 always starts high (total uncompleted)
      { x: 150, y: Math.max(40, 170 - (170 - 40) * (tasks.filter(t => t.status !== 'done').length / Math.max(1, totalCount))) },
      { x: 260, y: Math.max(50, 170 - (170 - 40) * (tasks.filter(t => t.status === 'progress' || t.status === 'review' || t.status === 'todo').length / Math.max(1, totalCount))) },
      { x: 370, y: Math.max(60, 170 - (170 - 40) * (tasks.filter(t => t.status === 'review' || t.status === 'todo').length / Math.max(1, totalCount))) },
      { x: 480, y: 170 - (170 - 40) * (tasks.filter(t => t.status === 'backlog').length / Math.max(1, totalCount)) }
    ];

    // Build SVG path string
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x} ${points[i].y}`;
    }
    burndownPath.setAttribute('d', pathD);

    // Draw dots at vertices
    points.forEach(p => {
      const circleDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circleDot.setAttribute('cx', p.x);
      circleDot.setAttribute('cy', p.y);
      circleDot.setAttribute('r', '5');
      circleDot.setAttribute('fill', '#f5576c');
      circleDot.setAttribute('stroke', '#fff');
      circleDot.setAttribute('stroke-width', '1.5');
      dotsGroup.appendChild(circleDot);
    });
  }

  // Initial Boot
  renderBoard();
  updateAnalytics();
});
