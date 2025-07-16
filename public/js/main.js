// Global variables for 3D book
let book = null;
let scene = null;
let camera = null;
let renderer = null;

document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu functionality
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const closeMenuButton = document.getElementById('close-menu-button');
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');
    
    if (mobileMenuButton && mobileMenu && closeMenuButton) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
        
        closeMenuButton.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
        
        // Close menu when clicking on links
        mobileMenuLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                document.body.style.overflow = 'auto';
            });
        });
        
        // Close menu when clicking outside
        mobileMenu.addEventListener('click', (e) => {
            if (e.target === mobileMenu) {
                mobileMenu.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    }
    
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Initialize 3D Book Viewer
    init3DBookViewer();
    
    // Initialize Enhanced Book Display
    initEnhancedBookDisplay();
    
    // Loading screen
    const loadingOverlay = document.getElementById('loading');
    if (loadingOverlay) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                loadingOverlay.style.opacity = '0';
                setTimeout(() => {
                    loadingOverlay.style.display = 'none';
                }, 500);
            }, 1000);
        });
    }
});

// 3D Book Viewer Initialization
async function init3DBookViewer() {
    const container = document.getElementById('book-viewer');
    const loadingDiv = document.getElementById('book-loading');
    const staticFallback = document.getElementById('static-fallback');
    const pageInfo = document.getElementById('page-info');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    if (!container) {
        console.warn('Book viewer container not found');
        return;
    }
    
    try {
        // Check WebGL support
        if (!isWebGLSupported()) {
            throw new Error('WebGL not supported');
        }
        
        // Initialize Three.js scene
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, container.offsetWidth / container.offsetHeight, 0.1, 50);
        camera.position.set(0, 1.1, 3);
        
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(container.offsetWidth, container.offsetHeight);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.setClearColor(0x000000, 1);
        
        // Add lighting
        scene.add(new THREE.HemisphereLight(0xffffff, 0x444455, 1));
        const keyLight = new THREE.DirectionalLight(0xffffff, 0.6);
        keyLight.position.set(5, 8, 5);
        scene.add(keyLight);
        
        // Load and initialize book
        const { Book } = await import('./Book.js');
        book = await Book.init({ scene, renderer, container });
        scene.add(book.group);
        
        // Add renderer to container
        container.appendChild(renderer.domElement);
        
        // Hide loading, show controls
        loadingDiv.style.display = 'none';
        
        // Setup controls
        setupBookControls(book, pageInfo, prevBtn, nextBtn);
        
        // Start render loop
        startRenderLoop();
        
        // Handle window resize
        window.addEventListener('resize', onWindowResize);
        
    } catch (error) {
        console.error('Failed to initialize 3D book viewer:', error);
        showFallback(container, loadingDiv, staticFallback);
    }
}

function setupBookControls(book, pageInfo, prevBtn, nextBtn) {
    function updateUI() {
        const info = book.getCurrentPageInfo();
        pageInfo.textContent = `Page ${info.current + 1} of ${info.total}`;
        
        prevBtn.disabled = !info.canGoPrev;
        nextBtn.disabled = !info.canGoNext;
        
        prevBtn.style.opacity = info.canGoPrev ? '1' : '0.5';
        nextBtn.style.opacity = info.canGoNext ? '1' : '0.5';
    }
    
    prevBtn.addEventListener('click', () => {
        book.prev();
        setTimeout(updateUI, 100);
    });
    
    nextBtn.addEventListener('click', () => {
        book.next();
        setTimeout(updateUI, 100);
    });
    
    // Initial UI update
    updateUI();
}

function startRenderLoop() {
    function animate(time) {
        if (book && renderer && scene && camera) {
            book.update(time);
            renderer.render(scene, camera);
        }
        requestAnimationFrame(animate);
    }
    animate();
}

function onWindowResize() {
    const container = document.getElementById('book-viewer');
    if (!container || !camera || !renderer) return;
    
    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.offsetWidth, container.offsetHeight);
}

function isWebGLSupported() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
                 (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
        return false;
    }
}

function showFallback(container, loadingDiv, staticFallback) {
    loadingDiv.style.display = 'none';
    container.style.display = 'none';
    if (staticFallback) {
        staticFallback.classList.remove('hidden');
    }
}

// Enhanced Book Display Functionality
function initEnhancedBookDisplay() {
    const flippableBook = document.getElementById('flippable-book');
    const bookWrapper = document.querySelector('.book-flip-wrapper');
    let isFlipped = false;
    
    if (flippableBook && bookWrapper) {
        // Add click-to-flip functionality
        flippableBook.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            isFlipped = !isFlipped;
            
            if (isFlipped) {
                bookWrapper.classList.add('flipped');
            } else {
                bookWrapper.classList.remove('flipped');
            }
        });
        
        // Add mouse tracking for lighting effects on both faces
        const bookFaces = flippableBook.querySelectorAll('.book-face');
        bookFaces.forEach(face => {
            face.addEventListener('mousemove', (e) => {
                const rect = face.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                
                const lighting = face.querySelector('.book-lighting');
                if (lighting) {
                    lighting.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(255, 255, 255, 0.3) 0%, transparent 50%)`;
                }
            });
            
            face.addEventListener('mouseleave', () => {
                const lighting = face.querySelector('.book-lighting');
                if (lighting) {
                    lighting.style.background = 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)';
                }
            });
        });
    }
}