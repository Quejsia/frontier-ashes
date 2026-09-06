/* Frontier Ashes — Phase 2.1: connect the selected loadout to gameplay.
   This is intentionally isolated from game-v3.js so the existing combat code stays intact. */
(function(){
  const WEAPON_STATS={
    'Rust Pistol':      {mag:12,fireRate:.18,bulletSpeed:420},
    'Service Pistol':   {mag:15,fireRate:.16,bulletSpeed:430},
    'Combat SMG':       {mag:30,fireRate:.085,bulletSpeed:440},
    'Pump Shotgun':     {mag:6, fireRate:.55,bulletSpeed:360},
    'Assault Rifle':    {mag:30,fireRate:.11,bulletSpeed:500},
    'Marksman Rifle':   {mag:8, fireRate:.48,bulletSpeed:650},
    'Thunderbolt AR':   {mag:36,fireRate:.095,bulletSpeed:530},
    'Wasteland Reaper': {mag:10,fireRate:.38,bulletSpeed:620},
    'ARGUS Prototype':  {mag:20,fireRate:.13,bulletSpeed:560},
    'Ashen Nova':       {mag:24,fireRate:.105,bulletSpeed:600}
  };

  function selectedWeapon(){return loadout&&loadout.weapon?loadout.weapon:null}
  function stats(){
    const w=selectedWeapon();
    return WEAPON_STATS[w&&w.name]||WEAPON_STATS['Rust Pistol'];
  }

  // game-v3.js currently resets to Rust Pistol values. Apply the selected
  // loadout immediately after its existing reset logic runs.
  const originalReset=window.reset;
  if(typeof originalReset==='function'){
    window.reset=function(){
      originalReset();
      const w=selectedWeapon();
      if(!w)return;
      const s=stats();
      player.mag=s.mag;
      player.ammo=s.mag;
      player.ammoType=loadout.ammoType||w.ammo||'9mm Ammo';
      player.reserve=Math.max(0,Number(loadout.ammo)||0);
      Object.keys(inv).forEach(k=>{if(k!=='Weapons')inv[k]=0});
      inv.Weapons=1;
      inv[player.ammoType]=player.reserve;
      updateHud();
      updateInventory();
    };
  }

  // Reload from the selected weapon's ammo pool instead of hard-coded 9mm.
  const originalReload=window.reload;
  if(typeof originalReload==='function'){
    window.reload=function(){
      const type=player.ammoType||'9mm Ammo';
      if(player.reloading||player.ammo===player.mag||player.reserve<=0)return;
      player.reloading=true;
      showMessage('Reloading...');
      setTimeout(()=>{
        if(!player.reloading)return;
        const amount=Math.min(player.mag-player.ammo,player.reserve);
        player.ammo+=amount;
        player.reserve-=amount;
        inv[type]=player.reserve;
        player.reloading=false;
        updateHud();
        updateInventory();
        showMessage('Reloaded');
      },650);
    };
  }

  // Keep the original bullet/damage collision system, but make the selected
  // weapon's magazine, fire cadence and projectile speed real in gameplay.
  const originalFire=window.fire;
  if(typeof originalFire==='function'){
    window.fire=function(){
      if(!running||paused||lootOpen||player.reloading||shootCooldown>0)return;
      if(player.ammo<=0){showMessage('OUT OF AMMO — tap reload');return;}
      const s=stats();
      player.ammo--;
      shootCooldown=s.fireRate;
      const a=player.angle;
      bullets.push({
        x:player.x+Math.cos(a)*12,
        y:player.y+Math.sin(a)*12,
        vx:Math.cos(a)*s.bulletSpeed,
        vy:Math.sin(a)*s.bulletSpeed,
        life:1.1
      });
      burst(player.x+Math.cos(a)*12,player.y+Math.sin(a)*12,4);
      updateHud();
    };
  }
})();
