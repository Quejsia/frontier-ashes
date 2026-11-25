// Frontier Ashes — reliable START EXPEDITION bridge.
// The title screen and legacy game both used to install their own handlers on
// #start. This file is the single final entry point and handles mouse + touch.
(function () {
  let activated = false;

  function enterFullscreen() {
    try {
      const root = document.documentElement;
      if (document.fullscreenElement || !root.requestFullscreen) return;
      const request = root.requestFullscreen({ navigationUI: 'hide' });
      if (request && request.then) {
        request.then(function () {
          const o = window.screen && window.screen.orientation;
          if (o && o.lock) return o.lock('landscape');
        }).catch(function () {});
      }
    } catch (error) {}
  }

  function activate(event) {
    const target = event && event.target;
    const button = target && target.closest ? target.closest('#start') : document.getElementById('start');
    if (!button) return;

    if (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }

    enterFullscreen();

    // Prevent pointerup + click + touchend from opening the menu multiple times.
    if (activated) return;
    activated = true;

    const screen = document.getElementById('start-screen');
    const menu = document.getElementById('raid-menu');

    // Always give the player immediate visual feedback, even if another legacy
    // handler throws an error.
    if (screen) screen.style.display = 'none';
    if (menu) menu.style.display = 'grid';

    try {
      if (typeof globalThis.openRaidMenu === 'function') {
        globalThis.openRaidMenu();
      }
    } catch (error) {
      console.error('Frontier Ashes: START EXPEDITION failed.', error);
      // Keep the safehouse visible if the legacy handler failed.
      if (screen) screen.style.display = 'none';
      if (menu) menu.style.display = 'grid';
    }

    // Allow another attempt after the current event cycle.
    setTimeout(function () { activated = false; }, 350);
  }

  // Capture at document level so the button works even when another script
  // has attached a competing handler directly to #start.
  document.addEventListener('pointerdown', activate, true);
  document.addEventListener('click', activate, true);
  document.addEventListener('touchend', activate, true);

  // Make the visible button explicitly interactive once the DOM is ready.
  function prepareButton() {
    const button = document.getElementById('start');
    if (!button) return;
    button.type = 'button';
    button.disabled = false;
    button.style.pointerEvents = 'auto';
    button.style.touchAction = 'manipulation';
    button.style.position = 'relative';
    button.style.zIndex = '100';
  }

  prepareButton();
  window.addEventListener('load', prepareButton);
})();

(function () {
  const root = document.documentElement;
  if (!root.requestFullscreen) return;
  const ENTER = '<svg viewBox="0 0 24 24" width="60%" height="60%" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
  const EXIT = '<svg viewBox="0 0 24 24" width="60%" height="60%" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
  function install() {
    if (document.getElementById('fullscreen-btn')) return;
    const pause = document.getElementById('pause-btn');
    if (!pause || !pause.parentNode) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'fullscreen-btn';
    btn.className = 'hud-btn';
    function sync() {
      const on = !!document.fullscreenElement;
      btn.innerHTML = on ? EXIT : ENTER;
      btn.setAttribute('aria-label', on ? 'Exit fullscreen' : 'Enter fullscreen');
    }
    function toggle(event) {
      event.preventDefault();
      if (document.fullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen().catch(function () {});
        return;
      }
      try {
        const request = root.requestFullscreen({ navigationUI: 'hide' });
        if (request && request.then) {
          request.then(function () {
            const o = window.screen && window.screen.orientation;
            if (o && o.lock) return o.lock('landscape');
          }).catch(function () {});
        }
      } catch (error) {}
    }
    btn.addEventListener('pointerup', toggle);
    btn.addEventListener('click', function (event) { event.preventDefault(); });
    document.addEventListener('fullscreenchange', sync);
    pause.parentNode.insertBefore(btn, pause);
    sync();
  }
  install();
  window.addEventListener('load', install);
})();
