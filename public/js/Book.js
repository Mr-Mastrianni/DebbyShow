import * as THREE from 'three';
import anime from 'animejs';

export class Book {
    static async init({ scene, renderer, container }) {
        const self = new Book(scene, renderer, container);
        await self.#loadTextures();
        await self.#loadShaders();
        self.#createPages();
        self.#bindInput();
        return self;
    }

    constructor(scene, renderer, container) {
        this.scene = scene;
        this.renderer = renderer;
        this.container = container;
        this.group = new THREE.Group();
        this.pages = [];
        this.currentIndex = 0;
        this.isFlipping = false;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.clock = new THREE.Clock();
        
        // Position the book group
        this.group.position.set(0, 0, 0);
        this.group.rotation.x = -0.1; // Slight tilt for better viewing
    }

    async #loadTextures() {
        const loader = new THREE.TextureLoader();
        const textureNames = ['cover', 'page01', 'page02', 'backCover'];
        
        this.textures = await Promise.all(
            textureNames.map(name =>
                new Promise((resolve, reject) => {
                    loader.load(
                        `/assets/images/book-animation/${name}.png`,
                        (texture) => {
                            texture.colorSpace = THREE.SRGBColorSpace;
                            texture.generateMipmaps = true;
                            texture.minFilter = THREE.LinearMipmapLinearFilter;
                            texture.magFilter = THREE.LinearFilter;
                            resolve(texture);
                        },
                        undefined,
                        (error) => {
                            console.warn(`Failed to load texture: ${name}`, error);
                            // Create a fallback texture
                            const canvas = document.createElement('canvas');
                            canvas.width = canvas.height = 512;
                            const ctx = canvas.getContext('2d');
                            ctx.fillStyle = '#f0f0f0';
                            ctx.fillRect(0, 0, 512, 512);
                            ctx.fillStyle = '#333';
                            ctx.font = '24px Arial';
                            ctx.textAlign = 'center';
                            ctx.fillText(name, 256, 256);
                            
                            const texture = new THREE.CanvasTexture(canvas);
                            texture.colorSpace = THREE.SRGBColorSpace;
                            resolve(texture);
                        }
                    );
                })
            )
        );
    }

    async #loadShaders() {
        try {
            const [vertexShader, fragmentShader] = await Promise.all([
                fetch('/js/shaders/curl.vert').then(r => r.text()),
                fetch('/js/shaders/basic.frag').then(r => r.text())
            ]);
            
            this.vertexShader = vertexShader;
            this.fragmentShader = fragmentShader;
        } catch (error) {
            console.warn('Failed to load shaders, using fallback', error);
            // Fallback shaders
            this.vertexShader = `
                uniform float uCurl;
                uniform float uTime;
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    if (uCurl > 0.0) {
                        float theta = uCurl * (position.x + 0.5) * 3.14159;
                        pos.z += sin(theta) * 0.6 * uCurl;
                        pos.x = (position.x + 0.5) - cos(theta) * 0.6 * uCurl - 0.5;
                    }
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `;
            this.fragmentShader = `
                uniform sampler2D uTexture;
                uniform float uShadow;
                varying vec2 vUv;
                void main() {
                    vec4 texColor = texture2D(uTexture, vUv);
                    float lighting = 1.0 - (uShadow * 0.3);
                    gl_FragColor = vec4(texColor.rgb * lighting, texColor.a);
                }
            `;
        }
    }

    #createPages() {
        const geom = new THREE.PlaneGeometry(1.2, 1.6, 50, 1); // High segment count for smooth curling
        
        this.textures.forEach((texture, i) => {
            const material = new THREE.ShaderMaterial({
                vertexShader: this.vertexShader,
                fragmentShader: this.fragmentShader,
                side: THREE.DoubleSide,
                uniforms: {
                    uTexture: { value: texture },
                    uCurl: { value: 0 },
                    uShadow: { value: 0 },
                    uTime: { value: 0 }
                }
            });

            const mesh = new THREE.Mesh(geom, material);
            
            // Position pages with slight offset for stacking effect
            mesh.position.x = i * 0.003;
            mesh.position.z = -i * 0.001;
            
            // Set initial rotation for open book effect (except cover)
            if (i > 0) {
                mesh.rotation.y = Math.PI; // Flip inner pages
            }
            
            this.group.add(mesh);
            this.pages.push(mesh);
        });
    }

    #bindInput() {
        const handlePointer = (event) => {
            if (this.isFlipping) return;
            
            // Get mouse position in normalized device coordinates
            const rect = this.container.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            
            // Determine if click is on right or left side
            const goNext = this.mouse.x > 0;
            goNext ? this.next() : this.prev();
        };

        // Mouse and touch events
        this.container.addEventListener('pointerdown', handlePointer);
        
        // Keyboard navigation
        window.addEventListener('keydown', (event) => {
            if (this.isFlipping) return;
            
            switch (event.key) {
                case 'ArrowRight':
                case ' ':
                    event.preventDefault();
                    this.next();
                    break;
                case 'ArrowLeft':
                    event.preventDefault();
                    this.prev();
                    break;
            }
        });
    }

    next() {
        if (this.currentIndex >= this.pages.length - 1) return;
        this.#flip(1);
    }

    prev() {
        if (this.currentIndex <= 0) return;
        this.#flip(-1);
    }

    #flip(direction) {
        const targetIndex = this.currentIndex + direction;
        if (targetIndex < 0 || targetIndex >= this.pages.length) return;

        const page = this.pages[this.currentIndex];
        this.isFlipping = true;

        // Create animation timeline
        const timeline = anime.timeline({
            easing: 'easeInOutCubic',
            duration: 1200,
            autoplay: true,
            complete: () => {
                this.currentIndex = targetIndex;
                this.isFlipping = false;
            }
        });

        if (direction > 0) {
            // Flip forward
            timeline
                .add({
                    targets: page.rotation,
                    y: [page.rotation.y, page.rotation.y + Math.PI],
                    duration: 1200
                }, 0)
                .add({
                    targets: page.material.uniforms.uCurl,
                    value: [0, 1, 0],
                    duration: 1200
                }, 0)
                .add({
                    targets: page.material.uniforms.uShadow,
                    value: [0, 0.6, 0],
                    duration: 1200
                }, 0);
        } else {
            // Flip backward
            const prevPage = this.pages[targetIndex];
            timeline
                .add({
                    targets: prevPage.rotation,
                    y: [prevPage.rotation.y, prevPage.rotation.y - Math.PI],
                    duration: 1200
                }, 0)
                .add({
                    targets: prevPage.material.uniforms.uCurl,
                    value: [0, 1, 0],
                    duration: 1200
                }, 0)
                .add({
                    targets: prevPage.material.uniforms.uShadow,
                    value: [0, 0.6, 0],
                    duration: 1200
                }, 0);
        }
    }

    update(time) {
        // Update time uniform for subtle animations
        this.pages.forEach(page => {
            if (page.material.uniforms.uTime) {
                page.material.uniforms.uTime.value = time * 0.001;
            }
        });
        
        // Gentle rotation animation when idle
        if (!this.isFlipping) {
            this.group.rotation.y = Math.sin(time * 0.0005) * 0.05;
        }
    }

    // Public method to get current page info
    getCurrentPageInfo() {
        return {
            current: this.currentIndex,
            total: this.pages.length,
            canGoNext: this.currentIndex < this.pages.length - 1,
            canGoPrev: this.currentIndex > 0
        };
    }
}
