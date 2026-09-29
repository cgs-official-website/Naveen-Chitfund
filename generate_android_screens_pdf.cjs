const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_HTML = path.join(__dirname, 'android_screens_catalog.html');
const OUTPUT_PDF = path.join(__dirname, 'Naveen_ChitFund_Android_Screens.pdf');

// HTML generator with all 12 screens in Light and Dark modes inside Android mockup frames
function generateHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Naveen Chit Fund - Android App Screens Design Catalog</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --font-main: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-display: 'Plus Jakarta Sans', sans-serif;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: var(--font-main);
      background: #0f1117;
      color: #e2e8f0;
      line-height: 1.4;
      font-size: 13px;
    }

    @page {
      size: A4 landscape;
      margin: 0;
    }

    .page {
      width: 297mm;
      height: 209mm;
      page-break-after: always;
      position: relative;
      background: #0f1117;
      overflow: hidden;
      padding: 12mm 16mm;
      display: flex;
      flex-direction: column;
    }

    /* Cover Page */
    .cover-page {
      background: radial-gradient(circle at 80% 20%, #4e1327 0%, #160c10 60%, #0c0709 100%);
      color: #fff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 20mm 24mm;
    }

    .cover-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: rgba(201, 162, 39, 0.15);
      border: 1px solid rgba(201, 162, 39, 0.4);
      border-radius: 999px;
      color: #e3c567;
      font-weight: 600;
      font-size: 12px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      width: fit-content;
    }

    .cover-title {
      font-family: var(--font-display);
      font-size: 42px;
      font-weight: 800;
      letter-spacing: -0.5px;
      line-height: 1.15;
      color: #ffffff;
      margin-top: 14px;
    }

    .cover-title span {
      background: linear-gradient(135deg, #e3c567, #c9a227, #fef08a);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .cover-subtitle {
      font-size: 17px;
      color: #c9b8be;
      margin-top: 14px;
      max-width: 650px;
      line-height: 1.5;
    }

    .cover-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin: 24px 0;
    }

    .cover-stat {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 14px 18px;
    }

    .cover-stat-val {
      font-size: 24px;
      font-weight: 700;
      color: #e3c567;
      font-family: var(--font-display);
    }

    .cover-stat-lbl {
      font-size: 11px;
      color: #a0aec0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 4px;
    }

    .cover-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 14px;
      color: #8a777e;
      font-size: 11px;
    }

    /* Page Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 8px;
    }

    .page-title-box {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .screen-num {
      background: linear-gradient(135deg, #7a1f3d, #4e1327);
      border: 1px solid rgba(201, 162, 39, 0.35);
      color: #e3c567;
      font-weight: 800;
      font-size: 13px;
      padding: 4px 10px;
      border-radius: 8px;
      letter-spacing: 0.5px;
    }

    .screen-title {
      font-family: var(--font-display);
      font-size: 19px;
      font-weight: 700;
      color: #fff;
    }

    .screen-category {
      font-size: 11px;
      color: #c9a227;
      background: rgba(201, 162, 39, 0.12);
      border: 1px solid rgba(201, 162, 39, 0.25);
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 600;
    }

    .screen-desc {
      color: #94a3b8;
      font-size: 12px;
      max-width: 520px;
      line-height: 1.35;
    }

    /* Main Content Layout: Side-by-side Light & Dark Phones */
    .screen-spread {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 40px;
      padding: 4px 0;
    }

    .phone-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .phone-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .phone-label.light { color: #f59e0b; }
    .phone-label.dark { color: #a78bfa; }

    /* Modern Android Phone Mockup (Scale-friendly) */
    .android-phone {
      width: 258px;
      height: 524px;
      border-radius: 36px;
      padding: 8px;
      position: relative;
      box-shadow: 0 16px 36px -8px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.12);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .android-phone.frame-light {
      background: linear-gradient(145deg, #2b2d35, #17181d);
      border: 2.5px solid #4a4e5e;
    }

    .android-phone.frame-dark {
      background: linear-gradient(145deg, #1f1b24, #0f0c13);
      border: 2.5px solid #443b4f;
    }

    .screen-inner {
      flex: 1;
      border-radius: 28px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
      font-size: 10px;
    }

    /* Themes inside screen */
    .screen-inner.theme-light {
      background: #FFFDF9;
      color: #241016;
    }

    .screen-inner.theme-dark {
      background: #160C10;
      color: #F5EDE7;
    }

    /* Android Status Bar */
    .status-bar {
      height: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 14px;
      font-size: 9px;
      font-weight: 700;
      z-index: 10;
      position: relative;
      flex-shrink: 0;
    }

    .camera-punch {
      position: absolute;
      left: 50%;
      top: 5px;
      transform: translateX(-50%);
      width: 8px;
      height: 8px;
      background: #000;
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.15);
      z-index: 20;
    }

    .status-icons {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Android Pill Nav Bar */
    .nav-bar-pill {
      height: 14px;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-shrink: 0;
      z-index: 10;
    }

    .nav-bar-pill .pill {
      width: 64px;
      height: 3px;
      border-radius: 3px;
    }

    .theme-light .nav-bar-pill .pill { background: #241016; opacity: 0.35; }
    .theme-dark .nav-bar-pill .pill { background: #F5EDE7; opacity: 0.35; }

    /* Screen UI Components */
    .screen-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: 6px 10px;
      position: relative;
    }

    .screen-header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0 8px 0;
    }

    .brand-title {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 13px;
      color: #7A1F3D;
    }
    .theme-dark .brand-title { color: #E3C567; }

    /* Reusable UI Elements */
    .card {
      border-radius: 12px;
      padding: 9px 10px;
      margin-bottom: 8px;
      position: relative;
    }

    .theme-light .card {
      background: #FBF3E7;
      border: 1px solid #E8DCCE;
    }

    .theme-dark .card {
      background: #241620;
      border: 1px solid #3D2837;
    }

    .theme-light .card-subtle {
      background: #F5EBDD;
      border: 1px solid #E8DCCE;
    }

    .theme-dark .card-subtle {
      background: #2E1D2A;
      border: 1px solid #3D2837;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .badge-gold {
      background: #FAF3DC;
      color: #926C00;
      border: 0.5px solid #C9A227;
    }
    .theme-dark .badge-gold {
      background: #2E2611;
      color: #E3C567;
      border: 0.5px solid #D6A429;
    }

    .badge-success {
      background: #E9F5EE;
      color: #2E7D4F;
    }
    .theme-dark .badge-success {
      background: #14291D;
      color: #3AA76D;
    }

    .badge-maroon {
      background: #F4E8EC;
      color: #7A1F3D;
    }
    .theme-dark .badge-maroon {
      background: #381522;
      color: #E87498;
    }

    .btn-primary {
      background: linear-gradient(135deg, #7A1F3D, #4E1327);
      color: #FFF;
      border: none;
      border-radius: 8px;
      padding: 7px 12px;
      font-size: 10px;
      font-weight: 700;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      box-shadow: 0 2px 5px rgba(122, 31, 61, 0.3);
    }
    .theme-dark .btn-primary {
      background: linear-gradient(135deg, #B8446B, #7A1F3D);
    }

    .btn-gold {
      background: linear-gradient(135deg, #D4AF37, #C9A227);
      color: #241016;
      border: none;
      border-radius: 8px;
      padding: 7px 12px;
      font-size: 10px;
      font-weight: 700;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }

    .bottom-tab-bar {
      height: 42px;
      display: flex;
      justify-content: space-around;
      align-items: center;
      border-top: 1px solid;
      flex-shrink: 0;
      padding: 0 4px;
    }

    .theme-light .bottom-tab-bar {
      background: #FFFDF9;
      border-top-color: #E8DCCE;
    }

    .theme-dark .bottom-tab-bar {
      background: #1D1117;
      border-top-color: #3D2837;
    }

    .tab-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1px;
      font-size: 7px;
      font-weight: 600;
      color: #9C888F;
    }
    .tab-item.active {
      color: #7A1F3D;
      font-weight: 700;
    }
    .theme-dark .tab-item.active {
      color: #E3C567;
    }

    .text-secondary {
      font-size: 9px;
    }
    .theme-light .text-secondary { color: #6B5A60; }
    .theme-dark .text-secondary { color: #C9B8BE; }

    .text-muted {
      font-size: 8px;
    }
    .theme-light .text-muted { color: #9C888F; }
    .theme-dark .text-muted { color: #8A777E; }

    /* SVG icon helper */
    svg {
      vertical-align: middle;
      flex-shrink: 0;
    }

    .screen-notes-panel {
      width: 100%;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 8px;
      padding: 6px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      font-size: 11px;
      color: #94a3b8;
    }

    .screen-notes-panel span strong {
      color: #e3c567;
    }
  </style>
</head>
<body>

  <!-- ==================== COVER PAGE ==================== -->
  <div class="page cover-page">
    <div>
      <div class="cover-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
        Official Design System & Screen Specifications
      </div>
      <h1 class="cover-title">Naveen Chit Fund<br><span>Android Application Screens</span></h1>
      <p class="cover-subtitle">
        Complete high-fidelity design catalog for all 12 mobile screens. Every screen is engineered with dual-theme compatibility, compliant with the Tamil Nadu Chit Funds Act 1982, and optimized for mobile Android devices.
      </p>
    </div>

    <div class="cover-grid">
      <div class="cover-stat">
        <div class="cover-stat-val">12</div>
        <div class="cover-stat-lbl">Core Android Screens</div>
      </div>
      <div class="cover-stat">
        <div class="cover-stat-val">24</div>
        <div class="cover-stat-lbl">Mockup Views (Light & Dark)</div>
      </div>
      <div class="cover-stat">
        <div class="cover-stat-val">412 × 915</div>
        <div class="cover-stat-lbl">Android Viewport Ratio</div>
      </div>
      <div class="cover-stat">
        <div class="cover-stat-val">TN-1982</div>
        <div class="cover-stat-lbl">Chit Fund Regulatory Ready</div>
      </div>
    </div>

    <div class="cover-footer">
      <div><strong>Platform:</strong> React Native / Android 14+ / Material 3 Guidelines</div>
      <div><strong>Palette:</strong> Royal Maroon (#7A1F3D) &amp; Gold (#C9A227)</div>
      <div><strong>Generated:</strong> September 2026 • Confidential &amp; Proprietary</div>
    </div>
  </div>

  <!-- ==================== SCREEN 1: SPLASH SCREEN ==================== -->
  <div class="page">
    <div class="page-header">
      <div class="page-title-box">
        <span class="screen-num">01 / 12</span>
        <h2 class="screen-title">Splash Screen</h2>
        <span class="screen-category">Brand Experience</span>
      </div>
      <div class="screen-desc">
        Initial boot screen showcasing the royal seal, trademark tagline, regulatory verification badge, and silent auth restoration state.
      </div>
    </div>

    <div class="screen-spread">
      <!-- Light Mode -->
      <div class="phone-container">
        <div class="phone-label light">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          Light Mode
        </div>
        <div class="android-phone frame-light">
          <div class="screen-inner theme-light" style="background: linear-gradient(180deg, #FFFDF9 0%, #F5EBDD 100%);">
            <div class="status-bar">
              <span>09:41</span>
              <div class="camera-punch"></div>
              <div class="status-icons">5G 98%</div>
            </div>
            <div class="screen-body" style="justify-content: center; align-items: center; text-align: center; gap: 14px;">
              <div style="width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, #7A1F3D, #4E1327); border: 2.5px solid #C9A227; display: flex; justify-content: center; align-items: center; box-shadow: 0 6px 16px rgba(122, 31, 61, 0.3);">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#E3C567" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
              </div>
              <div>
                <h3 style="font-family: var(--font-display); font-size: 17px; font-weight: 800; color: #7A1F3D; letter-spacing: -0.3px;">NAVEEN CHIT FUND</h3>
                <p style="font-size: 9px; color: #6B5A60; margin-top: 2px; font-weight: 500;">Trust • Transparency • Prosperity</p>
              </div>
              <div class="badge badge-gold" style="padding: 4px 8px; font-size: 8px;">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                Regd. TN Chit Funds Act 1982
              </div>
              <div style="margin-top: 28px; display: flex; flex-direction: column; align-items: center; gap: 6px;">
                <div style="width: 20px; height: 20px; border: 2.5px solid #7A1F3D; border-top-color: transparent; border-radius: 50%;"></div>
                <span class="text-muted">Securing Session...</span>
              </div>
            </div>
            <div class="nav-bar-pill"><div class="pill"></div></div>
          </div>
        </div>
      </div>

      <!-- Dark Mode -->
      <div class="phone-container">
        <div class="phone-label dark">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
          Dark Mode
        </div>
        <div class="android-phone frame-dark">
          <div class="screen-inner theme-dark" style="background: radial-gradient(circle at 50% 20%, #2E1D2A 0%, #160C10 70%);">
            <div class="status-bar" style="color: #F5EDE7;">
              <span>09:41</span>
              <div class="camera-punch"></div>
              <div class="status-icons">5G 98%</div>
            </div>
            <div class="screen-body" style="justify-content: center; align-items: center; text-align: center; gap: 14px;">
              <div style="width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, #B8446B, #7A1F3D); border: 2.5px solid #E3C567; display: flex; justify-content: center; align-items: center; box-shadow: 0 6px 20px rgba(184, 68, 107, 0.35);">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#E3C567" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
              </div>
              <div>
                <h3 style="font-family: var(--font-display); font-size: 17px; font-weight: 800; color: #E3C567; letter-spacing: -0.3px;">NAVEEN CHIT FUND</h3>
                <p style="font-size: 9px; color: #C9B8BE; margin-top: 2px; font-weight: 500;">Trust • Transparency • Prosperity</p>
              </div>
              <div class="badge badge-gold" style="padding: 4px 8px; font-size: 8px;">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                Regd. TN Chit Funds Act 1982
              </div>
              <div style="margin-top: 28px; display: flex; flex-direction: column; align-items: center; gap: 6px;">
                <div style="width: 20px; height: 20px; border: 2.5px solid #E3C567; border-top-color: transparent; border-radius: 50%;"></div>
                <span class="text-muted">Securing Session...</span>
              </div>
            </div>
            <div class="nav-bar-pill"><div class="pill"></div></div>
          </div>
        </div>
      </div>
    </div>

    <div class="screen-notes-panel">
      <span><strong>Component:</strong> <code>SplashScreen.jsx</code></span>
      <span><strong>Key States:</strong> Cold boot, offline check, silent biometric token restoration</span>
      <span><strong>Theme Tokens:</strong> Maroon Deep (#4E1327) &bull; Gold Accent (#C9A227)</span>
    </div>
  </div>

  <!-- ==================== SCREEN 2: ONBOARDING ==================== -->
  <div class="page">
    <div class="page-header">
      <div class="page-title-box">
        <span class="screen-num">02 / 12</span>
        <h2 class="screen-title">Onboarding Screen</h2>
        <span class="screen-category">Customer Journey</span>
      </div>
      <div class="screen-desc">
        Guided 3-step value proposition carousel explaining disciplined monthly savings, live reverse auctions, and government compliance.
      </div>
    </div>

    <div class="screen-spread">
      <!-- Light Mode -->
      <div class="phone-container">
        <div class="phone-label light">Light Mode</div>
        <div class="android-phone frame-light">
          <div class="screen-inner theme-light">
            <div class="status-bar">
              <span>09:41</span>
              <div class="camera-punch"></div>
              <div class="status-icons">5G 98%</div>
            </div>
            <div class="screen-body" style="justify-content: space-between; padding-bottom: 12px;">
              <div style="display: flex; justify-content: flex-end;">
                <span class="text-muted" style="font-weight: 700; cursor: pointer;">Skip</span>
              </div>

              <div style="text-align: center; padding: 10px 4px;">
                <div style="width: 100px; height: 100px; border-radius: 20px; background: #FAF3DC; border: 1.5px solid #C9A227; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#7A1F3D" stroke-width="1.8"><circle cx="12" cy="12" r="10"></circle><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><line x1="12" y1="6" x2="12" y2="8"></line><line x1="12" y1="16" x2="12" y2="18"></line></svg>
                </div>
                <h3 style="font-family: var(--font-display); font-size: 15px; font-weight: 800; color: #7A1F3D;">Smart Disciplined Savings</h3>
                <p class="text-secondary" style="margin-top: 6px; line-height: 1.4;">
                  Save monthly and earn lucrative monthly dividends with 100% transparent live digital bidding.
                </p>
              </div>

              <div>
                <div style="display: flex; justify-content: center; gap: 6px; margin-bottom: 14px;">
                  <div style="width: 20px; height: 5px; border-radius: 3px; background: #7A1F3D;"></div>
                  <div style="width: 5px; height: 5px; border-radius: 50%; background: #E8DCCE;"></div>
                  <div style="width: 5px; height: 5px; border-radius: 50%; background: #E8DCCE;"></div>
                </div>
                <div class="btn-primary" style="width: 100%;">
                  Get Started
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
              </div>
            </div>
            <div class="nav-bar-pill"><div class="pill"></div></div>
          </div>
        </div>
      </div>

      <!-- Dark Mode -->
      <div class="phone-container">
        <div class="phone-label dark">Dark Mode</div>
        <div class="android-phone frame-dark">
          <div class="screen-inner theme-dark">
            <div class="status-bar" style="color: #F5EDE7;">
              <span>09:41</span>
              <div class="camera-punch"></div>
              <div class="status-icons">5G 98%</div>
            </div>
            <div class="screen-body" style="justify-content: space-between; padding-bottom: 12px;">
              <div style="display: flex; justify-content: flex-end;">
                <span class="text-muted" style="font-weight: 700;">Skip</span>
              </div>

              <div style="text-align: center; padding: 10px 4px;">
                <div style="width: 100px; height: 100px; border-radius: 20px; background: #2E2611; border: 1.5px solid #D6A429; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#E3C567" stroke-width="1.8"><circle cx="12" cy="12" r="10"></circle><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><line x1="12" y1="6" x2="12" y2="8"></line><line x1="12" y1="16" x2="12" y2="18"></line></svg>
                </div>
                <h3 style="font-family: var(--font-display); font-size: 15px; font-weight: 800; color: #E3C567;">Smart Disciplined Savings</h3>
                <p class="text-secondary" style="margin-top: 6px; line-height: 1.4;">
                  Save monthly and earn lucrative monthly dividends with 100% transparent live digital bidding.
                </p>
              </div>

              <div>
                <div style="display: flex; justify-content: center; gap: 6px; margin-bottom: 14px;">
                  <div style="width: 20px; height: 5px; border-radius: 3px; background: #E3C567;"></div>
                  <div style="width: 5px; height: 5px; border-radius: 50%; background: #3D2837;"></div>
                  <div style="width: 5px; height: 5px; border-radius: 50%; background: #3D2837;"></div>
                </div>
                <div class="btn-primary" style="width: 100%;">
                  Get Started
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
              </div>
            </div>
            <div class="nav-bar-pill"><div class="pill"></div></div>
          </div>
        </div>
      </div>
    </div>

    <div class="screen-notes-panel">
      <span><strong>Component:</strong> <code>OnboardingScreen.jsx</code></span>
      <span><strong>Key States:</strong> Step 1 (Savings) &bull; Step 2 (Auctions) &bull; Step 3 (Guarantor Verification)</span>
      <span><strong>Features:</strong> Skip action, smooth swipe gesture, responsive CTA</span>
    </div>
  </div>

  <!-- ==================== SCREEN 3: AUTHENTICATION & OTP ==================== -->
  <div class="page">
    <div class="page-header">
      <div class="page-title-box">
        <span class="screen-num">03 / 12</span>
        <h2 class="screen-title">Authentication &amp; OTP Screen</h2>
        <span class="screen-category">Security &amp; Identity</span>
      </div>
      <div class="screen-desc">
        Seamless mobile number entry, Indian (+91) validation, 6-digit OTP verification box, and role assignment.
      </div>
    </div>

    <div class="screen-spread">
      <!-- Light Mode -->
      <div class="phone-container">
        <div class="phone-label light">Light Mode</div>
        <div class="android-phone frame-light">
          <div class="screen-inner theme-light">
            <div class="status-bar">
              <span>09:41</span>
              <div class="camera-punch"></div>
              <div class="status-icons">5G 98%</div>
            </div>
            <div class="screen-body">
              <div class="screen-header-bar">
                <span class="brand-title">Login / Register</span>
                <span class="badge badge-gold">OTP Secure</span>
              </div>

              <div style="margin-top: 10px;">
                <p style="font-weight: 700; font-size: 13px; color: #241016;">Enter Mobile Number</p>
                <p class="text-secondary" style="margin-top: 2px;">We'll send a 6-digit verification code</p>
              </div>

              <div class="card" style="margin-top: 12px; display: flex; align-items: center; gap: 8px; background: #FFF;">
                <span style="font-weight: 700; color: #7A1F3D;">🇮🇳 +91</span>
                <div style="width: 1px; height: 16px; background: #E8DCCE;"></div>
                <span style="font-weight: 600; font-size: 11px;">98765 43210</span>
              </div>

              <div style="margin-top: 8px;">
                <span class="text-muted" style="font-weight: 600;">ENTER 6-DIGIT OTP</span>
                <div style="display: flex; gap: 6px; margin-top: 6px;">
                  <div style="flex: 1; height: 36px; border: 1.5px solid #7A1F3D; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; background: #FAF3DC;">4</div>
                  <div style="flex: 1; height: 36px; border: 1.5px solid #7A1F3D; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; background: #FAF3DC;">8</div>
                  <div style="flex: 1; height: 36px; border: 1.5px solid #7A1F3D; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; background: #FAF3DC;">2</div>
                  <div style="flex: 1; height: 36px; border: 1px solid #E8DCCE; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; background: #FFF;">•</div>
                  <div style="flex: 1; height: 36px; border: 1px solid #E8DCCE; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; background: #FFF;">•</div>
                  <div style="flex: 1; height: 36px; border: 1px solid #E8DCCE; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; background: #FFF;">•</div>
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                <span class="text-muted">Resend OTP in <strong>00:42</strong></span>
                <span style="color: #7A1F3D; font-weight: 700; font-size: 9px;">Change Number</span>
              </div>

              <div style="margin-top: auto; margin-bottom: 6px;">
                <div class="btn-primary" style="width: 100%;">Verify &amp; Continue</div>
                <p class="text-muted" style="text-align: center; margin-top: 8px; font-size: 8px;">
                  By continuing, you agree to Naveen Chit Fund Rules &amp; TN Chit Act terms.
                </p>
              </div>
            </div>
            <div class="nav-bar-pill"><div class="pill"></div></div>
          </div>
        </div>
      </div>

      <!-- Dark Mode -->
      <div class="phone-container">
        <div class="phone-label dark">Dark Mode</div>
        <div class="android-phone frame-dark">
          <div class="screen-inner theme-dark">
            <div class="status-bar" style="color: #F5EDE7;">
              <span>09:41</span>
              <div class="camera-punch"></div>
              <div class="status-icons">5G 98%</div>
            </div>
            <div class="screen-body">
              <div class="screen-header-bar">
                <span class="brand-title">Login / Register</span>
                <span class="badge badge-gold">OTP Secure</span>
              </div>

              <div style="margin-top: 10px;">
                <p style="font-weight: 700; font-size: 13px; color: #F5EDE7;">Enter Mobile Number</p>
                <p class="text-secondary" style="margin-top: 2px;">We'll send a 6-digit verification code</p>
              </div>

              <div class="card" style="margin-top: 12px; display: flex; align-items: center; gap: 8px; background: #1D1117;">
                <span style="font-weight: 700; color: #E3C567;">🇮🇳 +91</span>
                <div style="width: 1px; height: 16px; background: #3D2837;"></div>
                <span style="font-weight: 600; font-size: 11px;">98765 43210</span>
              </div>

              <div style="margin-top: 8px;">
                <span class="text-muted" style="font-weight: 600;">ENTER 6-DIGIT OTP</span>
                <div style="display: flex; gap: 6px; margin-top: 6px;">
                  <div style="flex: 1; height: 36px; border: 1.5px solid #E3C567; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; background: #2E2611;">4</div>
                  <div style="flex: 1; height: 36px; border: 1.5px solid #E3C567; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; background: #2E2611;">8</div>
                  <div style="flex: 1; height: 36px; border: 1.5px solid #E3C567; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; background: #2E2611;">2</div>
                  <div style="flex: 1; height: 36px; border: 1px solid #3D2837; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; background: #1D1117;">•</div>
                  <div style="flex: 1; height: 36px; border: 1px solid #3D2837; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; background: #1D1117;">•</div>
                  <div style="flex: 1; height: 36px; border: 1px solid #3D2837; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; background: #1D1117;">•</div>
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                <span class="text-muted">Resend OTP in <strong>00:42</strong></span>
                <span style="color: #E3C567; font-weight: 700; font-size: 9px;">Change Number</span>
              </div>

              <div style="margin-top: auto; margin-bottom: 6px;">
                <div class="btn-primary" style="width: 100%;">Verify &amp; Continue</div>
                <p class="text-muted" style="text-align: center; margin-top: 8px; font-size: 8px;">
                  By continuing, you agree to Naveen Chit Fund Rules &amp; TN Chit Act terms.
                </p>
              </div>
            </div>
            <div class="nav-bar-pill"><div class="pill"></div></div>
          </div>
        </div>
      </div>
    </div>

    <div class="screen-notes-panel">
      <span><strong>Component:</strong> <code>AuthScreen.jsx</code></span>
      <span><strong>Security:</strong> Fast SMS OTP &bull; Auto-read OTP SMS &bull; JWT Token exchange</span>
      <span><strong>Inputs:</strong> +91 Phone Format &bull; Resend countdown timer</span>
    </div>
  </div>

  <!-- ==================== SCREEN 4: HOME / DASHBOARD ==================== -->
  <div class="page">
    <div class="page-header">
      <div class="page-title-box">
        <span class="screen-num">04 / 12</span>
        <h2 class="screen-title">Home &amp; Portfolio Dashboard</h2>
        <span class="screen-category">Core Experience</span>
      </div>
      <div class="screen-desc">
        Primary member dashboard showcasing active chit portfolio, accumulated dividends, live auction banner, and quick financial shortcuts.
      </div>
    </div>

    <div class="screen-spread">
      <!-- Light Mode -->
      <div class="phone-container">
        <div class="phone-label light">Light Mode</div>
        <div class="android-phone frame-light">
          <div class="screen-inner theme-light">
            <div class="status-bar">
              <span>09:41</span>
              <div class="camera-punch"></div>
              <div class="status-icons">5G 98%</div>
            </div>
            <div class="screen-body" style="padding: 4px 8px;">
              <!-- User Greeting -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <div>
                  <span class="text-muted">Welcome Back</span>
                  <div style="font-weight: 800; font-size: 13px; color: #7A1F3D;">Rajesh Kumar</div>
                </div>
                <span class="badge badge-success">KYC Verified</span>
              </div>

              <!-- Portfolio Card -->
              <div class="card" style="background: linear-gradient(135deg, #7A1F3D, #4E1327); color: #FFF; border: none; margin-bottom: 6px;">
                <span style="font-size: 8px; color: #E8DCCE; text-transform: uppercase; letter-spacing: 0.5px;">Active Chit Portfolio</span>
                <div style="font-family: var(--font-display); font-size: 18px; font-weight: 800; color: #FFF; margin: 2px 0;">₹5,00,000</div>
                <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 4px; margin-top: 4px; font-size: 8px;">
                  <span>Dividends Earned: <strong style="color: #E3C567;">₹24,500</strong></span>
                  <span>Active Chits: <strong>2 Groups</strong></span>
                </div>
              </div>

              <!-- Live Auction Urgent Alert -->
              <div class="card" style="background: #FAF3DC; border: 1px solid #C9A227; padding: 6px 8px; margin-bottom: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <span class="badge badge-maroon" style="font-size: 7px;">Auction Starts In 45m</span>
                    <div style="font-weight: 700; font-size: 10px; color: #241016; margin-top: 2px;">NCF-PREM-5L (Month 8/25)</div>
                  </div>
                  <div class="btn-primary" style="padding: 4px 8px; font-size: 8px;">Join Bid</div>
                </div>
              </div>

              <!-- Next Installment Card -->
              <div class="card" style="padding: 6px 8px; margin-bottom: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <span class="text-muted">Next Installment Due</span>
                    <div style="font-weight: 800; font-size: 12px; color: #7A1F3D;">₹8,600 <span style="font-size: 8px; font-weight: normal; color: #2E7D4F;">(Net of ₹1.4k dividend)</span></div>
                  </div>
                  <div class="btn-gold" style="padding: 4px 8px; font-size: 8px;">Pay Now</div>
                </div>
              </div>

              <!-- Quick Action Icons -->
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; text-align: center; margin-top: 2px;">
                <div style="background: #F5EBDD; border-radius: 8px; padding: 6px 2px;">
                  <div style="color: #7A1F3D; font-weight: 800; font-size: 11px;">₹</div>
                  <div style="font-size: 7px; font-weight: 600; margin-top: 2px;">Pay Dues</div>
                </div>
                <div style="background: #F5EBDD; border-radius: 8px; padding: 6px 2px;">
                  <div style="color: #7A1F3D; font-weight: 800; font-size: 11px;">🔍</div>
                  <div style="font-size: 7px; font-weight: 600; margin-top: 2px;">Explore</div>
                </div>
                <div style="background: #F5EBDD; border-radius: 8px; padding: 6px 2px;">
                  <div style="color: #7A1F3D; font-weight: 800; font-size: 11px;">⚖️</div>
                  <div style="font-size: 7px; font-weight: 600; margin-top: 2px;">Auction</div>
                </div>
                <div style="background: #F5EBDD; border-radius: 8px; padding: 6px 2px;">
                  <div style="color: #7A1F3D; font-weight: 800; font-size: 11px;">📑</div>
                  <div style="font-size: 7px; font-weight: 600; margin-top: 2px;">Passbook</div>
                </div>
              </div>
            </div>

            <!-- Bottom Tab Bar -->
            <div class="bottom-tab-bar">
              <div class="tab-item active">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
                Home
              </div>
              <div class="tab-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
                Explore
              </div>
              <div class="tab-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                Payments
              </div>
              <div class="tab-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                Profile
              </div>
            </div>
            <div class="nav-bar-pill"><div class="pill"></div></div>
          </div>
        </div>
      </div>

      <!-- Dark Mode -->
      <div class="phone-container">
        <div class="phone-label dark">Dark Mode</div>
        <div class="android-phone frame-dark">
          <div class="screen-inner theme-dark">
            <div class="status-bar" style="color: #F5EDE7;">
              <span>09:41</span>
              <div class="camera-punch"></div>
              <div class="status-icons">5G 98%</div>
            </div>
            <div class="screen-body" style="padding: 4px 8px;">
              <!-- User Greeting -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <div>
                  <span class="text-muted">Welcome Back</span>
                  <div style="font-weight: 800; font-size: 13px; color: #E3C567;">Rajesh Kumar</div>
                </div>
                <span class="badge badge-success">KYC Verified</span>
              </div>

              <!-- Portfolio Card -->
              <div class="card" style="background: linear-gradient(135deg, #B8446B, #7A1F3D); color: #FFF; border: none; margin-bottom: 6px;">
                <span style="font-size: 8px; color: #E8DCCE; text-transform: uppercase; letter-spacing: 0.5px;">Active Chit Portfolio</span>
                <div style="font-family: var(--font-display); font-size: 18px; font-weight: 800; color: #FFF; margin: 2px 0;">₹5,00,000</div>
                <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 4px; margin-top: 4px; font-size: 8px;">
                  <span>Dividends Earned: <strong style="color: #E3C567;">₹24,500</strong></span>
                  <span>Active Chits: <strong>2 Groups</strong></span>
                </div>
              </div>

              <!-- Live Auction Urgent Alert -->
              <div class="card" style="background: #2E2611; border: 1px solid #D6A429; padding: 6px 8px; margin-bottom: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <span class="badge badge-maroon" style="font-size: 7px;">Auction Starts In 45m</span>
                    <div style="font-weight: 700; font-size: 10px; color: #F5EDE7; margin-top: 2px;">NCF-PREM-5L (Month 8/25)</div>
                  </div>
                  <div class="btn-primary" style="padding: 4px 8px; font-size: 8px;">Join Bid</div>
                </div>
              </div>

              <!-- Next Installment Card -->
              <div class="card" style="padding: 6px 8px; margin-bottom: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <span class="text-muted">Next Installment Due</span>
                    <div style="font-weight: 800; font-size: 12px; color: #E3C567;">₹8,600 <span style="font-size: 8px; font-weight: normal; color: #3AA76D;">(Net of ₹1.4k dividend)</span></div>
                  </div>
                  <div class="btn-gold" style="padding: 4px 8px; font-size: 8px;">Pay Now</div>
                </div>
              </div>

              <!-- Quick Action Icons -->
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; text-align: center; margin-top: 2px;">
                <div style="background: #2E1D2A; border-radius: 8px; padding: 6px 2px;">
                  <div style="color: #E3C567; font-weight: 800; font-size: 11px;">₹</div>
                  <div style="font-size: 7px; font-weight: 600; margin-top: 2px;">Pay Dues</div>
                </div>
                <div style="background: #2E1D2A; border-radius: 8px; padding: 6px 2px;">
                  <div style="color: #E3C567; font-weight: 800; font-size: 11px;">🔍</div>
                  <div style="font-size: 7px; font-weight: 600; margin-top: 2px;">Explore</div>
                </div>
                <div style="background: #2E1D2A; border-radius: 8px; padding: 6px 2px;">
                  <div style="color: #E3C567; font-weight: 800; font-size: 11px;">⚖️</div>
                  <div style="font-size: 7px; font-weight: 600; margin-top: 2px;">Auction</div>
                </div>
                <div style="background: #2E1D2A; border-radius: 8px; padding: 6px 2px;">
                  <div style="color: #E3C567; font-weight: 800; font-size: 11px;">📑</div>
                  <div style="font-size: 7px; font-weight: 600; margin-top: 2px;">Passbook</div>
                </div>
              </div>
            </div>

            <!-- Bottom Tab Bar -->
            <div class="bottom-tab-bar">
              <div class="tab-item active">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
                Home
              </div>
              <div class="tab-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
                Explore
              </div>
              <div class="tab-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                Payments
              </div>
              <div class="tab-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                Profile
              </div>
            </div>
            <div class="nav-bar-pill"><div class="pill"></div></div>
          </div>
        </div>
      </div>
    </div>

    <div class="screen-notes-panel">
      <span><strong>Component:</strong> <code>HomeScreen.jsx</code></span>
      <span><strong>Integration:</strong> <code>useAppStore</code> (activeChits, currentAuction, totalPortfolioValue)</span>
      <span><strong>Navigation:</strong> Bottom tabs with active maroon/gold indicator</span>
    </div>
  </div>

  <!-- ==================== SCREEN 5: CHIT DISCOVERY ==================== -->
  <div class="page">
    <div class="page-header">
      <div class="page-title-box">
        <span class="screen-num">05 / 12</span>
        <h2 class="screen-title">Chit Discovery &amp; Plan Explorer</h2>
        <span class="screen-category">Product Discovery</span>
      </div>
      <div class="screen-desc">
        Interactive catalog of approved chit funds with duration chips, pool size filters, slot availability badges, and one-tap enrollment.
      </div>
    </div>

    <div class="screen-spread">
      <!-- Light Mode -->
      <div class="phone-container">
        <div class="phone-label light">Light Mode</div>
        <div class="android-phone frame-light">
          <div class="screen-inner theme-light">
            <div class="status-bar">
              <span>09:41</span>
              <div class="camera-punch"></div>
              <div class="status-icons">5G 98%</div>
            </div>
            <div class="screen-body" style="padding: 4px 8px;">
              <div class="screen-header-bar">
                <span class="brand-title">Explore Chits</span>
                <span class="badge badge-gold">PSO Verified</span>
              </div>

              <!-- Filter chips -->
              <div style="display: flex; gap: 4px; overflow-x: auto; margin-bottom: 8px;">
                <span style="background: #7A1F3D; color: #FFF; padding: 3px 8px; border-radius: 999px; font-size: 8px; font-weight: 700;">All Plans</span>
                <span style="background: #F5EBDD; color: #241016; padding: 3px 8px; border-radius: 999px; font-size: 8px; font-weight: 600;">₹1 Lakh</span>
                <span style="background: #F5EBDD; color: #241016; padding: 3px 8px; border-radius: 999px; font-size: 8px; font-weight: 600;">₹5 Lakh</span>
                <span style="background: #F5EBDD; color: #241016; padding: 3px 8px; border-radius: 999px; font-size: 8px; font-weight: 600;">25 M</span>
              </div>

              <!-- Chit Card 1 -->
              <div class="card" style="padding: 8px; margin-bottom: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <div>
                    <span class="badge badge-maroon" style="font-size: 7px;">Popular Plan</span>
                    <div style="font-weight: 800; font-size: 12px; color: #7A1F3D; margin-top: 2px;">₹5,00,000 Group</div>
                    <div class="text-secondary" style="font-size: 8px;">25 Months • ₹20,000 / month</div>
                  </div>
                  <span class="badge badge-success" style="font-size: 7px;">Filling Fast</span>
                </div>
                <!-- Progress bar -->
                <div style="margin: 6px 0 4px 0;">
                  <div style="display: flex; justify-content: space-between; font-size: 8px;" class="text-muted">
                    <span>Slots Joined</span>
                    <span><strong>19 / 25 Members</strong></span>
                  </div>
                  <div style="height: 4px; background: #E8DCCE; border-radius: 2px; margin-top: 2px;">
                    <div style="width: 76%; height: 100%; background: #C9A227; border-radius: 2px;"></div>
                  </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
                  <span style="font-size: 8px; color: #2E7D4F; font-weight: 700;">Est. Return ~11.8% p.a.</span>
                  <div class="btn-primary" style="padding: 4px 8px; font-size: 8px;">Join Chit</div>
                </div>
              </div>

              <!-- Chit Card 2 -->
              <div class="card" style="padding: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <div>
                    <span class="badge badge-gold" style="font-size: 7px;">Starter Fund</span>
                    <div style="font-weight: 800; font-size: 12px; color: #7A1F3D; margin-top: 2px;">₹1,00,000 Group</div>
                    <div class="text-secondary" style="font-size: 8px;">20 Months • ₹5,000 / month</div>
                  </div>
                  <span class="badge badge-success" style="font-size: 7px;">Starts 1st Oct</span>
                </div>
                <div style="margin: 6px 0 4px 0;">
                  <div style="display: flex; justify-content: space-between; font-size: 8px;" class="text-muted">
                    <span>Slots Joined</span>
                    <span><strong>12 / 20 Members</strong></span>
                  </div>
                  <div style="height: 4px; background: #E8DCCE; border-radius: 2px; margin-top: 2px;">
                    <div style="width: 60%; height: 100%; background: #C9A227; border-radius: 2px;"></div>
                  </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
                  <span style="font-size: 8px; color: #2E7D4F; font-weight: 700;">Est. Return ~10.5% p.a.</span>
                  <div class="btn-primary" style="padding: 4px 8px; font-size: 8px;">Join Chit</div>
                </div>
              </div>
            </div>
            <div class="nav-bar-pill"><div class="pill"></div></div>
          </div>
        </div>
      </div>

      <!-- Dark Mode -->
      <div class="phone-container">
        <div class="phone-label dark">Dark Mode</div>
        <div class="android-phone frame-dark">
          <div class="screen-inner theme-dark">
            <div class="status-bar" style="color: #F5EDE7;">
              <span>09:41</span>
              <div class="camera-punch"></div>
              <div class="status-icons">5G 98%</div>
            </div>
            <div class="screen-body" style="padding: 4px 8px;">
              <div class="screen-header-bar">
                <span class="brand-title">Explore Chits</span>
                <span class="badge badge-gold">PSO Verified</span>
              </div>

              <!-- Filter chips -->
              <div style="display: flex; gap: 4px; overflow-x: auto; margin-bottom: 8px;">
                <span style="background: #B8446B; color: #FFF; padding: 3px 8px; border-radius: 999px; font-size: 8px; font-weight: 700;">All Plans</span>
                <span style="background: #2E1D2A; color: #F5EDE7; padding: 3px 8px; border-radius: 999px; font-size: 8px; font-weight: 600;">₹1 Lakh</span>
                <span style="background: #2E1D2A; color: #F5EDE7; padding: 3px 8px; border-radius: 999px; font-size: 8px; font-weight: 600;">₹5 Lakh</span>
                <span style="background: #2E1D2A; color: #F5EDE7; padding: 3px 8px; border-radius: 999px; font-size: 8px; font-weight: 600;">25 M</span>
              </div>

              <!-- Chit Card 1 -->
              <div class="card" style="padding: 8px; margin-bottom: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <div>
                    <span class="badge badge-maroon" style="font-size: 7px;">Popular Plan</span>
                    <div style="font-weight: 800; font-size: 12px; color: #E3C567; margin-top: 2px;">₹5,00,000 Group</div>
                    <div class="text-secondary" style="font-size: 8px;">25 Months • ₹20,000 / month</div>
                  </div>
                  <span class="badge badge-success" style="font-size: 7px;">Filling Fast</span>
                </div>
                <div style="margin: 6px 0 4px 0;">
                  <div style="display: flex; justify-content: space-between; font-size: 8px;" class="text-muted">
                    <span>Slots Joined</span>
                    <span><strong>19 / 25 Members</strong></span>
                  </div>
                  <div style="height: 4px; background: #3D2837; border-radius: 2px; margin-top: 2px;">
                    <div style="width: 76%; height: 100%; background: #E3C567; border-radius: 2px;"></div>
                  </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
                  <span style="font-size: 8px; color: #3AA76D; font-weight: 700;">Est. Return ~11.8% p.a.</span>
                  <div class="btn-primary" style="padding: 4px 8px; font-size: 8px;">Join Chit</div>
                </div>
              </div>

              <!-- Chit Card 2 -->
              <div class="card" style="padding: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <div>
                    <span class="badge badge-gold" style="font-size: 7px;">Starter Fund</span>
                    <div style="font-weight: 800; font-size: 12px; color: #E3C567; margin-top: 2px;">₹1,00,000 Group</div>
                    <div class="text-secondary" style="font-size: 8px;">20 Months • ₹5,000 / month</div>
                  </div>
                  <span class="badge badge-success" style="font-size: 7px;">Starts 1st Oct</span>
                </div>
                <div style="margin: 6px 0 4px 0;">
                  <div style="display: flex; justify-content: space-between; font-size: 8px;" class="text-muted">
                    <span>Slots Joined</span>
                    <span><strong>12 / 20 Members</strong></span>
                  </div>
                  <div style="height: 4px; background: #3D2837; border-radius: 2px; margin-top: 2px;">
                    <div style="width: 60%; height: 100%; background: #E3C567; border-radius: 2px;"></div>
                  </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
                  <span style="font-size: 8px; color: #3AA76D; font-weight: 700;">Est. Return ~10.5% p.a.</span>
                  <div class="btn-primary" style="padding: 4px 8px; font-size: 8px;">Join Chit</div>
                </div>
              </div>
            </div>
            <div class="nav-bar-pill"><div class="pill"></div></div>
          </div>
        </div>
      </div>
    </div>

    <div class="screen-notes-panel">
      <span><strong>Component:</strong> <code>ChitDiscoveryScreen.jsx</code></span>
      <span><strong>Filters:</strong> Pool Size &bull; Duration &bull; Start Date &bull; Slots Available</span>
      <span><strong>Badges:</strong> Regulatory PSO Approved &bull; State Registration Certificate</span>
    </div>
  </div>

  <!-- ==================== SCREEN 6: CHIT DETAIL ==================== -->
  <div class="page">
    <div class="page-header">
      <div class="page-title-box">
        <span class="screen-num">06 / 12</span>
        <h2 class="screen-title">Chit Detail &amp; Dividend Projection</h2>
        <span class="screen-category">Financial Analytics</span>
      </div>
      <div class="screen-desc">
        Complete group timeline, 25-month auction schedule, minimum/maximum bid discount brackets, and foreman commission disclosures.
      </div>
    </div>

    <div class="screen-spread">
      <!-- Light Mode -->
      <div class="phone-container">
        <div class="phone-label light">Light Mode</div>
        <div class="android-phone frame-light">
          <div class="screen-inner theme-light">
            <div class="status-bar">
              <span>09:41</span>
              <div class="camera-punch"></div>
              <div class="status-icons">5G 98%</div>
            </div>
            <div class="screen-body" style="padding: 4px 8px;">
              <div class="screen-header-bar">
                <span class="brand-title">NCF-PREM-5L</span>
                <span class="badge badge-gold">Active Group</span>
              </div>

              <!-- Header Card -->
              <div class="card" style="background: #FAF3DC; border: 1px solid #C9A227; padding: 6px 8px; margin-bottom: 6px;">
                <div style="display: flex; justify-content: space-between;">
                  <div>
                    <span class="text-muted">Total Chit Value</span>
                    <div style="font-size: 15px; font-weight: 800; color: #7A1F3D;">₹5,00,000</div>
                  </div>
                  <div style="text-align: right;">
                    <span class="text-muted">Current Month</span>
                    <div style="font-size: 15px; font-weight: 800; color: #7A1F3D;">08 / 25</div>
                  </div>
                </div>
              </div>

              <!-- Metrics Grid -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 6px;">
                <div class="card" style="padding: 6px;">
                  <span class="text-muted">Installment / Mo</span>
                  <div style="font-weight: 700; font-size: 11px;">₹20,000 Gross</div>
                </div>
                <div class="card" style="padding: 6px;">
                  <span class="text-muted">Avg Dividend</span>
                  <div style="font-weight: 700; font-size: 11px; color: #2E7D4F;">₹2,850 / mo</div>
                </div>
                <div class="card" style="padding: 6px;">
                  <span class="text-muted">Max Discount</span>
                  <div style="font-weight: 700; font-size: 11px;">40% (₹2,00,000)</div>
                </div>
                <div class="card" style="padding: 6px;">
                  <span class="text-muted">Foreman Fee</span>
                  <div style="font-weight: 700; font-size: 11px;">5% (Statutory)</div>
                </div>
              </div>

              <!-- Regulatory Info -->
              <div class="card card-subtle" style="padding: 6px; margin-bottom: 6px;">
                <div style="font-weight: 700; font-size: 9px; color: #7A1F3D;">Statutory Compliance</div>
                <div style="font-size: 8px; margin-top: 2px;" class="text-secondary">
                  PSO No: <strong>TN/CBE/2024/0981</strong><br>
                  Security Deposit: 100% lodged with Registrar of Chits
                </div>
              </div>

              <div style="margin-top: auto;">
                <div class="btn-primary" style="width: 100%;">View Full Schedule &amp; Members</div>
              </div>
            </div>
            <div class="nav-bar-pill"><div class="pill"></div></div>
          </div>
        </div>
      </div>

      <!-- Dark Mode -->
      <div class="phone-container">
        <div class="phone-label dark">Dark Mode</div>
        <div class="android-phone frame-dark">
          <div class="screen-inner theme-dark">
            <div class="status-bar" style="color: #F5EDE7;">
              <span>09:41</span>
              <div class="camera-punch"></div>
              <div class="status-icons">5G 98%</div>
            </div>
            <div class="screen-body" style="padding: 4px 8px;">
              <div class="screen-header-bar">
                <span class="brand-title">NCF-PREM-5L</span>
                <span class="badge badge-gold">Active Group</span>
              </div>

              <!-- Header Card -->
              <div class="card" style="background: #2E2611; border: 1px solid #D6A429; padding: 6px 8px; margin-bottom: 6px;">
                <div style="display: flex; justify-content: space-between;">
                  <div>
                    <span class="text-muted">Total Chit Value</span>
                    <div style="font-size: 15px; font-weight: 800; color: #E3C567;">₹5,00,000</div>
                  </div>
                  <div style="text-align: right;">
                    <span class="text-muted">Current Month</span>
                    <div style="font-size: 15px; font-weight: 800; color: #E3C567;">08 / 25</div>
                  </div>
                </div>
              </div>

              <!-- Metrics Grid -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 6px;">
                <div class="card" style="padding: 6px;">
                  <span class="text-muted">Installment / Mo</span>
                  <div style="font-weight: 700; font-size: 11px;">₹20,000 Gross</div>
                </div>
                <div class="card" style="padding: 6px;">
                  <span class="text-muted">Avg Dividend</span>
                  <div style="font-weight: 700; font-size: 11px; color: #3AA76D;">₹2,850 / mo</div>
                </div>
                <div class="card" style="padding: 6px;">
                  <span class="text-muted">Max Discount</span>
                  <div style="font-weight: 700; font-size: 11px;">40% (₹2,00,000)</div>
                </div>
                <div class="card" style="padding: 6px;">
                  <span class="text-muted">Foreman Fee</span>
                  <div style="font-weight: 700; font-size: 11px;">5% (Statutory)</div>
                </div>
              </div>

              <!-- Regulatory Info -->
              <div class="card card-subtle" style="padding: 6px; margin-bottom: 6px;">
                <div style="font-weight: 700; font-size: 9px; color: #E3C567;">Statutory Compliance</div>
                <div style="font-size: 8px; margin-top: 2px;" class="text-secondary">
                  PSO No: <strong>TN/CBE/2024/0981</strong><br>
                  Security Deposit: 100% lodged with Registrar of Chits
                </div>
              </div>

              <div style="margin-top: auto;">
                <div class="btn-primary" style="width: 100%;">View Full Schedule &amp; Members</div>
              </div>
            </div>
            <div class="nav-bar-pill"><div class="pill"></div></div>
          </div>
        </div>
      </div>
    </div>

    <div class="screen-notes-panel">
      <span><strong>Component:</strong> <code>ChitDetailScreen.jsx</code></span>
      <span><strong>Transparency:</strong> 100% Foreman compliance &bull; Registrar Security Deposit disclosure</span>
      <span><strong>Calculations:</strong> Automatic dividend yield forecast &amp; net payable simulation</span>
    </div>
  </div>

  <!-- ==================== SCREEN 7: LIVE AUCTION ==================== -->
  <div class="page">
    <div class="page-header">
      <div class="page-title-box">
        <span class="screen-num">07 / 12</span>
        <h2 class="screen-title">Live Reverse Auction Room</h2>
        <span class="screen-category">High-Frequency Realtime</span>
      </div>
      <div class="screen-desc">
        WebSockets-powered live reverse bidding arena with dynamic countdown timer, real-time bid log, and quick discount increment buttons.
      </div>
    </div>

    <div class="screen-spread">
      <!-- Light Mode -->
      <div class="phone-container">
        <div class="phone-label light">Light Mode</div>
        <div class="android-phone frame-light">
          <div class="screen-inner theme-light">
            <div class="status-bar">
              <span>09:41</span>
              <div class="camera-punch"></div>
              <div class="status-icons">5G 98%</div>
            </div>
            <div class="screen-body" style="padding: 4px 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span class="badge" style="background: #FCECEB; color: #B3261E; border: 1px solid #B3261E; font-size: 8px;">
                  ● LIVE AUCTION
                </span>
                <span style="font-family: var(--font-display); font-weight: 800; font-size: 11px; color: #B3261E;">00:02:45</span>
              </div>

              <!-- Main Bid Focus -->
              <div class="card" style="background: #FAF3DC; border: 1.5px solid #C9A227; text-align: center; padding: 8px; margin-bottom: 6px;">
                <span class="text-muted" style="text-transform: uppercase; font-size: 8px;">Current Lowest Bid (Prize)</span>
                <div style="font-family: var(--font-display); font-size: 20px; font-weight: 800; color: #7A1F3D; margin: 2px 0;">₹3,40,000</div>
                <div style="font-size: 8px; color: #2E7D4F; font-weight: 700;">
                  Discount: ₹1,60,000 • Dividend / Member: ₹6,080
                </div>
              </div>

              <!-- Live Bid Feed -->
              <span class="text-muted" style="font-size: 8px; font-weight: 700; text-transform: uppercase;">Live Bidding Stream</span>
              <div style="display: flex; flex-direction: column; gap: 3px; margin: 4px 0 6px 0;">
                <div style="background: #FFF; border: 1px solid #E8DCCE; border-radius: 6px; padding: 4px 8px; display: flex; justify-content: space-between; font-size: 8px;">
                  <span><strong>Bidder #14</strong> (You)</span>
                  <span style="color: #7A1F3D; font-weight: 700;">₹3,40,000</span>
                </div>
                <div style="background: #FFF; border: 1px solid #E8DCCE; border-radius: 6px; padding: 4px 8px; display: flex; justify-content: space-between; font-size: 8px;">
                  <span><strong>Bidder #07</strong></span>
                  <span style="color: #6B5A60;">₹3,42,000</span>
                </div>
                <div style="background: #FFF; border: 1px solid #E8DCCE; border-radius: 6px; padding: 4px 8px; display: flex; justify-content: space-between; font-size: 8px;">
                  <span><strong>Bidder #21</strong></span>
                  <span style="color: #6B5A60;">₹3,45,000</span>
                </div>
              </div>

              <!-- Quick Bid Buttons -->
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-bottom: 6px;">
                <div class="card card-subtle" style="text-align: center; padding: 4px; font-size: 8px; font-weight: 700; color: #7A1F3D;">- ₹1,000</div>
                <div class="card card-subtle" style="text-align: center; padding: 4px; font-size: 8px; font-weight: 700; color: #7A1F3D;">- ₹2,000</div>
                <div class="card card-subtle" style="text-align: center; padding: 4px; font-size: 8px; font-weight: 700; color: #7A1F3D;">- ₹5,000</div>
              </div>

              <div style="margin-top: auto;">
                <div class="btn-primary" style="width: 100%; background: linear-gradient(135deg, #B3261E, #7A1F3D);">
                  Place Bid: ₹3,39,000
                </div>
              </div>
            </div>
            <div class="nav-bar-pill"><div class="pill"></div></div>
          </div>
        </div>
      </div>

      <!-- Dark Mode -->
      <div class="phone-container">
        <div class="phone-label dark">Dark Mode</div>
        <div class="android-phone frame-dark">
          <div class="screen-inner theme-dark">
            <div class="status-bar" style="color: #F5EDE7;">
              <span>09:41</span>
              <div class="camera-punch"></div>
              <div class="status-icons">5G 98%</div>
            </div>
            <div class="screen-body" style="padding: 4px 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span class="badge" style="background: #331616; color: #D94D45; border: 1px solid #D94D45; font-size: 8px;">
                  ● LIVE AUCTION
                </span>
                <span style="font-family: var(--font-display); font-weight: 800; font-size: 11px; color: #D94D45;">00:02:45</span>
              </div>

              <!-- Main Bid Focus -->
              <div class="card" style="background: #2E2611; border: 1.5px solid #D6A429; text-align: center; padding: 8px; margin-bottom: 6px;">
                <span class="text-muted" style="text-transform: uppercase; font-size: 8px;">Current Lowest Bid (Prize)</span>
                <div style="font-family: var(--font-display); font-size: 20px; font-weight: 800; color: #E3C567; margin: 2px 0;">₹3,40,000</div>
                <div style="font-size: 8px; color: #3AA76D; font-weight: 700;">
                  Discount: ₹1,60,000 • Dividend / Member: ₹6,080
                </div>
              </div>

              <!-- Live Bid Feed -->
              <span class="text-muted" style="font-size: 8px; font-weight: 700; text-transform: uppercase;">Live Bidding Stream</span>
              <div style="display: flex; flex-direction: column; gap: 3px; margin: 4px 0 6px 0;">
                <div style="background: #1D1117; border: 1px solid #3D2837; border-radius: 6px; padding: 4px 8px; display: flex; justify-content: space-between; font-size: 8px;">
                  <span><strong>Bidder #14</strong> (You)</span>
                  <span style="color: #E3C567; font-weight: 700;">₹3,40,000</span>
                </div>
                <div style="background: #1D1117; border: 1px solid #3D2837; border-radius: 6px; padding: 4px 8px; display: flex; justify-content: space-between; font-size: 8px;">
                  <span><strong>Bidder #07</strong></span>
                  <span style="color: #C9B8BE;">₹3,42,000</span>
                </div>
                <div style="background: #1D1117; border: 1px solid #3D2837; border-radius: 6px; padding: 4px 8px; display: flex; justify-content: space-between; font-size: 8px;">
                  <span><strong>Bidder #21</strong></span>
                  <span style="color: #C9B8BE;">₹3,45,000</span>
                </div>
              </div>

              <!-- Quick Bid Buttons -->
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-bottom: 6px;">
                <div class="card card-subtle" style="text-align: center; padding: 4px; font-size: 8px; font-weight: 700; color: #E3C567;">- ₹1,000</div>
                <div class="card card-subtle" style="text-align: center; padding: 4px; font-size: 8px; font-weight: 700; color: #E3C567;">- ₹2,000</div>
                <div class="card card-subtle" style="text-align: center; padding: 4px; font-size: 8px; font-weight: 700; color: #E3C567;">- ₹5,000</div>
              </div>

              <div style="margin-top: auto;">
                <div class="btn-primary" style="width: 100%; background: linear-gradient(135deg, #D94D45, #B8446B);">
                  Place Bid: ₹3,39,000
                </div>
              </div>
            </div>
            <div class="nav-bar-pill"><div class="pill"></div></div>
          </div>
        </div>
      </div>
    </div>

    <div class="screen-notes-panel">
      <span><strong>Component:</strong> <code>LiveAuctionScreen.jsx</code></span>
      <span><strong>Socket:</strong> <code>socket.io-client</code> live price channel &bull; Sub-second latency</span>
      <span><strong>Compliance:</strong> Statutory 40% bid cap ceiling enforced</span>
    </div>
  </div>

  <!-- ==================== SCREEN 8: PAYMENTS ==================== -->
  <div class="page">
    <div class="page-header">
      <div class="page-title-box">
        <span class="screen-num">08 / 12</span>
        <h2 class="screen-title">Payments &amp; Installments</h2>
        <span class="screen-category">Payment Gateway</span>
      </div>
      <div class="screen-desc">
        Installment settlement screen with automatic dividend deduction, UPI/Netbanking gateways, instant digital receipt generation.
      </div>
    </div>

    <div class="screen-spread">
      <!-- Light Mode -->
      <div class="phone-container">
        <div class="phone-label light">Light Mode</div>
        <div class="android-phone frame-light">
          <div class="screen-inner theme-light">
            <div class="status-bar">
              <span>09:41</span>
              <div class="camera-punch"></div>
              <div class="status-icons">5G 98%</div>
            </div>
            <div class="screen-body" style="padding: 4px 8px;">
              <div class="screen-header-bar">
                <span class="brand-title">Payments</span>
                <span class="badge badge-success">UPI AutoPay</span>
              </div>

              <!-- Outstanding Bill Card -->
              <div class="card" style="background: #FFF; border: 1.5px solid #7A1F3D; padding: 8px; margin-bottom: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <div>
                    <span class="text-muted">Month 8 Installment</span>
                    <div style="font-weight: 800; font-size: 11px; color: #7A1F3D;">NCF-PREM-5L</div>
                  </div>
                  <span class="badge badge-maroon" style="font-size: 7px;">Due In 3 Days</span>
                </div>

                <div style="margin-top: 6px; border-top: 1px dashed #E8DCCE; padding-top: 6px; font-size: 8px;">
                  <div style="display: flex; justify-content: space-between; color: #6B5A60;">
                    <span>Gross Installment</span>
                    <span>₹20,000</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; color: #2E7D4F; margin-top: 2px;">
                    <span>Less: Dividend Credit</span>
                    <span>- ₹3,800</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 11px; margin-top: 4px; color: #241016;">
                    <span>Net Payable</span>
                    <span style="color: #7A1F3D;">₹16,200</span>
                  </div>
                </div>
              </div>

              <!-- Payment Method Selection -->
              <span class="text-muted" style="font-size: 8px; font-weight: 700; text-transform: uppercase;">Select Payment Mode</span>
              <div style="display: flex; flex-direction: column; gap: 4px; margin: 4px 0 6px 0;">
                <div class="card card-subtle" style="padding: 5px 8px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 700; font-size: 9px;">UPI (GPay / PhonePe / Paytm)</span>
                  <span style="color: #2E7D4F; font-size: 8px;">Zero Fee</span>
                </div>
                <div class="card card-subtle" style="padding: 5px 8px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 700; font-size: 9px;">Net Banking (NEFT/RTGS/IMPS)</span>
                  <span class="text-muted" style="font-size: 8px;">Instant</span>
                </div>
              </div>

              <div style="margin-top: auto;">
                <div class="btn-primary" style="width: 100%;">Pay ₹16,200 via UPI</div>
              </div>
            </div>
            <div class="nav-bar-pill"><div class="pill"></div></div>
          </div>
        </div>
      </div>

      <!-- Dark Mode -->
      <div class="phone-container">
        <div class="phone-label dark">Dark Mode</div>
        <div class="android-phone frame-dark">
          <div class="screen-inner theme-dark">
            <div class="status-bar" style="color: #F5EDE7;">
              <span>09:41</span>
              <div class="camera-punch"></div>
              <div class="status-icons">5G 98%</div>
            </div>
            <div class="screen-body" style="padding: 4px 8px;">
              <div class="screen-header-bar">
                <span class="brand-title">Payments</span>
                <span class="badge badge-success">UPI AutoPay</span>
              </div>

              <!-- Outstanding Bill Card -->
              <div class="card" style="background: #1D1117; border: 1.5px solid #E3C567; padding: 8px; margin-bottom: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <div>
                    <span class="text-muted">Month 8 Installment</span>
                    <div style="font-weight: 800; font-size: 11px; color: #E3C567;">NCF-PREM-5L</div>
                  </div>
                  <span class="badge badge-maroon" style="font-size: 7px;">Due In 3 Days</span>
                </div>

                <div style="margin-top: 6px; border-top: 1px dashed #3D2837; padding-top: 6px; font-size: 8px;">
                  <div style="display: flex; justify-content: space-between; color: #C9B8BE;">
                    <span>Gross Installment</span>
                    <span>₹20,000</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; color: #3AA76D; margin-top: 2px;">
                    <span>Less: Dividend Credit</span>
                    <span>- ₹3,800</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 11px; margin-top: 4px; color: #F5EDE7;">
                    <span>Net Payable</span>
                    <span style="color: #E3C567;">₹16,200</span>
                  </div>
                </div>
              </div>

              <!-- Payment Method Selection -->
              <span class="text-muted" style="font-size: 8px; font-weight: 700; text-transform: uppercase;">Select Payment Mode</span>
              <div style="display: flex; flex-direction: column; gap: 4px; margin: 4px 0 6px 0;">
                <div class="card card-subtle" style="padding: 5px 8px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 700; font-size: 9px;">UPI (GPay / PhonePe / Paytm)</span>
                  <span style="color: #3AA76D; font-size: 8px;">Zero Fee</span>
                </div>
                <div class="card card-subtle" style="padding: 5px 8px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 700; font-size: 9px;">Net Banking (NEFT/RTGS/IMPS)</span>
                  <span class="text-muted" style="font-size: 8px;">Instant</span>
                </div>
              </div>

              <div style="margin-top: auto;">
                <div class="btn-primary" style="width: 100%;">Pay ₹16,200 via UPI</div>
              </div>
            </div>
            <div class="nav-bar-pill"><div class="pill"></div></div>
          </div>
        </div>
      </div>
    </div>

    <div class="screen-notes-panel">
      <span><strong>Component:</strong> <code>PaymentsScreen.jsx</code></span>
      <span><strong>Gateways:</strong> Razorpay / Cashfree UPI Intent &bull; Netbanking webhook sync</span>
      <span><strong>Compliance:</strong> Automatic digitally signed statutory PDF receipt generation</span>
    </div>
  </div>

  <!-- ==================== SCREEN 9: SURETY & GUARANTOR ==================== -->
  <div class="page">
    <div class="page-header">
      <div class="page-title-box">
        <span class="screen-num">09 / 12</span>
        <h2 class="screen-title">Surety &amp; Guarantor Verification</h2>
        <span class="screen-category">Risk &amp; Compliance</span>
      </div>
      <div class="screen-desc">
        Regulatory prize release workflow with guarantor identity, income slip validation, property pledge tracker, and legal approval status.
      </div>
    </div>

    <div class="screen-spread">
      <!-- Light Mode -->
      <div class="phone-container">
        <div class="phone-label light">Light Mode</div>
        <div class="android-phone frame-light">
          <div class="screen-inner theme-light">
            <div class="status-bar">
              <span>09:41</span>
              <div class="camera-punch"></div>
              <div class="status-icons">5G 98%</div>
            </div>
            <div class="screen-body" style="padding: 4px 8px;">
              <div class="screen-header-bar">
                <span class="brand-title">Prize Surety</span>
                <span class="badge badge-gold">Stage 2/3</span>
              </div>

              <div class="card" style="background: #FAF3DC; border: 1px solid #C9A227; padding: 6px 8px; margin-bottom: 6px;">
                <span class="text-muted">Prize Amount Eligible</span>
                <div style="font-size: 14px; font-weight: 800; color: #7A1F3D;">₹3,40,000</div>
                <span style="font-size: 8px; color: #6B5A60;">Requires 2 Solvency Guarantors per Chit Act</span>
              </div>

              <!-- Guarantor 1: Verified -->
              <div class="card" style="padding: 6px 8px; margin-bottom: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-weight: 700; font-size: 9px;">Guarantor 1: K. Sundaram</div>
                    <span class="text-muted">Govt School Principal • Salary Certificate</span>
                  </div>
                  <span class="badge badge-success">Verified</span>
                </div>
              </div>

              <!-- Guarantor 2: Under Review -->
              <div class="card" style="padding: 6px 8px; margin-bottom: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-weight: 700; font-size: 9px;">Guarantor 2: M. Vasanth</div>
                    <span class="text-muted">IT Professional • Form 16 / ITR V</span>
                  </div>
                  <span class="badge badge-gold">In Review</span>
                </div>
              </div>

              <!-- Document Upload Box -->
              <div class="card card-subtle" style="border: 1px dashed #7A1F3D; text-align: center; padding: 8px; margin-top: 4px;">
                <span style="font-weight: 700; font-size: 9px; color: #7A1F3D;">+ Upload Solvency / Property Doc</span>
                <p class="text-muted" style="margin-top: 2px;">PDF, PNG or JPG max 10MB</p>
              </div>

              <div style="margin-top: auto;">
                <div class="btn-primary" style="width: 100%;">Submit Surety Dossier</div>
              </div>
            </div>
            <div class="nav-bar-pill"><div class="pill"></div></div>
          </div>
        </div>
      </div>

      <!-- Dark Mode -->
      <div class="phone-container">
        <div class="phone-label dark">Dark Mode</div>
        <div class="android-phone frame-dark">
          <div class="screen-inner theme-dark">
            <div class="status-bar" style="color: #F5EDE7;">
              <span>09:41</span>
              <div class="camera-punch"></div>
              <div class="status-icons">5G 98%</div>
            </div>
            <div class="screen-body" style="padding: 4px 8px;">
              <div class="screen-header-bar">
                <span class="brand-title">Prize Surety</span>
                <span class="badge badge-gold">Stage 2/3</span>
              </div>

              <div class="card" style="background: #2E2611; border: 1px solid #D6A429; padding: 6px 8px; margin-bottom: 6px;">
                <span class="text-muted">Prize Amount Eligible</span>
                <div style="font-size: 14px; font-weight: 800; color: #E3C567;">₹3,40,000</div>
                <span style="font-size: 8px; color: #C9B8BE;">Requires 2 Solvency Guarantors per Chit Act</span>
              </div>

              <!-- Guarantor 1: Verified -->
              <div class="card" style="padding: 6px 8px; margin-bottom: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-weight: 700; font-size: 9px;">Guarantor 1: K. Sundaram</div>
                    <span class="text-muted">Govt School Principal • Salary Certificate</span>
                  </div>
                  <span class="badge badge-success">Verified</span>
                </div>
              </div>

              <!-- Guarantor 2: Under Review -->
              <div class="card" style="padding: 6px 8px; margin-bottom: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-weight: 700; font-size: 9px;">Guarantor 2: M. Vasanth</div>
                    <span class="text-muted">IT Professional • Form 16 / ITR V</span>
                  </div>
                  <span class="badge badge-gold">In Review</span>
                </div>
              </div>

              <!-- Document Upload Box -->
              <div class="card card-subtle" style="border: 1px dashed #E3C567; text-align: center; padding: 8px; margin-top: 4px;">
                <span style="font-weight: 700; font-size: 9px; color: #E3C567;">+ Upload Solvency / Property Doc</span>
                <p class="text-muted" style="margin-top: 2px;">PDF, PNG or JPG max 10MB</p>
              </div>

              <div style="margin-top: auto;">
                <div class="btn-primary" style="width: 100%;">Submit Surety Dossier</div>
              </div>
            </div>
            <div class="nav-bar-pill"><div class="pill"></div></div>
          </div>
        </div>
      </div>
    </div>

    <div class="screen-notes-panel">
      <span><strong>Component:</strong> <code>SuretyScreen.jsx</code></span>
      <span><strong>Audit Track:</strong> Aadhaar OTP eSign &bull; Form 16 verification &bull; Foreman scrutiny</span>
      <span><strong>Disbursement:</strong> Prize money escrow dispatch within 48h of approval</span>
    </div>
  </div>

  <!-- ==================== SCREEN 10: NOTIFICATIONS ==================== -->
  <div class="page">
    <div class="page-header">
      <div class="page-title-box">
        <span class="screen-num">10 / 12</span>
        <h2 class="screen-title">Notifications &amp; Alert Center</h2>
        <span class="screen-category">Communication &amp; Alerts</span>
      </div>
      <div class="screen-desc">
        Instant event notifications for auction announcements, dividend credit slips, upcoming payment deadlines, and KYC approvals.
      </div>
    </div>

    <div class="screen-spread">
      <!-- Light Mode -->
      <div class="phone-container">
        <div class="phone-label light">Light Mode</div>
        <div class="android-phone frame-light">
          <div class="screen-inner theme-light">
            <div class="status-bar">
              <span>09:41</span>
              <div class="camera-punch"></div>
              <div class="status-icons">5G 98%</div>
            </div>
            <div class="screen-body" style="padding: 4px 8px;">
              <div class="screen-header-bar">
                <span class="brand-title">Alert Center</span>
                <span style="font-size: 8px; color: #7A1F3D; font-weight: 700;">Mark all read</span>
              </div>

              <!-- Notifications list -->
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <div class="card" style="background: #FFF; border: 1px solid #7A1F3D; padding: 6px 8px;">
                  <div style="display: flex; justify-content: space-between;">
                    <span class="badge badge-maroon">Live Auction Alert</span>
                    <span class="text-muted">10m ago</span>
                  </div>
                  <div style="font-weight: 700; font-size: 9px; margin-top: 3px;">NCF-PREM-5L auction starting soon</div>
                  <p class="text-secondary" style="font-size: 8px; margin-top: 1px;">Join room by 10:30 AM to place your bid.</p>
                </div>

                <div class="card" style="padding: 6px 8px;">
                  <div style="display: flex; justify-content: space-between;">
                    <span class="badge badge-success">Dividend Credited</span>
                    <span class="text-muted">Yesterday</span>
                  </div>
                  <div style="font-weight: 700; font-size: 9px; margin-top: 3px;">₹3,800 credited for Month 7</div>
                  <p class="text-secondary" style="font-size: 8px; margin-top: 1px;">Adjusted against your next installment.</p>
                </div>

                <div class="card" style="padding: 6px 8px;">
                  <div style="display: flex; justify-content: space-between;">
                    <span class="badge badge-gold">Payment Reminder</span>
                    <span class="text-muted">2d ago</span>
                  </div>
                  <div style="font-weight: 700; font-size: 9px; margin-top: 3px;">Installment due on 28th Sept</div>
                  <p class="text-secondary" style="font-size: 8px; margin-top: 1px;">Avoid late surcharge by paying online.</p>
                </div>
              </div>
            </div>
            <div class="nav-bar-pill"><div class="pill"></div></div>
          </div>
        </div>
      </div>

      <!-- Dark Mode -->
      <div class="phone-container">
        <div class="phone-label dark">Dark Mode</div>
        <div class="android-phone frame-dark">
          <div class="screen-inner theme-dark">
            <div class="status-bar" style="color: #F5EDE7;">
              <span>09:41</span>
              <div class="camera-punch"></div>
              <div class="status-icons">5G 98%</div>
            </div>
            <div class="screen-body" style="padding: 4px 8px;">
              <div class="screen-header-bar">
                <span class="brand-title">Alert Center</span>
                <span style="font-size: 8px; color: #E3C567; font-weight: 700;">Mark all read</span>
              </div>

              <!-- Notifications list -->
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <div class="card" style="background: #1D1117; border: 1px solid #E3C567; padding: 6px 8px;">
                  <div style="display: flex; justify-content: space-between;">
                    <span class="badge badge-maroon">Live Auction Alert</span>
                    <span class="text-muted">10m ago</span>
                  </div>
                  <div style="font-weight: 700; font-size: 9px; margin-top: 3px;">NCF-PREM-5L auction starting soon</div>
                  <p class="text-secondary" style="font-size: 8px; margin-top: 1px;">Join room by 10:30 AM to place your bid.</p>
                </div>

                <div class="card" style="padding: 6px 8px;">
                  <div style="display: flex; justify-content: space-between;">
                    <span class="badge badge-success">Dividend Credited</span>
                    <span class="text-muted">Yesterday</span>
                  </div>
                  <div style="font-weight: 700; font-size: 9px; margin-top: 3px;">₹3,800 credited for Month 7</div>
                  <p class="text-secondary" style="font-size: 8px; margin-top: 1px;">Adjusted against your next installment.</p>
                </div>

                <div class="card" style="padding: 6px 8px;">
                  <div style="display: flex; justify-content: space-between;">
                    <span class="badge badge-gold">Payment Reminder</span>
                    <span class="text-muted">2d ago</span>
                  </div>
                  <div style="font-weight: 700; font-size: 9px; margin-top: 3px;">Installment due on 28th Sept</div>
                  <p class="text-secondary" style="font-size: 8px; margin-top: 1px;">Avoid late surcharge by paying online.</p>
                </div>
              </div>
            </div>
            <div class="nav-bar-pill"><div class="pill"></div></div>
          </div>
        </div>
      </div>
    </div>

    <div class="screen-notes-panel">
      <span><strong>Component:</strong> <code>NotificationsScreen.jsx</code></span>
      <span><strong>Channels:</strong> Push Notification (FCM) &bull; In-App Tray &bull; SMS Alerts</span>
      <span><strong>Categories:</strong> Auction, Billing, Dividends, Security</span>
    </div>
  </div>

  <!-- ==================== SCREEN 11: PROFILE & KYC ==================== -->
  <div class="page">
    <div class="page-header">
      <div class="page-title-box">
        <span class="screen-num">11 / 12</span>
        <h2 class="screen-title">Profile &amp; Member Settings</h2>
        <span class="screen-category">Account &amp; Governance</span>
      </div>
      <div class="screen-desc">
        Member credentials, government ID verification (Aadhaar &amp; PAN), linked bank accounts, biometric toggle, and security preferences.
      </div>
    </div>

    <div class="screen-spread">
      <!-- Light Mode -->
      <div class="phone-container">
        <div class="phone-label light">Light Mode</div>
        <div class="android-phone frame-light">
          <div class="screen-inner theme-light">
            <div class="status-bar">
              <span>09:41</span>
              <div class="camera-punch"></div>
              <div class="status-icons">5G 98%</div>
            </div>
            <div class="screen-body" style="padding: 4px 8px;">
              <div class="screen-header-bar">
                <span class="brand-title">Member Profile</span>
                <span class="badge badge-success">Aadhaar Linked</span>
              </div>

              <!-- Profile summary card -->
              <div class="card" style="text-align: center; padding: 8px; margin-bottom: 6px;">
                <div style="width: 44px; height: 44px; border-radius: 50%; background: #7A1F3D; color: #FFF; font-weight: 800; font-size: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 4px;">
                  RK
                </div>
                <div style="font-weight: 800; font-size: 12px; color: #241016;">Rajesh Kumar</div>
                <span class="text-secondary" style="font-size: 8px;">+91 98765 43210 • Member #NCF-8821</span>
              </div>

              <!-- KYC & Bank Details -->
              <div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 6px;">
                <div class="card card-subtle" style="padding: 5px 8px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 8px; font-weight: 700;">PAN Card</span>
                  <span class="text-muted" style="font-size: 8px;">ABCDE1234F • Verified</span>
                </div>
                <div class="card card-subtle" style="padding: 5px 8px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 8px; font-weight: 700;">Bank Account</span>
                  <span class="text-muted" style="font-size: 8px;">HDFC Bank •••• 4921</span>
                </div>
                <div class="card card-subtle" style="padding: 5px 8px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 8px; font-weight: 700;">Biometric Fingerprint</span>
                  <span style="color: #2E7D4F; font-size: 8px; font-weight: 700;">Enabled</span>
                </div>
              </div>

              <div style="margin-top: auto;">
                <div class="btn-primary" style="width: 100%; background: #FCECEB; color: #B3261E; border: 1px solid #B3261E; box-shadow: none;">
                  Logout of Device
                </div>
              </div>
            </div>
            <div class="nav-bar-pill"><div class="pill"></div></div>
          </div>
        </div>
      </div>

      <!-- Dark Mode -->
      <div class="phone-container">
        <div class="phone-label dark">Dark Mode</div>
        <div class="android-phone frame-dark">
          <div class="screen-inner theme-dark">
            <div class="status-bar" style="color: #F5EDE7;">
              <span>09:41</span>
              <div class="camera-punch"></div>
              <div class="status-icons">5G 98%</div>
            </div>
            <div class="screen-body" style="padding: 4px 8px;">
              <div class="screen-header-bar">
                <span class="brand-title">Member Profile</span>
                <span class="badge badge-success">Aadhaar Linked</span>
              </div>

              <!-- Profile summary card -->
              <div class="card" style="text-align: center; padding: 8px; margin-bottom: 6px;">
                <div style="width: 44px; height: 44px; border-radius: 50%; background: #B8446B; color: #FFF; font-weight: 800; font-size: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 4px;">
                  RK
                </div>
                <div style="font-weight: 800; font-size: 12px; color: #F5EDE7;">Rajesh Kumar</div>
                <span class="text-secondary" style="font-size: 8px;">+91 98765 43210 • Member #NCF-8821</span>
              </div>

              <!-- KYC & Bank Details -->
              <div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 6px;">
                <div class="card card-subtle" style="padding: 5px 8px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 8px; font-weight: 700;">PAN Card</span>
                  <span class="text-muted" style="font-size: 8px;">ABCDE1234F • Verified</span>
                </div>
                <div class="card card-subtle" style="padding: 5px 8px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 8px; font-weight: 700;">Bank Account</span>
                  <span class="text-muted" style="font-size: 8px;">HDFC Bank •••• 4921</span>
                </div>
                <div class="card card-subtle" style="padding: 5px 8px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 8px; font-weight: 700;">Biometric Fingerprint</span>
                  <span style="color: #3AA76D; font-size: 8px; font-weight: 700;">Enabled</span>
                </div>
              </div>

              <div style="margin-top: auto;">
                <div class="btn-primary" style="width: 100%; background: #331616; color: #D94D45; border: 1px solid #D94D45; box-shadow: none;">
                  Logout of Device
                </div>
              </div>
            </div>
            <div class="nav-bar-pill"><div class="pill"></div></div>
          </div>
        </div>
      </div>
    </div>

    <div class="screen-notes-panel">
      <span><strong>Component:</strong> <code>ProfileScreen.jsx</code></span>
      <span><strong>Security:</strong> SecureStore JWT credential management &bull; Biometric prompt</span>
      <span><strong>Compliance:</strong> KYC status tied to State Chit Registrar API validation</span>
    </div>
  </div>

  <!-- ==================== SCREEN 12: FOREMAN DASHBOARD ==================== -->
  <div class="page">
    <div class="page-header">
      <div class="page-title-box">
        <span class="screen-num">12 / 12</span>
        <h2 class="screen-title">Foreman Regulatory Dashboard</h2>
        <span class="screen-category">Administration &amp; Audit</span>
      </div>
      <div class="screen-desc">
        Admin &amp; foreman operational hub with portfolio AUM, collection efficiency, PSO statutory filings, and reverse auction oversight.
      </div>
    </div>

    <div class="screen-spread">
      <!-- Light Mode -->
      <div class="phone-container">
        <div class="phone-label light">Light Mode</div>
        <div class="android-phone frame-light">
          <div class="screen-inner theme-light">
            <div class="status-bar">
              <span>09:41</span>
              <div class="camera-punch"></div>
              <div class="status-icons">5G 98%</div>
            </div>
            <div class="screen-body" style="padding: 4px 8px;">
              <div class="screen-header-bar">
                <span class="brand-title">Foreman Hub</span>
                <span class="badge badge-gold">Admin Role</span>
              </div>

              <!-- AUM Card -->
              <div class="card" style="background: linear-gradient(135deg, #7A1F3D, #4E1327); color: #FFF; padding: 8px; margin-bottom: 6px; border: none;">
                <span style="font-size: 8px; color: #E8DCCE; text-transform: uppercase;">Total Active AUM</span>
                <div style="font-family: var(--font-display); font-size: 17px; font-weight: 800; color: #E3C567;">₹4.20 Crore</div>
                <div style="display: flex; justify-content: space-between; font-size: 8px; margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 4px;">
                  <span>14 Active Chit Groups</span>
                  <span>Collection: <strong>96.4%</strong></span>
                </div>
              </div>

              <!-- Quick stats -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 6px;">
                <div class="card" style="padding: 6px;">
                  <span class="text-muted">Today's Auctions</span>
                  <div style="font-weight: 700; font-size: 11px; color: #7A1F3D;">2 Scheduled</div>
                </div>
                <div class="card" style="padding: 6px;">
                  <span class="text-muted">Pending KYC</span>
                  <div style="font-weight: 700; font-size: 11px; color: #B8860B;">9 Members</div>
                </div>
              </div>

              <!-- Regulatory actions -->
              <span class="text-muted" style="font-size: 8px; font-weight: 700; text-transform: uppercase;">Statutory Filings</span>
              <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 3px;">
                <div class="card card-subtle" style="padding: 5px 8px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 700; font-size: 8px;">PSO Monthly Form XX</span>
                  <span class="badge badge-success">Filed</span>
                </div>
                <div class="card card-subtle" style="padding: 5px 8px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 700; font-size: 8px;">Reserve Bank Returns</span>
                  <span class="badge badge-gold">Due in 5d</span>
                </div>
              </div>

              <div style="margin-top: auto;">
                <div class="btn-primary" style="width: 100%;">Open Auction Admin Console</div>
              </div>
            </div>
            <div class="nav-bar-pill"><div class="pill"></div></div>
          </div>
        </div>
      </div>

      <!-- Dark Mode -->
      <div class="phone-container">
        <div class="phone-label dark">Dark Mode</div>
        <div class="android-phone frame-dark">
          <div class="screen-inner theme-dark">
            <div class="status-bar" style="color: #F5EDE7;">
              <span>09:41</span>
              <div class="camera-punch"></div>
              <div class="status-icons">5G 98%</div>
            </div>
            <div class="screen-body" style="padding: 4px 8px;">
              <div class="screen-header-bar">
                <span class="brand-title">Foreman Hub</span>
                <span class="badge badge-gold">Admin Role</span>
              </div>

              <!-- AUM Card -->
              <div class="card" style="background: linear-gradient(135deg, #B8446B, #7A1F3D); color: #FFF; padding: 8px; margin-bottom: 6px; border: none;">
                <span style="font-size: 8px; color: #E8DCCE; text-transform: uppercase;">Total Active AUM</span>
                <div style="font-family: var(--font-display); font-size: 17px; font-weight: 800; color: #E3C567;">₹4.20 Crore</div>
                <div style="display: flex; justify-content: space-between; font-size: 8px; margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 4px;">
                  <span>14 Active Chit Groups</span>
                  <span>Collection: <strong>96.4%</strong></span>
                </div>
              </div>

              <!-- Quick stats -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 6px;">
                <div class="card" style="padding: 6px;">
                  <span class="text-muted">Today's Auctions</span>
                  <div style="font-weight: 700; font-size: 11px; color: #E3C567;">2 Scheduled</div>
                </div>
                <div class="card" style="padding: 6px;">
                  <span class="text-muted">Pending KYC</span>
                  <div style="font-weight: 700; font-size: 11px; color: #D6A429;">9 Members</div>
                </div>
              </div>

              <!-- Regulatory actions -->
              <span class="text-muted" style="font-size: 8px; font-weight: 700; text-transform: uppercase;">Statutory Filings</span>
              <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 3px;">
                <div class="card card-subtle" style="padding: 5px 8px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 700; font-size: 8px;">PSO Monthly Form XX</span>
                  <span class="badge badge-success">Filed</span>
                </div>
                <div class="card card-subtle" style="padding: 5px 8px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 700; font-size: 8px;">Reserve Bank Returns</span>
                  <span class="badge badge-gold">Due in 5d</span>
                </div>
              </div>

              <div style="margin-top: auto;">
                <div class="btn-primary" style="width: 100%;">Open Auction Admin Console</div>
              </div>
            </div>
            <div class="nav-bar-pill"><div class="pill"></div></div>
          </div>
        </div>
      </div>
    </div>

    <div class="screen-notes-panel">
      <span><strong>Component:</strong> <code>ForemanDashboardScreen.jsx</code></span>
      <span><strong>Supervision:</strong> Real-time member default flag &bull; Registrar minute filing</span>
      <span><strong>Controls:</strong> Auction start/stop &bull; Bid dispute resolution &bull; Audit log export</span>
    </div>
  </div>

</body>
</html>
`;
}

async function main() {
  console.log('Writing HTML design catalog...');
  fs.writeFileSync(OUTPUT_HTML, generateHTML(), 'utf-8');
  console.log('HTML generated at:', OUTPUT_HTML);

  const chromePath = 'C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe';
  const edgePath = 'C:\\\\Program Files (x86)\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe';

  const browserPath = fs.existsSync(chromePath) ? chromePath : edgePath;
  console.log('Using browser binary:', browserPath);

  console.log('Generating PDF via headless browser...');
  const fileUrl = 'file:///' + OUTPUT_HTML.replace(/\\\\/g, '/');

  const cmd = `"${browserPath}" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${OUTPUT_PDF}" "${fileUrl}"`;
  console.log('Executing command...');

  execSync(cmd, { stdio: 'inherit' });

  if (fs.existsSync(OUTPUT_PDF)) {
    const stats = fs.statSync(OUTPUT_PDF);
    console.log('SUCCESS! PDF generated successfully.');
    console.log('File:', OUTPUT_PDF);
    console.log('Size:', (stats.size / 1024).toFixed(1), 'KB');
  } else {
    console.error('ERROR: Output PDF was not found.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
