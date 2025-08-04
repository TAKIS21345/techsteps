import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM, VRMLoaderPlugin } from '@pixiv/three-vrm';

export interface VRMModel {
  id: string;
  url: string;
  morphTargets: MorphTarget[];
  expressions: Expression[];
  loadedAt: Date;
  fileSize: number;
}

export interface MorphTarget {
  name: string;
  index: number;
  weight: number;
  phonemeMapping: PhonemeMapping[];
}

export interface PhonemeMapping {
  phoneme: string;
  weight: number;
}

export interface Expression {
  name: string;
  presetName: string;
  weight: number;
}

export class AvatarLoader {
  private loader: GLTFLoader;
  private cache: Map<string, VRM> = new Map();

  constructor() {
    this.loader = new GLTFLoader();
    this.loader.register((parser) => new VRMLoaderPlugin(parser));
  }

  /**
   * Load a default avatar for the senior learning platform
   * Uses a simple, friendly avatar suitable for older adults
   */
  async loadDefaultAvatar(): Promise<VRM | null> {
    try {
      // For now, we'll use a simple default avatar URL
      // In production, this would be a Ready Player Me avatar or a custom VRM model
      const defaultAvatarUrl = '/models/default-senior-avatar.vrm';

      return await this.loadAvatarFromUrl(defaultAvatarUrl);
    } catch (error) {
      console.warn('Default avatar not found, creating fallback avatar');
      return this.createFallbackAvatar();
    }
  }

  /**
   * Load avatar from Ready Player Me URL
   */
  async loadReadyPlayerMeAvatar(avatarId: string): Promise<VRM | null> {
    try {
      const url = `https://models.readyplayer.me/${avatarId}.glb`;
      return await this.loadAvatarFromUrl(url);
    } catch (error) {
      console.error('Failed to load Ready Player Me avatar:', error);
      return null;
    }
  }

  /**
   * Load avatar from custom URL
   */
  async loadAvatarFromUrl(url: string): Promise<VRM | null> {
    // Check cache first
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    try {
      const gltf: GLTF = await new Promise((resolve, reject) => {
        this.loader.load(
          url,
          resolve,
          (progress) => {
            console.log('Avatar loading progress:', (progress.loaded / progress.total) * 100 + '%');
          },
          reject
        );
      });

      const vrm = gltf.userData.vrm as VRM;

      if (vrm) {
        // Cache the loaded avatar
        this.cache.set(url, vrm);

        // Setup avatar for senior-friendly interaction
        this.setupAvatarForSeniors(vrm);

        return vrm;
      } else {
        throw new Error('No VRM data found in loaded model');
      }
    } catch (error) {
      console.error('Failed to load avatar from URL:', url, error);
      return null;
    }
  }

  /**
   * Create a simple fallback avatar when no model is available
   */
  private createFallbackAvatar(): VRM | null {
    try {
      // Create a simple geometric avatar as fallback
      const scene = new THREE.Scene();

      // Head
      const headGeometry = new THREE.SphereGeometry(0.15, 16, 16);
      const headMaterial = new THREE.MeshLambertMaterial({ color: 0xffdbac });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.set(0, 1.6, 0);
      scene.add(head);

      // Body
      const bodyGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.6, 8);
      const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4a90e2 });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(0, 1.0, 0);
      scene.add(body);

      // Simple eyes
      const eyeGeometry = new THREE.SphereGeometry(0.02, 8, 8);
      const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });

      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-0.05, 1.65, 0.12);
      scene.add(leftEye);

      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye.position.set(0.05, 1.65, 0.12);
      scene.add(rightEye);

      // Simple mouth for lip sync
      const mouthGeometry = new THREE.PlaneGeometry(0.06, 0.02);
      const mouthMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
      const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
      mouth.position.set(0, 1.55, 0.13);
      scene.add(mouth);

      // Create a minimal VRM-like structure
      const fallbackVRM = {
        scene,
        userData: { vrm: true },
        update: (deltaTime: number) => {
          // Simple idle animation
          const time = Date.now() * 0.001;
          head.rotation.y = Math.sin(time * 0.5) * 0.1;
        },
        expressionManager: {
          setValue: (expressionName: string, value: number) => {
            // Simple expression handling for fallback
            if (expressionName === 'happy' && value > 0) {
              mouth.scale.x = 1 + value * 0.5;
            } else if (expressionName === 'sad' && value > 0) {
              mouth.position.y = 1.55 - value * 0.02;
            }
          }
        },
        dispose: () => {
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
      } as unknown as VRM;

      return fallbackVRM;
    } catch (error) {
      console.error('Failed to create fallback avatar:', error);
      return null;
    }
  }

  /**
   * Setup avatar with senior-friendly configurations
   */
  private setupAvatarForSeniors(vrm: VRM): void {
    try {
      // Ensure avatar is positioned correctly
      vrm.scene.position.set(0, 0, 0);
      vrm.scene.rotation.set(0, 0, 0);

      // Set up default expressions for friendly appearance
      if (vrm.expressionManager) {
        vrm.expressionManager.setValue('happy', 0.2); // Slight smile by default
        vrm.expressionManager.setValue('relaxed', 0.3); // Relaxed expression
      }

      // Optimize materials for performance
      vrm.scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => {
              if (material instanceof THREE.MeshStandardMaterial) {
                // Reduce material complexity for better performance
                material.roughness = 0.8;
                material.metalness = 0.1;
              }
            });
          } else if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.roughness = 0.8;
            child.material.metalness = 0.1;
          }
        }
      });

      console.log('Avatar setup completed for senior-friendly interaction');
    } catch (error) {
      console.error('Failed to setup avatar for seniors:', error);
    }
  }

  /**
   * Get available morph targets for lip sync
   */
  getMorphTargets(vrm: VRM): MorphTarget[] {
    const morphTargets: MorphTarget[] = [];

    if (vrm.expressionManager) {
      // Common VRM expression presets that can be used for lip sync
      const lipSyncExpressions = [
        'aa', 'ih', 'ou', 'ee', 'oh', // Vowel sounds
        'bmp', 'ch', 'dd', 'ff', 'kk', 'nn', 'pp', 'rr', 'sil', 'ss', 'th' // Consonants
      ];

      lipSyncExpressions.forEach((expression, index) => {
        morphTargets.push({
          name: expression,
          index,
          weight: 0,
          phonemeMapping: this.getPhonemeMapping(expression)
        });
      });
    }

    return morphTargets;
  }

  /**
   * Get phoneme mapping for a given expression
   */
  private getPhonemeMapping(expression: string): PhonemeMapping[] {
    const mappings: Record<string, PhonemeMapping[]> = {
      'aa': [{ phoneme: 'AA', weight: 1.0 }, { phoneme: 'AH', weight: 0.8 }],
      'ih': [{ phoneme: 'IH', weight: 1.0 }, { phoneme: 'IY', weight: 0.7 }],
      'ou': [{ phoneme: 'UW', weight: 1.0 }, { phoneme: 'OW', weight: 0.8 }],
      'ee': [{ phoneme: 'IY', weight: 1.0 }, { phoneme: 'EH', weight: 0.6 }],
      'oh': [{ phoneme: 'AO', weight: 1.0 }, { phoneme: 'OW', weight: 0.7 }],
      'bmp': [{ phoneme: 'B', weight: 1.0 }, { phoneme: 'M', weight: 0.8 }, { phoneme: 'P', weight: 0.8 }],
      'ch': [{ phoneme: 'CH', weight: 1.0 }, { phoneme: 'SH', weight: 0.6 }],
      'dd': [{ phoneme: 'D', weight: 1.0 }, { phoneme: 'T', weight: 0.7 }],
      'ff': [{ phoneme: 'F', weight: 1.0 }, { phoneme: 'V', weight: 0.8 }],
      'kk': [{ phoneme: 'K', weight: 1.0 }, { phoneme: 'G', weight: 0.8 }],
      'nn': [{ phoneme: 'N', weight: 1.0 }, { phoneme: 'NG', weight: 0.7 }],
      'pp': [{ phoneme: 'P', weight: 1.0 }, { phoneme: 'B', weight: 0.8 }],
      'rr': [{ phoneme: 'R', weight: 1.0 }],
      'sil': [{ phoneme: 'SIL', weight: 1.0 }],
      'ss': [{ phoneme: 'S', weight: 1.0 }, { phoneme: 'Z', weight: 0.8 }],
      'th': [{ phoneme: 'TH', weight: 1.0 }, { phoneme: 'DH', weight: 0.8 }]
    };

    return mappings[expression] || [];
  }

  /**
   * Clear avatar cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.cache.forEach(vrm => {
      if (vrm.dispose) {
        vrm.dispose();
      }
    });
    this.clearCache();
  }
}