import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM, VRMLoaderPlugin, VRMHumanBoneName } from '@pixiv/three-vrm';

export interface VRMLoadResult {
  vrm: VRM;
  scene: THREE.Group;
  availableBlendShapes: string[];
}

/**
 * VRM Avatar Loader with enhanced capabilities for lip sync and facial expressions
 */
export class VRMLoader {
  private loader: GLTFLoader;

  constructor() {
    this.loader = new GLTFLoader();
    this.loader.register((parser) => new VRMLoaderPlugin(parser));
  }

  /**
   * Load VRM avatar from URL
   */
  async loadVRM(url: string): Promise<VRMLoadResult> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          const vrm = gltf.userData.vrm as VRM;
          
          if (!vrm) {
            reject(new Error('Failed to load VRM data from file'));
            return;
          }

          // Get available blend shapes for debugging
          const availableBlendShapes = this.getAvailableBlendShapes(vrm);
          
          console.log('✅ VRM loaded successfully');
          console.log('📋 Available blend shapes:', availableBlendShapes);
          
          // Setup the VRM for rendering
          this.setupVRM(vrm);
          
          resolve({
            vrm,
            scene: vrm.scene,
            availableBlendShapes
          });
        },
        (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          console.log('📈 VRM loading progress:', percent + '%');
        },
        (error) => {
          console.error('❌ VRM loading failed:', error);
          reject(error);
        }
      );
    });
  }

  /**
   * Get all available blend shape names from VRM
   */
  private getAvailableBlendShapes(vrm: VRM): string[] {
    const blendShapes: string[] = [];
    
    if (vrm.expressionManager) {
      // Get all expression names
      const expressions = vrm.expressionManager.expressionMap;
      for (const [name] of expressions) {
        blendShapes.push(name);
      }
    }
    
    return blendShapes;
  }

  /**
   * Setup VRM for optimal rendering and animation
   */
  private setupVRM(vrm: VRM): void {
    // Enable shadows
    vrm.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Enhance materials for better rendering
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => {
              if (material instanceof THREE.MeshStandardMaterial) {
                this.enhanceMaterial(material);
              }
            });
          } else if (child.material instanceof THREE.MeshStandardMaterial) {
            this.enhanceMaterial(child.material);
          }
        }
      }
    });

    // Set up initial pose
    this.setupInitialPose(vrm);
  }

  /**
   * Enhance material properties for better visual quality
   */
  private enhanceMaterial(material: THREE.MeshStandardMaterial): void {
    // Enhance skin materials
    if (material.name.toLowerCase().includes('skin') || 
        material.name.toLowerCase().includes('face')) {
      material.roughness = 0.6;
      material.metalness = 0.0;
      material.envMapIntensity = 0.5;
    }
    
    // Enhance hair materials
    if (material.name.toLowerCase().includes('hair')) {
      material.roughness = 0.8;
      material.metalness = 0.1;
      material.envMapIntensity = 0.3;
    }
    
    // Enhance clothing materials
    if (material.name.toLowerCase().includes('cloth') || 
        material.name.toLowerCase().includes('shirt') ||
        material.name.toLowerCase().includes('dress')) {
      material.roughness = 0.7;
      material.metalness = 0.0;
      material.envMapIntensity = 0.4;
    }
  }

  /**
   * Set up initial pose for the VRM avatar
   */
  private setupInitialPose(vrm: VRM): void {
    if (!vrm.humanoid) return;

    // Set a natural standing pose
    const humanoid = vrm.humanoid;
    
    // Slightly bend arms for more natural pose
    const leftUpperArm = humanoid.getNormalizedBoneNode(VRMHumanBoneName.LeftUpperArm);
    const rightUpperArm = humanoid.getNormalizedBoneNode(VRMHumanBoneName.RightUpperArm);
    
    if (leftUpperArm) {
      leftUpperArm.rotation.z = 0.1; // Slight outward rotation
    }
    
    if (rightUpperArm) {
      rightUpperArm.rotation.z = -0.1; // Slight outward rotation
    }

    // Set neutral facial expression
    if (vrm.expressionManager) {
      // Reset all expressions to neutral
      vrm.expressionManager.setValue('happy', 0);
      vrm.expressionManager.setValue('sad', 0);
      vrm.expressionManager.setValue('surprised', 0);
      vrm.expressionManager.setValue('angry', 0);
      
      // Set a slight pleasant expression
      vrm.expressionManager.setValue('happy', 0.1);
    }
  }

  /**
   * Apply blend shape weights to VRM
   */
  static applyBlendShapes(vrm: VRM, blendShapeWeights: Record<string, number>): void {
    if (!vrm.expressionManager) return;

    // Apply each blend shape weight
    Object.entries(blendShapeWeights).forEach(([name, weight]) => {
      try {
        vrm.expressionManager!.setValue(name, weight);
      } catch (error) {
        // Silently ignore missing blend shapes
      }
    });
  }

  /**
   * Update VRM (should be called in animation loop)
   */
  static updateVRM(vrm: VRM, deltaTime: number): void {
    // Update VRM systems
    vrm.update(deltaTime);
  }

  /**
   * Get VRM blend shape value
   */
  static getBlendShapeValue(vrm: VRM, name: string): number {
    if (!vrm.expressionManager) return 0;
    
    try {
      return vrm.expressionManager.getValue(name) || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Set VRM to look at a target position
   */
  static setLookAt(vrm: VRM, target: THREE.Vector3): void {
    if (vrm.lookAt) {
      vrm.lookAt.target = target;
    }
  }

  /**
   * Reset VRM to neutral pose and expression
   */
  static resetToNeutral(vrm: VRM): void {
    if (!vrm.expressionManager) return;

    // Reset all facial expressions
    const expressions = vrm.expressionManager.expressionMap;
    for (const [name] of expressions) {
      vrm.expressionManager.setValue(name, 0);
    }
    
    // Set slight pleasant expression
    vrm.expressionManager.setValue('happy', 0.05);
  }
}