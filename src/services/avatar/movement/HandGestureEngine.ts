/**
 * HandGestureEngine - Full arm and hand control system for VRM models
 * 
 * This class provides comprehensive hand and arm positioning, finger articulation,
 * and smooth hand movement transitions for natural avatar gestures.
 * 
 * Requirements addressed:
 * - 4.1: Appropriate hand gestures like pointing, counting, or descriptive movements
 * - 4.4: Celebratory hand gestures and joyful expressions
 */

import * as THREE from 'three';
import { VRM, VRMHumanBoneName } from '@pixiv/three-vrm';
import {
  MovementContext,
  CulturalProfile,
  MotionSettings,
  EasingType,
  AnimationCurve,
  Keyframe
} from './types';

export interface HandGesture {
  type: 'pointing' | 'counting' | 'descriptive' | 'celebratory' | 'supportive' | 'emphatic';
  leftHand: HandPosition;
  rightHand: HandPosition;
  duration: number;
  intensity: number;
  synchronizeWithSpeech: boolean;
  culturalVariant?: string;
  description: string;
}

export interface HandPosition {
  position: THREE.Vector3;
  rotation: THREE.Quaternion;
  fingerPositions: FingerPosition[];
  armConfiguration: ArmConfiguration;
  transitionCurve: AnimationCurve;
}

export interface FingerPosition {
  finger: 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';
  joints: JointRotation[];
  flexion: number; // 0.0 (extended) to 1.0 (fully flexed)
  spread: number; // 0.0 (closed) to 1.0 (spread)
}

export interface JointRotation {
  joint: 'proximal' | 'intermediate' | 'distal' | 'metacarpal';
  rotation: THREE.Quaternion;
  flexionAngle: number; // degrees
}

export interface ArmConfiguration {
  shoulder: THREE.Quaternion;
  upperArm: THREE.Quaternion;
  lowerArm: THREE.Quaternion;
  wrist: THREE.Quaternion;
  elbow: THREE.Vector3; // Position for IK solving
}

export interface HandGestureBlendState {
  currentGesture: HandGesture | null;
  targetGesture: HandGesture | null;
  blendProgress: number; // 0.0 to 1.0
  blendDuration: number;
  startTime: number;
  easing: EasingType;
}

export interface HandGestureResult {
  leftHandTransforms: BoneTransform[];
  rightHandTransforms: BoneTransform[];
  intensity: number;
  gestureType: string;
  isComplete: boolean;
}

export interface BoneTransform {
  boneName: VRMHumanBoneName;
  position?: THREE.Vector3;
  rotation: THREE.Quaternion;
  scale?: THREE.Vector3;
}

export class HandGestureEngine {
  private vrm: VRM | null = null;
  private blendState: HandGestureBlendState;
  private gestureLibrary: Map<string, HandGesture>;
  private motionSettings: MotionSettings;
  private culturalProfile: CulturalProfile;
  private isActive: boolean = false;
  private lastUpdateTime: number = 0;

  constructor(motionSettings: MotionSettings, culturalProfile: CulturalProfile) {
    this.motionSettings = motionSettings;
    this.culturalProfile = culturalProfile;
    this.blendState = this.createInitialBlendState();
    this.gestureLibrary = this.initializeGestureLibrary();
  }

  /**
   * Initializes the hand gesture engine with VRM model
   */
  public initialize(vrm: VRM): void {
    this.vrm = vrm;
    this.isActive = true;
    console.log('🤲 HandGestureEngine initialized with VRM model');
  }

  /**
   * Starts a hand gesture based on context and type
   */
  public startGesture(
    gestureType: string,
    context: MovementContext,
    intensity: number = 0.7
  ): boolean {
    if (!this.isActive || !this.vrm) {
      console.warn('🤲 HandGestureEngine not initialized');
      return false;
    }

    const gesture = this.selectGestureForContext(gestureType, context, intensity);
    if (!gesture) {
      console.warn(`🤲 No gesture found for type: ${gestureType}`);
      return false;
    }

    this.blendState.targetGesture = gesture;
    this.blendState.blendProgress = 0;
    this.blendState.blendDuration = gesture.duration;
    this.blendState.startTime = performance.now();
    this.blendState.easing = 'ease_in_out';

    console.log(`🤲 Starting hand gesture: ${gestureType} (${gesture.description})`);
    return true;
  }

  /**
   * Updates hand gesture animation
   */
  public update(deltaTime: number): HandGestureResult | null {
    if (!this.isActive || !this.vrm || !this.blendState.targetGesture) {
      return null;
    }

    const currentTime = performance.now();
    this.lastUpdateTime = currentTime;

    // Update blend progress
    const elapsed = currentTime - this.blendState.startTime;
    this.blendState.blendProgress = Math.min(1.0, elapsed / this.blendState.blendDuration);

    // Apply easing
    const easedProgress = this.applyEasing(this.blendState.blendProgress, this.blendState.easing);

    // Generate hand transforms
    const result = this.generateHandTransforms(easedProgress);

    // Apply transforms to VRM
    this.applyTransformsToVRM(result);

    // Check if gesture is complete
    if (this.blendState.blendProgress >= 1.0) {
      this.blendState.currentGesture = this.blendState.targetGesture;
      this.blendState.targetGesture = null;
      result.isComplete = true;
    }

    return result;
  }

  /**
   * Stops current gesture and returns to neutral position
   */
  public stopGesture(transitionDuration: number = 500): void {
    if (!this.isActive) return;

    const neutralGesture = this.createNeutralGesture();
    this.blendState.targetGesture = neutralGesture;
    this.blendState.blendProgress = 0;
    this.blendState.blendDuration = transitionDuration;
    this.blendState.startTime = performance.now();

    console.log('🤲 Stopping hand gesture, returning to neutral');
  }

  /**
   * Updates motion settings
   */
  public updateMotionSettings(settings: Partial<MotionSettings>): void {
    this.motionSettings = { ...this.motionSettings, ...settings };
  }

  /**
   * Updates cultural profile
   */
  public updateCulturalProfile(profile: CulturalProfile): void {
    this.culturalProfile = profile;
  }

  /**
   * Selects appropriate gesture for context
   */
  private selectGestureForContext(
    gestureType: string,
    context: MovementContext,
    intensity: number
  ): HandGesture | null {
    const baseGesture = this.gestureLibrary.get(gestureType);
    if (!baseGesture) return null;

    // Clone and modify gesture based on context
    const gesture: HandGesture = JSON.parse(JSON.stringify(baseGesture));
    
    // Apply intensity scaling
    gesture.intensity = Math.min(1.0, baseGesture.intensity * intensity * this.motionSettings.customIntensityScale);
    
    // Apply cultural modifications
    if (this.culturalProfile.region !== 'western') {
      gesture.intensity *= this.culturalProfile.movementAmplitude;
    }

    // Adjust for motion sensitivity
    if (this.motionSettings.motionSensitivity) {
      gesture.intensity *= 0.7;
      gesture.duration *= 1.3;
    }

    return gesture;
  }

  /**
   * Generates hand transforms based on blend progress
   */
  private generateHandTransforms(progress: number): HandGestureResult {
    const result: HandGestureResult = {
      leftHandTransforms: [],
      rightHandTransforms: [],
      intensity: 0,
      gestureType: '',
      isComplete: false
    };

    if (!this.blendState.targetGesture) return result;

    const gesture = this.blendState.targetGesture;
    result.gestureType = gesture.type;
    result.intensity = gesture.intensity * progress;

    // Generate left hand transforms
    result.leftHandTransforms = this.generateArmTransforms('left', gesture.leftHand, progress);
    
    // Generate right hand transforms
    result.rightHandTransforms = this.generateArmTransforms('right', gesture.rightHand, progress);

    return result;
  }

  /**
   * Generates transforms for a specific arm
   */
  private generateArmTransforms(
    side: 'left' | 'right',
    handPosition: HandPosition,
    progress: number
  ): BoneTransform[] {
    const transforms: BoneTransform[] = [];
    const isLeft = side === 'left';

    // Shoulder transform
    transforms.push({
      boneName: isLeft ? VRMHumanBoneName.LeftShoulder : VRMHumanBoneName.RightShoulder,
      rotation: this.blendQuaternion(
        new THREE.Quaternion(),
        handPosition.armConfiguration.shoulder,
        progress
      )
    });

    // Upper arm transform
    transforms.push({
      boneName: isLeft ? VRMHumanBoneName.LeftUpperArm : VRMHumanBoneName.RightUpperArm,
      rotation: this.blendQuaternion(
        new THREE.Quaternion(),
        handPosition.armConfiguration.upperArm,
        progress
      )
    });

    // Lower arm transform
    transforms.push({
      boneName: isLeft ? VRMHumanBoneName.LeftLowerArm : VRMHumanBoneName.RightLowerArm,
      rotation: this.blendQuaternion(
        new THREE.Quaternion(),
        handPosition.armConfiguration.lowerArm,
        progress
      )
    });

    // Hand transform
    transforms.push({
      boneName: isLeft ? VRMHumanBoneName.LeftHand : VRMHumanBoneName.RightHand,
      rotation: this.blendQuaternion(
        new THREE.Quaternion(),
        handPosition.armConfiguration.wrist,
        progress
      )
    });

    // Finger transforms (if available in VRM)
    const fingerTransforms = this.generateFingerTransforms(side, handPosition.fingerPositions, progress);
    transforms.push(...fingerTransforms);

    return transforms;
  }

  /**
   * Generates finger transforms
   */
  private generateFingerTransforms(
    side: 'left' | 'right',
    fingerPositions: FingerPosition[],
    progress: number
  ): BoneTransform[] {
    const transforms: BoneTransform[] = [];
    const isLeft = side === 'left';

    fingerPositions.forEach(finger => {
      finger.joints.forEach(joint => {
        const boneName = this.getFingerBoneName(isLeft, finger.finger, joint.joint);
        if (boneName) {
          transforms.push({
            boneName,
            rotation: this.blendQuaternion(
              new THREE.Quaternion(),
              joint.rotation,
              progress
            )
          });
        }
      });
    });

    return transforms;
  }

  /**
   * Gets VRM bone name for finger joint
   */
  private getFingerBoneName(
    isLeft: boolean,
    finger: string,
    joint: string
  ): VRMHumanBoneName | null {
    // VRM finger bone mapping
    const fingerMap: Record<string, Record<string, VRMHumanBoneName>> = {
      thumb: {
        metacarpal: isLeft ? VRMHumanBoneName.LeftThumbMetacarpal : VRMHumanBoneName.RightThumbMetacarpal,
        proximal: isLeft ? VRMHumanBoneName.LeftThumbProximal : VRMHumanBoneName.RightThumbProximal,
        distal: isLeft ? VRMHumanBoneName.LeftThumbDistal : VRMHumanBoneName.RightThumbDistal
      },
      index: {
        metacarpal: isLeft ? VRMHumanBoneName.LeftIndexMetacarpal : VRMHumanBoneName.RightIndexMetacarpal,
        proximal: isLeft ? VRMHumanBoneName.LeftIndexProximal : VRMHumanBoneName.RightIndexProximal,
        intermediate: isLeft ? VRMHumanBoneName.LeftIndexIntermediate : VRMHumanBoneName.RightIndexIntermediate,
        distal: isLeft ? VRMHumanBoneName.LeftIndexDistal : VRMHumanBoneName.RightIndexDistal
      },
      middle: {
        metacarpal: isLeft ? VRMHumanBoneName.LeftMiddleMetacarpal : VRMHumanBoneName.RightMiddleMetacarpal,
        proximal: isLeft ? VRMHumanBoneName.LeftMiddleProximal : VRMHumanBoneName.RightMiddleProximal,
        intermediate: isLeft ? VRMHumanBoneName.LeftMiddleIntermediate : VRMHumanBoneName.RightMiddleIntermediate,
        distal: isLeft ? VRMHumanBoneName.LeftMiddleDistal : VRMHumanBoneName.RightMiddleDistal
      },
      ring: {
        metacarpal: isLeft ? VRMHumanBoneName.LeftRingMetacarpal : VRMHumanBoneName.RightRingMetacarpal,
        proximal: isLeft ? VRMHumanBoneName.LeftRingProximal : VRMHumanBoneName.RightRingProximal,
        intermediate: isLeft ? VRMHumanBoneName.LeftRingIntermediate : VRMHumanBoneName.RightRingIntermediate,
        distal: isLeft ? VRMHumanBoneName.LeftRingDistal : VRMHumanBoneName.RightRingDistal
      },
      pinky: {
        metacarpal: isLeft ? VRMHumanBoneName.LeftLittleMetacarpal : VRMHumanBoneName.RightLittleMetacarpal,
        proximal: isLeft ? VRMHumanBoneName.LeftLittleProximal : VRMHumanBoneName.RightLittleProximal,
        intermediate: isLeft ? VRMHumanBoneName.LeftLittleIntermediate : VRMHumanBoneName.RightLittleIntermediate,
        distal: isLeft ? VRMHumanBoneName.LeftLittleDistal : VRMHumanBoneName.RightLittleDistal
      }
    };

    return fingerMap[finger]?.[joint] || null;
  }

  /**
   * Applies transforms to VRM model
   */
  private applyTransformsToVRM(result: HandGestureResult): void {
    if (!this.vrm?.humanoid) return;

    // Apply left hand transforms
    result.leftHandTransforms.forEach(transform => {
      const bone = this.vrm!.humanoid!.getNormalizedBoneNode(transform.boneName);
      if (bone) {
        if (transform.position) {
          bone.position.copy(transform.position);
        }
        bone.quaternion.copy(transform.rotation);
        if (transform.scale) {
          bone.scale.copy(transform.scale);
        }
      }
    });

    // Apply right hand transforms
    result.rightHandTransforms.forEach(transform => {
      const bone = this.vrm!.humanoid!.getNormalizedBoneNode(transform.boneName);
      if (bone) {
        if (transform.position) {
          bone.position.copy(transform.position);
        }
        bone.quaternion.copy(transform.rotation);
        if (transform.scale) {
          bone.scale.copy(transform.scale);
        }
      }
    });
  }

  /**
   * Blends between two quaternions
   */
  private blendQuaternion(from: THREE.Quaternion, to: THREE.Quaternion, t: number): THREE.Quaternion {
    return from.clone().slerp(to, t);
  }

  /**
   * Applies easing function to progress
   */
  private applyEasing(t: number, easing: EasingType): number {
    switch (easing) {
      case 'linear':
        return t;
      case 'ease_in':
        return t * t;
      case 'ease_out':
        return 1 - (1 - t) * (1 - t);
      case 'ease_in_out':
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      case 'bounce':
        return this.bounceEasing(t);
      case 'elastic':
        return this.elasticEasing(t);
      default:
        return t;
    }
  }

  private bounceEasing(t: number): number {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  }

  private elasticEasing(t: number): number {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }

  /**
   * Creates initial blend state
   */
  private createInitialBlendState(): HandGestureBlendState {
    return {
      currentGesture: null,
      targetGesture: null,
      blendProgress: 0,
      blendDuration: 0,
      startTime: 0,
      easing: 'ease_in_out'
    };
  }

  /**
   * Creates neutral hand gesture
   */
  private createNeutralGesture(): HandGesture {
    return {
      type: 'descriptive',
      leftHand: this.createNeutralHandPosition(),
      rightHand: this.createNeutralHandPosition(),
      duration: 500,
      intensity: 0,
      synchronizeWithSpeech: false,
      description: 'Neutral hand position'
    };
  }

  /**
   * Creates neutral hand position
   */
  private createNeutralHandPosition(): HandPosition {
    return {
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Quaternion(),
      fingerPositions: this.createNeutralFingerPositions(),
      armConfiguration: {
        shoulder: new THREE.Quaternion(),
        upperArm: new THREE.Quaternion(),
        lowerArm: new THREE.Quaternion(),
        wrist: new THREE.Quaternion(),
        elbow: new THREE.Vector3(0, 0, 0)
      },
      transitionCurve: {
        keyframes: [
          { time: 0, value: 0 },
          { time: 1, value: 1 }
        ],
        interpolation: 'linear',
        loop: false
      }
    };
  }

  /**
   * Creates neutral finger positions
   */
  private createNeutralFingerPositions(): FingerPosition[] {
    const fingers: ('thumb' | 'index' | 'middle' | 'ring' | 'pinky')[] = ['thumb', 'index', 'middle', 'ring', 'pinky'];
    
    return fingers.map(finger => ({
      finger,
      joints: this.createNeutralJoints(finger),
      flexion: 0.1, // Slightly relaxed
      spread: 0.0
    }));
  }

  /**
   * Creates neutral joint rotations for a finger
   */
  private createNeutralJoints(finger: string): JointRotation[] {
    const joints: ('proximal' | 'intermediate' | 'distal' | 'metacarpal')[] = 
      finger === 'thumb' ? ['metacarpal', 'proximal', 'distal'] : ['metacarpal', 'proximal', 'intermediate', 'distal'];

    return joints.map(joint => ({
      joint,
      rotation: new THREE.Quaternion(),
      flexionAngle: 0
    }));
  }

  /**
   * Initializes gesture library with predefined gestures
   */
  private initializeGestureLibrary(): Map<string, HandGesture> {
    const library = new Map<string, HandGesture>();

    // Pointing gesture
    library.set('pointing', this.createPointingGesture());
    
    // Counting gestures
    library.set('counting_one', this.createCountingGesture(1));
    library.set('counting_two', this.createCountingGesture(2));
    library.set('counting_three', this.createCountingGesture(3));
    library.set('counting_four', this.createCountingGesture(4));
    library.set('counting_five', this.createCountingGesture(5));
    
    // Descriptive gestures
    library.set('descriptive_small', this.createDescriptiveGesture('small'));
    library.set('descriptive_large', this.createDescriptiveGesture('large'));
    library.set('descriptive_round', this.createDescriptiveGesture('round'));
    
    // Celebratory gestures
    library.set('celebratory_clap', this.createCelebratoryGesture('clap'));
    library.set('celebratory_thumbs_up', this.createCelebratoryGesture('thumbs_up'));
    library.set('celebratory_victory', this.createCelebratoryGesture('victory'));
    
    // Supportive gestures
    library.set('supportive_open_palm', this.createSupportiveGesture('open_palm'));
    library.set('supportive_gentle_wave', this.createSupportiveGesture('gentle_wave'));
    
    // Emphatic gestures
    library.set('emphatic_fist', this.createEmphaticGesture('fist'));
    library.set('emphatic_point_up', this.createEmphaticGesture('point_up'));

    return library;
  }

  /**
   * Creates pointing gesture
   */
  private createPointingGesture(): HandGesture {
    const rightHandPosition: HandPosition = {
      position: new THREE.Vector3(0.3, 0.1, 0.2),
      rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -Math.PI / 6)),
      fingerPositions: [
        {
          finger: 'index',
          joints: [
            { joint: 'proximal', rotation: new THREE.Quaternion(), flexionAngle: 0 },
            { joint: 'intermediate', rotation: new THREE.Quaternion(), flexionAngle: 0 },
            { joint: 'distal', rotation: new THREE.Quaternion(), flexionAngle: 0 }
          ],
          flexion: 0.0,
          spread: 0.0
        },
        {
          finger: 'middle',
          joints: [
            { joint: 'proximal', rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), flexionAngle: 90 }
          ],
          flexion: 1.0,
          spread: 0.0
        },
        {
          finger: 'ring',
          joints: [
            { joint: 'proximal', rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), flexionAngle: 90 }
          ],
          flexion: 1.0,
          spread: 0.0
        },
        {
          finger: 'pinky',
          joints: [
            { joint: 'proximal', rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), flexionAngle: 90 }
          ],
          flexion: 1.0,
          spread: 0.0
        },
        {
          finger: 'thumb',
          joints: [
            { joint: 'proximal', rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 4, 0)), flexionAngle: 45 }
          ],
          flexion: 0.5,
          spread: 0.3
        }
      ],
      armConfiguration: {
        shoulder: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 6)),
        upperArm: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 4, 0)),
        lowerArm: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -Math.PI / 6)),
        wrist: new THREE.Quaternion(),
        elbow: new THREE.Vector3(0.2, 0, 0.1)
      },
      transitionCurve: {
        keyframes: [
          { time: 0, value: 0, easing: 'ease_out' },
          { time: 0.7, value: 0.9, easing: 'ease_in' },
          { time: 1, value: 1 }
        ],
        interpolation: 'cubic',
        loop: false
      }
    };

    return {
      type: 'pointing',
      leftHand: this.createNeutralHandPosition(),
      rightHand: rightHandPosition,
      duration: 800,
      intensity: 0.8,
      synchronizeWithSpeech: true,
      description: 'Pointing gesture with extended index finger'
    };
  }

  /**
   * Creates counting gesture for specific number
   */
  private createCountingGesture(count: number): HandGesture {
    const fingerPositions: FingerPosition[] = [];
    const fingers: ('thumb' | 'index' | 'middle' | 'ring' | 'pinky')[] = ['thumb', 'index', 'middle', 'ring', 'pinky'];

    fingers.forEach((finger, index) => {
      const isExtended = index < count;
      fingerPositions.push({
        finger,
        joints: [
          {
            joint: 'proximal',
            rotation: isExtended ? new THREE.Quaternion() : new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)),
            flexionAngle: isExtended ? 0 : 90
          }
        ],
        flexion: isExtended ? 0.0 : 1.0,
        spread: isExtended ? 0.2 : 0.0
      });
    });

    const rightHandPosition: HandPosition = {
      position: new THREE.Vector3(0.2, 0.2, 0.1),
      rotation: new THREE.Quaternion(),
      fingerPositions,
      armConfiguration: {
        shoulder: new THREE.Quaternion(),
        upperArm: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 6, Math.PI / 4)),
        lowerArm: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -Math.PI / 3)),
        wrist: new THREE.Quaternion(),
        elbow: new THREE.Vector3(0.15, 0.1, 0.05)
      },
      transitionCurve: {
        keyframes: [
          { time: 0, value: 0 },
          { time: 1, value: 1 }
        ],
        interpolation: 'linear',
        loop: false
      }
    };

    return {
      type: 'counting',
      leftHand: this.createNeutralHandPosition(),
      rightHand: rightHandPosition,
      duration: 600,
      intensity: 0.7,
      synchronizeWithSpeech: true,
      description: `Counting gesture showing ${count} finger${count !== 1 ? 's' : ''}`
    };
  }

  /**
   * Creates descriptive gesture
   */
  private createDescriptiveGesture(type: 'small' | 'large' | 'round'): HandGesture {
    let leftHandPos: HandPosition;
    let rightHandPos: HandPosition;

    switch (type) {
      case 'small':
        leftHandPos = this.createHandPosition(
          new THREE.Vector3(-0.1, 0.1, 0.1),
          new THREE.Quaternion(),
          0.3
        );
        rightHandPos = this.createHandPosition(
          new THREE.Vector3(0.1, 0.1, 0.1),
          new THREE.Quaternion(),
          0.3
        );
        break;
      case 'large':
        leftHandPos = this.createHandPosition(
          new THREE.Vector3(-0.4, 0.2, 0.1),
          new THREE.Quaternion(),
          0.8
        );
        rightHandPos = this.createHandPosition(
          new THREE.Vector3(0.4, 0.2, 0.1),
          new THREE.Quaternion(),
          0.8
        );
        break;
      case 'round':
        leftHandPos = this.createHandPosition(
          new THREE.Vector3(-0.2, 0.15, 0.1),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 4, 0)),
          0.5
        );
        rightHandPos = this.createHandPosition(
          new THREE.Vector3(0.2, 0.15, 0.1),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 4, 0)),
          0.5
        );
        break;
    }

    return {
      type: 'descriptive',
      leftHand: leftHandPos,
      rightHand: rightHandPos,
      duration: 1000,
      intensity: 0.6,
      synchronizeWithSpeech: true,
      description: `Descriptive gesture showing ${type} size/shape`
    };
  }

  /**
   * Creates celebratory gesture
   */
  private createCelebratoryGesture(type: 'clap' | 'thumbs_up' | 'victory'): HandGesture {
    let leftHandPos: HandPosition;
    let rightHandPos: HandPosition;

    switch (type) {
      case 'clap':
        leftHandPos = this.createHandPosition(
          new THREE.Vector3(-0.1, 0.2, 0.1),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)),
          0.0
        );
        rightHandPos = this.createHandPosition(
          new THREE.Vector3(0.1, 0.2, 0.1),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0)),
          0.0
        );
        break;
      case 'thumbs_up':
        leftHandPos = this.createNeutralHandPosition();
        rightHandPos = this.createThumbsUpPosition();
        break;
      case 'victory':
        leftHandPos = this.createNeutralHandPosition();
        rightHandPos = this.createVictoryPosition();
        break;
    }

    return {
      type: 'celebratory',
      leftHand: leftHandPos,
      rightHand: rightHandPos,
      duration: 1200,
      intensity: 0.9,
      synchronizeWithSpeech: false,
      description: `Celebratory ${type} gesture`
    };
  }

  /**
   * Creates supportive gesture
   */
  private createSupportiveGesture(type: 'open_palm' | 'gentle_wave'): HandGesture {
    let rightHandPos: HandPosition;

    switch (type) {
      case 'open_palm':
        rightHandPos = this.createHandPosition(
          new THREE.Vector3(0.2, 0.1, 0.2),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 6, 0, 0)),
          0.0
        );
        break;
      case 'gentle_wave':
        rightHandPos = this.createHandPosition(
          new THREE.Vector3(0.3, 0.3, 0.1),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 6)),
          0.2
        );
        break;
    }

    return {
      type: 'supportive',
      leftHand: this.createNeutralHandPosition(),
      rightHand: rightHandPos,
      duration: 800,
      intensity: 0.5,
      synchronizeWithSpeech: true,
      description: `Supportive ${type} gesture`
    };
  }

  /**
   * Creates emphatic gesture
   */
  private createEmphaticGesture(type: 'fist' | 'point_up'): HandGesture {
    let rightHandPos: HandPosition;

    switch (type) {
      case 'fist':
        rightHandPos = this.createHandPosition(
          new THREE.Vector3(0.2, 0.2, 0.1),
          new THREE.Quaternion(),
          1.0
        );
        break;
      case 'point_up':
        rightHandPos = this.createHandPosition(
          new THREE.Vector3(0.1, 0.4, 0.1),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)),
          0.0
        );
        // Set index finger extended for pointing up
        rightHandPos.fingerPositions[1].flexion = 0.0;
        break;
    }

    return {
      type: 'emphatic',
      leftHand: this.createNeutralHandPosition(),
      rightHand: rightHandPos,
      duration: 600,
      intensity: 0.8,
      synchronizeWithSpeech: true,
      description: `Emphatic ${type} gesture`
    };
  }

  /**
   * Helper method to create hand position
   */
  private createHandPosition(
    position: THREE.Vector3,
    rotation: THREE.Quaternion,
    flexion: number
  ): HandPosition {
    return {
      position,
      rotation,
      fingerPositions: this.createFlexedFingerPositions(flexion),
      armConfiguration: {
        shoulder: new THREE.Quaternion(),
        upperArm: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 6, Math.PI / 4)),
        lowerArm: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -Math.PI / 4)),
        wrist: rotation,
        elbow: new THREE.Vector3(position.x * 0.5, position.y * 0.5, position.z * 0.5)
      },
      transitionCurve: {
        keyframes: [
          { time: 0, value: 0 },
          { time: 1, value: 1 }
        ],
        interpolation: 'linear',
        loop: false
      }
    };
  }

  /**
   * Creates finger positions with specified flexion
   */
  private createFlexedFingerPositions(flexion: number): FingerPosition[] {
    const fingers: ('thumb' | 'index' | 'middle' | 'ring' | 'pinky')[] = ['thumb', 'index', 'middle', 'ring', 'pinky'];
    
    return fingers.map(finger => ({
      finger,
      joints: [
        {
          joint: 'proximal' as const,
          rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(flexion * Math.PI / 2, 0, 0)),
          flexionAngle: flexion * 90
        }
      ],
      flexion,
      spread: 0.0
    }));
  }

  /**
   * Creates thumbs up hand position
   */
  private createThumbsUpPosition(): HandPosition {
    const fingerPositions: FingerPosition[] = [
      {
        finger: 'thumb',
        joints: [
          { joint: 'proximal', rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2)), flexionAngle: 0 }
        ],
        flexion: 0.0,
        spread: 1.0
      },
      {
        finger: 'index',
        joints: [
          { joint: 'proximal', rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), flexionAngle: 90 }
        ],
        flexion: 1.0,
        spread: 0.0
      },
      {
        finger: 'middle',
        joints: [
          { joint: 'proximal', rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), flexionAngle: 90 }
        ],
        flexion: 1.0,
        spread: 0.0
      },
      {
        finger: 'ring',
        joints: [
          { joint: 'proximal', rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), flexionAngle: 90 }
        ],
        flexion: 1.0,
        spread: 0.0
      },
      {
        finger: 'pinky',
        joints: [
          { joint: 'proximal', rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), flexionAngle: 90 }
        ],
        flexion: 1.0,
        spread: 0.0
      }
    ];

    return {
      position: new THREE.Vector3(0.2, 0.2, 0.1),
      rotation: new THREE.Quaternion(),
      fingerPositions,
      armConfiguration: {
        shoulder: new THREE.Quaternion(),
        upperArm: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 4, Math.PI / 6)),
        lowerArm: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -Math.PI / 4)),
        wrist: new THREE.Quaternion(),
        elbow: new THREE.Vector3(0.1, 0.1, 0.05)
      },
      transitionCurve: {
        keyframes: [
          { time: 0, value: 0 },
          { time: 1, value: 1 }
        ],
        interpolation: 'linear',
        loop: false
      }
    };
  }

  /**
   * Creates victory (peace sign) hand position
   */
  private createVictoryPosition(): HandPosition {
    const fingerPositions: FingerPosition[] = [
      {
        finger: 'thumb',
        joints: [
          { joint: 'proximal', rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 3, 0, 0)), flexionAngle: 60 }
        ],
        flexion: 0.7,
        spread: 0.0
      },
      {
        finger: 'index',
        joints: [
          { joint: 'proximal', rotation: new THREE.Quaternion(), flexionAngle: 0 }
        ],
        flexion: 0.0,
        spread: 0.3
      },
      {
        finger: 'middle',
        joints: [
          { joint: 'proximal', rotation: new THREE.Quaternion(), flexionAngle: 0 }
        ],
        flexion: 0.0,
        spread: 0.3
      },
      {
        finger: 'ring',
        joints: [
          { joint: 'proximal', rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), flexionAngle: 90 }
        ],
        flexion: 1.0,
        spread: 0.0
      },
      {
        finger: 'pinky',
        joints: [
          { joint: 'proximal', rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), flexionAngle: 90 }
        ],
        flexion: 1.0,
        spread: 0.0
      }
    ];

    return {
      position: new THREE.Vector3(0.2, 0.3, 0.1),
      rotation: new THREE.Quaternion(),
      fingerPositions,
      armConfiguration: {
        shoulder: new THREE.Quaternion(),
        upperArm: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 4, Math.PI / 3)),
        lowerArm: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -Math.PI / 3)),
        wrist: new THREE.Quaternion(),
        elbow: new THREE.Vector3(0.15, 0.15, 0.05)
      },
      transitionCurve: {
        keyframes: [
          { time: 0, value: 0 },
          { time: 1, value: 1 }
        ],
        interpolation: 'linear',
        loop: false
      }
    };
  }
}