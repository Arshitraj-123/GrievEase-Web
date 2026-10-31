/**
 * GrievEase Demo Recorder Presentation Layer Overlay
 * Injected into Playwright browser context via addInitScript.
 * Provides captions, animated cursor, focus highlights, watermark, and title cards.
 * Completely decoupled from production application code.
 */

export const DEMO_OVERLAY_INJECTION_SCRIPT = `
(function() {
  if (window.__GRIEVEASE_DEMO_OVERLAY_INITIALIZED) return;
  window.__GRIEVEASE_DEMO_OVERLAY_INITIALIZED = true;

  function initOverlay() {
    if (!document.body) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initOverlay, { once: true });
      }
      return;
    }
    if (document.getElementById('demo-caption-banner')) return;

    // 1. Inject Styles
    if (!document.getElementById('grievease-demo-overlay-styles')) {
      const style = document.createElement('style');
      style.id = 'grievease-demo-overlay-styles';
      style.innerHTML = \`
        #demo-watermark {
          position: fixed;
          top: 12px;
          right: 14px;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(8px);
          color: #94A3B8;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 9999px;
          padding: 4px 12px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          z-index: 2147483640;
          pointer-events: none;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        #demo-caption-banner {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          width: min(860px, calc(100vw - 32px));
          background: rgba(15, 23, 42, 0.92);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 16px;
          padding: 14px 20px;
          color: #FFFFFF;
          z-index: 2147483642;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
          display: flex;
          flex-direction: column;
          gap: 6px;
          pointer-events: none;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Devanagari", sans-serif;
          transition: opacity 0.25s ease, transform 0.25s ease;
        }

        #demo-caption-banner.hidden {
          opacity: 0;
          transform: translate(-50%, 15px);
        }

        #demo-caption-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .demo-scene-badge {
          background: #00B894;
          color: #0F172A;
          padding: 2px 8px;
          border-radius: 6px;
          font-weight: 800;
        }

        .demo-step-counter {
          color: #94A3B8;
        }

        #demo-caption-text {
          font-size: 15px;
          line-height: 1.45;
          font-weight: 500;
          color: #F8FAFC;
        }

        #demo-highlight-box {
          position: absolute;
          border: 2.5px solid #00B894;
          border-radius: 8px;
          background: rgba(0, 184, 148, 0.12);
          z-index: 2147483630;
          pointer-events: none;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          display: none;
        }

        #demo-cursor {
          position: fixed;
          width: 22px;
          height: 22px;
          pointer-events: none;
          z-index: 2147483647;
          transition: transform 0.08s ease-out;
          transform: translate(-2px, -2px);
          filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));
        }

        .demo-ripple {
          position: fixed;
          border-radius: 50%;
          border: 2px solid #00B894;
          pointer-events: none;
          z-index: 2147483646;
          animation: demoRippleAnim 0.5s ease-out forwards;
        }

        @keyframes demoRippleAnim {
          0% {
            width: 0px;
            height: 0px;
            opacity: 0.9;
            transform: translate(-50%, -50%) scale(0.5);
          }
          100% {
            width: 48px;
            height: 48px;
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.5);
          }
        }

        #demo-title-card {
          position: fixed;
          inset: 0;
          background: #0B1329;
          color: #FFFFFF;
          z-index: 2147483647;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 32px;
          transition: opacity 0.5s ease;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Devanagari", sans-serif;
        }

        #demo-title-card.fade-out {
          opacity: 0;
          pointer-events: none;
        }

        .demo-card-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(0, 184, 148, 0.15);
          border: 1px solid rgba(0, 184, 148, 0.4);
          color: #00B894;
          padding: 6px 14px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 20px;
        }

        .demo-card-title {
          font-size: clamp(28px, 4vw, 44px);
          font-weight: 800;
          color: #F8FAFC;
          margin-bottom: 12px;
          max-width: 800px;
          line-height: 1.2;
        }

        .demo-card-goal {
          font-size: clamp(15px, 2vw, 18px);
          color: #94A3B8;
          max-width: 650px;
          line-height: 1.5;
        }
      \`;
      (document.head || document.documentElement).appendChild(style);
    }

    // 2. Inject DOM Elements
    const watermark = document.createElement('div');
    watermark.id = 'demo-watermark';
    watermark.textContent = 'DEMO DATA';
    document.body.appendChild(watermark);

    const captionBanner = document.createElement('div');
    captionBanner.id = 'demo-caption-banner';
    captionBanner.innerHTML = \`
      <div id="demo-caption-header">
        <span class="demo-scene-badge" id="demo-scene-id">SCENE</span>
        <span class="demo-step-counter" id="demo-step-text">Step 1 of 5</span>
      </div>
      <div id="demo-caption-text">Initializing scene...</div>
    \`;
    document.body.appendChild(captionBanner);

    const highlightBox = document.createElement('div');
    highlightBox.id = 'demo-highlight-box';
    document.body.appendChild(highlightBox);

    const cursor = document.createElement('div');
    cursor.id = 'demo-cursor';
    cursor.innerHTML = \`
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M4 3L11.5 21L14.5 13.5L22 10.5L4 3Z" fill="#00B894" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/>
      </svg>
    \`;
    document.body.appendChild(cursor);
  }

  if (document.body) {
    initOverlay();
  } else {
    document.addEventListener('DOMContentLoaded', initOverlay, { once: true });
  }

  // Track mouse coordinates
  window.addEventListener('mousemove', (e) => {
    const cursor = document.getElementById('demo-cursor');
    if (cursor) {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    }
  });

  window.addEventListener('mousedown', (e) => {
    if (!document.body) return;
    const ripple = document.createElement('div');
    ripple.className = 'demo-ripple';
    ripple.style.left = e.clientX + 'px';
    ripple.style.top = e.clientY + 'px';
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 550);
  });

  // 3. Global Control API
  window.__updateDemoOverlay = function(sceneId, stepNum, totalSteps, caption) {
    initOverlay();
    const banner = document.getElementById('demo-caption-banner');
    const badge = document.getElementById('demo-scene-id');
    const stepText = document.getElementById('demo-step-text');
    const text = document.getElementById('demo-caption-text');

    if (banner && badge && stepText && text) {
      badge.textContent = sceneId;
      stepText.textContent = 'Step ' + stepNum + ' of ' + totalSteps;
      text.textContent = caption;
      banner.classList.remove('hidden');
    }
  };

  window.__highlightElement = function(selector) {
    initOverlay();
    const highlight = document.getElementById('demo-highlight-box');
    if (!highlight) return;

    if (!selector) {
      highlight.style.display = 'none';
      return;
    }

    try {
      const el = document.querySelector(selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        highlight.style.left = (rect.left + scrollX - 4) + 'px';
        highlight.style.top = (rect.top + scrollY - 4) + 'px';
        highlight.style.width = (rect.width + 8) + 'px';
        highlight.style.height = (rect.height + 8) + 'px';
        highlight.style.display = 'block';
      } else {
        highlight.style.display = 'none';
      }
    } catch (e) {
      highlight.style.display = 'none';
    }
  };

  window.__showSceneTitleCard = function(sceneId, title, role, goal) {
    initOverlay();
    return new Promise((resolve) => {
      if (!document.body) {
        resolve();
        return;
      }
      const card = document.createElement('div');
      card.id = 'demo-title-card';
      card.innerHTML = \`
        <div class="demo-card-badge">
          <span>\${sceneId}</span> • <span>\${role}</span>
        </div>
        <h1 class="demo-card-title">\${title}</h1>
        <p class="demo-card-goal">\${goal}</p>
      \`;
      document.body.appendChild(card);

      setTimeout(() => {
        card.classList.add('fade-out');
        setTimeout(() => {
          card.remove();
          resolve();
        }, 500);
      }, 1600);
    });
  };
})();
`;
