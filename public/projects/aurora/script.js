document.addEventListener('DOMContentLoaded', () => {
  // --- Canvas Drawing Logic ---
  const canvas = document.getElementById('paint-canvas');
  const ctx = canvas.getContext('2d');
  const coordsLabel = document.getElementById('coords');
  const sizeSlider = document.getElementById('brush-size');
  const sizeVal = document.getElementById('brush-size-val');
  const colorPicker = document.getElementById('color-picker');
  const swatchesContainer = document.getElementById('current-palette');
  const undoBtn = document.getElementById('undo-btn');
  const clearBtn = document.getElementById('clear-btn');
  const exportBtn = document.getElementById('export-btn');

  let isDrawing = false;
  let currentTool = 'pencil';
  let currentColor = '#8a2be2';
  let currentSize = 5;
  let undoHistory = [];
  const maxHistory = 15;

  // Set canvas size to fill container
  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Fill canvas with background color
    ctx.fillStyle = '#161722';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Save initial state
    saveState();
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Save current canvas state to history
  function saveState() {
    if (undoHistory.length >= maxHistory) {
      undoHistory.shift();
    }
    undoHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  }

  // Restore previous state
  function undo() {
    if (undoHistory.length > 1) {
      undoHistory.pop(); // Remove current state
      const prevState = undoHistory[undoHistory.length - 1];
      ctx.putImageData(prevState, 0, 0);
    }
  }

  undoBtn.addEventListener('click', undo);

  // Mouse & Touch events
  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  function startDrawing(e) {
    isDrawing = true;
    const pos = getMousePos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineWidth = currentSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentTool === 'eraser') {
      ctx.strokeStyle = '#161722'; // Matches background
    } else {
      ctx.strokeStyle = currentColor;
    }
    
    // Draw initial dot
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function draw(e) {
    const pos = getMousePos(e);
    coordsLabel.textContent = `X: ${Math.round(pos.x)} | Y: ${Math.round(pos.y)}`;
    
    if (!isDrawing) return;

    if (currentTool === 'eraser') {
      ctx.strokeStyle = '#161722';
    } else {
      ctx.strokeStyle = currentColor;
    }
    
    ctx.lineWidth = currentSize;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function stopDrawing() {
    if (isDrawing) {
      isDrawing = false;
      ctx.closePath();
      saveState();
    }
  }

  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  window.addEventListener('mouseup', stopDrawing);

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startDrawing(e);
  });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    draw(e);
  });
  window.addEventListener('touchend', stopDrawing);

  // Tool Swapper
  const toolBtns = document.querySelectorAll('.tool-btn');
  toolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toolBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTool = btn.dataset.tool;
    });
  });

  // Brush Size
  sizeSlider.addEventListener('input', (e) => {
    currentSize = e.target.value;
    sizeVal.textContent = `${currentSize}px`;
  });

  // Color Swatches Selection
  swatchesContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('swatch')) {
      document.querySelectorAll('.swatch').forEach(s => s.classList.remove('color-active'));
      e.target.classList.add('color-active');
      currentColor = e.target.dataset.color;
      colorPicker.value = currentColor;
      
      // If active tool was eraser, switch back to pencil
      if (currentTool === 'eraser') {
        document.getElementById('tool-pencil').click();
      }
    }
  });

  // Custom Color Picker
  colorPicker.addEventListener('input', (e) => {
    currentColor = e.target.value;
    // Remove active swatch classes
    document.querySelectorAll('.swatch').forEach(s => s.classList.remove('color-active'));
    if (currentTool === 'eraser') {
      document.getElementById('tool-pencil').click();
    }
  });

  // Clear Canvas
  clearBtn.addEventListener('click', () => {
    if (confirm('Clear the entire canvas?')) {
      ctx.fillStyle = '#161722';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveState();
    }
  });

  // Export Art
  exportBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'aurora-art.png';
    link.href = canvas.toDataURL();
    link.click();
  });

  // --- Simulated Multi-User Activity ---
  const cursorContainer = document.getElementById('multiplayer-cursors');
  const users = [
    { name: 'Kenji', class: 'cursor-color-1', color: '#ff007f', x: 100, y: 150, tx: 200, ty: 250, drawing: false, speed: 0.02 },
    { name: 'Akira', class: 'cursor-color-2', color: '#00ffcc', x: 400, y: 300, tx: 450, ty: 150, drawing: false, speed: 0.015 },
    { name: 'Yuki', class: 'cursor-color-3', color: '#ffb347', x: 600, y: 200, tx: 300, ty: 400, drawing: false, speed: 0.025 }
  ];

  // Spawn cursors in DOM
  users.forEach((user, idx) => {
    const cursorEl = document.createElement('div');
    cursorEl.className = `mp-cursor`;
    cursorEl.id = `user-cursor-${idx}`;
    cursorEl.innerHTML = `
      <div class="mp-cursor-pointer" style="background-color: ${user.color};"></div>
      <div class="mp-cursor-label" style="background-color: ${user.color};">${user.name}</div>
    `;
    cursorContainer.appendChild(cursorEl);
    user.el = cursorEl;
  });

  // Update loop for multiplayer cursors
  function animateUsers() {
    users.forEach((user) => {
      // Lerp toward target coordinate
      user.x += (user.tx - user.x) * user.speed;
      user.y += (user.ty - user.y) * user.speed;

      // Update element position
      user.el.style.transform = `translate(${user.x}px, ${user.y}px)`;

      // If near target, set new target
      const dist = Math.hypot(user.tx - user.x, user.ty - user.y);
      if (dist < 15) {
        user.tx = Math.random() * (canvas.width - 50) + 20;
        user.ty = Math.random() * (canvas.height - 50) + 20;
        user.drawing = Math.random() > 0.45; // Toggle drawing status
        user.drawStart = true;
      }

      // Draw automatically if status is active
      if (user.drawing && canvas.width > 0) {
        ctx.lineWidth = 2 + Math.random() * 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = user.color;

        if (user.drawStart) {
          ctx.beginPath();
          ctx.moveTo(user.x, user.y);
          user.drawStart = false;
        } else {
          ctx.lineTo(user.x, user.y);
          ctx.stroke();
        }
      }
    });

    requestAnimationFrame(animateUsers);
  }

  // Start multiplayer animation after 2 seconds
  setTimeout(animateUsers, 2000);

  // --- AI Theme Assistant Generator ---
  const aiPrompt = document.getElementById('ai-prompt');
  const aiGenerateBtn = document.getElementById('ai-generate-btn');
  const aiSuggestionBox = document.getElementById('ai-suggestion-box');
  const aiThemeTitle = document.getElementById('ai-theme-title');
  const aiPalettePreview = document.getElementById('ai-palette-preview');
  const applyAiPaletteBtn = document.getElementById('apply-ai-palette');

  let generatedColors = [];

  const themeLibrary = [
    {
      keywords: ['cyber', 'neon', 'tokyo', 'cyberpunk', 'synthwave'],
      title: 'Neo-Tokyo Neon',
      colors: ['#0f051d', '#ff007f', '#00f6ff', '#9b5de5', '#ffee55']
    },
    {
      keywords: ['garden', 'zen', 'nature', 'serene', 'autumn', 'leaf', 'forest'],
      title: 'Serene Zen Garden',
      colors: ['#1e2522', '#70a288', '#dab785', '#d5896f', '#fff8f0']
    },
    {
      keywords: ['retro', 'vintage', 'sunset', '80s', 'aesthetic'],
      title: '80s Retro Sunset',
      colors: ['#2b1055', '#ff4b5c', '#ff8008', '#ffc837', '#05dfd7']
    },
    {
      keywords: ['ink', 'sumi', 'black', 'white', 'monochrome', 'minimalist'],
      title: 'Sumi Ink Minimal',
      colors: ['#111111', '#555555', '#888888', '#cccccc', '#f7f7f7']
    },
    {
      keywords: ['space', 'cosmic', 'nebula', 'galaxy', 'star'],
      title: 'Deep Cosmic Nebula',
      colors: ['#060919', '#3f37c9', '#4cc9f0', '#7209b7', '#f72585']
    }
  ];

  aiGenerateBtn.addEventListener('click', () => {
    const prompt = aiPrompt.value.trim().toLowerCase();
    if (!prompt) {
      alert('Please enter a description for your design concept!');
      return;
    }

    aiGenerateBtn.disabled = true;
    aiGenerateBtn.innerHTML = `
      <svg class="ai-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
      <span>Thinking...</span>
    `;

    // Add styles for spin animation if they don't exist
    if (!document.getElementById('ai-spin-styles')) {
      const style = document.createElement('style');
      style.id = 'ai-spin-styles';
      style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
      document.head.appendChild(style);
    }

    setTimeout(() => {
      // Find matching theme
      let matchedTheme = null;
      for (const theme of themeLibrary) {
        if (theme.keywords.some(keyword => prompt.includes(keyword))) {
          matchedTheme = theme;
          break;
        }
      }

      // Default fallback theme
      if (!matchedTheme) {
        matchedTheme = {
          title: 'Aurora Aurora Borealis',
          colors: ['#0d131a', '#00f260', '#0575e6', '#c084fc', '#ffffff']
        };
      }

      generatedColors = matchedTheme.colors;
      aiThemeTitle.textContent = matchedTheme.title;

      // Render theme preview colors
      aiPalettePreview.innerHTML = '';
      generatedColors.forEach(color => {
        const div = document.createElement('div');
        div.className = 'ai-palette-color';
        div.style.backgroundColor = color;
        aiPalettePreview.appendChild(div);
      });

      aiSuggestionBox.style.display = 'block';
      aiGenerateBtn.disabled = false;
      aiGenerateBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>
        <span>Generate Theme</span>
      `;
    }, 1200);
  });

  applyAiPaletteBtn.addEventListener('click', () => {
    if (generatedColors.length === 0) return;

    // Replace swatches
    swatchesContainer.innerHTML = '';
    generatedColors.forEach((color, idx) => {
      const swatch = document.createElement('div');
      swatch.className = 'swatch';
      if (idx === 1) { // Select second color as active drawing color
        swatch.classList.add('color-active');
        currentColor = color;
        colorPicker.value = color;
      }
      swatch.style.backgroundColor = color;
      swatch.dataset.color = color;
      swatchesContainer.appendChild(swatch);
    });

    // Animate transition on canvas background (first color)
    ctx.fillStyle = generatedColors[0];
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    canvas.style.backgroundColor = generatedColors[0];
    saveState();

    alert('AI Theme Applied! The canvas background and color swatches have updated.');
  });
});
