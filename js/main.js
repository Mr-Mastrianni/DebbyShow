document.addEventListener('DOMContentLoaded', () => {
    // GSAP Plugin Registration
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
    
    // Loading Overlay Animation
    gsap.to('#loading', {
        opacity: 0,
        duration: 0.5,
        delay: 0.5,
        onComplete: () => {
            document.getElementById('loading').style.display = 'none';
        }
    });

    // Hero Section Intro Animation
    const heroTl = gsap.timeline({delay: 0.8});
    heroTl.to('.hero-title', { y: 0, opacity: 1, duration: 1.5, ease: 'power3.out' })
          .to('.hero-tagline', { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out' }, '-=1.2')
          .to('.hero-content', { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }, '-=0.9');

    // 3D Scene Setup
    let scene, camera, renderer, particles = [];
    
    function init3DScene() {
        const container = document.getElementById('canvas-container');
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);
        
        const particleGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xdc2626, transparent: true, opacity: 0.6 });
        
        for (let i = 0; i < 50; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.set((Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200);
            particle.userData = {
                originalPosition: particle.position.clone(),
                speed: Math.random() * 0.02 + 0.01
            };
            scene.add(particle);
            particles.push(particle);
        }
        camera.position.z = 100;
        animate3D();
    }
    
    function animate3D() {
        requestAnimationFrame(animate3D);
        particles.forEach(p => {
            p.rotation.x += p.userData.speed;
            p.rotation.y += p.userData.speed;
            p.position.y += Math.sin(Date.now() * 0.001 + p.userData.originalPosition.x) * 0.01;
        });
        renderer.render(scene, camera);
    }
    
    init3DScene();
    
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Scroll-triggered animations for sections
    const sections = ['#about', '#testimonials', '#author', '#chapter-preview', '#faq', '#newsletter', '#purchase', '#contact'];
    sections.forEach(section => {
        const el = document.querySelector(section);
        if(el) {
            gsap.from(el.querySelectorAll('.card-3d, h2, p, form, img'), {
                scrollTrigger: {
                    trigger: section,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse',
                },
                opacity: 0,
                y: 50,
                duration: 1,
                stagger: 0.1,
                ease: 'power3.out'
            });
        }
    });

    // Smooth scrolling for all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);
            if (target) {
                // Close mobile menu if open
                const mobileMenu = document.getElementById('mobile-menu');
                if (mobileMenu.classList.contains('open')) {
                    toggleMenu();
                }
                gsap.to(window, {
                    duration: 1.2,
                    scrollTo: { y: target, offsetY: 70 },
                    ease: 'power2.inOut'
                });
            }
        });
    });
    
    // Newsletter form handling
    const newsletterForm = document.getElementById('newsletter-form');
    const newsletterFeedback = document.getElementById('newsletter-feedback');
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = this.querySelector('#email').value;
        
        // Developer Note: Replace this with actual AJAX call to your email service
        newsletterFeedback.textContent = 'Sending...';
        
        // Simulate network delay
        setTimeout(() => {
            if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                newsletterFeedback.textContent = 'Thank you for subscribing!';
                newsletterFeedback.style.color = '#34d399'; // Green color for success
                this.reset();
            } else {
                newsletterFeedback.textContent = 'Please enter a valid email.';
                newsletterFeedback.style.color = '#f87171'; // Red color for error
            }
            setTimeout(() => newsletterFeedback.textContent = '', 3000);
        }, 1000);
    });
    
    // Mouse movement parallax effect
    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        gsap.to('.floating-element', {
            x: (mouseX - 0.5) * 50,
            y: (mouseY - 0.5) * 50,
            duration: 1,
            ease: 'power1.out',
            stagger: 0.1
        });
    });

    // Mobile Menu Toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const closeMenuButton = document.getElementById('close-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuLinks = mobileMenu.querySelectorAll('a');

    const toggleMenu = () => {
        const isOpen = mobileMenu.classList.toggle('open');
        document.body.style.overflow = isOpen ? 'hidden' : '';
        
        if (isOpen) {
            gsap.to(mobileMenuLinks, {
                opacity: 1,
                y: 0,
                duration: 0.5,
                stagger: 0.1,
                delay: 0.3,
                ease: 'power3.out'
            });
        } else {
            gsap.to(mobileMenuLinks, {
                opacity: 0,
                y: 20,
                duration: 0.2,
                ease: 'power3.in'
            });
        }
    };

    mobileMenuButton.addEventListener('click', toggleMenu);
    closeMenuButton.addEventListener('click', toggleMenu);
    
    // Chapter download tracking
    const chapterDownloadLinks = document.querySelectorAll('a[href*="chapter1.pdf"], a[href*="#chapter-preview"]');
    chapterDownloadLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Track chapter download/view
            console.log('Chapter preview accessed');
            // Add your analytics tracking here
        });
    });
});