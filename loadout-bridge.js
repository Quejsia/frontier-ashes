/* Frontier Ashes — Phase 2.4: rarity-based weapon stats.
   Weapon rarity now affects damage, magazine size, fire cadence and projectile speed. */
(function(){
  const BASE_STATS={
    'Rust Pistol':      {mag:12,damage:25,fireRate:.18,bulletSpeed:420},
    'Service Pistol':   {mag:15,damage:27,fireRate:.16,bulletSpeed:430},
    'Combat SMG':       {mag:30,damage:19,fireRate:.085,bulletSpeed:440},
    'Pump Shotgun':     {mag:6, damage:45,fireRate:.55,bulletSpeed:360},
    'Assault Rifle':    {mag:30,damage:28,fireRate:.11,bulletSpeed:500},
    'Marksman Rifle':   {mag:8, damage:55,fireRate:.48,bulletSpeed:650},
    'Thunderbolt AR':   {mag:36,damage:32,fireRate:.095,bulletSpeed:530},
    'Wasteland Reaper': {mag:10,damage:72,fireRate:.38,bulletSpeed:620},
    'ARGUS Prototype':  {mag:20,damage:64,fireRate:.13,bulletSpeed:560},
    'Ashen Nova':       {mag:24,damage:78,fireRate:.105,bulletSpeed:600}
  };

  const RARITY_MULT={
    Common:1,
    Uncommon:1.08,
    Epic:1.18,
    Legendary:1.30,
    Mythic:1.44,
    Secret:1.60,
    Special:1.78
  };

  function selectedWeapon(){return loadout&&loadout.weapon?loadout.weapon:null}
  function rarity(){const w=selectedWeapon();return w&&w.rarity||'Common'}
  function stats(){
    const w=selectedWeapon();
    const base=BASE_STATS[w&&w.name]||BASE_STATS['Rust Pistol'];
    const mult=RARITY_MULT[rarity()]||1;
    return {
      mag:Math.max(1,Math.round(base.mag*(1+((mult-1)*.55)))),
      damage:Math.max(1,Math.round(base.damage*mult)),
      fireRate:Math.max(.045,base.fireRate*(1-((mult-1)*.20))),
      bulletSpeed:Math.round(base.bulletSpeed*(1+((mult-1)*.35)))
    };
  }

  window.FrontierAshesWeaponStats={stats,rarityMultipliers:RARITY_MULT};

  const originalReset=window.reset;
  if(typeof originalReset==='function'){
    window.reset=function(){
      originalReset();
      const w=selectedWeapon();if(!w)return;
      const s=stats();
      player.mag=s.mag;
      player.ammo=s.mag;
      player.ammoType=loadout.ammoType||w.ammo||'9mm Ammo';
      player.reserve=Math.max(0,Number(loadout.ammo)||0);
      Object.keys(inv).forEach(k=>{if(k!=='Weapons')inv[k]=0});
      inv.Weapons=1;
      inv[player.ammoType]=player.reserve;
      updateHud();updateInventory();
    };
  }

  const originalReload=window.reload;
  if(typeof originalReload==='function'){
    window.reload=function(){
      const type=player.ammoType||'9mm Ammo';
      if(player.reloading||player.ammo===player.mag||player.reserve<=0)return;
      player.reloading=true;showMessage('Reloading...');
      setTimeout(()=>{
        if(!player.reloading)return;
        const amount=Math.min(player.mag-player.ammo,player.reserve);
        player.ammo+=amount;player.reserve-=amount;inv[type]=player.reserve;
        player.reloading=false;updateHud();updateInventory();showMessage('Reloaded');
      },650);
    };
  }

  const originalFire=window.fire;
  if(typeof originalFire==='function'){
    window.fire=function(){
      if(!running||paused||lootOpen||player.reloading||shootCooldown>0)return;
      if(player.ammo<=0){showMessage('OUT OF AMMO — tap reload');return}
      const s=stats();player.ammo--;shootCooldown=s.fireRate;
      const a=player.angle;
      bullets.push({x:player.x+Math.cos(a)*12,y:player.y+Math.sin(a)*12,vx:Math.cos(a)*s.bulletSpeed,vy:Math.sin(a)*s.bulletSpeed,life:1.1,damage:s.damage});
      burst(player.x+Math.cos(a)*12,player.y+Math.sin(a)*12,4);updateHud();
    };
  }
})();