import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import {
  DEFAULT_PIPER_VOICE_KEY,
  PIPER_VOICE_CATALOG,
  type PiperVoiceKey,
} from './piper-voices'

@Injectable()
export class PiperTtsService {
  constructor(private readonly config: ConfigService) {}

  listVoices() {
    return PIPER_VOICE_CATALOG.map((v) => {
      const modelPath = this.resolveModelPath(v.key)
      return {
        ...v,
        available: !!modelPath && existsSync(modelPath),
        modelPath: modelPath || null,
      }
    })
  }

  /**
   * 调用本机 Piper 生成 wav。
   * lengthScale：越大越慢（Piper --length_scale）
   */
  async synthesizeToWav(
    text: string,
    lengthScale: number,
    voiceKey?: string,
  ): Promise<{
    absolutePath: string
    relativeUrl: string
    fileName: string
    voiceKey: string
  }> {
    const bin = this.config.get<string>('PIPER_BIN', '').trim()
    if (!bin) {
      throw new ServiceUnavailableException(
        '未配置 Piper：请在 api/.env 设置 PIPER_BIN',
      )
    }
    if (!existsSync(bin)) {
      throw new ServiceUnavailableException(`Piper 程序不存在: ${bin}`)
    }

    const resolvedKey = this.normalizeVoiceKey(voiceKey)
    const model = this.resolveModelPath(resolvedKey)
    if (!model || !existsSync(model)) {
      throw new BadRequestException(
        `音色「${resolvedKey}」模型未安装，请将 ${resolvedKey}.onnx 与 .onnx.json 放到语音目录`,
      )
    }

    const uploadRoot = join(process.cwd(), 'uploads', 'listening')
    if (!existsSync(uploadRoot)) mkdirSync(uploadRoot, { recursive: true })

    const fileName = `${Date.now()}-${randomUUID().slice(0, 8)}.wav`
    const absolutePath = join(uploadRoot, fileName)
    const relativeUrl = `/uploads/listening/${fileName}`

    const args = [
      '--model',
      model,
      '--output_file',
      absolutePath,
      '--length_scale',
      String(lengthScale),
    ]
    const speaker = this.config.get<string>('PIPER_SPEAKER', '').trim()
    if (speaker !== '') {
      args.push('--speaker', speaker)
    }

    await this.runPiper(bin, args, text)
    if (!existsSync(absolutePath)) {
      throw new ServiceUnavailableException('Piper 未生成音频文件')
    }

    return { absolutePath, relativeUrl, fileName, voiceKey: resolvedKey }
  }

  normalizeVoiceKey(voiceKey?: string): PiperVoiceKey {
    if (voiceKey && PIPER_VOICE_CATALOG.some((v) => v.key === voiceKey)) {
      return voiceKey as PiperVoiceKey
    }
    const fromEnv = this.config.get<string>('PIPER_DEFAULT_VOICE', '').trim()
    if (fromEnv && PIPER_VOICE_CATALOG.some((v) => v.key === fromEnv)) {
      return fromEnv as PiperVoiceKey
    }
    return DEFAULT_PIPER_VOICE_KEY
  }

  /** 优先 PIPER_VOICES_DIR/{key}.onnx；否则兼容旧配置 PIPER_MODEL */
  resolveModelPath(voiceKey: string): string | null {
    const dir = this.config.get<string>('PIPER_VOICES_DIR', '').trim()
    if (dir) {
      const p = join(dir, `${voiceKey}.onnx`)
      if (existsSync(p)) return p
    }

    const legacy = this.config.get<string>('PIPER_MODEL', '').trim()
    if (legacy) {
      const base = legacy.replace(/\.onnx$/i, '')
      const legacyKey = base.split(/[/\\]/).pop() || ''
      if (legacyKey === voiceKey && existsSync(legacy)) return legacy
      // 若只配了单个 PIPER_MODEL，且请求默认音色，允许直接用该文件
      if (voiceKey === DEFAULT_PIPER_VOICE_KEY && existsSync(legacy)) return legacy
      // 同目录下按 key 找
      const sibling = join(dirname(legacy), `${voiceKey}.onnx`)
      if (existsSync(sibling)) return sibling
    }

    return null
  }

  private runPiper(bin: string, args: string[], text: string): Promise<void> {
    const timeoutMs = Number(this.config.get<string>('PIPER_TIMEOUT_MS', '120000'))
    return new Promise((resolve, reject) => {
      const child = spawn(bin, args, {
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      let stderr = ''
      const timer = setTimeout(() => {
        child.kill()
        reject(new ServiceUnavailableException('Piper 合成超时'))
      }, timeoutMs)

      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString()
      })

      child.on('error', (err) => {
        clearTimeout(timer)
        reject(new ServiceUnavailableException(`无法启动 Piper: ${err.message}`))
      })

      child.on('close', (code) => {
        clearTimeout(timer)
        if (code === 0) {
          resolve()
          return
        }
        reject(
          new ServiceUnavailableException(
            `Piper 失败(code=${code}): ${stderr.slice(0, 500) || '无错误输出'}`,
          ),
        )
      })

      try {
        child.stdin.write(text, 'utf8')
        child.stdin.end()
      } catch (e) {
        clearTimeout(timer)
        child.kill()
        reject(
          new ServiceUnavailableException(
            `写入 Piper 输入失败: ${(e as Error).message}`,
          ),
        )
      }
    })
  }

  estimateWavDurationMs(absolutePath: string): number | null {
    try {
      const buf = readFileSync(absolutePath)
      if (buf.length < 44) return null
      if (buf.toString('ascii', 0, 4) !== 'RIFF') return null
      const sampleRate = buf.readUInt32LE(24)
      const channels = buf.readUInt16LE(22)
      const bitsPerSample = buf.readUInt16LE(34)
      let dataSize = buf.readUInt32LE(40)
      let offset = 12
      while (offset + 8 <= buf.length) {
        const id = buf.toString('ascii', offset, offset + 4)
        const size = buf.readUInt32LE(offset + 4)
        if (id === 'data') {
          dataSize = size
          break
        }
        offset += 8 + size
      }
      const bytesPerSec = sampleRate * channels * (bitsPerSample / 8)
      if (!bytesPerSec) return null
      return Math.round((dataSize / bytesPerSec) * 1000)
    } catch {
      return null
    }
  }
}
