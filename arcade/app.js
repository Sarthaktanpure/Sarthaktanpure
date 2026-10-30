// The Engineer's Arcade — Interactive Application Logic
// Author: Sarthak Tanpure

(function () {
  'use strict';

  // --- Sound Effects Synthesizer (Web Audio API) ---
  const AudioEngine = {
    ctx: null,
    enabled: true,
    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
    },
    playTone(freq, type, duration, delay = 0) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + delay + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + delay);
        osc.stop(this.ctx.currentTime + delay + duration);
      } catch (e) {
        // Audio might be blocked until user interaction
      }
    },
    click() { this.playTone(800, 'sine', 0.04); },
    correct() {
      this.playTone(523.25, 'triangle', 0.1, 0);     // C5
      this.playTone(659.25, 'triangle', 0.1, 0.08);  // E5
      this.playTone(783.99, 'triangle', 0.2, 0.16);  // G5
    },
    wrong() {
      this.playTone(220, 'sawtooth', 0.18, 0);
      this.playTone(185, 'sawtooth', 0.25, 0.1);
    },
    levelUp() {
      [440, 554, 659, 880].forEach((f, i) => this.playTone(f, 'sine', 0.12, i * 0.08));
    }
  };

  // --- Matrix Rain Background Effect ---
  const MatrixRain = {
    canvas: document.getElementById('matrixCanvas'),
    ctx: null,
    columns: 0,
    drops: [],
    intervalId: null,
    active: true,
    chars: '01ABCDEF<>[]{}/=+*~#%$λπΩΣ',
    init() {
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.resize();
      window.addEventListener('resize', () => this.resize());
      this.start();
    },
    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.columns = Math.floor(this.canvas.width / 18);
      this.drops = Array(this.columns).fill(1);
    },
    draw() {
      this.ctx.fillStyle = 'rgba(6, 9, 19, 0.1)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#22d3ee';
      this.ctx.font = '14px monospace';

      for (let i = 0; i < this.drops.length; i++) {
        const text = this.chars[Math.floor(Math.random() * this.chars.length)];
        this.ctx.fillText(text, i * 18, this.drops[i] * 18);
        if (this.drops[i] * 18 > this.canvas.height && Math.random() > 0.975) {
          this.drops[i] = 0;
        }
        this.drops[i]++;
      }
    },
    start() {
      if (!this.intervalId) {
        this.intervalId = setInterval(() => this.draw(), 50);
      }
    },
    stop() {
      clearInterval(this.intervalId);
      this.intervalId = null;
      if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    toggle() {
      this.active = !this.active;
      if (this.active) this.start();
      else this.stop();
      return this.active;
    }
  };

  // --- Quiz Questions Dataset ---
  const QUIZ_QUESTIONS = [
    {
      domain: 'HTTP & PROTOCOLS',
      q: 'Under RFC 9110 (HTTP Semantics), which combination of HTTP methods are officially specified as idempotent?',
      options: [
        'GET, POST, DELETE',
        'GET, PUT, DELETE, HEAD, OPTIONS',
        'POST, PATCH, PUT',
        'GET, POST, PATCH, OPTIONS'
      ],
      correct: 1,
      explanation: 'Idempotency means multiple identical requests have the same side effect as a single request. GET, HEAD, OPTIONS, PUT, and DELETE are idempotent. POST and PATCH are not idempotent by default.'
    },
    {
      domain: 'ALGORITHMS & DATA STRUCTURES',
      q: 'In Java 8+, when bucket collisions exceed TREEIFY_THRESHOLD (8) in a HashMap, buckets transform into Red-Black Trees. What is the worst-case lookup time?',
      options: [
        'O(1)',
        'O(log n)',
        'O(n)',
        'O(n log n)'
      ],
      correct: 1,
      explanation: 'Java 8 replaced linked lists with balanced Red-Black trees (TreeNode) in heavily collided HashMap buckets, improving worst-case search complexity from O(n) to O(log n).'
    },
    {
      domain: 'DATABASE INTERNALS',
      q: 'Why does MongoDB (WiredTiger engine) use B-Trees for default indexes instead of Hash indexes for collection querying?',
      options: [
        'B-Trees use less memory than Hash indexes',
        'B-Trees natively support ordered range scans ($gte, $lte) and prefix sorting',
        'Hash indexes cannot index strings or ObjectIds',
        'B-Trees are strictly faster for single point lookups'
      ],
      correct: 1,
      explanation: 'While hash indexes achieve O(1) for strict equality, B-Trees maintain sorted order, allowing efficient O(log n) range queries, cursor scans, and sort operations.'
    },
    {
      domain: 'SYSTEMS ARCHITECTURE',
      q: 'In building an API health monitoring platform like API Sentinel, why is polling a target endpoint with HTTP HEAD or GET preferable over POST?',
      options: [
        'POST requests cannot return HTTP status codes',
        'GET and HEAD avoid unintended mutation of remote database state while verifying status',
        'HEAD requests encrypt the HTTP status code',
        'GET requests do not consume network sockets'
      ],
      correct: 1,
      explanation: 'Health checks should be non-destructive. HEAD or GET requests check availability, latency, and status codes without mutating remote database records.'
    },
    {
      domain: 'NODE.JS INTERNALS',
      q: 'In the Node.js Event Loop, when are callbacks queued in process.nextTick() executed?',
      options: [
        'During the Check phase (setImmediate)',
        'Immediately after the current operation completes, before the event loop advances to the next phase',
        'Only when the Poll phase has no pending I/O',
        'Inside the Close Callbacks phase'
      ],
      correct: 1,
      explanation: 'process.nextTick() is not technically part of the event loop. The nextTickQueue is processed immediately after the current operation finishes, resolving before the event loop transitions.'
    },
    {
      domain: 'APPLIED AI & COMPUTER VISION',
      q: 'In MediVision AI, how does Grad-CAM produce visual heatmaps explaining CNN medical scan predictions?',
      options: [
        'By randomizing pixel colors across the scan',
        'By computing gradients of the target class score with respect to the feature maps of the final convolutional layer',
        'By clustering pixels using K-Means unsupervised learning',
        'By masking all dark pixels with transparent alpha layers'
      ],
      correct: 1,
      explanation: 'Grad-CAM computes the gradient of the predicted class score with respect to feature activation maps of the final conv layer, highlighting the precise visual regions that influenced the AI diagnosis.'
    }
  ];

  // --- Modes Controller ---
  const GamePod = {
    container: document.getElementById('gameArea'),
    currentMode: 'quiz',

    // --- Developer Quiz Game ---
    quiz: {
      index: 0,
      score: 0,
      streak: 0,
      maxStreak: 0,
      answered: false,

      render() {
        const q = QUIZ_QUESTIONS[this.index];
        const progress = Math.round(((this.index) / QUIZ_QUESTIONS.length) * 100);

        GamePod.container.innerHTML = `
          <div class="quiz-wrapper">
            <div class="quiz-header">
              <span class="mono eyebrow">QUESTION ${this.index + 1} OF ${QUIZ_QUESTIONS.length}</span>
              <div class="quiz-hud mono">
                <span>SCORE: <strong style="color:var(--accent-cyan)">${this.score}</strong></span>
                <span>STREAK: <strong style="color:var(--accent-green)">${this.streak}x</strong></span>
              </div>
            </div>
            <div class="quiz-progress-track">
              <div class="quiz-progress-bar" style="width: ${progress}%"></div>
            </div>

            <div class="question-box">
              <span class="mono question-tag">// ${q.domain}</span>
              <h2 class="question-text">${q.q}</h2>
            </div>

            <div class="options-grid">
              ${q.options.map((opt, i) => `
                <button class="option-btn" data-index="${i}">
                  <span class="option-key">[0${i + 1}]</span>
                  <span class="option-label">${opt}</span>
                </button>
              `).join('')}
            </div>

            <div id="explanationArea"></div>
          </div>
        `;

        document.querySelectorAll('.option-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.getAttribute('data-index'), 10);
            this.handleAnswer(idx);
          });
        });
      },

      handleAnswer(selectedIdx) {
        if (this.answered) return;
        this.answered = true;
        const q = QUIZ_QUESTIONS[this.index];
        const buttons = document.querySelectorAll('.option-btn');
        const isCorrect = selectedIdx === q.correct;

        if (isCorrect) {
          AudioEngine.correct();
          this.score += 100 * (1 + (this.streak * 0.2));
          this.streak++;
          if (this.streak > this.maxStreak) this.maxStreak = this.streak;
          buttons[selectedIdx].classList.add('correct');
        } else {
          AudioEngine.wrong();
          this.streak = 0;
          buttons[selectedIdx].classList.add('wrong');
          buttons[q.correct].classList.add('correct');
        }

        buttons.forEach(b => b.disabled = true);

        const expArea = document.getElementById('explanationArea');
        expArea.innerHTML = `
          <div class="explanation-card">
            <strong style="color: ${isCorrect ? 'var(--accent-green)' : 'var(--accent-rose)'}; display:block; margin-bottom:4px;">
              ${isCorrect ? '✓ Verified Correct' : '✗ Incorrect Logic'}
            </strong>
            <p>${q.explanation}</p>
            <div style="margin-top:14px; text-align:right;">
              <button id="nextQBtn" class="btn-next mono">
                ${this.index < QUIZ_QUESTIONS.length - 1 ? 'NEXT CHALLENGE →' : 'VIEW FINAL SCORECARD 🏆'}
              </button>
            </div>
          </div>
        `;

        document.getElementById('nextQBtn').addEventListener('click', () => {
          AudioEngine.click();
          this.answered = false;
          this.index++;
          if (this.index < QUIZ_QUESTIONS.length) {
            this.render();
          } else {
            this.renderResults();
          }
        });
      },

      renderResults() {
        AudioEngine.levelUp();
        let badge = 'ENGINEERING ARCHITECT';
        let badgeColor = 'var(--accent-cyan)';
        const maxScore = QUIZ_QUESTIONS.length * 100;

        if (this.score >= maxScore * 0.85) {
          badge = '🏆 LEAD SYSTEMS ARCHITECT';
          badgeColor = 'var(--accent-green)';
        } else if (this.score >= maxScore * 0.5) {
          badge = '⚡ SENIOR BACKEND ENGINEER';
          badgeColor = 'var(--accent-violet)';
        } else {
          badge = '🌱 ASPIRING CORE BUILDER';
          badgeColor = 'var(--accent-amber)';
        }

        GamePod.container.innerHTML = `
          <div style="text-align:center; padding:30px 10px; animation:fadeIn 0.4s ease;">
            <span class="mono eyebrow">SIMULATION COMPLETE</span>
            <h2 style="font-size:2rem; font-weight:800; margin:10px 0 6px; color:#f8fafc;">Scorecard Verified</h2>
            <p style="color:var(--text-muted); margin-bottom:24px;">Tested across protocols, distributed databases, event loops &amp; AI architectures.</p>
            
            <div style="display:inline-block; background:rgba(15,23,42,0.8); border:1px solid rgba(255,255,255,0.15); border-radius:14px; padding:24px 36px; margin-bottom:24px;">
              <div class="mono" style="font-size:2.8rem; font-weight:800; color:${badgeColor};">${Math.round(this.score)} PTS</div>
              <div class="mono" style="font-size:0.9rem; color:#cbd5e1; margin-top:8px; letter-spacing:1px;">${badge}</div>
              <div class="mono" style="font-size:0.8rem; color:#64748b; margin-top:4px;">MAX STREAK: ${this.maxStreak}x</div>
            </div>

            <div>
              <button id="retryBtn" class="btn-next mono">REPLAY CHALLENGE ↺</button>
            </div>
          </div>
        `;

        document.getElementById('retryBtn').addEventListener('click', () => {
          this.index = 0;
          this.score = 0;
          this.streak = 0;
          this.maxStreak = 0;
          this.answered = false;
          this.render();
        });
      }
    },

    // --- Interactive Terminal Emulator ---
    terminal: {
      history: [],
      historyIndex: -1,
      commands: {
        help: () => [
          'AVAILABLE COMMANDS IN SARTHAK_OS:',
          '  whoami       - Developer identity and mission',
          '  cat profile  - Read developer_profile.json',
          '  projects     - List verified production builds & repositories',
          '  ping sentinel- Test simulated telemetry response times',
          '  dsa          - DSA problem-solving statistics (Java)',
          '  cgpa         - Academic standing at PREC Loni',
          '  skills       - Backend, frontend & AI arsenal',
          '  contact      - Professional links (LinkedIn, GitHub, Email)',
          '  matrix       - Toggle background matrix digital rain',
          '  clear        - Clear terminal screen',
          '  easteregg    - Display secret developer badge',
          '  sudo         - Run as superuser'
        ],
        whoami: () => [
          'Sarthak Tanpure',
          'Third-year B.Tech Information Technology student @ Pravara Rural Engineering College (PREC Loni)',
          'Primary Identity: Software Engineer | Backend Systems | Full-Stack | Applied AI',
          'Location: Rahuri, Ahmednagar, Maharashtra, India'
        ],
        'cat profile': () => [
          '{',
          '  "name": "Sarthak Tanpure",',
          '  "cgpa": "9.0 / 10",',
          '  "focus": ["Backend Engineering", "Scalable REST APIs", "Applied AI"],',
          '  "venture": "Co-Founder @ WebCraft Studio",',
          '  "status": "Available for SDE Internships & Collaborative Engineering"',
          '}'
        ],
        'cat profile.json': () => [
          '{',
          '  "name": "Sarthak Tanpure",',
          '  "cgpa": "9.0 / 10",',
          '  "focus": ["Backend Engineering", "Scalable REST APIs", "Applied AI"],',
          '  "venture": "Co-Founder @ WebCraft Studio",',
          '  "status": "Available for SDE Internships & Collaborative Engineering"',
          '}'
        ],
        projects: () => [
          '01. API Sentinel  -> Real-time API monitoring, health checks & latency tracking (React, Vite, Node, Mongo)',
          '02. HospitalOS    -> Full clinical management system with multi-role RBAC (MERN, JWT, Tailwind)',
          '03. AgriConnect   -> Direct farmer-to-buyer produce trading platform (React, Vite, Express, Mongo)',
          '04. MediVision AI -> AI radiology triage with CNN & Grad-CAM heatmaps (FastAPI, Python, OpenCV, React)',
          '05. WebCraft Studio -> Co-Founder & Web Development Venture (Client Product Architecture)',
          'Type "ping sentinel" to simulate health check latency.'
        ],
        'ping sentinel': () => [
          'PING api-sentinel.mesh (127.0.0.1): 56 data bytes',
          '64 bytes from 127.0.0.1: icmp_seq=0 ttl=64 time=18.4 ms (200 OK)',
          '64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=22.1 ms (200 OK)',
          '64 bytes from 127.0.0.1: icmp_seq=2 ttl=64 time=16.8 ms (200 OK)',
          '--- api-sentinel ping statistics ---',
          '3 packets transmitted, 3 received, 0.0% packet loss, avg latency 19.1ms'
        ],
        dsa: () => [
          '⚡ Java Data Structures & Algorithms Practice:',
          '  • 200+ Solved algorithmic problems across LeetCode & platform tracks',
          '  • Strong foundations: Trees, Graphs, Dynamic Programming, Heaps, Two-Pointers, Sliding Window'
        ],
        cgpa: () => [
          '🎓 Academic Verification:',
          '  • Pravara Rural Engineering College, Loni (PREC)',
          '  • B.Tech in Information Technology (Third Year)',
          '  • Cumulative GPA: 9.0 / 10'
        ],
        skills: () => [
          'Languages:    Java, JavaScript, TypeScript, Python',
          'Backend:      Node.js, Express.js, FastAPI, RESTful APIs, JWT Auth',
          'Frontend:     React, Vite, Tailwind CSS, Modern Responsive HTML/CSS',
          'Databases:    MongoDB, Mongoose, Redis basics',
          'AI / ML:      CNNs, Grad-CAM, OpenCV, PyTorch basics',
          'Tools:        Git, GitHub, Postman, Linux, Vercel, Render'
        ],
        contact: () => [
          '• LinkedIn:  https://www.linkedin.com/in/sarthak-tanpure-a74b5133a',
          '• GitHub:    https://github.com/Sarthaktanpure',
          '• Email:     sarthaktanpure255@gmail.com',
          '• Studio:    https://webcraftstudioofficial.online'
        ],
        matrix: () => {
          const state = MatrixRain.toggle();
          return [`Matrix rain background effect: ${state ? 'ENABLED' : 'DISABLED'}`];
        },
        sudo: () => [
          'User is not in the sudoers file. This incident will be reported to Sarthak Tanpure.'
        ],
        easteregg: () => [
          '       /\\',
          '      /  \\',
          '     / /\\ \\     ENGINEERING THE FUTURE',
          '    / /  \\ \\    SARTHAK TANPURE',
          '   / / /\\ \\ \\   PREC LONI // 2026',
          '  /_/ /  \\ \\_\\',
          '    |  ||  |',
          '    |__||__|'
        ]
      },

      render() {
        GamePod.container.innerHTML = `
          <div class="terminal-window">
            <div class="terminal-topbar">
              <div class="term-dots">
                <span class="term-dot r"></span>
                <span class="term-dot y"></span>
                <span class="term-dot g"></span>
              </div>
              <span class="mono term-title">sarthak@precision:~ (bash)</span>
              <span class="mono" style="font-size:0.75rem; color:#10b981;">ONLINE</span>
            </div>
            <div id="termBody" class="terminal-body">
              <div class="term-line term-out cyan">
                SARTHAK_OS v3.4.0 (x86_64-pc-linux-gnu)<br/>
                Welcome to Sarthak Tanpure's engineering shell.<br/>
                Type <strong style="color:#f8fafc">help</strong> to see available commands or try <strong style="color:#f8fafc">cat profile</strong>.
              </div>
              <div id="termOutput"></div>
              <div class="terminal-input-row">
                <span class="term-prompt">sarthak@precision:~$</span>
                <input id="termInput" class="terminal-input" autofocus type="text" autocomplete="off" spellcheck="false" />
              </div>
            </div>
          </div>
        `;

        const input = document.getElementById('termInput');
        const body = document.getElementById('termBody');

        body.addEventListener('click', () => input.focus());

        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            const raw = input.value.trim();
            input.value = '';
            if (!raw) return;

            this.history.push(raw);
            this.historyIndex = this.history.length;
            this.execute(raw);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (this.historyIndex > 0) {
              this.historyIndex--;
              input.value = this.history[this.historyIndex];
            }
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (this.historyIndex < this.history.length - 1) {
              this.historyIndex++;
              input.value = this.history[this.historyIndex];
            } else {
              this.historyIndex = this.history.length;
              input.value = '';
            }
          } else if (e.key === 'Tab') {
            e.preventDefault();
            const val = input.value.toLowerCase().trim();
            const matches = Object.keys(this.commands).filter(c => c.startsWith(val));
            if (matches.length === 1) input.value = matches[0];
          }
        });
      },

      execute(cmdStr) {
        AudioEngine.click();
        const outDiv = document.getElementById('termOutput');
        const cleanCmd = cmdStr.toLowerCase().trim();

        const echo = document.createElement('div');
        echo.className = 'term-line';
        echo.innerHTML = `<span class="term-prompt">sarthak@precision:~$</span> <span class="term-cmd">${escapeHtml(cmdStr)}</span>`;
        outDiv.appendChild(echo);

        if (cleanCmd === 'clear') {
          outDiv.innerHTML = '';
          return;
        }

        let lines = [];
        if (this.commands[cleanCmd]) {
          lines = this.commands[cleanCmd]();
        } else {
          lines = [`Command not found: "${cleanCmd}". Type "help" for a list of commands.`];
        }

        const outBlock = document.createElement('div');
        outBlock.className = 'term-line term-out';
        outBlock.innerHTML = lines.map(l => escapeHtml(l)).join('<br/>');
        outDiv.appendChild(outBlock);

        const body = document.getElementById('termBody');
        body.scrollTop = body.scrollHeight;
      }
    },

    // --- Playable Snake Game ---
    snake: {
      canvas: null,
      ctx: null,
      gridSize: 20,
      tileCount: 20,
      snakeParts: [],
      tailLength: 4,
      headX: 10,
      headY: 10,
      xVelocity: 0,
      yVelocity: 0,
      appleX: 5,
      appleY: 5,
      score: 0,
      highScore: parseInt(localStorage.getItem('snake_hi') || '0', 10),
      gameLoopId: null,
      gameOver: false,
      speed: 100,

      render() {
        GamePod.container.innerHTML = `
          <div class="snake-container">
            <div class="snake-hud">
              <span>SCORE: <strong id="snakeScore" style="color:var(--accent-green)">0</strong></span>
              <span>COMMITS EATEN: <strong id="snakeCommits" style="color:var(--accent-cyan)">0</strong></span>
              <span>HIGH SCORE: <strong id="snakeHi" style="color:var(--accent-amber)">${this.highScore}</strong></span>
            </div>

            <canvas id="snakeCanvas" width="400" height="400"></canvas>

            <div class="mono" style="font-size:0.8rem; color:#94a3b8; text-align:center;">
              USE ARROW KEYS OR W/A/S/D TO NAVIGATE · EAT THE NEON COMMITS
            </div>

            <div class="snake-controls">
              <button class="dpad-btn" id="dpadUp">▲</button>
              <div class="dpad-row">
                <button class="dpad-btn" id="dpadLeft">◀</button>
                <button class="dpad-btn" id="dpadDown">▼</button>
                <button class="dpad-btn" id="dpadRight">▶</button>
              </div>
            </div>
          </div>
        `;

        this.canvas = document.getElementById('snakeCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.reset();

        window.addEventListener('keydown', this.handleKeyDown.bind(this));

        document.getElementById('dpadUp').addEventListener('click', () => this.setDir(0, -1));
        document.getElementById('dpadDown').addEventListener('click', () => this.setDir(0, 1));
        document.getElementById('dpadLeft').addEventListener('click', () => this.setDir(-1, 0));
        document.getElementById('dpadRight').addEventListener('click', () => this.setDir(1, 0));

        this.startLoop();
      },

      reset() {
        this.snakeParts = [];
        this.tailLength = 4;
        this.headX = 10;
        this.headY = 10;
        this.xVelocity = 1;
        this.yVelocity = 0;
        this.score = 0;
        this.gameOver = false;
        this.spawnApple();
        this.updateHUD();
      },

      spawnApple() {
        this.appleX = Math.floor(Math.random() * this.tileCount);
        this.appleY = Math.floor(Math.random() * this.tileCount);
      },

      setDir(x, y) {
        if (this.gameOver) {
          this.reset();
          return;
        }
        if (x !== 0 && this.xVelocity === -x) return;
        if (y !== 0 && this.yVelocity === -y) return;
        this.xVelocity = x;
        this.yVelocity = y;
        AudioEngine.click();
      },

      handleKeyDown(e) {
        if (GamePod.currentMode !== 'snake') return;
        if (['ArrowUp', 'KeyW'].includes(e.code)) { e.preventDefault(); this.setDir(0, -1); }
        if (['ArrowDown', 'KeyS'].includes(e.code)) { e.preventDefault(); this.setDir(0, 1); }
        if (['ArrowLeft', 'KeyA'].includes(e.code)) { e.preventDefault(); this.setDir(-1, 0); }
        if (['ArrowRight', 'KeyD'].includes(e.code)) { e.preventDefault(); this.setDir(1, 0); }
      },

      updateHUD() {
        const s = document.getElementById('snakeScore');
        const c = document.getElementById('snakeCommits');
        const h = document.getElementById('snakeHi');
        if (s) s.textContent = this.score;
        if (c) c.textContent = Math.max(0, this.tailLength - 4);
        if (h) h.textContent = this.highScore;
      },

      startLoop() {
        if (this.gameLoopId) clearInterval(this.gameLoopId);
        this.gameLoopId = setInterval(() => {
          if (GamePod.currentMode !== 'snake') {
            clearInterval(this.gameLoopId);
            return;
          }
          this.tick();
        }, this.speed);
      },

      tick() {
        if (this.gameOver) {
          this.drawGameOver();
          return;
        }

        this.headX += this.xVelocity;
        this.headY += this.yVelocity;

        // Wrap around borders
        if (this.headX < 0) this.headX = this.tileCount - 1;
        if (this.headX >= this.tileCount) this.headX = 0;
        if (this.headY < 0) this.headY = this.tileCount - 1;
        if (this.headY >= this.tileCount) this.headY = 0;

        // Self collision check
        for (let i = 0; i < this.snakeParts.length; i++) {
          const part = this.snakeParts[i];
          if (part.x === this.headX && part.y === this.headY) {
            this.gameOver = true;
            AudioEngine.wrong();
            return;
          }
        }

        this.snakeParts.push({ x: this.headX, y: this.headY });
        while (this.snakeParts.length > this.tailLength) {
          this.snakeParts.shift();
        }

        // Apple collision
        if (this.appleX === this.headX && this.appleY === this.headY) {
          AudioEngine.correct();
          this.tailLength++;
          this.score += 25;
          if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snake_hi', this.highScore.toString());
          }
          this.spawnApple();
          this.updateHUD();
        }

        this.draw();
      },

      draw() {
        // Clear background
        this.ctx.fillStyle = '#080d1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Grid lines
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        for (let i = 0; i < this.tileCount; i++) {
          this.ctx.beginPath();
          this.ctx.moveTo(i * this.gridSize, 0);
          this.ctx.lineTo(i * this.gridSize, this.canvas.height);
          this.ctx.stroke();

          this.ctx.beginPath();
          this.ctx.moveTo(0, i * this.gridSize);
          this.ctx.lineTo(this.canvas.width, i * this.gridSize);
          this.ctx.stroke();
        }

        // Draw Apple (Neon Commit Node)
        this.ctx.fillStyle = '#22d3ee';
        this.ctx.shadowColor = '#22d3ee';
        this.ctx.shadowBlur = 12;
        this.ctx.beginPath();
        this.ctx.arc(
          this.appleX * this.gridSize + this.gridSize / 2,
          this.appleY * this.gridSize + this.gridSize / 2,
          this.gridSize / 2 - 2,
          0,
          Math.PI * 2
        );
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Draw Snake
        for (let i = 0; i < this.snakeParts.length; i++) {
          const part = this.snakeParts[i];
          const isHead = i === this.snakeParts.length - 1;
          this.ctx.fillStyle = isHead ? '#34d399' : '#10b981';
          if (isHead) {
            this.ctx.shadowColor = '#34d399';
            this.ctx.shadowBlur = 10;
          }
          this.ctx.fillRect(
            part.x * this.gridSize + 1,
            part.y * this.gridSize + 1,
            this.gridSize - 2,
            this.gridSize - 2
          );
          this.ctx.shadowBlur = 0;
        }
      },

      drawGameOver() {
        this.ctx.fillStyle = 'rgba(6, 9, 19, 0.85)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#f43f5e';
        this.ctx.font = 'bold 24px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SIMULATION TERMINATED', this.canvas.width / 2, 170);

        this.ctx.fillStyle = '#f8fafc';
        this.ctx.font = '16px monospace';
        this.ctx.fillText(`SCORE: ${this.score} COMMITS`, this.canvas.width / 2, 210);

        this.ctx.fillStyle = '#22d3ee';
        this.ctx.font = '14px monospace';
        this.ctx.fillText('PRESS ARROW KEY OR TAP DPAD TO RESTART', this.canvas.width / 2, 250);
      }
    },

    setMode(mode) {
      this.currentMode = mode;
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.game === mode);
      });

      if (mode === 'quiz') this.quiz.render();
      else if (mode === 'terminal') this.terminal.render();
      else if (mode === 'snake') this.snake.render();

      history.replaceState(null, '', '?game=' + mode);
    }
  };

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Initialize App ---
  document.addEventListener('DOMContentLoaded', () => {
    MatrixRain.init();

    // Sound FX button
    const sfxBtn = document.getElementById('audioToggle');
    if (sfxBtn) {
      sfxBtn.addEventListener('click', () => {
        AudioEngine.enabled = !AudioEngine.enabled;
        sfxBtn.textContent = AudioEngine.enabled ? '🔊 SFX ON' : '🔇 SFX OFF';
      });
    }

    // Matrix button
    const matBtn = document.getElementById('matrixToggle');
    if (matBtn) {
      matBtn.addEventListener('click', () => {
        const state = MatrixRain.toggle();
        matBtn.textContent = state ? '⚡ MATRIX' : '⚪ MATRIX OFF';
      });
    }

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        AudioEngine.click();
        GamePod.setMode(btn.dataset.game);
      });
    });

    // Check query param (?game=...)
    const initialGame = new URLSearchParams(window.location.search).get('game') || 'quiz';
    GamePod.setMode(['quiz', 'terminal', 'snake'].includes(initialGame) ? initialGame : 'quiz');
  });

})();
