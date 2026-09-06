// Frontier Ashes — mobile-safe START EXPEDITION bridge.
// Runs after the legacy and loadout scripts so the visible start button
// always has a working touch/click path into the Safehouse.
(function () {
  function bind() {
    const button = document.getElementById('start');
    if (!button) return false;

    const activate = function (event) {
      if (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      if (typeof globalThis.openRaidMenu === 'function') {
        globalThis.openRaidMenu();
        return;
      }

      // Defensive fallback if the loadout script failed before exposing its API.
      const screen = document.getElementById('start-screen');
      const menu = document.getElementById('raid-menu');
      if (screen && menu) {
        screen.style.display = 'none';
        menu.style.display = 'grid';
      }
    };

    button.addEventListener('click', activate, true);
    button.addEventListener('pointerup', activate, true);
    button.addEventListener('touchend', activate, true);
    button.style.pointerEvents = 'auto';
    button.style.position = 'relative';
    button.style.zIndex = '2';
    return true;
  }

  if (!bind()) {
    const timer = setInterval(function () {
      if (bind()) clearInterval(timer);
    }, 100);
    setTimeout(function () { clearInterval(timer); }, 5000);
  }
})();
