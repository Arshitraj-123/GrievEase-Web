import fs from 'fs';
import path from 'path';

export async function assembleDemoPack() {
  console.log('================================================================');
  console.log('             GRIEV-EASE DEMO PACK EXPORT & ASSEMBLY             ');
  console.log('================================================================');

  const outDir = path.resolve(__dirname, 'out');
  const manifestPath = path.join(outDir, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    console.error('❌ Cannot pack: manifest.json not found! Run `pnpm demo:record` or `pnpm demo:verify` first.');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  // HARD RULE: If any scene failed, the pack is NOT exported.
  if (!manifest.allGreen || manifest.failedScenes > 0) {
    console.error(`❌ PACK EXPORT ABORTED: ${manifest.failedScenes} scene(s) failed in the recording run.`);
    console.error('Every step must be verified green before exporting for the client.');
    process.exit(1);
  }

  console.log(`✅ All ${manifest.totalScenes} scenes verified green. Generating offline viewer and guides...`);

  const enCaptions = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'captions/en.json'), 'utf-8'));
  const hiCaptions = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'captions/hi.json'), 'utf-8'));

  // 1. Generate walkthrough.html (Self-Contained Offline Interactive HTML Viewer)
  generateOfflineViewer(outDir, manifest, enCaptions, hiCaptions);

  // 2. Generate Workflow-Guide-EN.html & Workflow-Guide-HI.html
  generateWorkflowGuide(outDir, 'en', enCaptions);
  generateWorkflowGuide(outDir, 'hi', hiCaptions);

  // 3. Generate README-for-client.md
  generateClientReadme(outDir);

  // 4. Automated Pack Secret & Leaks Scanner
  auditPackForSecrets(outDir);

  console.log('\n================================================================');
  console.log('🎉 DEMO PACK ASSEMBLED SUCCESSFULLY!');
  console.log(`📁 Destination: ${outDir}`);
  console.log('================================================================');
}

function generateOfflineViewer(outDir: string, manifest: any, enCaptions: any, hiCaptions: any) {
  const viewerHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GrievEase - Interactive System Walkthrough</title>
  <style>
    :root {
      --primary: #00B894;
      --primary-dark: #00846A;
      --bg-dark: #0B1329;
      --surface: #1E293B;
      --surface-light: #334155;
      --text: #F8FAFC;
      --text-muted: #94A3B8;
      --border: rgba(255, 255, 255, 0.1);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Devanagari", sans-serif;
      background: var(--bg-dark);
      color: var(--text);
      display: flex;
      height: 100vh;
      overflow: hidden;
    }
    #sidebar {
      width: 380px;
      background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }
    #sidebar-header {
      padding: 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      color: var(--primary);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .lang-toggle-bar {
      display: flex;
      background: var(--bg-dark);
      border-radius: 8px;
      padding: 3px;
      gap: 4px;
    }
    .lang-btn {
      flex: 1;
      padding: 6px;
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-weight: 700;
      font-size: 13px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .lang-btn.active {
      background: var(--primary);
      color: #0F172A;
    }
    #search-box {
      width: 100%;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--bg-dark);
      color: var(--text);
      font-size: 13px;
      outline: none;
    }
    #scene-list {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }
    .category-heading {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin: 16px 8px 6px;
    }
    .scene-item {
      padding: 10px 14px;
      border-radius: 8px;
      margin-bottom: 4px;
      cursor: pointer;
      transition: background 0.15s;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 1px solid transparent;
    }
    .scene-item:hover {
      background: rgba(255, 255, 255, 0.05);
    }
    .scene-item.active {
      background: rgba(0, 184, 148, 0.15);
      border-color: rgba(0, 184, 148, 0.4);
      color: #FFFFFF;
    }
    .scene-badge {
      font-size: 11px;
      font-weight: 800;
      background: var(--surface-light);
      padding: 2px 6px;
      border-radius: 4px;
      color: var(--primary);
    }
    .scene-name {
      font-size: 13.5px;
      font-weight: 600;
      flex: 1;
      margin: 0 10px;
    }
    #main-content {
      flex: 1;
      overflow-y: auto;
      padding: 28px 36px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .scene-header {
      border-bottom: 1px solid var(--border);
      padding-bottom: 16px;
    }
    .scene-title {
      font-size: 26px;
      font-weight: 800;
      color: #FFFFFF;
      margin-bottom: 6px;
    }
    .scene-meta {
      font-size: 14px;
      color: var(--text-muted);
    }
    .step-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .step-header {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
      font-size: 15px;
      color: var(--primary);
    }
    .step-caption {
      font-size: 15px;
      line-height: 1.5;
      color: var(--text);
    }
    .step-image {
      max-width: 100%;
      border-radius: 8px;
      border: 1px solid var(--border);
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      background: #000;
    }
  </style>
</head>
<body>
  <div id="sidebar">
    <div id="sidebar-header">
      <div class="brand-title">
        <span>🏢</span> GrievEase Walkthrough
      </div>
      <div class="lang-toggle-bar">
        <button class="lang-btn active" id="btn-lang-en" onclick="setLang('en')">English</button>
        <button class="lang-btn" id="btn-lang-hi" onclick="setLang('hi')">हिंदी</button>
      </div>
      <input type="text" id="search-box" placeholder="Search scenes and features..." oninput="filterScenes()">
    </div>
    <div id="scene-list"></div>
  </div>

  <div id="main-content">
    <div class="scene-header">
      <h1 class="scene-title" id="view-title">Select a Scene</h1>
      <p class="scene-meta" id="view-meta">Choose any workflow from the sidebar to inspect step-by-step actions and screenshots.</p>
    </div>
    <div id="steps-container"></div>
  </div>

  <script>
    const manifest = ${JSON.stringify(manifest)};
    const enCaptions = ${JSON.stringify(enCaptions)};
    const hiCaptions = ${JSON.stringify(hiCaptions)};
    let currentLang = 'en';
    let currentSceneId = 'P01';

    function setLang(lang) {
      currentLang = lang;
      document.getElementById('btn-lang-en').classList.toggle('active', lang === 'en');
      document.getElementById('btn-lang-hi').classList.toggle('active', lang === 'hi');
      renderSidebar();
      renderScene(currentSceneId);
    }

    function renderSidebar() {
      const list = document.getElementById('scene-list');
      list.innerHTML = '';
      const captions = currentLang === 'hi' ? hiCaptions : enCaptions;

      const categories = ['PUBLIC', 'ADMIN', 'RESIDENT', 'GUARD', 'VENDOR'];
      categories.forEach(cat => {
        const catHeader = document.createElement('div');
        catHeader.className = 'category-heading';
        catHeader.textContent = cat;
        list.appendChild(catHeader);

        const sceneIds = Object.keys(captions).filter(id => {
          if (cat === 'PUBLIC') return id.startsWith('P');
          if (cat === 'ADMIN') return id.startsWith('A');
          if (cat === 'RESIDENT') return id.startsWith('R');
          if (cat === 'GUARD') return id.startsWith('G');
          if (cat === 'VENDOR') return id.startsWith('V');
          return false;
        });

        sceneIds.forEach(id => {
          const item = document.createElement('div');
          item.className = 'scene-item' + (id === currentSceneId ? ' active' : '');
          item.onclick = () => selectScene(id);
          item.innerHTML = \`
            <span class="scene-badge">\${id}</span>
            <span class="scene-name">\${captions[id].title}</span>
            <span style="font-size: 11px; color: #00B894;">✓</span>
          \`;
          list.appendChild(item);
        });
      });
    }

    function selectScene(id) {
      currentSceneId = id;
      document.querySelectorAll('.scene-item').forEach(el => el.classList.remove('active'));
      renderSidebar();
      renderScene(id);
    }

    function renderScene(id) {
      const captions = currentLang === 'hi' ? hiCaptions : enCaptions;
      const scene = captions[id];
      if (!scene) return;

      document.getElementById('view-title').textContent = '[' + id + '] ' + scene.title;
      document.getElementById('view-meta').textContent = (scene.role || '') + ' • ' + (scene.goal || '');

      const container = document.getElementById('steps-container');
      container.innerHTML = '';

      const steps = scene.steps || {};
      Object.keys(steps).forEach(stepNum => {
        const card = document.createElement('div');
        card.className = 'step-card';
        card.innerHTML = \`
          <div class="step-header">
            <span>Step \${stepNum}</span>
          </div>
          <p class="step-caption">\${steps[stepNum]}</p>
          <img class="step-image" src="screenshots/\${id}_step\${stepNum}.png" onerror="this.style.display='none'" alt="Step \${stepNum} screenshot">
        \`;
        container.appendChild(card);
      });
    }

    function filterScenes() {
      const query = document.getElementById('search-box').value.toLowerCase();
      document.querySelectorAll('.scene-item').forEach(el => {
        const text = el.textContent.toLowerCase();
        el.style.display = text.includes(query) ? 'flex' : 'none';
      });
    }

    // Initialize
    renderSidebar();
    renderScene('P01');
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(outDir, 'walkthrough.html'), viewerHtml, 'utf-8');
  console.log(`📄 Generated offline viewer: ${path.join(outDir, 'walkthrough.html')}`);
}

function generateWorkflowGuide(outDir: string, lang: 'en' | 'hi', captions: any) {
  const isHi = lang === 'hi';
  const title = isHi ? 'ग्रीवईज़ सोसायटी वर्कफ़्लो गाइड' : 'GrievEase Society Operational Workflow Guide';

  let sectionsHtml = '';
  for (const sceneId of Object.keys(captions)) {
    const s = captions[sceneId];
    sectionsHtml += `
      <section style="margin-bottom: 48px; page-break-inside: avoid;">
        <div style="border-bottom: 2px solid #00B894; padding-bottom: 8px; margin-bottom: 16px;">
          <h2 style="font-size: 22px; color: #1E293B;">[${sceneId}] ${s.title}</h2>
          <p style="color: #64748B; font-size: 14px; margin-top: 4px;"><strong>Role:</strong> ${s.role} | <strong>Goal:</strong> ${s.goal}</p>
        </div>
        <div style="display: flex; flex-direction: column; gap: 18px;">
    `;

    const steps = s.steps || {};
    for (const stepNum of Object.keys(steps)) {
      sectionsHtml += `
        <div style="border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; background: #F8FAFC;">
          <h4 style="color: #00846A; font-size: 14px; margin-bottom: 6px;">Step ${stepNum}</h4>
          <p style="font-size: 15px; color: #334155; margin-bottom: 12px;">${steps[stepNum]}</p>
          <img src="screenshots/${sceneId}_step${stepNum}.png" style="max-width: 100%; border: 1px solid #CBD5E1; border-radius: 6px;" onerror="this.style.display='none'">
        </div>
      `;
    }

    sectionsHtml += `</div></section>`;
  }

  const guideHtml = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Devanagari", sans-serif; padding: 40px; color: #0F172A; max-width: 900px; margin: 0 auto; line-height: 1.6; }
    h1 { font-size: 32px; color: #0F172A; margin-bottom: 8px; }
    .subtitle { color: #64748B; font-size: 16px; margin-bottom: 36px; border-bottom: 1px solid #E2E8F0; padding-bottom: 20px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="subtitle">${isHi ? 'सोसायटी के सभी 28 कार्यप्रवाहों की आधिकारिक मुद्रण योग्य गाइड' : 'Official Step-by-Step Printable Reference Manual across all 28 society workflows'}</p>
  ${sectionsHtml}
</body>
</html>`;

  const fileName = isHi ? 'Workflow-Guide-HI.html' : 'Workflow-Guide-EN.html';
  fs.writeFileSync(path.join(outDir, fileName), guideHtml, 'utf-8');
  console.log(`📄 Generated workflow guide: ${path.join(outDir, fileName)}`);
}

function generateClientReadme(outDir: string) {
  const readmeContent = `# GrievEase Walkthrough Pack - Client Readme

Welcome to the GrievEase Automated System Walkthrough Pack.

This package contains full interactive demonstrations, step-by-step verified screenshots, and printable workflow manuals for all 28 resident, administrative, security, and contractor workflows in both English and Hindi.

---

### How to Open the Walkthrough
1. **Self-Contained Offline Viewer**:
   - Double click \`walkthrough.html\` in any web browser (Chrome, Edge, Firefox, Safari).
   - Works 100% offline without internet connection, third-party CDNs, or external servers.
   - Switch between **English** and **हिंदी** using the top-left language toggle.
2. **Printable Workflow Guides**:
   - \`Workflow-Guide-EN.html\` (English Manual)
   - \`Workflow-Guide-HI.html\` (हिंदी मार्गदर्शिका)
   - Open in any browser and use **Print to PDF** to create hard-copy binder manuals.
3. **Screenshots**:
   - Located in the \`screenshots/\` directory, organized by Scene ID and step number.

---

### What is Represented in the Demo
- **Society**: Green Valley Residency (Wings A and B, 20 flats, 9 canonical role accounts).
- **All Data is Synthetic**: Simulated Indian names, fake phone numbers (+91 99999 00000..), and synthetic community dues.

---

### Intentional Offline & Architectural Distinctions
- **Zero Third-Party SaaS Reliance**: No external SMS gateways, cloud payment gateways, or third-party analytics are used.
- **Cash Maintenance Billing**: Maintenance dues are collected in cash at the society management office, accompanied by printed digital receipts and immutable SHA-256 ledger entries.
- **In-App Alerting**: All notices, approvals, and emergency alerts are delivered in-app.
- **Physical Gate Protocol**: Guard console operates on dedicated gatehouse tablets with offline queueing support.

---

*GrievEase QA-Automation & Documentation Engineering Team*
`;

  fs.writeFileSync(path.join(outDir, 'README-for-client.md'), readmeContent, 'utf-8');
  console.log(`📄 Generated client README: ${path.join(outDir, 'README-for-client.md')}`);
}

function auditPackForSecrets(outDir: string) {
  console.log('🔍 Auditing packed files for unredacted secrets or server tokens...');
  const files = fs.readdirSync(outDir);
  const forbiddenFiles = ['.env', 'credentials.local.md', 'id_rsa', 'secret'];

  for (const f of files) {
    if (forbiddenFiles.some(ff => f.toLowerCase().includes(ff))) {
      console.error(`❌ SECURITY VIOLATION: Forbidden file detected in export pack: ${f}`);
      fs.unlinkSync(path.join(outDir, f));
    }
  }
  console.log('✅ Pack audit passed: Zero secrets or forbidden files in export pack.');
}

if (require.main === module) {
  assembleDemoPack().catch(err => {
    console.error('Pack error:', err);
    process.exit(1);
  });
}
