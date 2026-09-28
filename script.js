// LocalStorage Base Keys
const BASE_KEYS = {
    USER_SESSION: 'student_dashboard_active_session',
    SCHEDULE_PREFIX: 'student_dashboard_schedules_',
    TASKS_PREFIX: 'student_dashboard_tasks_'
};

// Application State
let currentUser = JSON.parse(localStorage.getItem(BASE_KEYS.USER_SESSION)) || null;
let schedules = [];
let tasks = [];

let activeDay = 'Senin';
let taskFilter = 'all';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initClock();
    initNavigation();
    initDiscordAuth();
    initScheduleManager();
    initTaskManager();
    
    // Check Active Session
    if (currentUser) {
        showDashboard();
    } else {
        showLoginOverlay();
    }
});

/* ==========================================
   1. PER-ACCOUNT STORAGE LOGIC (KUNCI UTAMA)
   ========================================== */
function getUserScheduleKey() {
    return currentUser ? `${BASE_KEYS.SCHEDULE_PREFIX}${currentUser.id}` : 'guest_schedules';
}

function getUserTaskKey() {
    return currentUser ? `${BASE_KEYS.TASKS_PREFIX}${currentUser.id}` : 'guest_tasks';
}

function loadUserData() {
    if (!currentUser) return;
    schedules = JSON.parse(localStorage.getItem(getUserScheduleKey())) || [];
    tasks = JSON.parse(localStorage.getItem(getUserTaskKey())) || [];
    renderAll();
}

function saveUserData() {
    if (!currentUser) return;
    localStorage.setItem(getUserScheduleKey(), JSON.stringify(schedules));
    localStorage.setItem(getUserTaskKey(), JSON.stringify(tasks));
    renderAll();
}

function clearCurrentUserData() {
    if (!currentUser) return;
    if (confirm(`Apakah kamu yakin ingin menghapus seluruh jadwal dan tugas untuk akun ${currentUser.username}?`)) {
        localStorage.removeItem(getUserScheduleKey());
        localStorage.removeItem(getUserTaskKey());
        schedules = [];
        tasks = [];
        renderAll();
        alert('Data akun berhasil dibersihkan!');
    }
}

/* ==========================================
   2. AUTHENTICATION & LOGIN OVERLAY
   ========================================== */
function initDiscordAuth() {
    const loginDiscordBtn = document.getElementById('loginDiscordBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    // Parse OAuth2 Token from URL Hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.has('access_token')) {
        const accessToken = hashParams.get('access_token');
        fetchDiscordUserProfile(accessToken);
        window.location.hash = ''; // Clear Hash
    }

    loginDiscordBtn.addEventListener('click', () => {
        const authUrl = `${DISCORD_CONFIG.AUTH_ENDPOINT}?client_id=${DISCORD_CONFIG.CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_CONFIG.REDIRECT_URI)}&response_type=token&scope=${DISCORD_CONFIG.SCOPES.join('%20')}`;
        window.location.href = authUrl;
    });

    logoutBtn.addEventListener('click', () => {
        if (confirm('Apakah kamu yakin ingin keluar dari akun ini?')) {
            currentUser = null;
            localStorage.removeItem(BASE_KEYS.USER_SESSION);
            showLoginOverlay();
        }
    });
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
            localStorage.setItem(BASE_KEYS.USER_SESSION, JSON.stringify(currentUser));
            showDashboard();
        }
    })
    .catch(err => {
        console.error('Error fetching Discord user profile:', err);
        alert('Gagal mengambil profil Discord. Periksa koneksi internet atau konfigurasi OAuth2.');
    });
}

// SIMULASI OFFLINE TESTING (Multi-Account Demo)
function loginDemo(accountType) {
    if (accountType === 'user_a') {
        currentUser = {
            id: 'demo_user_111',
            username: 'Budi (Mahasiswa A)',
            tag: '#1234',
            avatar: 'https://cdn.discordapp.com/embed/avatars/1.png'
        };
    } else {
        currentUser = {
            id: 'demo_user_222',
            username: 'Siti (Mahasiswa B)',
            tag: '#5678',
            avatar: 'https://cdn.discordapp.com/embed/avatars/2.png'
        };
    }
    localStorage.setItem(BASE_KEYS.USER_SESSION, JSON.stringify(currentUser));
    showDashboard();
}

function showLoginOverlay() {
    document.getElementById('loginOverlay').classList.add('active');
}

function showDashboard() {
    document.getElementById('loginOverlay').classList.remove('active');
    
    // Update Profile UI
    document.getElementById('userAvatar').src = currentUser.avatar;
    document.getElementById('userName').textContent = currentUser.username;
    document.getElementById('userTag').textContent = currentUser.tag;
    document.getElementById('pillAccountName').textContent = currentUser.username;

    // Update Settings UI
    document.getElementById('settingAccountName').textContent = currentUser.username;
    document.getElementById('settingAccountId').textContent = currentUser.id;
    document.getElementById('settingStorageKey').textContent = getUserScheduleKey();

    // Load Data
    loadUserData();
}

/* ==========================================
   3. CLOCK & NAVIGATION
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
    document.querySelectorAll('.nav-btn').forEach(btn => {
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
        settings: 'Pengaturan Akun & Memori'
    };
    document.getElementById('pageTitle').textContent = titles[tabId] || 'Dashboard';
}

/* ==========================================
   4. JADWAL KULIAH LOGIC
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
        saveUserData();
        form.reset();
        modal.classList.remove('active');
    });

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
    saveUserData();
}

/* ==========================================
   5. MANAJEMEN TUGAS LOGIC
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
        saveUserData();
        form.reset();
        modal.classList.remove('active');
    });

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
                <p>Tidak ada tugas dalam daftar ini.</p>
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
    saveUserData();
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveUserData();
}

/* ==========================================
   6. RENDER DASHBOARD & STATS
   ========================================== */
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
        priorityListEl.innerHTML = `<li style="color:var(--text-muted); font-size: 13px; list-style: none;">Tidak ada tugas prioritas tinggi. Kerjaan aman!</li>`;
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