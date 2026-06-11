document.addEventListener('DOMContentLoaded', () => {
  // --- Clock Trigger ---
  function updateClock() {
    const clock = document.getElementById('zen-time');
    const now = new Date();
    clock.textContent = now.toLocaleTimeString('en-US', { hour12: false });
  }
  setInterval(updateClock, 1000);
  updateClock();

  // --- Focus Goals Checklist ---
  const todoForm = document.getElementById('todo-form');
  const todoInput = document.getElementById('todo-input');
  const todoList = document.getElementById('todo-list');
  const completedGoalsLabel = document.getElementById('completed-goals-count');
  const totalFocusTimeLabel = document.getElementById('total-focus-time');
  const resetBtn = document.getElementById('zen-reset-btn');

  let goalsCompleted = parseInt(localStorage.getItem('zen_completed_goals') || '8');
  let focusHours = parseFloat(localStorage.getItem('zen_focus_hours') || '4.2');
  
  completedGoalsLabel.textContent = goalsCompleted;
  totalFocusTimeLabel.textContent = `${focusHours.toFixed(1)}h`;

  let items = [
    { id: 1, text: 'Drink a warm cup of sencha tea', done: false },
    { id: 2, text: 'Set daily coding milestones', done: false },
    { id: 3, text: 'Take a deep breath and clear mind', done: false }
  ];

  function renderGoals() {
    todoList.innerHTML = '';
    items.forEach(item => {
      const li = document.createElement('li');
      li.className = `todo-item ${item.done ? 'completed' : ''}`;
      li.innerHTML = `
        <div class="todo-item-content">
          <div class="todo-item-check" data-id="${item.id}"></div>
          <span>${item.text}</span>
        </div>
        <button class="todo-delete-btn" data-id="${item.id}" title="Remove Goal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      `;

      // Complete toggle listener
      li.querySelector('.todo-item-check').addEventListener('click', () => toggleGoal(item.id));
      li.querySelector('.todo-delete-btn').addEventListener('click', () => deleteGoal(item.id));

      todoList.appendChild(li);
    });
  }

  function toggleGoal(id) {
    const item = items.find(i => i.id === id);
    if (item) {
      item.done = !item.done;
      if (item.done) {
        goalsCompleted++;
        focusHours += 0.2; // Add 12 mins focus per task completed
        localStorage.setItem('zen_completed_goals', goalsCompleted);
        localStorage.setItem('zen_focus_hours', focusHours);
        
        completedGoalsLabel.textContent = goalsCompleted;
        totalFocusTimeLabel.textContent = `${focusHours.toFixed(1)}h`;
        
        // Find matching li to animate fade out
        setTimeout(() => {
          items = items.filter(i => i.id !== id);
          renderGoals();
        }, 1200);
      }
      renderGoals();
    }
  }

  function deleteGoal(id) {
    items = items.filter(i => i.id !== id);
    renderGoals();
  }

  todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const txt = todoInput.value.trim();
    if (txt) {
      const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
      items.push({ id: newId, text: txt, done: false });
      todoInput.value = '';
      renderGoals();
    }
  });

  resetBtn.addEventListener('click', () => {
    if (confirm('Reset focus metrics to starting values?')) {
      goalsCompleted = 8;
      focusHours = 4.2;
      localStorage.setItem('zen_completed_goals', goalsCompleted);
      localStorage.setItem('zen_focus_hours', focusHours);
      completedGoalsLabel.textContent = goalsCompleted;
      totalFocusTimeLabel.textContent = `${focusHours.toFixed(1)}h`;
      items = [
        { id: 1, text: 'Drink a warm cup of sencha tea', done: false },
        { id: 2, text: 'Set daily coding milestones', done: false },
        { id: 3, text: 'Take a deep breath and clear mind', done: false }
      ];
      renderGoals();
    }
  });

  renderGoals();

  // --- Mindful Breathing Guide ---
  const breathCircle = document.getElementById('breath-circle');
  const breathLabel = document.getElementById('breath-label');
  const breathToggleBtn = document.getElementById('breath-toggle-btn');
  
  let breathingActive = false;
  let breathTimer = null;
  let breathState = 0; // 0: inhale, 1: hold (full), 2: exhale, 3: hold (empty)

  function runBreathStep() {
    if (!breathingActive) return;

    breathCircle.className = 'breath-circle'; // Clear states
    
    if (breathState === 0) {
      breathCircle.classList.add('inhale');
      breathLabel.textContent = 'Inhale deeply...';
      breathState = 1;
      breathTimer = setTimeout(runBreathStep, 4000);
    } else if (breathState === 1) {
      breathCircle.classList.add('hold');
      breathLabel.textContent = 'Hold breath...';
      breathState = 2;
      breathTimer = setTimeout(runBreathStep, 4000);
    } else if (breathState === 2) {
      breathCircle.classList.add('exhale');
      breathLabel.textContent = 'Exhale slowly...';
      breathState = 3;
      breathTimer = setTimeout(runBreathStep, 4000);
    } else {
      // Hold empty
      breathLabel.textContent = 'Hold...';
      breathState = 0;
      breathTimer = setTimeout(runBreathStep, 4000);
    }
  }

  function startBreathing() {
    breathingActive = true;
    breathState = 0;
    breathToggleBtn.textContent = 'Stop Breathing Circle';
    runBreathStep();
  }

  function stopBreathing() {
    breathingActive = false;
    clearTimeout(breathTimer);
    breathCircle.className = 'breath-circle';
    breathLabel.textContent = 'Click to Start';
    breathToggleBtn.textContent = 'Start Breathing Circle';
  }

  breathToggleBtn.addEventListener('click', () => {
    if (breathingActive) {
      stopBreathing();
    } else {
      startBreathing();
    }
  });


  // --- Real-time Synthesized Audio Mixer (Web Audio API) ---
  let audioCtx = null;
  const activeSynths = {
    rain: null,
    wind: null,
    stream: null
  };

  // Helper to get Web Audio Context (safe resume browser security)
  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Sound Engine Class Definitions
  class RainSynth {
    constructor(ctx, volume = 0.5) {
      this.ctx = ctx;
      
      // Generate noise buffer
      const bufferSize = ctx.sampleRate * 2; // 2 seconds
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1; // White noise
      }

      this.noise = ctx.createBufferSource();
      this.noise.buffer = noiseBuffer;
      this.noise.loop = true;

      // Filter: High pass to shave off bass, Band pass for rain droplet frequencies
      this.filter = ctx.createBiquadFilter();
      this.filter.type = 'bandpass';
      this.filter.frequency.value = 1000;
      this.filter.Q.value = 1.0;

      // Gain Node
      this.gainNode = ctx.createGain();
      this.gainNode.gain.value = volume * 0.15; // Low scaling for smooth rain

      // Connect graph
      this.noise.connect(this.filter);
      this.filter.connect(this.gainNode);
      this.gainNode.connect(ctx.destination);
    }

    start() {
      this.noise.start(0);
    }

    stop() {
      try {
        this.noise.stop();
      } catch(e) {}
      this.noise.disconnect();
      this.filter.disconnect();
      this.gainNode.disconnect();
    }

    setVolume(val) {
      this.gainNode.gain.setValueAtTime(val * 0.15, this.ctx.currentTime);
    }
  }

  class WindSynth {
    constructor(ctx, volume = 0.5) {
      this.ctx = ctx;

      // Create pink noise approximation buffer
      const bufferSize = ctx.sampleRate * 4;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0, b1, b2, b3, b4, b5, b6;
      b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
      
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11; // estimate
        b6 = white * 0.115926;
      }

      this.noise = ctx.createBufferSource();
      this.noise.buffer = noiseBuffer;
      this.noise.loop = true;

      // Lowpass filter representing wind gusts
      this.filter = ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 400;

      // LFO to modulate filter frequency (slow gusty winds)
      this.lfo = ctx.createOscillator();
      this.lfo.type = 'sine';
      this.lfo.frequency.value = 0.08; // extremely slow oscillation (12 seconds cycle)

      this.lfoGain = ctx.createGain();
      this.lfoGain.gain.value = 250; // Modulate cutoff by 250Hz

      this.gainNode = ctx.createGain();
      this.gainNode.gain.value = volume * 0.25;

      // Connect LFO modulation
      this.lfo.connect(this.lfoGain);
      this.lfoGain.connect(this.filter.frequency);

      // Connect source sound
      this.noise.connect(this.filter);
      this.filter.connect(this.gainNode);
      this.gainNode.connect(ctx.destination);
    }

    start() {
      this.noise.start(0);
      this.lfo.start(0);
    }

    stop() {
      try {
        this.noise.stop();
        this.lfo.stop();
      } catch(e) {}
      this.noise.disconnect();
      this.lfo.disconnect();
      this.lfoGain.disconnect();
      this.filter.disconnect();
      this.gainNode.disconnect();
    }

    setVolume(val) {
      this.gainNode.gain.setValueAtTime(val * 0.25, this.ctx.currentTime);
    }
  }

  class StreamSynth {
    constructor(ctx, volume = 0.5) {
      this.ctx = ctx;

      // White noise buffer
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      this.noise = ctx.createBufferSource();
      this.noise.buffer = noiseBuffer;
      this.noise.loop = true;

      // Resonant bandpass filter to sound bubbly
      this.filter = ctx.createBiquadFilter();
      this.filter.type = 'bandpass';
      this.filter.frequency.value = 800;
      this.filter.Q.value = 8.0; // High Q makes it whistly/bubbly

      // Faster LFO to modulate bubble rate
      this.lfo = ctx.createOscillator();
      this.lfo.type = 'sine';
      this.lfo.frequency.value = 4.0; // 4Hz rate

      this.lfoGain = ctx.createGain();
      this.lfoGain.gain.value = 300;

      this.gainNode = ctx.createGain();
      this.gainNode.gain.value = volume * 0.15;

      // Connect LFO modulation
      this.lfo.connect(this.lfoGain);
      this.lfoGain.connect(this.filter.frequency);

      // Connect sound graph
      this.noise.connect(this.filter);
      this.filter.connect(this.gainNode);
      this.gainNode.connect(ctx.destination);
    }

    start() {
      this.noise.start(0);
      this.lfo.start(0);
    }

    stop() {
      try {
        this.noise.stop();
        this.lfo.stop();
      } catch(e) {}
      this.noise.disconnect();
      this.lfo.disconnect();
      this.lfoGain.disconnect();
      this.filter.disconnect();
      this.gainNode.disconnect();
    }

    setVolume(val) {
      this.gainNode.gain.setValueAtTime(val * 0.15, this.ctx.currentTime);
    }
  }

  // Handle mixer play/pause toggles
  document.querySelectorAll('.mixer-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const soundType = btn.dataset.sound;
      const row = btn.closest('.mixer-row');
      const volSlider = row.querySelector('.mixer-volume');
      const volume = parseFloat(volSlider.value);

      const actCtx = getAudioCtx();

      if (btn.classList.contains('active')) {
        // Stop sound
        btn.classList.remove('active');
        row.querySelector('.play-icon').style.display = 'block';
        row.querySelector('.pause-icon').style.display = 'none';

        if (activeSynths[soundType]) {
          activeSynths[soundType].stop();
          activeSynths[soundType] = null;
        }
      } else {
        // Start sound
        btn.classList.add('active');
        row.querySelector('.play-icon').style.display = 'none';
        row.querySelector('.pause-icon').style.display = 'block';

        if (soundType === 'rain') {
          activeSynths.rain = new RainSynth(actCtx, volume);
          activeSynths.rain.start();
        } else if (soundType === 'wind') {
          activeSynths.wind = new WindSynth(actCtx, volume);
          activeSynths.wind.start();
        } else if (soundType === 'stream') {
          activeSynths.stream = new StreamSynth(actCtx, volume);
          activeSynths.stream.start();
        }
      }
    });
  });

  // Handle volume changes
  document.querySelectorAll('.mixer-volume').forEach(slider => {
    slider.addEventListener('input', (e) => {
      const row = slider.closest('.mixer-row');
      const toggleBtn = row.querySelector('.mixer-toggle');
      const soundType = toggleBtn.dataset.sound;
      const volume = parseFloat(e.target.value);

      if (toggleBtn.classList.contains('active') && activeSynths[soundType]) {
        activeSynths[soundType].setVolume(volume);
      }
    });
  });
});
