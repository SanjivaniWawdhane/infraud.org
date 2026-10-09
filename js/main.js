document.addEventListener('DOMContentLoaded', () => {
    // 1. Sticky Navbar Effect
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 10) {
                navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                navbar.style.boxShadow = 'var(--shadow-sm)';
            } else {
                navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                navbar.style.boxShadow = 'none';
            }
        });
    }

    // 2. Checker Tab Switching
    const tabs = document.querySelectorAll('.workspace-tab');
    if (tabs.length > 0) {
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                // Remove active class from all
                tabs.forEach(t => t.classList.remove('active'));
                // Add active class to clicked
                e.target.classList.add('active');
                
                // Update placeholder based on type
                const input = document.querySelector('.workspace-box .input');
                if (input) {
                    const type = e.target.innerText.toLowerCase();
                    if (type === 'phone') input.placeholder = 'e.g., +1 (555) 000-0000';
                    else if (type === 'upi') input.placeholder = 'e.g., username@bank';
                    else if (type === 'email') input.placeholder = 'e.g., support@company.com';
                    else if (type === 'message') input.placeholder = 'Paste entire text message...';
                    else input.placeholder = 'https://...';
                }
            });
        });
    }

    // 3. Smooth Score Animation (For Results Page)
    const scoreElement = document.querySelector('.score-number');
    if (scoreElement) {
        const targetScore = parseInt(scoreElement.innerText, 10);
        if (!isNaN(targetScore)) {
            scoreElement.innerText = '0';
            let currentScore = 0;
            const duration = 1500; // 1.5 seconds
            const interval = 20; // 20ms steps
            const step = targetScore / (duration / interval);
            
            const timer = setInterval(() => {
                currentScore += step;
                if (currentScore >= targetScore) {
                    scoreElement.innerText = targetScore;
                    clearInterval(timer);
                } else {
                    scoreElement.innerText = Math.floor(currentScore);
                }
            }, interval);
        }
    }

    // 4. Staggered Signal Reveal
    const signals = document.querySelectorAll('.signal-item');
    if (signals.length > 0) {
        signals.forEach((signal, index) => {
            signal.style.opacity = '0';
            signal.style.transform = 'translateY(10px)';
            signal.style.transition = 'all 0.4s ease-out';
            
            setTimeout(() => {
                signal.style.opacity = '1';
                signal.style.transform = 'translateY(0)';
            }, 300 + (index * 150)); // Stagger by 150ms after 300ms initial delay
        });
    }

    // 5. Scroll Reveal for Sections
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.section').forEach(section => {
        if (!section.classList.contains('hero-section')) {
            section.style.opacity = '0';
            section.style.transform = 'translateY(20px)';
            section.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            observer.observe(section);
        }
    });

    // 6. Form Submission Loading State
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            const btn = form.querySelector('button[type="submit"]');
            if (btn) {
                const originalText = btn.innerText;
                btn.style.width = btn.offsetWidth + 'px'; // Maintain width
                btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg>';
                btn.disabled = true;
                btn.style.opacity = '0.8';
                
                // Allow default submission to proceed, this just handles the visual state until page unload
            }
        });
    });

});

// Global CSS for spin animation
const style = document.createElement('style');
style.innerHTML = `
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
`;
document.head.appendChild(style);
