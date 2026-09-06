// Frontier Ashes — reliable START EXPEDITION bridge.
// The title screen and legacy game both used to install their own handlers on
// #start. This file is the single final entry point and handles mouse + touch.
(function () {
  let activated = false;

  function activate(event) {
    const target = event && event.target;
    const button = target && target.closest ? target.closest('#start') : document.getElementById('start');
    if (!button) return;

    if (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }

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
