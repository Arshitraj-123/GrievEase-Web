const fs = require('fs');
const path = require('path');

const nextDir = path.resolve(__dirname, '..', '.next');
const prerenderPath = path.join(nextDir, 'prerender-manifest.json');
const previewPropsPath = path.join(nextDir, 'server', 'preview-props.json');
const routesManifestPath = path.join(nextDir, 'routes-manifest.json');

// 1. Ensure server/preview-props.json exists
if (fs.existsSync(prerenderPath)) {
  try {
    const prerender = JSON.parse(fs.readFileSync(prerenderPath, 'utf-8'));
    if (prerender.preview && !fs.existsSync(previewPropsPath)) {
      fs.mkdirSync(path.dirname(previewPropsPath), { recursive: true });
      fs.writeFileSync(previewPropsPath, JSON.stringify(prerender.preview, null, 2), 'utf-8');
      console.log('✓ Generated server/preview-props.json for Next.js production server.');
    }
  } catch (err) {
    console.warn('⚠️ Could not generate preview-props.json:', err.message);
  }
}

// 2. Ensure routes-manifest.json has onMatchHeaders: []
if (fs.existsSync(routesManifestPath)) {
  try {
    const routes = JSON.parse(fs.readFileSync(routesManifestPath, 'utf-8'));
    if (!routes.onMatchHeaders) {
      routes.onMatchHeaders = [];
      fs.writeFileSync(routesManifestPath, JSON.stringify(routes, null, 2), 'utf-8');
      console.log('✓ Injected onMatchHeaders: [] into routes-manifest.json.');
    }
  } catch (err) {
    console.warn('⚠️ Could not update routes-manifest.json:', err.message);
  }
}
