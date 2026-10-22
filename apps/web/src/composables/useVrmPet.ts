import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { VRMLoaderPlugin, VRMUtils, type VRM } from '@pixiv/three-vrm'
import type { PetAction } from '@/components/pet/event-map'
import {
  EMOTION_PRESETS,
  mapPetActionToVrm,
  nextClickEmotion,
  type VrmEmotion,
} from '@/components/pet/vrm-action-map'
import {
  computeCameraShot,
  createCameraTween,
  loadPetCameraMode,
  savePetCameraMode,
  startCameraTween,
  stepCameraTween,
  type CameraFraming,
  type PetCameraMode,
} from '@/components/pet/PetCameraController'
import {
  DEFAULT_DANCE_FBX,
  loadMixamoAnimation,
} from '@/composables/loadMixamoAnimation'

export type VrmPetStatus = 'idle' | 'loading' | 'ready' | 'error'

export type UseVrmPetOptions = {
  canvas: HTMLCanvasElement
  url: string
  onStatus?: (s: VrmPetStatus, err?: string) => void
  /** 镜头模式变化（非 Vue 高频，仅切换时回调） */
  onCameraMode?: (mode: PetCameraMode) => void
}

export function useVrmPet(opts: UseVrmPetOptions) {
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const renderer = new THREE.WebGLRenderer({
    canvas: opts.canvas,
    alpha: true,
    antialias: true,
    premultipliedAlpha: false,
    powerPreference: 'high-performance',
  })
  renderer.setClearColor(0x000000, 0)
  renderer.setClearAlpha(0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.98

  const scene = new THREE.Scene()
  scene.background = null

  // 极淡脚下光晕，不铺满画布，避免出现灰底方块
  const glowGeo = new THREE.SphereGeometry(0.35, 16, 12)
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x6ea8ff,
    transparent: true,
    opacity: 0.045,
    depthWrite: false,
  })
  const glow = new THREE.Mesh(glowGeo, glowMat)
  glow.position.set(0, 0.15, -0.2)
  glow.scale.set(1.6, 0.35, 1)
  scene.add(glow)

  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50)
  camera.position.set(0, 1.25, 2.2)

  // 柔和主光 + 补光 + 轮廓光（避免皮肤过曝、黑衣死黑）
  const key = new THREE.DirectionalLight(0xfff2e6, 1.05)
  key.position.set(1.0, 1.7, 1.3)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xa8bde8, 0.42)
  fill.position.set(-1.3, 0.85, 0.6)
  scene.add(fill)
  const rim = new THREE.DirectionalLight(0xdde8ff, 0.48)
  rim.position.set(0.15, 1.2, -1.5)
  scene.add(rim)
  scene.add(new THREE.AmbientLight(0xffffff, 0.32))
  scene.add(new THREE.HemisphereLight(0xffffff, 0x2a3340, 0.4))

  const lookTarget = new THREE.Object3D()
  scene.add(lookTarget)

  const orbitTarget = new THREE.Vector3(0, 1.2, 0)
  // 固定正对镜头：禁止旋转/缩放/平移（拖动留给页面挪位置）
  const controls = new OrbitControls(camera, opts.canvas)
  controls.enableDamping = false
  controls.enableRotate = false
  controls.enableZoom = false
  controls.enablePan = false
  controls.target.copy(orbitTarget)
  opts.canvas.style.touchAction = 'none'
  opts.canvas.style.cursor = 'grab'

  let vrm: VRM | null = null
  let loadToken = 0
  let raf = 0
  let disposed = false
  let visible =
    typeof document === 'undefined' ? true : document.visibilityState !== 'hidden'
  let blinkUntil = 0
  let nextBlinkAt = 0
  let clickEmotion: VrmEmotion | null = null
  let clickHoldUntil = 0
  let currentAction: PetAction = 'idle'
  let cameraMode: PetCameraMode = loadPetCameraMode()
  /** 加载并 rotateVRM0 后的朝向，庆祝复位必须回到这里（不能写死 0） */
  const baseSceneQuat = new THREE.Quaternion()
  let hasBaseSceneQuat = false
  const tween = createCameraTween()
  const _tmpPos = new THREE.Vector3()
  const _tmpTarget = new THREE.Vector3()
  const _tmpEuler = new THREE.Euler()

  /** Mixamo 重定向舞蹈 */
  let mixer: THREE.AnimationMixer | null = null
  let danceAction: THREE.AnimationAction | null = null
  let danceClip: THREE.AnimationClip | null = null
  let danceClipUrl = ''
  let dancing = false
  let danceToken = 0
  let danceEndHandler: (() => void) | null = null
  let cameraFraming: CameraFraming = 'default'

  const clock = new THREE.Clock()
  const loader = new GLTFLoader()
  loader.register((parser) => new VRMLoaderPlugin(parser))

  function setStatus(s: VrmPetStatus, err?: string) {
    opts.onStatus?.(s, err)
  }

  function applyRestPose() {
    if (!vrm?.humanoid) return
    const lArm = vrm.humanoid.getNormalizedBoneNode('leftUpperArm')
    const rArm = vrm.humanoid.getNormalizedBoneNode('rightUpperArm')
    const lLower = vrm.humanoid.getNormalizedBoneNode('leftLowerArm')
    const rLower = vrm.humanoid.getNormalizedBoneNode('rightLowerArm')
    if (lArm) {
      lArm.rotation.z = 1.35
      lArm.rotation.x = 0.12
      lArm.rotation.y = 0.05
    }
    if (rArm) {
      rArm.rotation.z = -1.35
      rArm.rotation.x = 0.12
      rArm.rotation.y = -0.05
    }
    if (lLower) {
      lLower.rotation.z = 0.25
      lLower.rotation.y = 0.1
    }
    if (rLower) {
      rLower.rotation.z = -0.25
      rLower.rotation.y = -0.1
    }
  }

  function captureBaseFacing() {
    if (!vrm) return
    baseSceneQuat.copy(vrm.scene.quaternion)
    hasBaseSceneQuat = true
  }

  function applyBaseFacing(yawOffset = 0) {
    if (!vrm || !hasBaseSceneQuat) return
    if (Math.abs(yawOffset) < 1e-6) {
      vrm.scene.quaternion.copy(baseSceneQuat)
      return
    }
    _tmpEuler.setFromQuaternion(baseSceneQuat, 'YXZ')
    _tmpEuler.y += yawOffset
    vrm.scene.quaternion.setFromEuler(_tmpEuler)
  }

  /**
   * 程序化庆祝：在「正对镜头」基准上左右轻转 + 举手欢庆。
   * 注意：不可把 scene.rotation 写成绝对角度，否则会冲掉 rotateVRM0。
   */
  function applyCelebrateDance(t: number) {
    if (!vrm?.humanoid) return
    applyBaseFacing(Math.sin(t * 2.4) * 0.55)

    const spine =
      vrm.humanoid.getNormalizedBoneNode('spine') ||
      vrm.humanoid.getNormalizedBoneNode('chest')
    const hips = vrm.humanoid.getNormalizedBoneNode('hips')
    const lArm = vrm.humanoid.getNormalizedBoneNode('leftUpperArm')
    const rArm = vrm.humanoid.getNormalizedBoneNode('rightUpperArm')
    const lLower = vrm.humanoid.getNormalizedBoneNode('leftLowerArm')
    const rLower = vrm.humanoid.getNormalizedBoneNode('rightLowerArm')
    const head = vrm.humanoid.getNormalizedBoneNode('head')

    if (spine) {
      spine.rotation.set(
        Math.sin(t * 3.2) * 0.06,
        Math.sin(t * 2.6) * 0.1,
        Math.sin(t * 4.2) * 0.12,
      )
    }
    if (hips) {
      hips.rotation.set(
        Math.sin(t * 6.5) * 0.04,
        Math.sin(t * 3.5) * 0.12,
        Math.sin(t * 5.5) * 0.08,
      )
    }
    if (lArm) {
      lArm.rotation.set(
        -1.1 + Math.sin(t * 8) * 0.25,
        0.15,
        0.15 + Math.sin(t * 8) * 0.35,
      )
    }
    if (rArm) {
      rArm.rotation.set(
        -1.1 + Math.sin(t * 8 + 0.9) * 0.25,
        -0.15,
        -0.15 + Math.sin(t * 8 + 0.9) * -0.35,
      )
    }
    if (lLower) {
      lLower.rotation.set(0, 0.05, 0.35 + Math.sin(t * 9) * 0.15)
    }
    if (rLower) {
      rLower.rotation.set(0, -0.05, -0.35 + Math.sin(t * 9 + 0.7) * -0.15)
    }
    if (head) {
      head.rotation.set(
        -0.08 + Math.sin(t * 4.5) * 0.06,
        Math.sin(t * 3.2) * 0.1,
        Math.sin(t * 5) * 0.08,
      )
    }
  }

  function zeroBone(name: Parameters<NonNullable<VRM['humanoid']>['getNormalizedBoneNode']>[0]) {
    const n = vrm?.humanoid?.getNormalizedBoneNode(name)
    if (n) n.rotation.set(0, 0, 0)
  }

  /** 结束庆祝：恢复加载时正对镜头朝向 + 休息姿 */
  function resetCelebratePose() {
    if (!vrm) return
    applyBaseFacing(0)
    zeroBone('hips')
    zeroBone('spine')
    zeroBone('chest')
    zeroBone('upperChest')
    zeroBone('neck')
    zeroBone('head')
    zeroBone('leftUpperArm')
    zeroBone('rightUpperArm')
    zeroBone('leftLowerArm')
    zeroBone('rightLowerArm')
    applyRestPose()
    vrm.scene.updateMatrixWorld(true)
  }

  function applyShot(mode: PetCameraMode, animate: boolean, framing: CameraFraming = cameraFraming) {
    if (!vrm) return
    // 跳舞中勿强制 rest，否则打断 AnimationMixer
    if (!dancing) applyRestPose()
    vrm.scene.updateMatrixWorld(true)
    const shot = computeCameraShot(vrm, camera, mode, { framing })
    controls.minDistance = shot.minDistance
    controls.maxDistance = shot.maxDistance

    if (!animate || reducedMotion) {
      tween.active = false
      camera.position.copy(shot.position)
      orbitTarget.copy(shot.target)
      controls.target.copy(shot.target)
      controls.update()
      return
    }

    startCameraTween(
      tween,
      camera.position.clone(),
      shot.position,
      controls.target.clone(),
      shot.target,
      0.65,
    )
  }

  function setCameraMode(
    mode: PetCameraMode,
    optsIn?: { persist?: boolean; animate?: boolean; framing?: CameraFraming },
  ) {
    cameraMode = mode
    if (optsIn?.framing) cameraFraming = optsIn.framing
    if (optsIn?.persist !== false) savePetCameraMode(mode)
    opts.onCameraMode?.(mode)
    applyShot(mode, optsIn?.animate !== false, cameraFraming)
  }

  function cycleCameraMode() {
    const order: PetCameraMode[] = ['portrait', 'closeup', 'fullBody']
    const i = order.indexOf(cameraMode)
    setCameraMode(order[(i + 1) % order.length])
  }

  function getCameraMode() {
    return cameraMode
  }

  function resize(w: number, h: number) {
    const width = Math.max(1, Math.floor(w))
    const height = Math.max(1, Math.floor(h))
    renderer.setSize(width, height, false)
    opts.canvas.style.width = '100%'
    opts.canvas.style.height = '100%'
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    if (vrm) applyShot(cameraMode, false)
  }

  function clearExpressions() {
    const em = vrm?.expressionManager
    if (!em) return
    for (const name of EMOTION_PRESETS) {
      try {
        em.setValue(name, 0)
      } catch {
        /* missing */
      }
    }
    for (const mouth of ['aa', 'ih', 'ou', 'ee', 'oh'] as const) {
      try {
        em.setValue(mouth, 0)
      } catch {
        /* missing */
      }
    }
    try {
      em.setValue('blink', 0)
    } catch {
      /* missing */
    }
  }

  function setEmotion(name: VrmEmotion, weight: number) {
    const em = vrm?.expressionManager
    if (!em) return
    clearExpressions()
    if (name === 'neutral' || weight <= 0) return
    try {
      em.setValue(name, Math.min(1, Math.max(0, weight)))
    } catch {
      /* missing */
    }
  }

  function scheduleBlink(now: number) {
    nextBlinkAt = now + 2.2 + Math.random() * 3.2
  }

  function applyBlink(now: number) {
    const em = vrm?.expressionManager
    if (!em) return
    if (now >= nextBlinkAt && blinkUntil <= now) {
      blinkUntil = now + 0.16
      scheduleBlink(now)
    }
    if (blinkUntil > now) {
      const t = 1 - Math.abs((blinkUntil - now) / 0.08 - 1)
      try {
        em.setValue('blink', Math.min(1, Math.max(0, t)))
      } catch {
        /* missing */
      }
    }
  }

  function applyBreath(t: number) {
    if (!vrm?.humanoid) return
    const chest =
      vrm.humanoid.getNormalizedBoneNode('chest') ||
      vrm.humanoid.getNormalizedBoneNode('spine')
    if (!chest) return
    // 幅度很小，配合头顶留白，呼吸时不顶出画面
    chest.rotation.x = Math.sin(t * 1.4) * 0.014
  }

  function applyLookAt() {
    if (!vrm) return
    if (vrm.lookAt) vrm.lookAt.target = lookTarget
    // 始终看向镜头（相机位置），不跟鼠标转头
    lookTarget.position.copy(camera.position)
  }

  function applyActionFx(now: number) {
    if (clickHoldUntil > now && clickEmotion) {
      setEmotion(clickEmotion, 0.95)
      return
    }
    const fx = mapPetActionToVrm(currentAction)
    setEmotion(fx.emotion, fx.weight)

    if (fx.mouthTalk && vrm?.expressionManager) {
      const w = (Math.sin(now * 8) + 1) * 0.2
      try {
        vrm.expressionManager.setValue('aa', w)
      } catch {
        /* missing */
      }
    }

    if (fx.lookDown && vrm?.humanoid) {
      const head = vrm.humanoid.getNormalizedBoneNode('head')
      if (head) head.rotation.x = 0.18
    }
  }

  function frame(_ts: number) {
    if (disposed) return
    raf = requestAnimationFrame(frame)
    if (!visible) return
    const delta = Math.min(clock.getDelta(), 0.05)
    const now = clock.elapsedTime

    if (tween.active) {
      const animating = stepCameraTween(tween, delta, _tmpPos, _tmpTarget, !!reducedMotion)
      camera.position.copy(_tmpPos)
      controls.target.copy(_tmpTarget)
      orbitTarget.copy(_tmpTarget)
      if (!animating) controls.update()
    } else {
      controls.update()
    }

    if (dancing && mixer) {
      mixer.update(delta)
      // 舞蹈由 AnimationMixer 驱动骨骼；保留眨眼/表情，避免 lookAt 抢头部
      applyBreath(now)
      applyActionFx(now)
      applyBlink(now)
    } else if (currentAction === 'celebrate') {
      // 无 FBX 时的程序化兜底
      applyCelebrateDance(now)
      applyBreath(now)
      applyActionFx(now)
      applyBlink(now)
    } else {
      applyRestPose()
      applyBreath(now)
      applyLookAt()
      applyActionFx(now)
      applyBlink(now)
    }

    if (vrm) vrm.update(delta)
    // 光晕贴在角色脚下附近，不随镜头变成整块背板
    glow.position.set(orbitTarget.x, Math.max(0.05, orbitTarget.y - 0.95), orbitTarget.z - 0.15)
    renderer.render(scene, camera)
  }

  async function load(url: string) {
    const token = ++loadToken
    setStatus('loading')
    disposeModel()
    try {
      const gltf = await loader.loadAsync(url)
      if (token !== loadToken || disposed) {
        disposeGltfScene(gltf.scene)
        return
      }
      const next = gltf.userData.vrm as VRM | undefined
      if (!next) {
        disposeGltfScene(gltf.scene)
        setStatus('error', '不是有效的 VRM 模型')
        return
      }
      VRMUtils.removeUnnecessaryVertices(gltf.scene)
      VRMUtils.combineSkeletons(gltf.scene)
      VRMUtils.rotateVRM0(next)

      next.scene.traverse((obj) => {
        obj.frustumCulled = false
      })

      scene.add(next.scene)
      if (next.lookAt) next.lookAt.target = lookTarget
      vrm = next
      next.scene.updateMatrixWorld(true)
      captureBaseFacing()
      applyRestPose()
      next.scene.updateMatrixWorld(true)
      // 默认半身，不重置用户已存偏好
      setCameraMode(cameraMode, { persist: false, animate: false })
      requestAnimationFrame(() => {
        if (vrm === next && !disposed) {
          setCameraMode(cameraMode, { persist: false, animate: false })
        }
      })

      scheduleBlink(clock.elapsedTime)
      console.info('[PetVrm] ready', url, 'mode=', cameraMode)
      setStatus('ready')
    } catch (e) {
      if (token !== loadToken) return
      const msg = e instanceof Error ? e.message : 'VRM 加载失败'
      console.warn('[PetVrm]', msg, e)
      setStatus('error', msg)
    }
  }

  function disposeGltfScene(root: THREE.Object3D) {
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (mesh.isMesh) {
        mesh.geometry?.dispose()
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        for (const m of mats) m?.dispose?.()
      }
    })
  }

  function disposeMixer() {
    if (danceAction) {
      try {
        danceAction.stop()
      } catch {
        /* ignore */
      }
      danceAction = null
    }
    if (mixer) {
      try {
        mixer.stopAllAction()
      } catch {
        /* ignore */
      }
      mixer = null
    }
    danceClip = null
    danceClipUrl = ''
    dancing = false
    danceEndHandler = null
  }

  function disposeModel() {
    disposeMixer()
    if (!vrm) return
    scene.remove(vrm.scene)
    disposeGltfScene(vrm.scene)
    vrm = null
    hasBaseSceneQuat = false
  }

  function setAction(action: PetAction) {
    if (currentAction === 'celebrate' && action !== 'celebrate') {
      if (dancing) stopDance({ restoreCamera: false })
      else resetCelebratePose()
    }
    currentAction = action
  }

  function resetPose() {
    resetCelebratePose()
    if (vrm) applyShot(cameraMode, false)
  }

  /** 庆祝结束后：正对镜头 + 特写 */
  function restoreAfterCelebration() {
    if (dancing) stopDance({ restoreCamera: true })
    else {
      resetCelebratePose()
      setCameraMode('closeup', { persist: true, animate: false })
    }
  }

  function stopDance(optsIn?: { restoreCamera?: boolean }) {
    const restoreCamera = optsIn?.restoreCamera !== false
    dancing = false
    currentAction = 'idle'
    if (danceAction) {
      try {
        danceAction.fadeOut(0.15)
        danceAction.stop()
      } catch {
        /* ignore */
      }
      danceAction = null
    }
    if (mixer) {
      try {
        mixer.stopAllAction()
      } catch {
        /* ignore */
      }
    }
    if (vrm?.humanoid) {
      try {
        vrm.humanoid.resetNormalizedPose()
      } catch {
        /* ignore */
      }
    }
    resetCelebratePose()
    cameraFraming = 'default'
    if (restoreCamera) {
      setCameraMode('closeup', { persist: true, animate: false, framing: 'default' })
    }
  }

  /**
   * 播放 Mixamo 重定向舞蹈：全身镜头 → 播完 → 待机 + 特写正对。
   */
  async function playDance(optsIn?: {
    url?: string
    onEnd?: () => void
  }): Promise<boolean> {
    if (!vrm?.humanoid) {
      console.warn('[PetVrm] playDance: VRM 未就绪')
      optsIn?.onEnd?.()
      return false
    }
    const url = optsIn?.url || DEFAULT_DANCE_FBX
    const token = ++danceToken
    danceEndHandler = optsIn?.onEnd || null

    try {
      if (!danceClip || danceClipUrl !== url) {
        console.info('[PetVrm] retarget Mixamo…', url)
        danceClip = await loadMixamoAnimation(url, vrm)
        danceClipUrl = url
      }
      if (token !== danceToken || disposed || !vrm) {
        optsIn?.onEnd?.()
        return false
      }

      if (!mixer || mixer.getRoot() !== vrm.scene) {
        mixer?.stopAllAction()
        mixer = new THREE.AnimationMixer(vrm.scene)
      }

      mixer.stopAllAction()
      danceAction = mixer.clipAction(danceClip)
      danceAction.reset()
      danceAction.setLoop(THREE.LoopOnce, 1)
      danceAction.clampWhenFinished = true
      danceAction.fadeIn(0.2)
      danceAction.play()

      dancing = true
      currentAction = 'celebrate'
      applyBaseFacing(0)
      // 跳舞取景加宽加远，避免手臂摆出画面
      setCameraMode('fullBody', { persist: false, animate: true, framing: 'dance' })

      const onFinished = (e: { action: THREE.AnimationAction }) => {
        if (e.action !== danceAction) return
        mixer?.removeEventListener('finished', onFinished as any)
        if (token !== danceToken) return
        const cb = danceEndHandler
        danceEndHandler = null
        stopDance({ restoreCamera: true })
        cb?.()
      }
      mixer.addEventListener('finished', onFinished as any)
      console.info('[PetVrm] dance playing', danceClip.duration, 's')
      return true
    } catch (e) {
      console.warn('[PetVrm] playDance failed', e)
      dancing = false
      // 回退程序化庆祝，仍通知结束
      currentAction = 'celebrate'
      setCameraMode('fullBody', { persist: false, animate: true, framing: 'dance' })
      setTimeout(() => {
        if (token !== danceToken) return
        const cb = danceEndHandler
        danceEndHandler = null
        stopDance({ restoreCamera: true })
        cb?.()
      }, 5500)
      return false
    }
  }

  function cycleExpression() {
    clickEmotion = nextClickEmotion(clickEmotion)
    clickHoldUntil = clock.elapsedTime + 1.8
    setEmotion(clickEmotion, 0.95)
    return clickEmotion
  }

  function onVisibility() {
    visible = document.visibilityState !== 'hidden'
    if (visible) clock.getDelta()
  }

  document.addEventListener('visibilitychange', onVisibility)
  raf = requestAnimationFrame(frame)
  void load(opts.url)

  function setUrl(url: string) {
    void load(url)
  }

  function dispose() {
    disposed = true
    cancelAnimationFrame(raf)
    document.removeEventListener('visibilitychange', onVisibility)
    controls.dispose()
    disposeModel()
    glowGeo.dispose()
    glowMat.dispose()
    renderer.dispose()
  }

  return {
    resize,
    setUrl,
    setAction,
    resetPose,
    restoreAfterCelebration,
    playDance,
    stopDance,
    cycleExpression,
    setCameraMode,
    cycleCameraMode,
    getCameraMode,
    dispose,
  }
}

export type VrmPetController = ReturnType<typeof useVrmPet>
