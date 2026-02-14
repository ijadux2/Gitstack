// GitStack Application - Enhanced Edition with File Tree Viewer
class GitStackApp {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'landing';
        this.currentRepo = null;
        this.currentPath = '';
        this.animationsEnabled = true;
        this.notifications = [];
        this.settings = this.loadSettings();
        this.init();
    }

    init() {
        this.bindEvents();
        this.initAnimations();
        this.initCursorGlow();
        this.checkAuth();
    }

    // Settings Management
    loadSettings() {
        const defaults = {
            theme: 'mocha',
            animations: true,
            notifications: true,
            compactView: false,
            codeFontSize: 14,
            showLineNumbers: true
        };
        const saved = localStorage.getItem('gitstack_settings');
        return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    }

    saveSettings() {
        localStorage.setItem('gitstack_settings', JSON.stringify(this.settings));
    }

    // Notifications System
    initNotifications() {
        // Only start notifications after user is authenticated
        if (this.currentUser) {
            this.checkGitHubNotifications();
            // Store interval ID so it can be cleared later
            this.notificationsInterval = setInterval(() => this.checkGitHubNotifications(), 300000);
        }
    }

    async checkGitHubNotifications() {
        if (!this.currentUser) return;
        try {
            // Use server endpoint instead of direct GitHub API call
            const response = await fetch('/api/user/notifications');
            if (response.ok) {
                const notifications = await response.json();
                this.updateNotificationBadge(notifications.length);
                this.notifications = notifications;
            } else if (response.status === 401) {
                // Authentication failed, stop checking
                if (this.notificationsInterval) {
                    clearInterval(this.notificationsInterval);
                }
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    }

    updateNotificationBadge(count) {
        const badge = document.getElementById('notification-badge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    showNotifications() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content notifications-modal">
                <div class="modal-header">
                    <h2><i class="fas fa-bell"></i> Notifications</h2>
                    <button class="btn btn-icon close-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${this.notifications.length === 0 ? `
                        <div class="empty-state">
                            <i class="fas fa-bell-slash"></i>
                            <p>No new notifications</p>
                        </div>
                    ` : `
                        <div class="notifications-list">
                            ${this.notifications.map(notif => `
                                <div class="notification-item ${notif.unread ? 'unread' : ''}">
                                    <div class="notification-icon">
                                        <i class="fas fa-bell"></i>
                                    </div>
                                    <div class="notification-content">
                                        <div class="notification-title">${notif.subject?.title || 'Notification'}</div>
                                        <div class="notification-meta">${notif.repository?.full_name || ''}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    }

    initCursorGlow() {
        // Add cursor glow effect
        const glow = document.createElement('div');
        glow.className = 'cursor-glow';
        glow.style.cssText = `
            position: fixed;
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, rgba(203, 166, 247, 0.15) 0%, transparent 70%);
            pointer-events: none;
            z-index: 9999;
            transform: translate(-50%, -50%);
            transition: opacity 0.3s ease;
            opacity: 0;
        `;
        document.body.appendChild(glow);

        let mouseX = 0, mouseY = 0;
        let glowX = 0, glowY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            glow.style.opacity = '1';
        });

        document.addEventListener('mouseleave', () => {
            glow.style.opacity = '0';
        });

        // Smooth animation loop
        const animate = () => {
            glowX += (mouseX - glowX) * 0.1;
            glowY += (mouseY - glowY) * 0.1;
            glow.style.left = glowX + 'px';
            glow.style.top = glowY + 'px';
            requestAnimationFrame(animate);
        };
        animate();

        // Initialize typing animation for hero code
        this.initHeroTyping();
    }

    initHeroTyping() {
        const codeElement = document.getElementById('hero-code');
        if (!codeElement) return;

        const originalHTML = codeElement.innerHTML;
        codeElement.innerHTML = '';
        codeElement.style.opacity = '1';

        // Parse the HTML content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = originalHTML;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';

        let index = 0;
        const typeSpeed = 30; // ms per character

        const typeChar = () => {
            if (index < textContent.length) {
                const char = textContent.charAt(index);
                codeElement.textContent += char;
                index++;
                setTimeout(typeChar, typeSpeed);
            } else {
                // Restore HTML formatting after typing
                codeElement.innerHTML = originalHTML;
            }
        };

        // Start typing animation after a delay
        setTimeout(typeChar, 800);
    }

    initAnimations() {
        // Add intersection observer for scroll animations
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fadeInUp');
                    entry.target.style.opacity = '1';
                }
            });
        }, { threshold: 0.1 });

        // Observe elements for scroll animations
        document.querySelectorAll('.repo-card, .feature-card, .issue-item, .pull-item').forEach(el => {
            el.style.opacity = '0';
            this.observer.observe(el);
        });
    }

    // Event Bindings
    bindEvents() {
        // Navigation
        document.getElementById('login-btn')?.addEventListener('click', () => this.login());
        document.getElementById('hero-login-btn')?.addEventListener('click', () => this.login());
        document.getElementById('logout-btn')?.addEventListener('click', () => this.logout());

        // User menu toggle
        document.getElementById('user-avatar')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleUserMenu();
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.classList.add('hidden');
            });
        });

        // Repository creation
        document.getElementById('new-repo-btn')?.addEventListener('click', () => this.showModal('create-repo-modal'));
        document.getElementById('create-repo-btn')?.addEventListener('click', () => this.showModal('create-repo-modal'));

        // Modal close buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) this.hideModal(modal.id);
            });
        });

        // Form submissions
        document.getElementById('create-repo-form')?.addEventListener('submit', (e) => this.createRepository(e));
        document.getElementById('create-issue-form')?.addEventListener('submit', (e) => this.createIssue(e));

        // Repository source filter
        document.getElementById('repo-source')?.addEventListener('change', () => this.loadRepositories());

        // Repository navigation tabs
        document.querySelectorAll('.repo-nav-item').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = tab.dataset.tab;
                this.switchRepoTab(tabName);
            });
        });

        // New issue button
        document.getElementById('new-issue-btn')?.addEventListener('click', () => this.showModal('create-issue-modal'));

        // New pull request button
        document.getElementById('new-pull-btn')?.addEventListener('click', () => this.showToast('Pull request creation coming soon!', 'info'));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Theme toggle
        document.getElementById('theme-toggle')?.addEventListener('click', () => this.toggleAnimations());

        // Notifications
        document.getElementById('notifications-btn')?.addEventListener('click', () => this.showNotifications());

        // Settings link
        document.querySelector('a[href="#settings"]')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.loadSettingsPage();
        });
    }

    toggleAnimations() {
        this.animationsEnabled = !this.animationsEnabled;
        document.body.classList.toggle('animations-disabled', !this.animationsEnabled);
        
        const icon = document.querySelector('#theme-toggle i');
        if (icon) {
            icon.className = this.animationsEnabled ? 'fas fa-sparkles' : 'fas fa-minus-circle';
        }
        
        this.showToast(
            this.animationsEnabled ? 'Animations enabled ✨' : 'Animations disabled',
            'info'
        );
    }

    // Authentication
    async checkAuth() {
        try {
            const response = await fetch('/api/auth/me');
            const data = await response.json();
            
            if (data.authenticated) {
                this.currentUser = data.user;
                this.showAuthenticatedUI();
                // Initialize notifications after authentication is confirmed
                this.initNotifications();
                // Check for hash route or default to dashboard
                const hash = window.location.hash.replace('#', '') || 'dashboard';
                this.navigate(hash);
            } else {
                this.showUnauthenticatedUI();
                this.navigate('landing');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.showUnauthenticatedUI();
        }
    }

    login() {
        window.location.href = '/api/auth/github';
    }

    async logout() {
        try {
            const response = await fetch('/api/auth/logout');
            if (response.ok) {
                this.currentUser = null;
                // Clear notifications interval on logout
                if (this.notificationsInterval) {
                    clearInterval(this.notificationsInterval);
                    this.notificationsInterval = null;
                }
                this.showUnauthenticatedUI();
                this.navigate('landing');
                this.showToast('Successfully logged out', 'success');
            }
        } catch (error) {
            console.error('Logout failed:', error);
            this.showToast('Logout failed', 'error');
        }
    }

    // UI State Management
    showAuthenticatedUI() {
        document.getElementById('auth-section')?.classList.add('hidden');
        document.getElementById('user-section')?.classList.remove('hidden');
        
        if (this.currentUser) {
            const avatar = document.getElementById('user-avatar');
            const username = document.getElementById('user-username');
            const dashboardUsername = document.getElementById('dashboard-username');
            
            if (avatar) avatar.src = this.currentUser.avatar;
            if (username) username.textContent = `@${this.currentUser.username}`;
            if (dashboardUsername) dashboardUsername.textContent = this.currentUser.displayName || this.currentUser.username;
        }
    }

    showUnauthenticatedUI() {
        document.getElementById('auth-section')?.classList.remove('hidden');
        document.getElementById('user-section')?.classList.add('hidden');
    }

    toggleUserMenu() {
        const menu = document.querySelector('.dropdown-menu');
        if (menu) menu.classList.toggle('hidden');
    }

    // Navigation with smooth transitions
    async navigate(page) {
        // Fade out current page
        const currentPageEl = document.querySelector('.page:not(.hidden)');
        if (currentPageEl && this.animationsEnabled) {
            currentPageEl.style.animation = 'fadeOut 0.3s ease forwards';
            await this.sleep(250);
        }
        
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.add('hidden');
            p.style.animation = '';
        });
        
        // Show target page with animation
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.classList.remove('hidden');
            if (this.animationsEnabled) {
                targetPage.style.animation = 'fadeInUp 0.4s ease forwards';
            }
        }
        
        this.currentPage = page;
        
        // Update URL hash for SPA routing
        window.history.pushState({ page }, '', `#${page}`);
        
        // Page-specific initialization
        switch (page) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'repositories':
                this.loadRepositories();
                break;
            case 'profile':
                this.loadProfile();
                break;
        }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Dashboard
    async loadDashboard() {
        await this.loadSidebarRepos();
    }

    async loadSidebarRepos() {
        const repoList = document.getElementById('repo-list');
        if (!repoList) return;
        
        try {
            const response = await fetch('/api/repos?per_page=10');
            const repos = await response.json();
            
            repoList.innerHTML = repos.map(repo => `
                <a href="#repo/${repo.owner.login}/${repo.name}" class="repo-list-item" data-owner="${repo.owner.login}" data-repo="${repo.name}">
                    <i class="fas fa-book"></i>
                    <span>${repo.name}</span>
                </a>
            `).join('');
            
            // Add click handlers
            repoList.querySelectorAll('.repo-list-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const owner = item.dataset.owner;
                    const repo = item.dataset.repo;
                    this.loadRepository(owner, repo);
                });
            });
        } catch (error) {
            console.error('Failed to load repositories:', error);
            repoList.innerHTML = '<div class="empty-state">Failed to load repositories</div>';
        }
    }

    // Repositories Page with loading animations
    async loadRepositories() {
        const listContainer = document.getElementById('repositories-list');
        if (!listContainer) return;
        
        const repoSource = document.getElementById('repo-source')?.value || 'github';
        
        // Show skeleton loading state
        listContainer.innerHTML = Array(5).fill(0).map((_, i) => `
            <div class="repo-card skeleton-card" style="animation-delay: ${i * 0.1}s">
                <div class="skeleton" style="height: 24px; width: 40%; margin-bottom: 12px;"></div>
                <div class="skeleton" style="height: 16px; width: 70%; margin-bottom: 20px;"></div>
                <div style="display: flex; gap: 16px;">
                    <div class="skeleton" style="height: 14px; width: 80px;"></div>
                    <div class="skeleton" style="height: 14px; width: 60px;"></div>
                </div>
            </div>
        `).join('');
        
        try {
            let repos;
            if (repoSource === 'local') {
                const response = await fetch('/api/local');
                repos = await response.json();
            } else {
                const response = await fetch('/api/repos?sort=updated&per_page=50');
                repos = await response.json();
            }
            
            if (repos.length === 0) {
                listContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>No repositories found</p>
                        ${repoSource === 'local' ? `
                            <p style="margin-top: 10px; font-size: 0.9em; color: var(--ctp-overlay0);">
                                Add git repos to the /repos folder or clone them.
                            </p>
                        ` : `
                            <button class="btn btn-primary" onclick="window.gitstack.showModal('create-repo-modal')">
                                Create your first repository
                            </button>
                        `}
                    </div>
                `;
                return;
            }
            
            listContainer.innerHTML = repos.map((repo, index) => {
                const isLocal = repo.isLocal || repoSource === 'local';
                const name = repo.name;
                const owner = repo.owner?.login || 'local';
                const description = repo.description || 'No description';
                const updated = repo.updated_at ? this.formatDate(repo.updated_at) : (repo.lastCommit ? this.formatDate(new Date(repo.lastCommit.timestamp * 1000)) : '');
                
                return `
                <div class="repo-card" style="animation: fadeInUp 0.4s ease ${index * 0.1}s backwards;">
                    <div class="repo-card-header">
                        <div class="repo-card-title">
                            <a href="#repo/${owner}/${name}" data-owner="${owner}" data-repo="${name}" data-source="${repoSource}">
                                ${name}
                            </a>
                            <span class="badge">${isLocal ? 'Local' : (repo.private ? 'Private' : 'Public')}</span>
                        </div>
                    </div>
                    <p class="repo-card-description">${description}</p>
                    <div class="repo-card-meta">
                        <span><i class="fas fa-code-branch"></i> ${repo.branch || 'main'}</span>
                        ${repo.lastCommit ? `<span>Updated ${updated}</span>` : ''}
                    </div>
                </div>
            `}).join('');
            
            // Add click handlers with hover effects
            listContainer.querySelectorAll('a[data-owner]').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const source = link.dataset.source || 'github';
                    this.loadRepository(link.dataset.owner, link.dataset.repo, source);
                });
            });
        } catch (error) {
            console.error('Failed to load repositories:', error);
            listContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle" style="color: var(--ctp-red);"></i>
                    <p>Failed to load repositories</p>
                    <button class="btn btn-secondary" onclick="window.gitstack.loadRepositories()">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                </div>
            `;
        }
    }

    // Repository Detail Page
    async loadRepository(owner, name, source = 'github') {
        this.currentRepo = { owner, name, source };
        this.navigate('repository');
        
        try {
            // Load repository details
            const apiPath = source === 'local' ? `/api/local/${name}` : `/api/repos/${owner}/${name}`;
            const response = await fetch(apiPath);
            const repo = await response.json();
            
            // Update header
            document.getElementById('repo-owner').textContent = owner;
            document.getElementById('repo-name').textContent = name;
            document.getElementById('repo-visibility').textContent = repo.isLocal ? 'Local' : (repo.private ? 'Private' : 'Public');
            document.getElementById('repo-description').textContent = repo.description || 'No description provided';
            document.getElementById('repo-stars').textContent = repo.stargazers_count || 0;
            document.getElementById('repo-watchers').textContent = repo.watchers_count || 0;
            document.getElementById('repo-forks').textContent = repo.forks_count || 0;
            
            // Load file list
            this.loadFileList(owner, name, '', source);
            
            // Load issues count
            if (source !== 'local') {
                this.loadIssuesCount(owner, name);
            
            // Load PRs count
            this.loadPRsCount(owner, name);
            }
            
        } catch (error) {
            console.error('Failed to load repository:', error);
            this.showToast('Failed to load repository', 'error');
        }
    }

    async loadFileList(owner, name, path = '', source = 'github') {
        const fileList = document.getElementById('file-list');
        if (!fileList) return;
        
        this.currentRepo = { owner, name, source };
        
        fileList.innerHTML = `
            <div class="file-tree-loading">
                <div class="loading-spinner"></div>
                <span>Loading files...</span>
            </div>
        `;
        
        try {
            const apiPath = source === 'local' 
                ? `/api/local/${name}/contents/${path}` 
                : `/api/repos/${owner}/${name}/contents/${path}`;
            const response = await fetch(apiPath);
            const files = await response.json();
            
            if (!Array.isArray(files)) {
                this.viewFile(owner, name, path, files, source);
                return;
            }
            
            files.sort((a, b) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return a.type === 'dir' ? -1 : 1;
            });
            
            const breadcrumb = this.buildBreadcrumb(owner, name, path);
            
            const readmeFile = files.find(f => f.name.toLowerCase().startsWith('readme'));
            let readmeContent = '';
            if (readmeFile && path === '') {
                try {
                    const readmeApi = source === 'local'
                        ? `/api/local/${name}/contents/${readmeFile.path}`
                        : `/api/repos/${owner}/${name}/contents/${readmeFile.path}`;
                    const readmeResp = await fetch(readmeApi);
                    const readmeData = await readmeResp.json();
                    if (readmeData.content) {
                        readmeContent = this.renderReadme(atob(readmeData.content));
                    }
                } catch (e) {}
            }
            
            fileList.innerHTML = `
                ${breadcrumb}
                ${readmeContent ? `<div class="readme-container">${readmeContent}</div>` : ''}
                <div class="file-tree">
                    ${files.map((file, index) => `
                        <div class="file-tree-item ${file.type}" 
                             data-type="${file.type}" 
                             data-path="${file.path}"
                             data-source="${source}"
                             style="animation: fadeInUp 0.3s ease ${index * 0.05}s backwards">
                            <div class="file-icon">
                                ${this.getFileIcon(file.name, file.type)}
                            </div>
                            <div class="file-info">
                                <span class="file-name">${file.name}</span>
                                ${file.type === 'file' ? `<span class="file-size">${this.formatFileSize(file.size)}</span>` : ''}
                            </div>
                            ${file.type === 'file' ? `
                                <button class="btn btn-icon btn-sm view-file-btn" title="View file">
                                    <i class="fas fa-eye"></i>
                                </button>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
            
            fileList.querySelectorAll('.file-tree-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (e.target.closest('.view-file-btn')) {
                        e.stopPropagation();
                        this.viewFile(owner, name, item.dataset.path, null, source);
                    } else if (item.dataset.type === 'dir') {
                        this.loadFileList(owner, name, item.dataset.path, source);
                    } else {
                        this.viewFile(owner, name, item.dataset.path, null, source);
                    }
                });
            });
            
            fileList.querySelectorAll('.breadcrumb-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.loadFileList(owner, name, item.dataset.path, source);
                });
            });
            
        } catch (error) {
            console.error('Failed to load files:', error);
            fileList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle" style="color: var(--ctp-red);"></i>
                    <p>Failed to load files</p>
                    <button class="btn btn-secondary" onclick="window.gitstack.loadFileList('${owner}', '${name}', '${path}', '${source}')">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            `;
        }
    }

    buildBreadcrumb(owner, repo, path) {
        const parts = path.split('/').filter(p => p);
        let html = `<div class="breadcrumb">
            <span class="breadcrumb-item" data-path="">
                <i class="fas fa-folder"></i> ${repo}
            </span>`;
        
        let currentPath = '';
        parts.forEach((part, index) => {
            currentPath += (currentPath ? '/' : '') + part;
            html += `
                <span class="breadcrumb-separator">/</span>
                <span class="breadcrumb-item" data-path="${currentPath}">${part}</span>`;
        });
        
        return html + '</div>';
    }

    getFileIcon(filename, type) {
        if (type === 'dir') {
            return '<i class="fas fa-folder" style="color: var(--ctp-yellow);"></i>';
        }
        
        const ext = filename.split('.').pop().toLowerCase();
        const icons = {
            js: '<i class="fab fa-js" style="color: #f7df1e;"></i>',
            jsx: '<i class="fab fa-react" style="color: #61dafb;"></i>',
            ts: '<i class="fab fa-js" style="color: #3178c6;"></i>',
            tsx: '<i class="fab fa-react" style="color: #61dafb;"></i>',
            html: '<i class="fab fa-html5" style="color: #e34c26;"></i>',
            css: '<i class="fab fa-css3-alt" style="color: #264de4;"></i>',
            scss: '<i class="fab fa-sass" style="color: #cf649a;"></i>',
            json: '<i class="fas fa-code" style="color: var(--ctp-teal);"></i>',
            md: '<i class="fas fa-file-alt" style="color: var(--ctp-text);"></i>',
            py: '<i class="fab fa-python" style="color: #3572A5;"></i>',
            java: '<i class="fab fa-java" style="color: #b07219;"></i>',
            php: '<i class="fab fa-php" style="color: #777bb4;"></i>',
            rb: '<i class="fas fa-gem" style="color: #cc342d;"></i>',
            go: '<i class="fas fa-code" style="color: #00add8;"></i>',
            rs: '<i class="fas fa-cog" style="color: #dea584;"></i>',
            cpp: '<i class="fas fa-code" style="color: #f34b7d;"></i>',
            c: '<i class="fas fa-code" style="color: #555555;"></i>',
            sql: '<i class="fas fa-database" style="color: var(--ctp-green);"></i>',
            yml: '<i class="fas fa-cog" style="color: var(--ctp-teal);"></i>',
            yaml: '<i class="fas fa-cog" style="color: var(--ctp-teal);"></i>',
            dockerfile: '<i class="fab fa-docker" style="color: #2496ed;"></i>',
            env: '<i class="fas fa-key" style="color: #ecd53f;"></i>',
            gitignore: '<i class="fab fa-git-alt" style="color: #f05032;"></i>',
            txt: '<i class="fas fa-file-alt" style="color: var(--ctp-overlay0);"></i>',
            sh: '<i class="fas fa-terminal" style="color: var(--ctp-green);"></i>',
            bash: '<i class="fas fa-terminal" style="color: var(--ctp-green);"></i>'
        };
        
        return icons[ext] || '<i class="fas fa-file" style="color: var(--ctp-overlay0);"></i>';
    }

    renderReadme(content) {
        let html = content;
        
        html = html
            .replace(/^###### (.*$)/gim, '<h6>$1</h6>')
            .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
            .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        html = html
            .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
        
        html = html
            .replace(/`([^`]+)`/g, '<code>$1</code>');
        
        html = html
            .replace(/^\*\*\* (.*$)/gim, '<li style="list-style: none;"><strong>$1</strong></li>')
            .replace(/^\*\* (.*$)/gim, '<li style="list-style: none;">$1</li>')
            .replace(/^\- \[x\] (.*$)/gim, '<li><input type="checkbox" checked disabled> $1</li>')
            .replace(/^\- \[ \] (.*$)/gim, '<li><input type="checkbox" disabled> $1</li>')
            .replace(/^\- (.*$)/gim, '<li>$1</li>')
            .replace(/^\* (.*$)/gim, '<li>$1</li>')
            .replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
        
        html = html
            .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
            .replace(/^---$/gim, '<hr>')
            .replace(/^___$/gim, '<hr>');
        
        html = html
            .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/~~(.*?)~~/g, '<del>$1</del>')
            .replace(/`([^`]+)`/g, '<code>$1</code>');
        
        html = html
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
            .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
        
        html = html
            .replace(/\|(.+)\|/g, (match) => {
                const cells = match.split('|').filter(c => c.trim());
                if (cells.every(c => c.trim().match(/^-+$/))) {
                    return '';
                }
                const isHeader = !match.includes('---');
                const tag = isHeader ? 'th' : 'td';
                return '<tr>' + cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>';
            });
        
        html = html.replace(/(<tr>.*<\/tr>)+/g, '<table>$&</table>');
        
        html = html
            .split('\n\n')
            .map(block => {
                block = block.trim();
                if (!block) return '';
                if (block.match(/^<(h[1-6]|pre|blockquote|hr|table|ul|ol)/)) {
                    return block;
                }
                return `<p>${block.replace(/\n/g, '<br>')}</p>`;
            })
            .join('\n');
        
        return `<div class="readme-content">${html}</div>`;
    }

    async viewFile(owner, repo, path, fileData = null, source = 'github') {
        const modal = document.createElement('div');
        modal.className = 'modal file-viewer-modal';
        
        modal.innerHTML = `
            <div class="modal-content file-viewer-content">
                <div class="modal-header">
                    <h3><i class="fas fa-file-code"></i> ${path.split('/').pop()}</h3>
                    <div class="file-actions">
                        <button class="btn btn-icon" id="copy-file-btn" title="Copy content">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn btn-icon close-modal" title="Close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="modal-body file-viewer-body">
                    <div class="file-loading">
                        <div class="loading-spinner"></div>
                        <span>Loading file...</span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        
        try {
            let content;
            
            if (fileData && fileData.content) {
                content = atob(fileData.content);
            } else {
                const apiPath = source === 'local'
                    ? `/api/local/${repo}/contents/${path}`
                    : `/api/repos/${owner}/${repo}/contents/${path}`;
                const resp = await fetch(apiPath);
                const data = await resp.json();
                content = data.content ? atob(data.content) : (data || '');
            }
            
            const ext = path.split('.').pop().toLowerCase();
            const isImage = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext);
            const isMarkdown = ['md', 'markdown'].includes(ext);
            
            let contentHtml;
            if (isImage) {
                contentHtml = `<div class="image-preview"><img src="data:image/${ext};base64,${btoa(content)}" alt="${path}"></div>`;
            } else if (isMarkdown) {
                contentHtml = `<div class="markdown-preview">${this.renderReadme(content)}</div>`;
            } else {
                contentHtml = `<pre><code>${this.escapeHtml(content)}</code></pre>`;
            }
            
            modal.querySelector('.file-viewer-body').innerHTML = contentHtml;
            
            modal.querySelector('#copy-file-btn')?.addEventListener('click', () => {
                navigator.clipboard.writeText(content);
                this.showToast('Copied to clipboard', 'success');
            });
            
        } catch (error) {
            console.error('Failed to load file:', error);
            modal.querySelector('.file-viewer-body').innerHTML = '<div class="empty-state">Failed to load file</div>';
        }
    }

    escapeHtml(text) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    async loadIssuesCount(owner, name) {
        try {
            const response = await fetch(`/api/issues/${owner}/${name}?state=open`);
            const data = await response.json();
            const count = (data.github?.length || 0) + (data.local?.length || 0);
            document.getElementById('issues-count').textContent = count;
        } catch (error) {
            console.error('Failed to load issues count:', error);
        }
    }

    async loadPRsCount(owner, name) {
        try {
            const response = await fetch(`/api/pulls/${owner}/${name}?state=open`);
            const data = await response.json();
            const count = (data.github?.length || 0) + (data.local?.length || 0);
            document.getElementById('pulls-count').textContent = count;
        } catch (error) {
            console.error('Failed to load PRs count:', error);
        }
    }

    switchRepoTab(tabName) {
        // Update navigation
        document.querySelectorAll('.repo-nav-item').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        
        const tabContent = document.getElementById(`${tabName}-tab`);
        if (tabContent) tabContent.classList.remove('hidden');
        
        // Load tab-specific content
        if (tabName === 'issues' && this.currentRepo) {
            this.loadIssues(this.currentRepo.owner, this.currentRepo.name);
        } else if (tabName === 'pulls' && this.currentRepo) {
            this.loadPullRequests(this.currentRepo.owner, this.currentRepo.name);
        }
    }

    async loadIssues(owner, name) {
        const issuesList = document.getElementById('issues-list');
        if (!issuesList) return;
        
        try {
            const response = await fetch(`/api/issues/${owner}/${name}`);
            const data = await response.json();
            
            const allIssues = [...(data.github || []), ...(data.local || [])];
            
            if (allIssues.length === 0) {
                issuesList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-check-circle"></i>
                        <p>No open issues</p>
                    </div>
                `;
                return;
            }
            
            issuesList.innerHTML = allIssues.map(issue => `
                <div class="issue-item">
                    <i class="fas fa-exclamation-circle issue-icon ${issue.state}"></i>
                    <div class="issue-content">
                        <div class="issue-title">${issue.title}</div>
                        <div class="issue-meta">
                            #${issue.number || issue._id} opened ${this.formatDate(issue.created_at || issue.createdAt)} by ${issue.user?.login || issue.author}
                        </div>
                    </div>
                    ${issue.labels ? `
                        <div class="issue-labels">
                            ${issue.labels.map(label => `
                                <span class="badge" style="background-color: #${label.color || 'e1e4e8'}; color: ${this.getContrastColor(label.color || 'e1e4e8')}">${label.name || label}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Failed to load issues:', error);
            issuesList.innerHTML = '<div class="empty-state">Failed to load issues</div>';
        }
    }

    async loadPullRequests(owner, name) {
        const pullsList = document.getElementById('pulls-list');
        if (!pullsList) return;
        
        try {
            const response = await fetch(`/api/pulls/${owner}/${name}`);
            const data = await response.json();
            
            const allPRs = [...(data.github || []), ...(data.local || [])];
            
            if (allPRs.length === 0) {
                pullsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-code-pull-request"></i>
                        <p>No open pull requests</p>
                    </div>
                `;
                return;
            }
            
            pullsList.innerHTML = allPRs.map(pr => `
                <div class="pull-item">
                    <i class="fas fa-code-pull-request pull-icon ${pr.state}"></i>
                    <div class="pull-content">
                        <div class="pull-title">${pr.title}</div>
                        <div class="pull-meta">
                            #${pr.number || pr._id} opened ${this.formatDate(pr.created_at || pr.createdAt)} by ${pr.user?.login || pr.author}
                        </div>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Failed to load pull requests:', error);
            pullsList.innerHTML = '<div class="empty-state">Failed to load pull requests</div>';
        }
    }

    // Repository CRUD
    async createRepository(e) {
        e.preventDefault();
        
        const name = document.getElementById('repo-name-input').value;
        const description = document.getElementById('repo-desc-input').value;
        const isPrivate = document.querySelector('input[name="visibility"]:checked').value === 'private';
        const initReadme = document.getElementById('init-readme').checked;
        
        try {
            const response = await fetch('/api/repos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    description,
                    private: isPrivate,
                    auto_init: initReadme
                })
            });
            
            if (response.ok) {
                const repo = await response.json();
                this.hideModal('create-repo-modal');
                this.showToast('Repository created successfully!', 'success');
                this.loadRepository(repo.owner.login, repo.name);
            } else {
                const error = await response.json();
                this.showToast(error.error || 'Failed to create repository', 'error');
            }
        } catch (error) {
            console.error('Failed to create repository:', error);
            this.showToast('Failed to create repository', 'error');
        }
    }

    // Issue CRUD
    async createIssue(e) {
        e.preventDefault();
        
        if (!this.currentRepo) return;
        
        const title = document.getElementById('issue-title-input').value;
        const body = document.getElementById('issue-desc-input').value;
        const labels = Array.from(document.getElementById('issue-labels').selectedOptions).map(opt => opt.value);
        
        try {
            const response = await fetch(`/api/issues/${this.currentRepo.owner}/${this.currentRepo.name}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title,
                    body,
                    labels,
                    useGithub: true
                })
            });
            
            if (response.ok) {
                const issue = await response.json();
                this.hideModal('create-issue-modal');
                this.showToast('Issue created successfully!', 'success');
                this.loadIssues(this.currentRepo.owner, this.currentRepo.name);
                
                // Reset form
                document.getElementById('create-issue-form').reset();
            } else {
                const error = await response.json();
                this.showToast(error.error || 'Failed to create issue', 'error');
            }
        } catch (error) {
            console.error('Failed to create issue:', error);
            this.showToast('Failed to create issue', 'error');
        }
    }

    // Profile
    async loadProfile() {
        if (!this.currentUser) return;
        
        document.getElementById('profile-avatar').src = this.currentUser.avatar;
        document.getElementById('profile-name').textContent = this.currentUser.displayName || this.currentUser.username;
        document.getElementById('profile-username').textContent = `@${this.currentUser.username}`;
        
        try {
            const response = await fetch('/api/user/profile');
            const profile = await response.json();
            
            document.getElementById('profile-bio').textContent = profile.bio || 'No bio provided';
            document.getElementById('profile-followers').textContent = profile.followers;
            document.getElementById('profile-following').textContent = profile.following;
            document.getElementById('profile-repo-count').textContent = profile.public_repos;
        } catch (error) {
            console.error('Failed to load profile:', error);
        }
        
        // Load popular repos
        this.loadProfileRepos();
    }

    async loadProfileRepos() {
        const container = document.getElementById('profile-repos');
        if (!container) return;
        
        try {
            const response = await fetch('/api/repos?sort=stars&per_page=6');
            const repos = await response.json();
            
            container.innerHTML = repos.map(repo => `
                <div class="repo-card">
                    <div class="repo-card-title">
                        <a href="#repo/${repo.owner.login}/${repo.name}" data-owner="${repo.owner.login}" data-repo="${repo.name}">${repo.name}</a>
                    </div>
                    <p class="repo-card-description">${repo.description || ''}</p>
                    <div class="repo-card-meta">
                        ${repo.language ? `
                            <span>
                                <span class="language-color" style="background-color: ${this.getLanguageColor(repo.language)}"></span>
                                ${repo.language}
                            </span>
                        ` : ''}
                        <span><i class="far fa-star"></i> ${repo.stargazers_count}</span>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Failed to load profile repos:', error);
        }
    }

    // Modal Management with animations
    async showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        modal.classList.remove('hidden');
        modal.style.animation = 'modalBackdrop 0.3s ease forwards';
        
        const content = modal.querySelector('.modal-content');
        if (content) {
            content.style.animation = 'modalContent 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
        }
        
        // Focus first input
        const firstInput = modal.querySelector('input, textarea, select');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
        
        // Add body scroll lock
        document.body.style.overflow = 'hidden';
    }

    async hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        const content = modal.querySelector('.modal-content');
        if (content && this.animationsEnabled) {
            content.style.animation = 'scaleOut 0.2s ease forwards';
            await this.sleep(150);
        }
        
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    // Toast Notifications with Catppuccin styling
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // Add icon based on type
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            info: 'info-circle',
            warning: 'exclamation-triangle'
        };
        
        toast.innerHTML = `
            <i class="fas fa-${icons[type] || 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Play sound effect (optional)
        this.playSound(type);
        
        // Animate out
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    playSound(type) {
        // Optional: Add sound effects
        const sounds = {
            success: 800,
            error: 200,
            info: 600
        };
        
        if (window.AudioContext || window.webkitAudioContext) {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.frequency.value = sounds[type] || 500;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        }
    }

    // Keyboard Shortcuts
    handleKeyboard(e) {
        // Focus search on "/"
        if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            document.getElementById('search-input')?.focus();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
                this.hideModal(modal.id);
            });
        }
    }

    // Utility Functions
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'just now';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getLanguageColor(language) {
        const colors = {
            'JavaScript': '#f1e05a',
            'TypeScript': '#2b7489',
            'Python': '#3572A5',
            'Java': '#b07219',
            'HTML': '#e34c26',
            'CSS': '#563d7c',
            'Ruby': '#701516',
            'Go': '#00ADD8',
            'Rust': '#dea584',
            'C++': '#f34b7d',
            'C': '#555555',
            'PHP': '#4F5D95',
            'Swift': '#ffac45',
            'Kotlin': '#A97BFF',
            'Shell': '#89e051',
            'Vue': '#41b883'
        };
        return colors[language] || '#8b949e';
    }

    getContrastColor(hexColor) {
        // Convert hex to RGB
        const r = parseInt(hexColor.substr(0, 2), 16);
        const g = parseInt(hexColor.substr(2, 2), 16);
        const b = parseInt(hexColor.substr(4, 2), 16);
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        return luminance > 0.5 ? '#24292f' : '#ffffff';
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.gitstack = new GitStackApp();
});