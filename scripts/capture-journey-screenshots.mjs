#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { mkdir, unlink } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const outDir = path.join(root, 'public', 'journey')
const port = 4321
const baseUrl = `http://127.0.0.1:${port}`

const shots = [
  { file: 'journey-1-add-vehicles.png', path: '/__journey__/vehicles' },
  { file: 'journey-2-log-bill.png', path: '/__journey__/visits/new' },
  {
    file: 'journey-3-review-invoice.png',
    path: '/__journey__/visits/00000000-0000-4000-8000-000000000004/review',
  },
  { file: 'journey-4-home-history.png', path: '/__journey__/' },
  { file: 'journey-5-search.png', path: '/__journey__/search' },
  { file: 'journey-6-compare-quote.png', path: '/__journey__/compare' },
  { file: 'journey-7-family.png', path: '/__journey__/household' },
]

const legacyFiles = [
  'journey-1-log-bill.png',
  'journey-2-review-invoice.png',
  'journey-3-home-history.png',
  'journey-4-compare-quote.png',
  'journey-5-compare-quote.png',
]

function waitForServer(url, timeoutMs = 60_000) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url)
        if (res.ok) return resolve()
      } catch {
        // retry
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Server did not start at ${url}`))
        return
      }
      setTimeout(tick, 400)
    }
    void tick()
  })
}

const preview = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(port)], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
})

try {
  await waitForServer(baseUrl)
  await mkdir(outDir, { recursive: true })

  for (const legacy of legacyFiles) {
    try {
      await unlink(path.join(outDir, legacy))
    } catch {
      // already removed
    }
  }

  const browser = await chromium.launch()
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  })

  for (const shot of shots) {
    await page.goto(`${baseUrl}${shot.path}`, { waitUntil: 'networkidle' })
    await page.evaluate(() => {
      localStorage.setItem('garage-log-theme', 'dark')
      document.documentElement.classList.add('dark')
    })
    await page.waitForTimeout(350)
    await page.screenshot({ path: path.join(outDir, shot.file) })
    console.log(`Saved ${shot.file}`)
  }

  await browser.close()
} finally {
  preview.kill('SIGTERM')
}
