// Global scripts for INFRAUD frontend

document.addEventListener('DOMContentLoaded', () => {
    // 1. Form submission handling for Report page
    const reportForm = document.getElementById('report-form');
    if (reportForm) {
        reportForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // In Phase 1, just show an alert. Phase 3/4 will connect to Supabase/Express
            const btn = reportForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            
            btn.innerHTML = 'Submitting...';
            btn.style.opacity = '0.7';
            
            setTimeout(() => {
                alert('Thank you! Your report has been submitted for verification.');
                reportForm.reset();
                btn.innerHTML = originalText;
                btn.style.opacity = '1';
            }, 1000);
        });
    }

    // 2. Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if(targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // 3. Simple Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    if(navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                navbar.style.boxShadow = 'var(--shadow-sm)';
                navbar.style.background = 'rgba(255, 255, 255, 0.9)';
            } else {
                navbar.style.boxShadow = 'none';
                navbar.style.background = 'rgba(255, 255, 255, 0.7)';
            }
        });
    }
});
