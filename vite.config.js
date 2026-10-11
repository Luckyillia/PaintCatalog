import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Подставляет абсолютный адрес сайта вместо __SITE_URL__ в index.html
// (нужно для og:image — соцсети не понимают относительные пути).
// Приоритет: VITE_SITE_URL из .env / Vercel → автоматический домен
// Vercel (VERCEL_PROJECT_PRODUCTION_URL) → пусто (тогда путь остаётся
// относительным).
function siteUrlPlugin(siteUrl) {
  return {
    name: 'osnova-site-url',
    transformIndexHtml(html) {
      return html.replaceAll('__SITE_URL__', siteUrl)
    },
  }
}

// Только для `npm run dev`: обслуживает /api/* функции из папки api/
// (на проде их запускает сам Vercel), чтобы админка и подпись Cloudinary
// работали локально без `vercel dev`. Серверные переменные (.env) попадают
// в process.env только dev-сервера. Если правишь api/_lib/*, перезапусти dev.
function apiDevPlugin(env) {
  return {
    name: 'osnova-api-dev',
    configureServer(server) {
      for (const [k, v] of Object.entries(env)) {
        if (process.env[k] === undefined) process.env[k] = v
      }

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost')
        const match = url.pathname.match(/^\/api\/([a-z0-9-]+)$/)
        if (!match) return next()

        const file = path.resolve(process.cwd(), 'api', `${match[1]}.js`)
        if (!fs.existsSync(file)) return next()

        try {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          const raw = Buffer.concat(chunks).toString('utf8')
          req.body = {}
          if (raw && (req.headers['content-type'] || '').includes('application/json')) {
            try {
              req.body = JSON.parse(raw)
            } catch {
              req.body = {}
            }
          }

          res.status = (code) => {
            res.statusCode = code
            return res
          }
          res.json = (data) => {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
          }

          const mod = await import(
            pathToFileURL(file).href + '?t=' + fs.statSync(file).mtimeMs
          )
          await mod.default(req, res)
        } catch (err) {
          console.error('[api-dev]', err)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: String(err?.message || err) }))
          }
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL
  const siteUrl = (env.VITE_SITE_URL || (vercelHost ? `https://${vercelHost}` : ''))
    .replace(/\/+$/, '')

  return {
    plugins: [react(), siteUrlPlugin(siteUrl), apiDevPlugin(env)],
    // В проде исходники через DevTools не восстанавливаются
    build: { sourcemap: false },
  }
})
