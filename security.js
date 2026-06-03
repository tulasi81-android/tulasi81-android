/**
 * EduGuard - Secure Exam Proctoring Engine (security.js)
 * Implements ironclad front-end isolation and monitoring for examination sandboxes.
 */

class SecureExamGuard {
    /**
     * Creates a new instance of the secure exam monitor.
     * @param {Object} options Configuration options
     * @param {Function} options.onViolation Callback fired when a security violation is detected
     * @param {Function} options.onLimitExceeded Callback fired when the max allowed violations is exceeded
     * @param {number} options.maxViolations The violation threshold before auto-submitting the exam
     */
    constructor(options = {}) {
        this.onViolation = options.onViolation || (() => {});
        this.onLimitExceeded = options.onLimitExceeded || (() => {});
        this.maxViolations = options.maxViolations || 2;
        
        this.isActive = false;
        this.violations = [];
        this.handlers = {};
    }

    /**
     * Activates proctoring listeners and requests fullscreen lock.
     * Must be triggered inside a user gesture event listener (e.g. click).
     * @returns {Promise<boolean>} Resolves to true if fullscreen succeeds, false otherwise
     */
    async enable() {
        if (this.isActive) return true;
        this.isActive = true;
        this.violations = [];

        // Request Fullscreen
        const enteredFullscreen = await this.requestFullscreenLock();
        if (!enteredFullscreen) {
            this.logViolation('fullscreen_denied', 'Student rejected or browser blocked entering Fullscreen mode.');
        }

        // Set up event listeners
        this.setupSecurityListeners();
        return enteredFullscreen;
    }

    /**
     * Deactivates proctoring locks and returns browser to normal state.
     */
    disable() {
        if (!this.isActive) return;
        this.isActive = false;

        // Remove event listeners
        this.removeSecurityListeners();

        // Exit Fullscreen safely
        this.exitFullscreenLock();
    }

    /**
     * Requests browser fullscreen. Uses vendor prefixes for compatibility.
     * @returns {Promise<boolean>}
     */
    async requestFullscreenLock() {
        const docEl = document.documentElement;
        try {
            if (docEl.requestFullscreen) {
                await docEl.requestFullscreen();
            } else if (docEl.webkitRequestFullscreen) {
                await docEl.webkitRequestFullscreen();
            } else if (docEl.mozRequestFullScreen) {
                await docEl.mozRequestFullScreen();
            } else if (docEl.msRequestFullscreen) {
                await docEl.msRequestFullscreen();
            }
            return true;
        } catch (err) {
            console.error('Fullscreen request failed:', err);
            return false;
        }
    }

    /**
     * Safely exits fullscreen mode.
     */
    exitFullscreenLock() {
        try {
            if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
            }
        } catch (err) {
            console.error('Error exiting fullscreen:', err);
        }
    }

    /**
     * Attaches page and keyboard intercepts.
     */
    setupSecurityListeners() {
        // 1. Fullscreen Change monitor
        this.handlers.fullscreenChange = () => {
            const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
            if (!isFullscreen && this.isActive) {
                this.logViolation('fullscreen_exit', 'Student exited fullscreen proctoring sandbox.');
            }
        };
        document.addEventListener('fullscreenchange', this.handlers.fullscreenChange);
        document.addEventListener('webkitfullscreenchange', this.handlers.fullscreenChange);
        document.addEventListener('mozfullscreenchange', this.handlers.fullscreenChange);
        document.addEventListener('MSFullscreenChange', this.handlers.fullscreenChange);

        // 2. Focus / Blur Tracker (Detect window switching, Alt+Tab, opening other apps)
        this.handlers.windowBlur = () => {
            if (this.isActive) {
                this.logViolation('focus_lost', 'Student switched windows or clicked outside exam workspace.');
            }
        };
        window.addEventListener('blur', this.handlers.windowBlur);

        // 3. Tab switching detector (Page Visibility API)
        this.handlers.visibilityChange = () => {
            if (document.visibilityState === 'hidden' && this.isActive) {
                this.logViolation('tab_switch', 'Student switched tabs to background.');
            }
        };
        document.addEventListener('visibilitychange', this.handlers.visibilityChange);

        // 4. Keyboard hook - prevent developer tools and command overrides
        this.handlers.keyDown = (e) => {
            if (!this.isActive) return;

            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const ctrlKey = e.ctrlKey || (isMac && e.metaKey);

            // Block F12 (Developer tools)
            if (e.key === 'F12' || e.keyCode === 123) {
                e.preventDefault();
                this.logViolation('KEY_DEVTOOLS', 'F12 key pressed. Access to DevTools Console was blocked.');
                return false;
            }

            // Block F5 (Refresh)
            if (e.key === 'F5' || e.keyCode === 116) {
                e.preventDefault();
                this.logViolation('KEY_REFRESH', 'F5 refresh shortcut blocked. Reloading exam sheets is prohibited.');
                return false;
            }

            // Block F6 / F11
            if (['F6', 'F11'].includes(e.key)) {
                e.preventDefault();
                this.logViolation('KEY_SHORTCUT', `${e.key} key command blocked.`);
                return false;
            }

            // Block Ctrl+Shift+I / Ctrl+Shift+C / Ctrl+Shift+J (DevTools)
            if (ctrlKey && e.shiftKey && ['I', 'C', 'J', 'i', 'c', 'j'].includes(e.key)) {
                e.preventDefault();
                this.logViolation('KEY_DEVTOOLS', 'Inspector shortcut blocked (Ctrl+Shift+I/C/J). Inspector pane access denied.');
                return false;
            }

            // Block Ctrl+U (View source)
            if (ctrlKey && ['U', 'u'].includes(e.key)) {
                e.preventDefault();
                this.logViolation('KEY_DEVTOOLS', 'View source command blocked (Ctrl+U). Code viewing denied.');
                return false;
            }

            // Block copy & paste combinations
            if (ctrlKey && ['C', 'V', 'X', 'c', 'v', 'x'].includes(e.key)) {
                e.preventDefault();
                const operationType = e.key.toUpperCase() === 'C' ? 'Copy' : e.key.toUpperCase() === 'V' ? 'Paste' : 'Cut';
                this.logViolation('KEY_CLIPBOARD', `Clipboard action blocked (${operationType} via keyboard shortcut).`);
                return false;
            }

            // Block printing Ctrl+P
            if (ctrlKey && ['P', 'p'].includes(e.key)) {
                e.preventDefault();
                this.logViolation('KEY_SHORTCUT', 'Print command blocked (Ctrl+P). Layout duplication denied.');
                return false;
            }
        };
        window.addEventListener('keydown', this.handlers.keyDown, true);

        // 5. Disable Context Menu (Right Click)
        this.handlers.contextMenu = (e) => {
            if (this.isActive) {
                e.preventDefault();
                this.logViolation('RIGHT_CLICK', 'Context menu trigger blocked. Right-clicking is prohibited inside the exam card.');
                return false;
            }
        };
        document.addEventListener('contextmenu', this.handlers.contextMenu, true);

        // 6. Disable copy, paste and cut events via standard listeners
        this.handlers.clipboardHook = (e) => {
            if (this.isActive) {
                e.preventDefault();
                this.logViolation('CLIPBOARD_TRIGGER', 'Clipboard system operation blocked (standard copy/paste action).');
                return false;
            }
        };
        document.addEventListener('copy', this.handlers.clipboardHook, true);
        document.addEventListener('paste', this.handlers.clipboardHook, true);
        document.addEventListener('cut', this.handlers.clipboardHook, true);
    }

    /**
     * Removes security locks on system release.
     */
    removeSecurityListeners() {
        document.removeEventListener('fullscreenchange', this.handlers.fullscreenChange);
        document.removeEventListener('webkitfullscreenchange', this.handlers.fullscreenChange);
        document.removeEventListener('mozfullscreenchange', this.handlers.fullscreenChange);
        document.removeEventListener('MSFullscreenChange', this.handlers.fullscreenChange);

        window.removeEventListener('blur', this.handlers.windowBlur);
        document.removeEventListener('visibilitychange', this.handlers.visibilityChange);
        
        window.removeEventListener('keydown', this.handlers.keyDown, true);
        document.removeEventListener('contextmenu', this.handlers.contextMenu, true);

        document.removeEventListener('copy', this.handlers.clipboardHook, true);
        document.removeEventListener('paste', this.handlers.clipboardHook, true);
        document.removeEventListener('cut', this.handlers.clipboardHook, true);
    }

    /**
     * Appends an event to the local audit timeline and evaluates limits.
     * @param {string} type Violation key (focus_lost, fullscreen_exit, etc.)
     * @param {string} message Human readable description of infraction
     */
    logViolation(type, message) {
        if (!this.isActive) return;

        const timestamp = new Date();
        const eventLog = {
            type,
            message,
            time: timestamp.toLocaleTimeString(),
            timestamp: timestamp.getTime()
        };

        this.violations.push(eventLog);
        
        // Trigger generic violation callback
        this.onViolation(type, message, this.violations.length, eventLog);

        // Check if student exceeded violation budget
        if (this.violations.length >= this.maxViolations) {
            this.onLimitExceeded(this.violations);
        }
    }
}
