import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface ReadyPlayerMeAvatar {
  scene: THREE.Group;
  mixer: THREE.AnimationMixer;
  morphTargets: Map<string, THREE.Mesh>;
  cleanup: () => void;
}

export class ReadyPlayerMeLoader {
  private loader: GLTFLoader;
  private cache: Map<string, ReadyPlayerMeAvatar> = new Map();
  private fallbackImageCache: Map<string, string> = new Map();

  constructor() {
    this.loader = new GLTFLoader();
  }

  /**
   * Load the specific Ready Player Me avatar
   */
  async loadAvatar(avatarId: string = '688acf39a70fe61ff012fe38'): Promise<ReadyPlayerMeAvatar | null> {
    // Check cache first
    if (this.cache.has(avatarId)) {
      return this.cache.get(avatarId)!;
    }

    try {
      const url = `https://models.readyplayer.me/${avatarId}.glb`;
      console.log('🌐 Loading GLB from:', url);
      
      const gltf: GLTF = await new Promise((resolve, reject) => {
        // Set up CORS and timeout
        const timeoutId = setTimeout(() => {
          reject(new Error('Avatar loading timeout after 15 seconds'));
        }, 15000);

        this.loader.load(
          url,
          (gltf) => {
            clearTimeout(timeoutId);
            console.log('✅ GLB loaded successfully');
            resolve(gltf);
          },
          (progress) => {
            if (progress.total > 0) {
              const percent = Math.round((progress.loaded / progress.total) * 100);
              console.log(`📥 Avatar loading progress: ${percent}%`);
            }
          },
          (error) => {
            clearTimeout(timeoutId);
            console.error('❌ GLB loading failed:', error);
            reject(error);
          }
        );
      });

      console.log('🔄 Processing GLB...');
      const avatar = this.processGLTF(gltf);
      
      // Cache the avatar
      this.cache.set(avatarId, avatar);
      console.log('✅ Avatar processed and cached');
      
      return avatar;
    } catch (error) {
      console.error('❌ Failed to load Ready Player Me avatar:', error);
      return null;
    }
  }

  /**
   * Process the loaded GLTF and extract necessary components
   */
  private processGLTF(gltf: GLTF): ReadyPlayerMeAvatar {
    const scene = gltf.scene;
    const mixer = new THREE.AnimationMixer(scene);
    const morphTargets = new Map<string, THREE.Mesh>();

    console.log('🔍 Analyzing GLB structure...');
    
    // Log the scene structure for debugging
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        console.log(`📦 Found mesh: ${child.name}, has morphTargets: ${!!child.morphTargetDictionary}`);
        if (child.morphTargetDictionary) {
          console.log(`🎭 Morph targets:`, Object.keys(child.morphTargetDictionary));
        }
      }
    });

    // Optimize for mobile performance
    this.optimizeForMobile(scene);

    // Find meshes with morph targets (for lip sync)
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.morphTargetDictionary) {
        // Ready Player Me models typically have morph targets on head/face meshes
        const morphTargetKeys = Object.keys(child.morphTargetDictionary);
        
        // Look for any mesh with morph targets (Ready Player Me models vary in naming)
        if (morphTargetKeys.length > 0) {
          console.log(`✅ Adding mesh "${child.name}" with ${morphTargetKeys.length} morph targets`);
          morphTargets.set(child.name, child);
        }
      }
    });

    // Position and scale avatar for bottom-right corner display
    // Ready Player Me avatars are typically life-sized, so we need to scale them down
    scene.position.set(0, -0.8, 0); // Lower position
    scene.scale.setScalar(0.8); // Scale down to fit in 200x200 container

    // Ensure the avatar faces forward
    scene.rotation.y = 0;

    console.log(`✅ Avatar processed: ${morphTargets.size} meshes with morph targets`);

    return {
      scene,
      mixer,
      morphTargets,
      cleanup: () => {
        mixer.stopAllAction();
        scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
    };
  }

  /**
   * Optimize avatar for mobile performance
   */
  private optimizeForMobile(scene: THREE.Group): void {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Optimize materials
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => this.optimizeMaterial(material));
          } else {
            this.optimizeMaterial(child.material);
          }
        }

        // Optimize geometry
        if (child.geometry) {
          // Reduce precision for mobile
          child.geometry.setAttribute('position', 
            new THREE.Float32BufferAttribute(child.geometry.attributes.position.array, 3));
        }
      }
    });
  }

  /**
   * Optimize material for mobile performance
   */
  private optimizeMaterial(material: THREE.Material): void {
    if (material instanceof THREE.MeshStandardMaterial) {
      // Reduce material complexity for mobile
      material.roughness = Math.max(0.5, material.roughness);
      material.metalness = Math.min(0.5, material.metalness);
      
      // Compress textures if they exist
      if (material.map) {
        material.map.generateMipmaps = false;
        material.map.minFilter = THREE.LinearFilter;
      }
    }
  }

  /**
   * Generate fallback image (simple 2D placeholder)
   */
  async generateFallbackImage(avatarId: string): Promise<string> {
    if (this.fallbackImageCache.has(avatarId)) {
      return this.fallbackImageCache.get(avatarId)!;
    }

    try {
      // Create a simple 2D avatar placeholder instead of trying to render 3D
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d')!;
      
      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, 200);
      gradient.addColorStop(0, '#e0f2fe');
      gradient.addColorStop(1, '#bae6fd');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 200, 200);
      
      // Head
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(100, 80, 45, 0, Math.PI * 2);
      ctx.fill();
      
      // Eyes
      ctx.fillStyle = '#1f2937';
      ctx.beginPath();
      ctx.arc(85, 70, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(115, 70, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Mouth
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(100, 95, 6, 0, Math.PI);
      ctx.fill();
      
      // Body
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(70, 125, 60, 75);
      
      // Arms
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(50, 135, 20, 40);
      ctx.fillRect(130, 135, 20, 40);
      
      // Label
      ctx.fillStyle = '#374151';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('AI Assistant', 100, 185);
      
      const dataURL = canvas.toDataURL('image/png');
      this.fallbackImageCache.set(avatarId, dataURL);
      
      return dataURL;
    } catch (error) {
      console.error('Failed to generate fallback image:', error);
      
      // Ultimate fallback - just return a data URL for a simple colored circle
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d')!;
      
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(100, 100, 80, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Avatar', 100, 105);
      
      const dataURL = canvas.toDataURL('image/png');
      this.fallbackImageCache.set(avatarId, dataURL);
      
      return dataURL;
    }
  }

  /**
   * Check if WebGL is supported
   */
  isWebGLSupported(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get device performance tier
   */
  getPerformanceTier(): 'high' | 'medium' | 'low' {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    
    if (!gl) return 'low';
    
    const renderer = gl.getParameter(gl.RENDERER);
    const vendor = gl.getParameter(gl.VENDOR);
    
    // Simple heuristics for performance detection
    if (renderer.includes('Adreno') && (renderer.includes('530') || renderer.includes('540'))) {
      return 'medium';
    }
    
    if (renderer.includes('Mali') || renderer.includes('PowerVR')) {
      return 'low';
    }
    
    if (renderer.includes('GeForce') || renderer.includes('Radeon')) {
      return 'high';
    }
    
    // Default to medium for unknown GPUs
    return 'medium';
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.forEach(avatar => avatar.cleanup());
    this.cache.clear();
    this.fallbackImageCache.clear();
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.clearCache();
  }
}