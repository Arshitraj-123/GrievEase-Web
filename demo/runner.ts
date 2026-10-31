import { chromium, Browser, BrowserContext, Page } from '@playwright/test';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { ALL_SCENES, SceneDefinition } from './scenes';
import { DEMO_OVERLAY_INJECTION_SCRIPT } from './recorder/overlay';
import { runDemoSeed } from './seed/demo-seed';

interface RunnerOptions {
  sceneId?: string;
  role?: string;
  lang: 'en' | 'hi' | 'both';
  isVerify: boolean;
  isRecord: boolean;
  fast: boolean;
}

function parseArgs(): RunnerOptions {
  const args = process.argv.slice(2);
  let sceneId: string | undefined;
  let role: string | undefined;
  let lang: 'en' | 'hi' | 'both' = 'en';
  let isVerify = false;
  let isRecord = false;
  let fast = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--scene' && args[i + 1]) {
      sceneId = args[++i].toUpperCase();
    } else if (args[i] === '--role' && args[i + 1]) {
      role = args[++i].toUpperCase();
    } else if (args[i] === '--lang' && args[i + 1]) {
      lang = args[++i].toLowerCase() as any;
    } else if (args[i] === '--verify') {
      isVerify = true;
    } else if (args[i] === '--record' || args[i] === '--all') {
      isRecord = true;
    } else if (args[i] === '--fast') {
      fast = true;
    }
  }

  // Default to verify if neither record nor verify is explicitly passed
  if (!isRecord && !isVerify) {
    isVerify = true;
  }

  return { sceneId, role, lang, isVerify, isRecord, fast };
}

function assertDemoSafety() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: Refusing to run demo runner when NODE_ENV=production!');
  }
  if (process.env.DEMO_MODE !== 'true') {
    throw new Error('FATAL: Refusing to start demo runner: DEMO_MODE must be set to true.');
  }

  const dbUrl = process.env.DATABASE_URL || '';
  if (!dbUrl.includes('_demo') && process.env.ALLOW_DEMO_SEED_ON_DEV !== 'true') {
    throw new Error(`FATAL: Database name must end with '_demo' to protect production data. Current: ${dbUrl}`);
  }

  const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3000';
  if (!baseUrl.includes('localhost') && !baseUrl.includes('127.0.0.1') && !baseUrl.includes('demo')) {
    throw new Error(`FATAL: Base URL must be localhost or allow-listed demo host. Current: ${baseUrl}`);
  }
}

async function checkServer(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
    return res.status < 500;
  } catch {
    return false;
  }
}

async function ensureServerRunning(baseUrl: string): Promise<() => void> {
  const isUp = await checkServer(baseUrl);
  if (isUp) {
    console.log(`🌐 Application server is already active at ${baseUrl}`);
    return () => {};
  }

  console.log(`🚀 Starting web application server at ${baseUrl}...`);
  const rootDir = path.resolve(__dirname, '..');
  const nextBin = require.resolve('next/dist/bin/next');

  const u = new URL(baseUrl);
  const host = u.hostname;
  const port = u.port || '3000';

  const child = spawn(process.execPath, [nextBin, 'start', '-H', host, '-p', port], {
    cwd: path.resolve(rootDir, 'apps/web'),
    env: { ...process.env, PORT: port },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stderr?.on('data', (d) => {
    const msg = d.toString().trim();
    if (!msg.includes('ExperimentalWarning')) {
      console.error('[Next.js]', msg);
    }
  });

  const start = Date.now();
  let reachable = false;
  while (Date.now() - start < 30000) {
    await new Promise((r) => setTimeout(r, 600));
    if (await checkServer(baseUrl)) {
      reachable = true;
      break;
    }
  }

  if (!reachable) {
    child.kill();
    throw new Error(`Failed to start web server at ${baseUrl} within 30 seconds.`);
  }

  console.log(`✅ Web application server is ready at ${baseUrl}!`);

  return () => {
    console.log('🛑 Stopping web application server...');
    child.kill();
  };
}

export async function main() {
  const opts = parseArgs();
  console.log('================================================================');
  console.log('         GRIEV-EASE AUTOMATED DEMO RECORDING & VERIFICATION     ');
  console.log('================================================================');
  console.log(`Mode: ${opts.isVerify ? 'FAST VERIFY (Headless CI)' : 'FULL RECORDING'}`);
  console.log(`Language: ${opts.lang}`);
  if (opts.fast) console.log('Option: Fast pacing enabled');
  if (opts.sceneId) console.log(`Filter Scene: ${opts.sceneId}`);
  if (opts.role) console.log(`Filter Role: ${opts.role}`);

  assertDemoSafety();

  // Reset database before execution to guarantee deterministic baseline
  console.log('\n▶ Resetting demo database snapshot...');
  await runDemoSeed();

  const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3000';
  const outDir = path.resolve(__dirname, 'out');
  const videosDir = path.join(outDir, 'videos');
  const screenshotsDir = path.join(outDir, 'screenshots');

  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(videosDir, { recursive: true });
  fs.mkdirSync(screenshotsDir, { recursive: true });

  const enCaptions = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'captions/en.json'), 'utf-8'));
  const hiCaptions = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'captions/hi.json'), 'utf-8'));

  // Filter scenes
  let targetScenes = ALL_SCENES;
  if (opts.sceneId) {
    targetScenes = targetScenes.filter((s) => s.id === opts.sceneId);
  } else if (opts.role) {
    targetScenes = targetScenes.filter((s) => s.category.toLowerCase() === opts.role?.toLowerCase());
  }

  if (targetScenes.length === 0) {
    console.error('❌ No scenes matched filter criteria!');
    process.exit(1);
  }

  console.log(`Found ${targetScenes.length} scenes to execute.`);

  // Ensure server is up
  const stopServer = await ensureServerRunning(baseUrl);

  const languagesToRun: ('en' | 'hi')[] = opts.lang === 'both' ? ['en', 'hi'] : [opts.lang as 'en' | 'hi'];
  const manifestResults: any[] = [];
  let totalFailed = 0;

  const browser: Browser = await chromium.launch({
    headless: true,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--disable-web-security',
      '--allow-file-access-from-files',
    ],
  });

  try {
    for (const lang of languagesToRun) {
      console.log(`\n────────────────────────────────────────────────────────────────`);
      console.log(`  EXECUTING SUITE IN LANGUAGE: ${lang.toUpperCase()}`);
      console.log(`────────────────────────────────────────────────────────────────`);

      const captionsDict = lang === 'hi' ? hiCaptions : enCaptions;

      for (const scene of targetScenes) {
        console.log(`\n▶ [${scene.id}] ${scene.title} (${scene.role}) [${lang.toUpperCase()}]`);

        const sceneVideoDir = path.join(videosDir, lang, scene.category.toLowerCase());
        fs.mkdirSync(sceneVideoDir, { recursive: true });

        const context: BrowserContext = await browser.newContext({
          viewport: { width: scene.viewport.width, height: scene.viewport.height },
          isMobile: scene.viewport.isMobile || false,
          hasTouch: scene.viewport.isMobile || false,
          recordVideo: opts.isRecord ? { dir: sceneVideoDir, size: { width: scene.viewport.width, height: scene.viewport.height } } : undefined,
          baseURL: baseUrl,
          permissions: ['geolocation'],
          geolocation: { latitude: 19.033, longitude: 73.0297 }, // Navi Mumbai demo coordinates
        });

        await context.addInitScript(DEMO_OVERLAY_INJECTION_SCRIPT);

        // Fulfill API requests deterministically so front-end renders all cards & graphs cleanly
        await context.route('**/*', async (route) => {
          const req = route.request();
          const url = req.url();

          // Let Next.js assets, pages and static files pass through
          if (url.includes('127.0.0.1:3000') || url.includes('localhost:3000')) {
            return route.continue();
          }

          // Mock API endpoints
          if (url.includes('/consent')) {
            return route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                accepted: true,
                version: '2026.1',
                consentedAt: new Date().toISOString(),
              }),
            });
          }

          if (url.includes('/transparency') || url.includes('/analytics')) {
            return route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                totalRaised: 184,
                resolvedCount: 179,
                avgResolutionHours: 28,
                escalationBreakdown: { L1: 120, L2: 45, L3: 14, L4: 5 },
                satisfactionScore: 4.8,
              }),
            });
          }

          if (url.includes('/auth/login') || url.includes('/login')) {
            return route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                accessToken: 'mock_demo_jwt_token',
                user: { id: 'usr_demo_1', username: 'resident.rohan', role: 'RESIDENT', name: 'Rohan Mehra' },
              }),
            });
          }

          if (url.includes('/grievances')) {
            return route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                items: [
                  { id: 'GRV-2026-001', publicId: 'GRV-2026-001', title: 'Corridor pipeline seepage', status: 'IN_PROGRESS', level: 2, createdAt: new Date().toISOString() },
                ],
                total: 1,
              }),
            });
          }

          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: [] }),
          });
        });

        const page: Page = await context.newPage();
        const startTime = Date.now();
        let pass = false;
        let errorMessage = '';

        const consoleErrors: string[] = [];
        page.on('pageerror', (err) => consoleErrors.push(err.message));
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            const txt = msg.text();
            console.log('  [BROWSER ERROR]:', txt, msg.location().url || '');
            if (!txt.includes('favicon.ico') && !txt.includes('DevTools') && !txt.includes('net::ERR_CONNECTION_REFUSED') && !txt.includes('Failed to load resource')) {
              consoleErrors.push(txt);
            }
          }
        });

        try {
          // Execute Scene
          await scene.run({
            page,
            lang,
            captions: captionsDict,
            baseUrl,
          });

          await page.waitForTimeout(300);

          if (consoleErrors.length > 0) {
            throw new Error(`Quality Gate Failure: Page threw ${consoleErrors.length} console errors: ${consoleErrors[0]}`);
          }

          pass = true;
          console.log(`  ✅ ${scene.id} PASSED cleanly (${((Date.now() - startTime) / 1000).toFixed(1)}s)`);
        } catch (err: any) {
          errorMessage = err.message;
          console.error(`  ❌ ${scene.id} FAILED: ${err.message}`);
          totalFailed++;
        } finally {
          const durationSec = Math.round((Date.now() - startTime) / 1000);
          const video = page.video();
          await page.close();
          await context.close();

          let videoPath: string | null = null;
          if (video && opts.isRecord) {
            try {
              const originalPath = await video.path();
              const finalName = `${scene.id}-${scene.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.webm`;
              videoPath = path.join(sceneVideoDir, finalName);
              fs.copyFileSync(originalPath, videoPath);

              // Generate WebVTT & SRT subtitle files
              generateSubtitles(scene.id, captionsDict[scene.id]?.steps || {}, sceneVideoDir, finalName.replace('.webm', ''));
            } catch (vErr) {
              // Video save fallback
            }
          }

          manifestResults.push({
            id: scene.id,
            title: scene.title,
            role: scene.role,
            category: scene.category,
            language: lang,
            durationSeconds: durationSec,
            status: pass ? 'PASS' : 'FAIL',
            error: errorMessage || undefined,
            videoFile: videoPath ? path.relative(outDir, videoPath) : undefined,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }
  } finally {
    await browser.close();
    stopServer();
  }

  // Write manifest.json
  const manifestPath = path.join(outDir, 'manifest.json');
  const manifestData = {
    generatedAt: new Date().toISOString(),
    totalScenes: targetScenes.length * languagesToRun.length,
    passedScenes: manifestResults.filter((r) => r.status === 'PASS').length,
    failedScenes: totalFailed,
    allGreen: totalFailed === 0,
    scenes: manifestResults,
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2), 'utf-8');
  console.log(`\n================================================================`);
  console.log(`Execution Summary: ${manifestData.passedScenes}/${manifestData.totalScenes} Passed.`);
  console.log(`Manifest written to: ${manifestPath}`);

  if (totalFailed > 0) {
    console.error('❌ Demo verification failed. Correct failing steps before packing.');
    process.exit(1);
  } else {
    console.log('🎉 ALL SCENES PASSED CLEANLY! Ready for demo:pack.');
    process.exit(0);
  }
}

function generateSubtitles(sceneId: string, steps: Record<string, string>, outDir: string, baseName: string) {
  const stepKeys = Object.keys(steps);
  if (stepKeys.length === 0) return;

  const vttLines = ['WEBVTT\n'];
  const srtLines: string[] = [];

  let currentSec = 2; // start after title card
  const stepDuration = 3; // 3 seconds per step caption

  stepKeys.forEach((key, idx) => {
    const startS = currentSec;
    const endS = currentSec + stepDuration;
    currentSec = endS + 1;

    const startVtt = formatTimeVtt(startS);
    const endVtt = formatTimeVtt(endS);
    const startSrt = formatTimeSrt(startS);
    const endSrt = formatTimeSrt(endS);

    const caption = steps[key] || '';

    // VTT
    vttLines.push(`${startVtt} --> ${endVtt}`);
    vttLines.push(`Step ${key}: ${caption}\n`);

    // SRT
    srtLines.push(`${idx + 1}`);
    srtLines.push(`${startSrt} --> ${endSrt}`);
    srtLines.push(`Step ${key}: ${caption}\n`);
  });

  fs.writeFileSync(path.join(outDir, `${baseName}.vtt`), vttLines.join('\n'), 'utf-8');
  fs.writeFileSync(path.join(outDir, `${baseName}.srt`), srtLines.join('\n'), 'utf-8');
}

function formatTimeVtt(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `00:${m}:${s}.000`;
}

function formatTimeSrt(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `00:${m}:${s},000`;
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Fatal runner error:', err);
    process.exit(1);
  });
}
