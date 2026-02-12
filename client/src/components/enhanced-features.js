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
        this.checkAuth();
        this.initAnimations();
        this.initCursorGlow();
        this.initNotifications();
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
        this.checkGitHubNotifications();
        // Check every 5 minutes
        setInterval(() => this.checkGitHubNotifications(), 300000);
    }

    async checkGitHubNotifications() {
        if (!this.currentUser) return;
        
        try {
            const response = await fetch('https://api.github.com/notifications', {
                headers: {
                    'Authorization': `token ${this.currentUser.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                const notifications = await response.json();
                this.updateNotificationBadge(notifications.length);
                this.notifications = notifications;
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
            if (count > 0) {
                this.showToast(`${count} new notification${count > 1 ? 's' : ''}`, 'info');
            }
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
                                <div class="notification-item ${notif.unread ? 'unread' : ''}" data-id="${notif.id}">
                                    <div class="notification-icon">
                                        <i class="fas fa-${this.getNotificationIcon(notif.subject.type)}"></i>
                                    </div>
                                    <div class="notification-content">
                                        <div class="notification-title">${notif.subject.title}</div>
                                        <div class="notification-meta">
                                            ${notif.repository.full_name} • ${this.formatDate(notif.updated_at)}
                                        </div>
                                    </div>
                                    ${notif.unread ? '<span class="unread-dot"></span>' : ''}
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    getNotificationIcon(type) {
        const icons = {
            'PullRequest': 'code-pull-request',
            'Issue': 'exclamation-circle',
            'Commit': 'commit',
            'Release': 'tag',
            'Discussion': 'comments'
        };
        return icons[type] || 'bell';
    }

    // Enhanced File Tree Viewer
    async loadFileTree(owner, repo, path = '') {
        const fileList = document.getElementById('file-list');
        if (!fileList) return;

        this.currentPath = path;
        
        // Show loading state
        fileList.innerHTML = `
            <div class="file-tree-loading">
                <div class="loading-spinner"></div>
                <span>Loading files...</span>
            </div>
        `;

        try {
            const response = await fetch(`/api/repos/${owner}/${repo}/contents/${path}`);
            const files = await response.json();

            if (!Array.isArray(files)) {
                // Single file - show content
                this.viewFile(owner, repo, path, files);
                return;
            }

            // Sort: directories first, then files
            files.sort((a, b) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return a.type === 'dir' ? -1 : 1;
            });

            // Build breadcrumb
            const breadcrumb = this.buildBreadcrumb(owner, repo, path);

            fileList.innerHTML = `
                ${breadcrumb}
                <div class="file-tree">
                    ${files.map((file, index) => `
                        <div class="file-tree-item ${file.type}" 
                             data-type="${file.type}" 
                             data-path="${file.path}"
                             style="animation: fadeInUp 0.3s ease ${index * 0.05}s backwards">
                            <div class="file-icon">
                                ${this.getFileIcon(file.name, file.type)}
                            </div>
                            <div class="file-info">
                                <span class="file-name">${file.name}</span>
                                ${file.type === 'file' ? `
                                    <span class="file-size">${this.formatFileSize(file.size)}</span>
                                ` : ''}
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

            // Add click handlers
            fileList.querySelectorAll('.file-tree-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (e.target.closest('.view-file-btn')) {
                        e.stopPropagation();
                        this.viewFile(owner, repo, item.dataset.path);
                    } else if (item.dataset.type === 'dir') {
                        this.loadFileTree(owner, repo, item.dataset.path);
                    } else {
                        this.viewFile(owner, repo, item.dataset.path);
                    }
                });
            });

        } catch (error) {
            console.error('Failed to load file tree:', error);
            fileList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle" style="color: var(--ctp-red);"></i>
                    <p>Failed to load files</p>
                    <button class="btn btn-secondary" onclick="window.gitstack.loadFileTree('${owner}', '${repo}', '${path}')">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            `;
        }
    }

    buildBreadcrumb(owner, repo, path) {
        const parts = path.split('/').filter(p => p);
        let html = `
            <div class="breadcrumb">
                <span class="breadcrumb-item" data-path="">
                    <i class="fas fa-home"></i> ${repo}
                </span>
        `;
        
        let currentPath = '';
        parts.forEach((part, index) => {
            currentPath += (currentPath ? '/' : '') + part;
            html += `
                <span class="breadcrumb-separator">/</span>
                <span class="breadcrumb-item" data-path="${currentPath}">${part}</span>
            `;
        });
        
        html += '</div>';
        return html;
    }

    getFileIcon(filename, type) {
        if (type === 'dir') {
            return '<i class="fas fa-folder" style="color: var(--ctp-yellow);"></i>';
        }

        const extension = filename.split('.').pop().toLowerCase();
        const icons = {
            'js': '<i class="fab fa-js" style="color: var(--ctp-yellow);"></i>',
            'jsx': '<i class="fab fa-react" style="color: var(--ctp-blue);"></i>',
            'ts': '<i class="fab fa-js" style="color: var(--ctp-blue);"></i>',
            'tsx': '<i class="fab fa-react" style="color: var(--ctp-blue);"></i>',
            'html': '<i class="fab fa-html5" style="color: var(--ctp-peach);"></i>',
            'css': '<i class="fab fa-css3-alt" style="color: var(--ctp-blue);"></i>',
            'scss': '<i class="fab fa-sass" style="color: var(--ctp-pink);"></i>',
            'json': '<i class="fas fa-code" style="color: var(--ctp-teal);"></i>',
            'md': '<i class="fas fa-file-alt" style="color: var(--ctp-text);"></i>',
            'py': '<i class="fab fa-python" style="color: var(--ctp-yellow);"></i>',
            'java': '<i class="fab fa-java" style="color: var(--ctp-red);"></i>',
            'php': '<i class="fab fa-php" style="color: var(--ctp-mauve);"></i>',
            'rb': '<i class="fas fa-gem" style="color: var(--ctp-red);"></i>',
            'go': '<i class="fas fa-code" style="color: var(--ctp-teal);"></i>',
            'rs': '<i class="fas fa-cog" style="color: var(--ctp-orange);"></i>',
            'cpp': '<i class="fas fa-code" style="color: var(--ctp-blue);"></i>',
            'c': '<i class="fas fa-code" style="color: var(--ctp-blue);"></i>',
            'sql': '<i class="fas fa-database" style="color: var(--ctp-green);"></i>',
            'yml': '<i class="fas fa-cog" style="color: var(--ctp-teal);"></i>',
            'yaml': '<i class="fas fa-cog" style="color: var(--ctp-teal);"></i>',
            'dockerfile': '<i class="fab fa-docker" style="color: var(--ctp-blue);"></i>',
            'env': '<i class="fas fa-key" style="color: var(--ctp-yellow);"></i>',
            'gitignore': '<i class="fab fa-git-alt" style="color: var(--ctp-red);"></i>',
        };

        return icons[extension] || '<i class="fas fa-file" style="color: var(--ctp-overlay0);"></i>';
    }

    async viewFile(owner, repo, path, fileData = null) {
        const modal = document.createElement('div');
        modal.className = 'modal file-viewer-modal';
        
        // Show loading
        modal.innerHTML = `
            <div class="modal-content file-viewer-content">
                <div class="modal-header">
                    <h3><i class="fas fa-file-code"></i> ${path.split('/').pop()}</h3>
                    <div class="file-actions">
                        <button class="btn btn-icon" id="copy-file-btn" title="Copy content">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn btn-icon" id="raw-file-btn" title="View raw">
                            <i class="fas fa-external-link-alt"></i>
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
        
        // Close handlers
        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        try {
            let content, fileInfo;
            
            if (fileData && fileData.content) {
                content = atob(fileData.content);
                fileInfo = fileData;
            } else {
                const response = await fetch(`/api/repos/${owner}/${repo}/contents/${path}`);
                fileInfo = await response.json();
                content = atob(fileInfo.content);
            }

            const extension = path.split('.').pop().toLowerCase();
            const highlightedCode = this.syntaxHighlight(content, extension);

            const fileViewerBody = modal.querySelector('.file-viewer-body');
            fileViewerBody.innerHTML = `
                <div class="code-viewer">
                    ${this.settings.showLineNumbers ? `
                        <div class="line-numbers">
                            ${content.split('\n').map((_, i) => `<span>${i + 1}</span>`).join('')}
                        </div>
                    ` : ''}
                    <pre class="code-content"><code>${highlightedCode}</code></pre>
                </div>
            `;

            // Copy button handler
            modal.querySelector('#copy-file-btn').addEventListener('click', () => {
                navigator.clipboard.writeText(content).then(() => {
                    this.showToast('File content copied!', 'success');
                });
            });

            // Raw view handler
            modal.querySelector('#raw-file-btn').addEventListener('click', () => {
                window.open(fileInfo.html_url, '_blank');
            });

        } catch (error) {
            console.error('Failed to load file:', error);
            modal.querySelector('.file-viewer-body').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle" style="color: var(--ctp-red);"></i>
                    <p>Failed to load file content</p>
                </div>
            `;
        }
    }

    syntaxHighlight(code, extension) {
        // Simple syntax highlighting with Catppuccin Mocha colors
        let highlighted = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        const patterns = {
            comment: /(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm,
            string: /(".*?"|'.*?'|`[\s\S]*?`)/g,
            keyword: /\b(const|let|var|function|class|if|else|for|while|return|import|export|from|async|await|try|catch|throw|new|this|true|false|null|undefined)\b/g,
            function: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g,
            number: /\b\d+\.?\d*\b/g,
        };

        // Apply highlighting
        highlighted = highlighted
            .replace(patterns.comment, '<span class="token comment">$1</span>')
            .replace(patterns.string, '<span class="token string">$1</span>')
            .replace(patterns.keyword, '<span class="token keyword">$1</span>')
            .replace(patterns.function, '<span class="token function">$1</span>')
            .replace(patterns.number, '<span class="token number">$1</span>');

        return highlighted;
    }

    // Settings Page
    loadSettingsPage() {
        const settingsHTML = `
            <section id="settings-page" class="page">
                <div class="settings-container">
                    <div class="settings-sidebar">
                        <h2>Settings</h2>
                        <nav class="settings-nav">
                            <a href="#" class="active" data-section="appearance">
                                <i class="fas fa-paint-brush"></i> Appearance
                            </a>
                            <a href="#" data-section="notifications">
                                <i class="fas fa-bell"></i> Notifications
                            </a>
                            <a href="#" data-section="editor">
                                <i class="fas fa-code"></i> Code Editor
                            </a>
                            <a href="#" data-section="account">
                                <i class="fas fa-user"></i> Account
                            </a>
                        </nav>
                    </div>
                    <div class="settings-content">
                        <div id="appearance-section" class="settings-section active">
                            <h3>Appearance</h3>
                            <div class="setting-item">
                                <label class="setting-label">
                                    <span>Enable Animations</span>
                                    <span class="setting-description">Smooth transitions and hover effects</span>
                                </label>
                                <label class="toggle">
                                    <input type="checkbox" id="setting-animations" ${this.settings.animations ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                            <div class="setting-item">
                                <label class="setting-label">
                                    <span>Compact View</span>
                                    <span class="setting-description">Reduce spacing for more content</span>
                                </label>
                                <label class="toggle">
                                    <input type="checkbox" id="setting-compact" ${this.settings.compactView ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                        
                        <div id="notifications-section" class="settings-section">
                            <h3>Notifications</h3>
                            <div class="setting-item">
                                <label class="setting-label">
                                    <span>Enable Notifications</span>
                                    <span class="setting-description">Show GitHub notifications</span>
                                </label>
                                <label class="toggle">
                                    <input type="checkbox" id="setting-notifications" ${this.settings.notifications ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                        
                        <div id="editor-section" class="settings-section">
                            <h3>Code Editor</h3>
                            <div class="setting-item">
                                <label class="setting-label">
                                    <span>Font Size</span>
                                    <span class="setting-description">Code viewer font size (px)</span>
                                </label>
                                <input type="range" id="setting-font-size" min="10" max="20" value="${this.settings.codeFontSize}">
                                <span class="range-value">${this.settings.codeFontSize}px</span>
                            </div>
                            <div class="setting-item">
                                <label class="setting-label">
                                    <span>Show Line Numbers</span>
                                    <span class="setting-description">Display line numbers in code viewer</span>
                                </label>
                                <label class="toggle">
                                    <input type="checkbox" id="setting-line-numbers" ${this.settings.showLineNumbers ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                        
                        <div id="account-section" class="settings-section">
                            <h3>Account</h3>
                            <div class="account-info">
                                <img id="settings-avatar" src="${this.currentUser?.avatar || ''}" alt="Avatar">
                                <div class="account-details">
                                    <h4>${this.currentUser?.displayName || this.currentUser?.username || 'Guest'}</h4>
                                    <p>@${this.currentUser?.username || 'username'}</p>
                                </div>
                            </div>
                            <button class="btn btn-danger" id="logout-settings-btn">
                                <i class="fas fa-sign-out-alt"></i> Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        `;

        // Insert settings page if not exists
        if (!document.getElementById('settings-page')) {
            document.querySelector('.main-content').insertAdjacentHTML('beforeend', settingsHTML);
            this.bindSettingsEvents();
        }

        this.navigate('settings');
    }

    bindSettingsEvents() {
        // Settings navigation
        document.querySelectorAll('.settings-nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                
                document.querySelectorAll('.settings-nav a').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
                document.getElementById(`${section}-section`).classList.add('active');
            });
        });

        // Settings toggles
        document.getElementById('setting-animations')?.addEventListener('change', (e) => {
            this.settings.animations = e.target.checked;
            this.animationsEnabled = e.target.checked;
            this.saveSettings();
            this.showToast('Settings saved', 'success');
        });

        document.getElementById('setting-compact')?.addEventListener('change', (e) => {
            this.settings.compactView = e.target.checked;
            document.body.classList.toggle('compact-view', e.target.checked);
            this.saveSettings();
            this.showToast('Settings saved', 'success');
        });

        document.getElementById('setting-notifications')?.addEventListener('change', (e) => {
            this.settings.notifications = e.target.checked;
            this.saveSettings();
            this.showToast('Settings saved', 'success');
        });

        document.getElementById('setting-font-size')?.addEventListener('input', (e) => {
            this.settings.codeFontSize = e.target.value;
            e.target.nextElementSibling.textContent = `${e.target.value}px`;
            this.saveSettings();
        });

        document.getElementById('setting-line-numbers')?.addEventListener('change', (e) => {
            this.settings.showLineNumbers = e.target.checked;
            this.saveSettings();
            this.showToast('Settings saved', 'success');
        });

        document.getElementById('logout-settings-btn')?.addEventListener('click', () => {
            this.logout();
        });
    }

    // Improved Dashboard
    async loadDashboard() {
        await this.loadSidebarRepos();
        await this.loadRecentActivity();
        await this.loadContributions();
    }

    async loadRecentActivity() {
        const activityList = document.getElementById('activity-list');
        if (!activityList || !this.currentUser) return;

        try {
            // Get recent events from GitHub
            const response = await fetch(`https://api.github.com/users/${this.currentUser.username}/events/public?per_page=10`, {
                headers: {
                    'Authorization': `token ${this.currentUser.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) throw new Error('Failed to fetch events');

            const events = await response.json();

            if (events.length === 0) {
                activityList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>No recent activity</p>
                        <p class="empty-hint">Push some code to see your activity!</p>
                    </div>
                `;
                return;
            }

            activityList.innerHTML = events.map((event, index) => `
                <div class="activity-item" style="animation: fadeInUp 0.3s ease ${index * 0.1}s backwards">
                    <div class="activity-icon ${event.type}">
                        ${this.getActivityIcon(event.type)}
                    </div>
                    <div class="activity-content">
                        <div class="activity-text">
                            ${this.formatActivityText(event)}
                        </div>
                        <div class="activity-time">${this.formatDate(event.created_at)}</div>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Failed to load activity:', error);
            activityList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle" style="color: var(--ctp-overlay0);"></i>
                    <p>Unable to load activity</p>
                </div>
            `;
        }
    }

    getActivityIcon(type) {
        const icons = {
            'PushEvent': '<i class="fas fa-upload"></i>',
            'CreateEvent': '<i class="fas fa-plus-circle"></i>',
            'DeleteEvent': '<i class="fas fa-trash"></i>',
            'IssuesEvent': '<i class="fas fa-exclamation-circle"></i>',
            'PullRequestEvent': '<i class="fas fa-code-pull-request"></i>',
            'WatchEvent': '<i class="fas fa-star"></i>',
            'ForkEvent': '<i class="fas fa-code-branch"></i>',
            'ReleaseEvent': '<i class="fas fa-tag"></i>',
            'CommitCommentEvent': '<i class="fas fa-comment"></i>',
            'IssueCommentEvent': '<i class="fas fa-comment"></i>',
        };
        return icons[type] || '<i class="fas fa-circle"></i>';
    }

    formatActivityText(event) {
        const repo = event.repo?.name || 'unknown';
        const payload = event.payload || {};

        switch (event.type) {
            case 'PushEvent':
                const commits = payload.commits?.length || 0;
                return `Pushed ${commits} commit${commits !== 1 ? 's' : ''} to <strong>${repo}</strong>`;
            case 'CreateEvent':
                return `Created ${payload.ref_type || 'repository'} in <strong>${repo}</strong>`;
            case 'DeleteEvent':
                return `Deleted ${payload.ref_type} from <strong>${repo}</strong>`;
            case 'IssuesEvent':
                return `${payload.action} issue in <strong>${repo}</strong>`;
            case 'PullRequestEvent':
                return `${payload.action} pull request in <strong>${repo}</strong>`;
            case 'WatchEvent':
                return `Starred <strong>${repo}</strong>`;
            case 'ForkEvent':
                return `Forked <strong>${repo}</strong>`;
            default:
                return `Activity in <strong>${repo}</strong>`;
        }
    }

    async loadContributions() {
        // This would show a contribution graph (simplified version)
        const dashboardContent = document.querySelector('.dashboard-content');
        if (!dashboardContent) return;

        // Check if contributions section already exists
        if (dashboardContent.querySelector('.contributions-section')) return;

        const contributionsHTML = `
            <div class="contributions-section">
                <h3>Contributions</h3>
                <div class="contributions-graph">
                    <div class="contribution-loading">
                        <div class="loading-spinner"></div>
                        <span>Loading contribution data...</span>
                    </div>
                </div>
            </div>
        `;

        dashboardContent.insertAdjacentHTML('beforeend', contributionsHTML);

        // Simulate loading contribution data (in real app, this would fetch from GitHub)
        setTimeout(() => {
            const graph = dashboardContent.querySelector('.contributions-graph');
            graph.innerHTML = this.generateContributionGraph();
        }, 1000);
    }

    generateContributionGraph() {
        // Generate a simple contribution heatmap
        const weeks = 26; // 6 months
        const days = 7;
        let html = '<div class="contribution-grid">';

        for (let w = 0; w < weeks; w++) {
            html += '<div class="contribution-week">';
            for (let d = 0; d < days; d++) {
                const level = Math.floor(Math.random() * 5); // 0-4 contribution level
                html += `<div class="contribution-day level-${level}" title="${level} contributions"></div>`;
            }
            html += '</div>';
        }

        html += '</div>';
        html += `
            <div class="contribution-legend">
                <span>Less</span>
                <div class="contribution-day level-0"></div>
                <div class="contribution-day level-1"></div>
                <div class="contribution-day level-2"></div>
                <div class="contribution-day level-3"></div>
                <div class="contribution-day level-4"></div>
                <span>More</span>
            </div>
        `;

        return html;
    }
}