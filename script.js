// LocalStorage Data Keys
const STORAGE_KEYS = {
    SCHEDULE: 'student_dashboard_schedules',
    TASKS: 'student_dashboard_tasks',
    DISCORD_USER: 'student_dashboard_user'
};

// Application State
let schedules = JSON.parse(localStorage.getItem(STORAGE_KEYS.SCHEDULE)) || [];
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS)) || [];
let currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.DISCORD_USER)) || null;

let activeDay = 'Senin';
let taskFilter = 'all';

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initClock();
    initNavigation();
    initDiscordAuth();
    initScheduleManager();
    initTaskManager();
    renderAll();
});

/* ==========================================
   1. CLOCK & NAVIGATION LOGIC
   ========================================== */
function initClock() {
    const clockEl = document.getElementById('liveClock');
    const updateTime = () => {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString('id-ID') + ' WIB';
    };
    updateTime();
    setInterval(updateTime, 1000);

    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('id-ID', dateOptions);
}

function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });
}

function switchTab(tabId) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    const activeNavBtn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
    const activeTabContent = document.getElementById(`tab-${tabId}`);

    if (activeNavBtn) activeNavBtn.classList.add('active');
    if (activeTabContent) activeTabContent.classList.add('active');

    const titles = {
        dashboard: 'Dashboard Ringkasan',
        schedule: 'Jadwal Kuliah',
        tasks: 'Manajemen Tugas',
        settings: 'Pengaturan OAuth2 Discord'
    };
    document.getElementById('pageTitle').textContent = titles[tabId] || 'Dashboard';
}

/* ==========================================
   2. DISCORD OAUTH2 AUTHORIZATION
   ========================================== */
function initDiscordAuth() {
    const topAuthBtn = document.getElementById('topAuthBtn');
    const authBtn = document.getElementById('authBtn');
    
    // Check URL Hash for OAuth Access Token
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.has('access_token')) {
        const accessToken = hashParams.get('access_token');
        fetchDiscordUserProfile(accessToken);
        window.location.hash = ''; // Clear URL hash
    }

    const triggerLogin = () => {
        if (currentUser) {
            // Logout confirmation
            if (confirm('Apakah kamu yakin ingin logout dari Discord?')) {
                currentUser = null;
                localStorage.removeItem(STORAGE_KEYS.DISCORD_USER);
                renderUserCard();
            }
        } else {
            // Redirect to Discord OAuth URL
            const authUrl = `${DISCORD_CONFIG.AUTH_ENDPOINT}?client_id=${DISCORD_CONFIG.CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_CONFIG.REDIRECT_URI)}&response_type=token&scope=${DISCORD_CONFIG.SCOPES.join('%20')}`;
            window.location.href = authUrl;
        }
    };

    topAuthBtn.addEventListener('click', triggerLogin);
    authBtn.addEventListener('click', triggerLogin);

    renderUserCard();
}

function fetchDiscordUserProfile(token) {
    fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        if (data.id) {
            currentUser = {
                id: data.id,
                username: data.global_name || data.username,
                tag: `#${data.discriminator !== '0' ? data.discriminator : '0000'}`,
                avatar: data.avatar 
                    ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png` 
                    : 'https://cdn.discordapp.com/embed/avatars/0.png'
            };
            localStorage.setItem(STORAGE_KEYS.DISCORD_USER, JSON.stringify(currentUser));
            renderUserCard();
        }
    })
    .catch(err => console.error('Gagal mengambil data akun Discord:', err));
}

function renderUserCard() {
    const avatarImg = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userTag = document.getElementById('userTag');
    const topAuthBtn = document.getElementById('topAuthBtn');
    const settingsStatus = document.getElementById('settingsLoginStatus');
    const settingsRedirect = document.getElementById('settingsRedirectUri');

    if (settingsRedirect) settingsRedirect.textContent = DISCORD_CONFIG.REDIRECT_URI;

    if (currentUser) {
        avatarImg.src = currentUser.avatar;
        userName.textContent = currentUser.username;
        userTag.textContent = currentUser.tag;
        topAuthBtn.innerHTML = `<i class="fa-solid fa-right-from-bracket"></i> Logout`;
        topAuthBtn.classList.replace('btn-discord', 'btn-secondary');
        if (settingsStatus) settingsStatus.textContent = `Terkoneksi sebagai ${currentUser.username}`;
    } else {
        avatarImg.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
        userName.textContent = 'Guest User';
        userTag.textContent = 'Belum Login';
        topAuthBtn.innerHTML = `<i class="fa-brands fa-discord"></i> Login Discord`;
        topAuthBtn.classList.replace('btn-secondary', 'btn-discord');
        if (settingsStatus) settingsStatus.textContent = 'Belum Terkoneksi (Mode Tamu)';
    }
}

/* ==========================================
   3. JADWAL KULIAH LOGIC
   ========================================== */
function initScheduleManager() {
    const modal = document.getElementById('scheduleModal');
    const openBtn = document.getElementById('openScheduleModalBtn');
    const closeBtn = document.getElementById('closeScheduleModal');
    const cancelBtn = document.getElementById('cancelScheduleModal');
    const form = document.getElementById('scheduleForm');

    openBtn.addEventListener('click', () => modal.classList.add('active'));
    [closeBtn, cancelBtn].forEach(b => b.addEventListener('click', () => modal.classList.remove('active')));

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const newSchedule = {
            id: Date.now().toString(),
            subject: document.getElementById('schedSubject').value,
            day: document.getElementById('schedDay').value,
            room: document.getElementById('schedRoom').value,
            startTime: document.getElementById('schedStartTime').value,
            endTime: document.getElementById('schedEndTime').value,
            lecturer: document.getElementById('schedLecturer').value
        };

        schedules.push(newSchedule);
        saveAndRender();
        form.reset();
        modal.classList.remove('active');
    });

    // Day picker tabs
    document.querySelectorAll('.day-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeDay = btn.getAttribute('data-day');
            renderSchedule();
        });
    });
}

function renderSchedule() {
    const listEl = document.getElementById('scheduleList');
    const filtered = schedules.filter(s => s.day === activeDay);

    if (filtered.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fa-solid fa-calendar-xmark"></i>
                <p>Tidak ada jadwal kuliah untuk hari ${activeDay}.</p>
            </div>`;
        return;
    }

    listEl.innerHTML = filtered.map(s => `
        <div class="sched-card">
            <div class="sched-time"><i class="fa-regular fa-clock"></i> ${s.startTime} - ${s.endTime}</div>
            <h3 class="sched-title">${escapeHtml(s.subject)}</h3>
            <div class="sched-detail"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(s.room)}</div>
            <div class="sched-detail"><i class="fa-solid fa-user-tie"></i> ${escapeHtml(s.lecturer || 'Dosen -')}</div>
            <button onclick="deleteSchedule('${s.id}')" style="position:absolute; top:12px; right:12px; background:none; border:none; color:var(--text-muted); cursor:pointer;">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function deleteSchedule(id) {
    schedules = schedules.filter(s => s.id !== id);
    saveAndRender();
}

/* ==========================================
   4. MANAJEMEN TUGAS LOGIC
   ========================================== */
function initTaskManager() {
    const modal = document.getElementById('taskModal');
    const openBtn = document.getElementById('openTaskModalBtn');
    const closeBtn = document.getElementById('closeTaskModal');
    const cancelBtn = document.getElementById('cancelTaskModal');
    const form = document.getElementById('taskForm');

    openBtn.addEventListener('click', () => modal.classList.add('active'));
    [closeBtn, cancelBtn].forEach(b => b.addEventListener('click', () => modal.classList.remove('active')));

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const newTask = {
            id: Date.now().toString(),
            title: document.getElementById('taskTitle').value,
            course: document.getElementById('taskCourse').value,
            priority: document.getElementById('taskPriority').value,
            deadline: document.getElementById('taskDeadline').value,
            notes: document.getElementById('taskNotes').value,
            completed: false
        };

        tasks.push(newTask);
        saveAndRender();
        form.reset();
        modal.classList.remove('active');
    });

    // Task Filter Buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            taskFilter = btn.getAttribute('data-filter');
            renderTasks();
        });
    });
}

function renderTasks() {
    const listEl = document.getElementById('taskList');
    let filtered = tasks;

    if (taskFilter === 'pending') filtered = tasks.filter(t => !t.completed);
    if (taskFilter === 'done') filtered = tasks.filter(t => t.completed);

    if (filtered.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-clipboard-check"></i>
                <p>Tidak ada tugas dalam kategori ini.</p>
            </div>`;
        return;
    }

    listEl.innerHTML = filtered.map(t => `
        <div class="task-card ${t.completed ? 'completed' : ''}">
            <div class="task-header">
                <span class="badge badge-${t.priority}">Prioritas ${t.priority}</span>
                <button onclick="deleteTask('${t.id}')" style="background:none; border:none; color:var(--text-muted); cursor:pointer;">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
            <h3 style="margin: 10px 0 4px 0; color:var(--text-heading); ${t.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${escapeHtml(t.title)}</h3>
            <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 10px;">${escapeHtml(t.course)}</p>
            <div style="font-size: 12px; color: var(--discord-yellow); margin-bottom: 12px;">
                <i class="fa-regular fa-clock"></i> Deadline: ${new Date(t.deadline).toLocaleString('id-ID')}
            </div>
            ${t.notes ? `<p style="font-size: 12px; background: var(--bg-tertiary); padding: 8px; border-radius: 6px; color: var(--text-normal); margin-bottom: 12px;">${escapeHtml(t.notes)}</p>` : ''}
            <button class="btn ${t.completed ? 'btn-secondary' : 'btn-primary'}" onclick="toggleTask('${t.id}')" style="width: 100%; justify-content: center; font-size: 12px;">
                <i class="fa-solid ${t.completed ? 'fa-rotate-left' : 'fa-check'}"></i>
                ${t.completed ? 'Tandai Belum Selesai' : 'Tandai Selesai'}
            </button>
        </div>
    `).join('');
}

function toggleTask(id) {
    tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveAndRender();
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveAndRender();
}

/* ==========================================
   5. DASHBOARD STATS & RENDER HELPERS
   ========================================== */
function saveAndRender() {
    localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(schedules));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    renderAll();
}

function renderAll() {
    renderSchedule();
    renderTasks();
    renderDashboardStats();
}

function renderDashboardStats() {
    const daysName = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayName = daysName[new Date().getDay()];
    
    const todayClasses = schedules.filter(s => s.day === todayName);
    const pendingTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);

    document.getElementById('statTodayClasses').textContent = `${todayClasses.length} Matakuliah`;
    document.getElementById('statPendingTasks').textContent = `${pendingTasks.length} Tugas`;
    document.getElementById('statCompletedTasks').textContent = `${completedTasks.length} Tugas`;

    // Next class display
    const nextClassEl = document.getElementById('nextClassContainer');
    if (todayClasses.length > 0) {
        const next = todayClasses[0];
        nextClassEl.innerHTML = `
            <div class="sched-card" style="margin: 0;">
                <div class="sched-time"><i class="fa-regular fa-clock"></i> ${next.startTime} - ${next.endTime}</div>
                <h3 class="sched-title">${escapeHtml(next.subject)}</h3>
                <div class="sched-detail"><i class="fa-solid fa-location-dot"></i> Ruang: ${escapeHtml(next.room)}</div>
                <div class="sched-detail"><i class="fa-solid fa-user-tie"></i> Dosen: ${escapeHtml(next.lecturer || '-')}</div>
            </div>`;
    } else {
        nextClassEl.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-mug-hot"></i>
                <p>Tidak ada perkuliahan untuk hari ini (${todayName})!</p>
            </div>`;
    }

    // Priority tasks list
    const priorityListEl = document.getElementById('priorityTaskList');
    const highPriorityTasks = tasks.filter(t => !t.completed && t.priority === 'high');

    if (highPriorityTasks.length === 0) {
        priorityListEl.innerHTML = `<li style="color:var(--text-muted); font-size: 13px; list-style: none;">Tidak ada tugas prioritas tinggi. Good job!</li>`;
    } else {
        priorityListEl.innerHTML = highPriorityTasks.slice(0, 3).map(t => `
            <li style="margin-bottom: 10px; list-style: none; display: flex; justify-content: space-between; align-items: center; background: var(--bg-tertiary); padding: 8px 12px; border-radius: 6px;">
                <div>
                    <strong style="color: var(--text-heading); font-size: 13px;">${escapeHtml(t.title)}</strong>
                    <div style="font-size: 11px; color: var(--discord-red);">${escapeHtml(t.course)}</div>
                </div>
                <button onclick="switchTab('tasks')" class="btn-text">Buka</button>
            </li>
        `).join('');
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, match => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[match]));
}