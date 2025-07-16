// Fragment shader for book pages
uniform sampler2D uTexture;
uniform float uShadow;      // 0-1 shadow intensity
uniform float uCurl;        // 0-1 curl amount for lighting
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    // Sample the page texture
    vec4 texColor = texture2D(uTexture, vUv);
    
    // Calculate lighting based on curl
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
    float NdotL = max(dot(normalize(vNormal), lightDir), 0.0);
    
    // Add ambient lighting
    float ambient = 0.6;
    float lighting = ambient + (1.0 - ambient) * NdotL;
    
    // Apply shadow during curl
    float shadowFactor = 1.0 - (uShadow * 0.4);
    lighting *= shadowFactor;
    
    // Enhance contrast slightly for better readability
    texColor.rgb = pow(texColor.rgb, vec3(0.9));
    
    gl_FragColor = vec4(texColor.rgb * lighting, texColor.a);
}
