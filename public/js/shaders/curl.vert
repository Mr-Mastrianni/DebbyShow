// Vertex shader for page curl effect
uniform float uCurl;        // 0-1 curl amount
uniform float uTime;        // for subtle animation
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    vUv = uv;
    vNormal = normal;
    
    // Calculate curl effect
    float curlRadius = 0.6;
    float theta = uCurl * (position.x + 0.5) * 3.14159;
    
    vec3 pos = position;
    
    // Apply curl transformation
    if (uCurl > 0.0) {
        pos.z += sin(theta) * curlRadius * uCurl;
        pos.x = (position.x + 0.5) - cos(theta) * curlRadius * uCurl - 0.5;
    }
    
    // Subtle breathing animation when idle
    pos.y += sin(uTime * 0.5 + position.x * 2.0) * 0.01 * (1.0 - uCurl);
    
    vPosition = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
