// PyCompiler JavaScript Code
// Global variables
let pyodide;
let editor;
let isLoading = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize application
async function initializeApp() {
    try {
        // Show loading overlay
        showLoadingOverlay();
        
        // Initialize components
        setupNavigation();
        setupCodeEditor();
        setupEventListeners();
        setupAnimations();
        
        // Initialize Pyodide
        await initializePyodide();
        
        // Hide loading overlay
        hideLoadingOverlay();
        
        console.log('PyCompiler initialized successfully');
    } catch (error) {
        console.error('Failed to initialize PyCompiler:', error);
        hideLoadingOverlay();
        showError('Failed to initialize Python environment. Please refresh the page.');
    }
}

// Navigation functionality
function setupNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    
    // Hamburger menu toggle
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}

// Tab switching functionality
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected tab
    const targetTab = document.getElementById(tabName);
    if (targetTab) {
        targetTab.classList.add('active');
        
        // Add active class to corresponding nav item
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.textContent.toLowerCase().includes(tabName.toLowerCase()) || 
                (tabName === 'home' && item.textContent.toLowerCase() === 'home')) {
                item.classList.add('active');
            }
        });
        
        // Special handling for editor tab
        if (tabName === 'editor' && editor) {
            setTimeout(() => {
                editor.refresh();
            }, 100);
        }
    }
}

// Initialize CodeMirror editor
function setupCodeEditor() {
    const codeTextarea = document.getElementById('codeEditor');
    if (codeTextarea) {
        editor = CodeMirror.fromTextArea(codeTextarea, {
            mode: 'python',
            theme: 'monokai',
            lineNumbers: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            indentUnit: 4,
            indentWithTabs: false,
            lineWrapping: true,
            fontSize: '14px',
            viewportMargin: Infinity
        });
        
        // Set default code
        editor.setValue(`# Welcome to PyCompiler!
print('Hello, PyCompiler!')

# Example: Calculate factorial
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n-1)

number = 5
result = factorial(number)
print(f'Factorial of {number} is {result}')

# Try some basic operations
numbers = [1, 2, 3, 4, 5]
print(f'Sum of numbers: {sum(numbers)}')
print(f'Max number: {max(numbers)}')`);
    }
}

// Initialize Pyodide
async function initializePyodide() {
    try {
        pyodide = await loadPyodide();
        console.log('Pyodide loaded successfully');
        updateOutputStatus('Python Ready', 'success');
    } catch (error) {
        console.error('Failed to load Pyodide:', error);
        updateOutputStatus('Python Failed to Load', 'error');
        throw error;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Run button
    const runBtn = document.getElementById('runBtn');
    if (runBtn) {
        runBtn.addEventListener('click', runPythonCode);
    }
    
    // Copy button
    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', copyCode);
    }
    
    // Clear button
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearCode);
    }
    
    // FAQ items
    setupFAQs();
    
    // Contact form
    setupContactForm();
    
    // Brand click handler
    const navBrand = document.querySelector('.nav-brand');
    if (navBrand) {
        navBrand.addEventListener('click', () => showTab('home'));
    }
}

// Run Python code
async function runPythonCode() {
    if (!pyodide) {
        showError('Python environment not ready. Please wait...');
        return;
    }
    
    if (isLoading) {
        return;
    }
    
    const code = editor.getValue().trim();
    if (!code) {
        showError('Please enter some Python code to run.');
        return;
    }
    
    isLoading = true;
    updateRunButton(true);
    updateOutputStatus('Running...', 'running');
    
    const outputElement = document.getElementById('output');
    outputElement.textContent = '';
    
    try {
        // Capture stdout
        pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
        `);
        
        // Run user code
        pyodide.runPython(code);
        
        // Get output
        const output = pyodide.runPython("sys.stdout.getvalue()");
        
        // Reset stdout
        pyodide.runPython("sys.stdout = sys.__stdout__");
        
        // Display output
        if (output.trim()) {
            outputElement.textContent = output;
            updateOutputStatus('Completed', 'success');
        } else {
            outputElement.textContent = 'Code executed successfully (no output)';
            updateOutputStatus('Completed', 'success');
        }
        
    } catch (error) {
        outputElement.textContent = `Error: ${error.message}`;
        updateOutputStatus('Error', 'error');
        console.error('Python execution error:', error);
    } finally {
        isLoading = false;
        updateRunButton(false);
    }
}

// Copy code to clipboard
async function copyCode() {
    if (!editor) return;
    
    const code = editor.getValue();
    try {
        await navigator.clipboard.writeText(code);
        showNotification('Code copied to clipboard!', 'success');
    } catch (error) {
        console.error('Failed to copy code:', error);
        showNotification('Failed to copy code', 'error');
    }
}

// Clear code editor
function clearCode() {
    if (!editor) return;
    
    if (confirm('Are you sure you want to clear all code?')) {
        editor.setValue('# Write your Python code here\nprint("Hello, PyCompiler!")');
        document.getElementById('output').textContent = 'Click "Run Code" to see output here...';
        updateOutputStatus('Ready', 'ready');
        showNotification('Code cleared!', 'info');
    }
}

// Update run button state
function updateRunButton(running) {
    const runBtn = document.getElementById('runBtn');
    if (!runBtn) return;
    
    if (running) {
        runBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running...';
        runBtn.disabled = true;
        runBtn.classList.add('running');
    } else {
        runBtn.innerHTML = '<i class="fas fa-play"></i> Run Code';
        runBtn.disabled = false;
        runBtn.classList.remove('running');
    }
}

// Update output status
function updateOutputStatus(status, type) {
    const statusElement = document.getElementById('outputStatus');
    if (!statusElement) return;
    
    statusElement.textContent = status;
    statusElement.className = `output-status ${type}`;
}

// Setup FAQ functionality
function setupFAQs() {
    document.querySelectorAll('.faq-item').forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        const icon = question.querySelector('i');
        
        question.addEventListener('click', function() {
            const isActive = item.classList.contains('active');
            
            // Close all FAQ items
            document.querySelectorAll('.faq-item').forEach(faq => {
                faq.classList.remove('active');
                faq.querySelector('.faq-question i').style.transform = 'rotate(0deg)';
            });
            
            // Toggle current item
            if (!isActive) {
                item.classList.add('active');
                icon.style.transform = 'rotate(180deg)';
            }
        });
    });
}

// Setup contact form
function setupContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(contactForm);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                subject: formData.get('subject'),
                message: formData.get('message')
            };
            
            // Simulate form submission
            showNotification('Thank you for your message! We\'ll get back to you soon.', 'success');
            contactForm.reset();
        });
    }
}

// Setup animations
function setupAnimations() {
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.feature-card, .faq-item, .contact-method, .about-feature, .tech-item').forEach(el => {
        observer.observe(el);
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Utility functions
function showLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
    }
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getIconForType(type)}"></i>
        <span>${message}</span>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function getIconForType(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

function showError(message) {
    showNotification(message, 'error');
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to run code
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runPythonCode();
    }
    
    // Ctrl/Cmd + S to copy code (prevent default save)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        copyCode();
    }
});

// Handle window resize
window.addEventListener('resize', function() {
    if (editor) {
        setTimeout(() => {
            editor.refresh();
        }, 100);
    }
});

// Handle page visibility change
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && editor) {
        editor.refresh();
    }
});

// Initialize theme handling
function initializeTheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
        document.body.classList.add('dark-theme');
    }
}

// Error handling for unhandled promises
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    showError('An unexpected error occurred. Please try again.');
});

// Service worker registration (optional, for future PWA features)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // navigator.serviceWorker.register('/sw.js')
        //     .then(function(registration) {
        //         console.log('SW registered: ', registration);
        //     })
        //     .catch(function(registrationError) {
        //         console.log('SW registration failed: ', registrationError);
        //     });
    });
}

// Export functions for global access
window.showTab = showTab;
window.runPythonCode = runPythonCode;
window.copyCode = copyCode;
window.clearCode = clearCode;
