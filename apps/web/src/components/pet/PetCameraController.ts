import * as THREE from 'three'
import type { VRM } from '@pixiv/three-vrm'

export type PetCameraMode = 'closeup' | 'portrait' | 'fullBody'

export const PET_CAMERA_MODES: { id: PetCameraMode; label: string }[] = [
  { id: 'closeup', label: '特写' },
  { id: 'portrait', label: '半身' },
  { id: 'fullBody', label: '全身' },
]

const STORAGE_KEY = 'pet.cameraMode'

export function loadPetCameraMode(): PetCameraMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'closeup' || v === 'portrait' || v === 'fullBody') return v
  } catch {
    /* ignore */
  }
  return 'portrait'
}

export function savePetCameraMode(mode: PetCameraMode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    /* ignore */
  }
}

export type CameraShot = {
  position: THREE.Vector3
  target: THREE.Vector3
  /** 建议的 OrbitControls min/max distance */
  minDistance: number
  maxDistance: number
}

function boneWorld(vrm: VRM, name: string, fallback: THREE.Vector3): THREE.Vector3 {
  const node = vrm.humanoid?.getNormalizedBoneNode(name as any)
  if (!node) return fallback.clone()
  return node.getWorldPosition(new THREE.Vector3())
}

export type CameraFraming = 'default' | 'dance'

/**
 * 按骨骼（或包围盒回退）计算镜头，不写死身高。
 * closeup: 头+肩；portrait: 头到腰；fullBody: 完整人物。
 * framing=dance: 为手臂大幅摆动预留更宽/更远取景。
 */
export function computeCameraShot(
  vrm: VRM,
  camera: THREE.PerspectiveCamera,
  mode: PetCameraMode,
  opts?: { framing?: CameraFraming },
): CameraShot {
  const framing = opts?.framing || 'default'
  const dance = framing === 'dance'
  vrm.scene.updateMatrixWorld(true)

  const box = new THREE.Box3().setFromObject(vrm.scene)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  const hasBones = !!vrm.humanoid

  const head = hasBones
    ? boneWorld(vrm, 'head', new THREE.Vector3(center.x, box.max.y - size.y * 0.08, center.z))
    : new THREE.Vector3(center.x, box.max.y - size.y * 0.08, center.z)
  const neck = hasBones ? boneWorld(vrm, 'neck', head) : head.clone()
  const chest = hasBones
    ? boneWorld(vrm, 'chest', new THREE.Vector3(center.x, center.y + size.y * 0.15, center.z))
    : new THREE.Vector3(center.x, center.y + size.y * 0.15, center.z)
  const hips = hasBones
    ? boneWorld(vrm, 'hips', new THREE.Vector3(center.x, center.y - size.y * 0.05, center.z))
    : new THREE.Vector3(center.x, center.y - size.y * 0.05, center.z)

  // 头顶略高于 head 骨骼（头发）
  const headTop = head.y + Math.max(0.12, size.y * 0.06)
  const feetY = box.min.y

  let topY: number
  let bottomY: number
  let targetY: number
  let pad: number

  switch (mode) {
    case 'closeup':
      // 头 + 肩：头顶多留白，呼吸不顶出
      topY = headTop + Math.max(0.1, size.y * 0.05)
      bottomY = chest.y + (head.y - chest.y) * 0.12
      targetY = neck.y + (head.y - neck.y) * 0.2
      pad = 1.22
      break
    case 'fullBody':
      topY = headTop + Math.max(0.08, size.y * (dance ? 0.08 : 0.03))
      bottomY = feetY - (dance ? Math.max(0.05, size.y * 0.04) : 0)
      targetY = (headTop + feetY) * 0.5
      pad = dance ? 1.55 : 1.22
      break
    case 'portrait':
    default:
      // 默认半身略小一号 + 头顶留白防呼吸裁切
      topY = headTop + Math.max(0.12, size.y * 0.055)
      bottomY = hips.y
      targetY = (head.y + chest.y) * 0.48
      pad = 1.28
      break
  }

  const frameH = Math.max(0.22, (topY - bottomY) * pad)
  // 横向：特写更窄（按头宽），避免被双臂撑远
  let frameW: number
  if (mode === 'fullBody') {
    if (dance) {
      // 休息姿包围盒偏窄；按身高预留手臂横摆空间
      frameW = Math.max(size.x, size.z, size.y * 0.95) * pad * 1.35
    } else {
      frameW = Math.max(size.x, size.z) * pad
    }
  } else if (mode === 'closeup') {
    frameW = Math.max(size.x * 0.28, frameH * 0.72) * pad
  } else {
    frameW = Math.max(size.x * 0.42, frameH * 0.62) * pad
  }

  const aspect = Math.max(0.35, camera.aspect || 1)
  const fovRad = THREE.MathUtils.degToRad(camera.fov)
  const distH = frameH / 2 / Math.tan(fovRad / 2)
  const distW = frameW / 2 / Math.tan(fovRad / 2) / aspect
  // 普通全身：宽度仅可小幅拉远；跳舞：完全按宽高取更远
  let dist = dance
    ? Math.max(distH, distW) * 1.12
    : Math.max(distH, Math.min(distW, distH * (mode === 'fullBody' ? 1.12 : 1.2)))

  if (mode === 'closeup') dist *= 1.02
  if (mode === 'portrait') dist *= 1.12
  if (mode === 'fullBody' && !dance) dist *= 1.05
  dist = Math.max(0.45, dist)

  const target = new THREE.Vector3(center.x, targetY, center.z)
  const position = new THREE.Vector3(center.x, targetY, center.z + dist)

  return {
    position,
    target,
    minDistance: dist * 0.55,
    maxDistance: dist * 2.8,
  }
}

/** easeInOutCubic */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export type CameraTween = {
  active: boolean
  duration: number
  elapsed: number
  fromPos: THREE.Vector3
  toPos: THREE.Vector3
  fromTarget: THREE.Vector3
  toTarget: THREE.Vector3
  token: number
}

export function createCameraTween(): CameraTween {
  return {
    active: false,
    duration: 0.65,
    elapsed: 0,
    fromPos: new THREE.Vector3(),
    toPos: new THREE.Vector3(),
    fromTarget: new THREE.Vector3(),
    toTarget: new THREE.Vector3(),
    token: 0,
  }
}

export function startCameraTween(
  tween: CameraTween,
  fromPos: THREE.Vector3,
  toPos: THREE.Vector3,
  fromTarget: THREE.Vector3,
  toTarget: THREE.Vector3,
  durationSec = 0.65,
): number {
  tween.token += 1
  tween.active = true
  tween.duration = durationSec
  tween.elapsed = 0
  tween.fromPos.copy(fromPos)
  tween.toPos.copy(toPos)
  tween.fromTarget.copy(fromTarget)
  tween.toTarget.copy(toTarget)
  return tween.token
}

/** @returns true if still animating */
export function stepCameraTween(
  tween: CameraTween,
  delta: number,
  outPos: THREE.Vector3,
  outTarget: THREE.Vector3,
  reducedMotion: boolean,
): boolean {
  if (!tween.active) return false
  if (reducedMotion) {
    outPos.copy(tween.toPos)
    outTarget.copy(tween.toTarget)
    tween.active = false
    return false
  }
  tween.elapsed += delta
  const t = Math.min(1, tween.elapsed / tween.duration)
  const e = easeInOutCubic(t)
  outPos.lerpVectors(tween.fromPos, tween.toPos, e)
  outTarget.lerpVectors(tween.fromTarget, tween.toTarget, e)
  if (t >= 1) {
    tween.active = false
    outPos.copy(tween.toPos)
    outTarget.copy(tween.toTarget)
    return false
  }
  return true
}
