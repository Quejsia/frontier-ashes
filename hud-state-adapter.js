/* Frontier Ashes — Phase 1, Commit 3: HUD state adapter.
   Non-destructive migration layer. The legacy updateHud implementation and its
   cache variables remain in game-v3.js until this adapter is confirmed in-game.
*/
(function(){
  function snapshot(playerState, nearCrateReader){
    return {
      hp: Math.ceil(playerState.hp),
      maxHp: playerState.maxHp,
      ammo: playerState.ammo,
      reserve: playerState.reserve,
      dodgeCooldown: playerState.dodgeCooldown,
      nearCrate: !!nearCrateReader()
    };
  }

  window.FrontierAshesHudState = { snapshot };

  // Replace the global HUD entry point without deleting the legacy version.
  // Rendering is intentionally identical; only the state source changes.
  const legacyUpdateHud = window.updateHud;
  window.updateHud = function(){
    const state = snapshot(player, nearbyCrate);

    document.getElementById('hp-fill').style.width = `${Math.max(0,player.hp/player.maxHp*100)}%`;
    document.getElementById('hp-text').textContent = `${state.hp}/${state.maxHp}`;
    document.getElementById('ammo-text').textContent = `${state.ammo}/${state.reserve}`;

    const dodge = document.getElementById('dodge');
    if(state.dodgeCooldown>0){
      dodge.textContent = Math.ceil(state.dodgeCooldown);
      dodge.classList.add('cooling');
    }else{
      dodge.textContent = '↯';
      dodge.classList.remove('cooling');
    }

    document.getElementById('interact').classList.toggle('hidden',!state.nearCrate||lootOpen);
    updateInventory();
  };

  // Keep a reference to the legacy function for debugging/rollback visibility.
  window.FrontierAshesHudState.legacyUpdateHud = legacyUpdateHud;
})();
