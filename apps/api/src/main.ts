import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import type { NextFunction, Request, Response } from 'express'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  const uploadDir = join(process.cwd(), 'uploads')
  if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true })
  // STEP_10：阻断公开静态访问工业 SVG（须走会话授权 API）
  const expressForUploads = app.getHttpAdapter().getInstance()
  expressForUploads.use(
    '/uploads/industrial-svg',
    (_req: Request, res: Response) => {
      res.status(403).type('application/json').send({
        success: false,
        message:
          'Forbidden: industrial SVG requires authorized chemistry train session API',
      })
    },
  )
  app.useStaticAssets(uploadDir, { prefix: '/uploads' })

  // 前端静态页（二级目录 /study-system）
  // 目录优先：环境变量 WEB_ROOT，否则 api 同级 web/ 或 api/web/
  const webCandidates = [
    process.env.WEB_ROOT,
    join(process.cwd(), '..', 'web'),
    join(process.cwd(), 'web'),
  ].filter(Boolean) as string[]
  const webDir = webCandidates.find((p) => existsSync(join(p, 'index.html')))
  if (webDir) {
    app.useStaticAssets(webDir, {
      prefix: '/study-system',
      index: false,
    })
    const expressApp = app.getHttpAdapter().getInstance()
    expressApp.get(
      [/^\/study-system\/?$/, /^\/study-system\/.*/],
      (req: Request, res: Response, next: NextFunction) => {
        // 带扩展名的静态资源未命中时交给后续 404
        const sub = req.path.replace(/^\/study-system\/?/, '')
        if (sub && /\.[a-zA-Z0-9]+$/.test(sub)) {
          return next()
        }
        return res.sendFile(join(webDir, 'index.html'))
      },
    )
    console.log(`Web UI mounted at /study-system  (from ${webDir})`)
  } else {
    console.warn(
      'Web UI not found: put built frontend in ../web or ./web, or set WEB_ROOT',
    )
  }

  app.enableCors({
    origin: true,
    credentials: true,
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )
  app.useGlobalInterceptors(new TransformInterceptor())
  app.useGlobalFilters(new AllExceptionsFilter())

  const port = Number(process.env.PORT) || 3000
  await app.listen(port)
  console.log(`API listening on http://localhost:${port}`)
  if (webDir) {
    console.log(`Open http://localhost:${port}/study-system/`)
  }
}

bootstrap()
