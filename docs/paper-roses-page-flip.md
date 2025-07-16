# Paper Roses – 3‑D Page‑Flip Integration Guide  
*Bring Debby Show’s novel to life with a tactile WebGL book experience.*

---

## 1. Prerequisites

| Tool | Version (tested) | Install |
|------|-----------------|---------|
|Node | ≥ 18 LTS | `nvm install 18 && nvm use 18` |
|npm  | comes with Node | – |
|Vite | 5.x | `npm i -D vite` |
|three | 0.165.0 | `npm i three` |
|animejs | 3.2.x | `npm i animejs` |
|glslify (optional) | 7.x | `npm i -D glslify` |

> **Folder layout**

/public
/assets
cover.png
page1.png
page2.png
...
/src
main.js
Book.js
shaders/
curl.vert
basic.frag
paper-roses-page-flip.md
index.html
vite.config.js

---

## 2. Bootstrapping the scene (`main.js`)

```js
import * as THREE from 'three';
import { Book } from './Book.js';

const scene    = new THREE.Scene();
const camera   = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.1, 50);
camera.position.set(0, 1.1, 3);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// soft key light & ambient
scene.add(new THREE.HemisphereLight(0xffffff, 0x444455, 1));
const key = new THREE.DirectionalLight(0xffffff, .6);
key.position.set(5, 8, 5);
scene.add(key);

// load book
const book = await Book.init({ scene, renderer });
scene.add(book.group);

// render‑loop
renderer.setAnimationLoop((t) => {
  book.update(t);
  renderer.render(scene, camera);
});
```

## 3. Building the book module (Book.js)

```js
import * as THREE from 'three';
import anime from 'animejs';

export class Book {
  static async init({ scene, renderer }) {
    const self = new Book(scene, renderer);
    await self.#loadTextures();
    self.#createPages();
    self.#bindInput();
    return self;
  }

  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.group = new THREE.Group();
    this.pages = [];
    this.currentIndex = 0;
    this.isFlipping = false;
  }

  async #loadTextures() {
    const loader = new THREE.TextureLoader();
    this.textures = await Promise.all(
      ['cover', 'page1', 'page2', /* … */].map(name =>
        new Promise(res => loader.load(`/assets/${name}.png`, t => res(t)))
      )
    );
  }

  #createPages() {
    const geom = new THREE.PlaneGeometry(1, 1.4, 50, 1);   // high‑segment width for curvature
    const materialBase = new THREE.ShaderMaterial({
      vertexShader: document.getElementById('curlVS').textContent,
      fragmentShader: document.getElementById('basicFS').textContent,
      side: THREE.DoubleSide,
      uniforms: {
        uTexture: { value: null },
        uCurl:    { value: 0 },     // 0 = flat, 1 = fully curled
        uShadow:  { value: 0 }
      }
    });

    // front cover + inner pages
    this.textures.forEach((tex, i) => {
      const mat = materialBase.clone();
      mat.uniforms.uTexture.value = tex;
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.x = i * 0.002;        // subtle stacking offset
      mesh.rotateY(Math.PI * (i===0 ? 0 : 1)); // open book orientation
      this.group.add(mesh);
      this.pages.push(mesh);
    });
  }

  #bindInput() {
    window.addEventListener('pointerdown', (e) => {
      if (this.isFlipping) return;
      const goNext = e.clientX > innerWidth * 0.55; // right side click
      goNext ? this.next() : this.prev();
    });
  }

  next() { this.#flip(+1); }
  prev() { this.#flip(-1); }

  #flip(dir) {
    const targetIdx = this.currentIndex + dir;
    if (targetIdx < 0 || targetIdx >= this.pages.length) return;

    const page = this.pages[targetIdx];
    this.isFlipping = true;

    anime.timeline({
      easing: 'easeInOutQuad',
      duration: 1100,
      autoplay: true,
      complete: () => { 
        this.currentIndex = targetIdx; 
        this.isFlipping = false; 
      }
    })
    .add({
      targets: page.rotation,
      y: [dir>0 ? Math.PI : 0, dir>0 ? 0 : Math.PI]
    }, 0)
    .add({
      targets: page.material.uniforms.uCurl,
      value: [0, 1, 0]      // rise then settle
    }, 0)
    .add({
      targets: page.material.uniforms.uShadow,
      value: [0, 0.5, 0],
    }, 0);
  }

  update(t) {
    // can inject idle breathing or camera auto‑orbit here
  }
}
```

## 4. The curl vertex shader (curl.vert)

```glsl
// attribute vec3 position, uv comes from THREE.PlaneGeometry
uniform float uCurl;        // 0‑1
varying vec2 vUv;

void main() {
  vUv = uv;
  float curlRadius = 0.6;                    // tweak for thickness
  float theta = uCurl * (position.x + 0.5);  // curve only during flip
  vec3 pos = position;
  pos.z += sin(theta) * curlRadius;
  pos.x  = 0.5 - cos(theta) * curlRadius;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
```

Fragment (basic.frag) simply samples uTexture and multiplies an ambient & uShadow factor to fake self‑shadowing.

## 5. Performance & polish

Pre‑compile shaders: call renderer.compileAsync(scene, camera) on load to avoid the first‑flip stall.

Texture sizing: 1024×1440 px per page balances Retina crispness and memory (~4 MB/page).

Lazy loading: keep only ±3 pages in GPU memory; dispose() distant textures.

Accessibility: provide keyboard bindings (←/→) and prefers-reduced-motion media query fallbacks to fade‑in pages instead of curl.

SEO: mirror critical text as hidden semantic HTML so crawlers and screen‑readers don’t lose content.

## 6. Deployment

Add "preview": "vite preview --port 5173" to package.json scripts.

Run npm run build → Vite outputs to /dist with hashed assets.

Push /dist to your static host (Netlify, Cloudflare Pages, etc.).

Verify WebGL context on low‑end Android via Chrome DevTools’ Performance tab – aim for < 8 ms main‑thread.

## 7. Troubleshooting Checklist

| Symptom | Fix |
|---------|-----|
| Page flips snap instantly | Ensure Anime timeline duration > 200 ms and that the shader uses uCurl uniform, not a const. |
| Book disappears on iOS | Add renderer.capabilities.precision === "highp" guard; downgrade to mediump if needed. |
| Textures blurry | Call texture.colorSpace = THREE.SRGBColorSpace before creating material; confirm devicePixelRatio. |

---

### How to use the guide  
1. **Copy** everything inside the triple‑backticks to `paper‑roses-page‑flip.md`.  
2. Work through each numbered section; you’ll finish with a fully interactive, GPU‑accelerated flipbook that loads the provided cover and interior page PNGs.