import * as THREE from 'three'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import type { VRM } from '@pixiv/three-vrm'
import { mixamoVRMRigMap } from '@/components/pet/mixamoVRMRigMap'
import { resolveVrmUrl } from '@/components/pet/skins'

/** 相对 public；经 resolveVrmUrl 适配 /study-system/ 二级目录 */
export const DEFAULT_DANCE_FBX = resolveVrmUrl('animations/mixamo/dance-hiphop.fbx')

function normalizeMixamoName(name: string) {
  return name.replace(/^mixamorig:/i, 'mixamorig')
}

function findMixamoClip(asset: THREE.Group): THREE.AnimationClip | null {
  const clips = asset.animations || []
  if (!clips.length) return null
  return (
    THREE.AnimationClip.findByName(clips, 'mixamo.com') ||
    clips.find((c) => /mixamo/i.test(c.name)) ||
    clips[0]
  )
}

function findHips(asset: THREE.Object3D): THREE.Object3D | null {
  return (
    asset.getObjectByName('mixamorigHips') ||
    asset.getObjectByName('mixamorig:Hips') ||
    null
  )
}

/**
 * 加载 Mixamo FBX，按 three-vrm 官方方案重定向到当前 VRM Humanoid（NormalizedBone）。
 * 不可直接把 Mixamo 轨道绑到 VRM 原始骨骼。
 */
export async function loadMixamoAnimation(
  url: string,
  vrm: VRM,
): Promise<THREE.AnimationClip> {
  const loader = new FBXLoader()
  const asset = await loader.loadAsync(url)

  const clip = findMixamoClip(asset)
  if (!clip) {
    throw new Error('Mixamo FBX 中未找到 AnimationClip')
  }

  const hips = findHips(asset)
  if (!hips) {
    throw new Error('Mixamo FBX 中未找到 mixamorigHips，请确认导出为 Mixamo 骨骼')
  }

  const humanoid = vrm.humanoid
  if (!humanoid) {
    throw new Error('当前 VRM 无 humanoid，无法重定向')
  }

  const tracks: THREE.KeyframeTrack[] = []
  const restRotationInverse = new THREE.Quaternion()
  const parentRestWorldRotation = new THREE.Quaternion()
  const _quatA = new THREE.Quaternion()

  const motionHipsHeight = hips.position.y || 1
  const restHips = humanoid.normalizedRestPose?.hips
  const vrmHipsHeight =
    (restHips?.position && restHips.position[1]) ||
    humanoid.getNormalizedBoneNode('hips')?.position.y ||
    1
  const hipsPositionScale = vrmHipsHeight / motionHipsHeight

  const isVrm0 = vrm.meta?.metaVersion === '0'

  console.info('[Mixamo] bones sample:', {
    mixamoHips: hips.name,
    motionHipsHeight,
    vrmHipsHeight,
    hipsPositionScale,
    trackCount: clip.tracks.length,
    vrmMeta: vrm.meta?.metaVersion,
  })

  for (const track of clip.tracks) {
    const trackSplitted = track.name.split('.')
    const mixamoRigName = normalizeMixamoName(trackSplitted[0])
    const vrmBoneName = mixamoVRMRigMap[mixamoRigName]
    if (!vrmBoneName) continue

    const vrmNode = humanoid.getNormalizedBoneNode(vrmBoneName as any)
    const vrmNodeName = vrmNode?.name
    const mixamoRigNode = asset.getObjectByName(trackSplitted[0]) || asset.getObjectByName(mixamoRigName)
    if (!vrmNodeName || !mixamoRigNode) continue

    const propertyName = trackSplitted[1]
    mixamoRigNode.getWorldQuaternion(restRotationInverse).invert()
    mixamoRigNode.parent?.getWorldQuaternion(parentRestWorldRotation) ??
      parentRestWorldRotation.identity()

    if (track instanceof THREE.QuaternionKeyframeTrack) {
      const values = track.values.slice()
      for (let i = 0; i < values.length; i += 4) {
        const flat = values.slice(i, i + 4)
        _quatA.fromArray(flat)
        // 父节点 rest 世界旋转 * 轨道旋转 * rest 世界旋转的逆
        _quatA.premultiply(parentRestWorldRotation).multiply(restRotationInverse)
        _quatA.toArray(flat)
        for (let j = 0; j < 4; j++) values[i + j] = flat[j]
      }
      // VRM0 坐标系：对 x/z 分量取反（与官方一致）
      const mapped = values.map((v, i) => (isVrm0 && i % 2 === 0 ? -v : v))
      tracks.push(
        new THREE.QuaternionKeyframeTrack(`${vrmNodeName}.${propertyName}`, track.times, mapped),
      )
    } else if (track instanceof THREE.VectorKeyframeTrack) {
      const value = track.values.map(
        (v, i) => (isVrm0 && i % 3 !== 1 ? -v : v) * hipsPositionScale,
      )
      tracks.push(
        new THREE.VectorKeyframeTrack(`${vrmNodeName}.${propertyName}`, track.times, value),
      )
    }
  }

  if (!tracks.length) {
    throw new Error('Mixamo 重定向后无有效轨道，请检查骨骼映射')
  }

  console.info('[Mixamo] retargeted tracks:', tracks.length, 'duration=', clip.duration)
  return new THREE.AnimationClip('vrmDance', clip.duration, tracks)
}
