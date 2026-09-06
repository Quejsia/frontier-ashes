/* Frontier Ashes — Phase 2.2: separate in-raid gun loadout.
   Inspired by extraction-shooter patterns: a deployment weapon plus a small
   field weapon rack for guns found during the raid. */
(function(){
  const STATS={
    'Rust Pistol':{mag:12,fireRate:.18,bulletSpeed:420},
    'Service Pistol':{mag:15,fireRate:.16,bulletSpeed:430},
    'Combat SMG':{mag:30,fireRate:.085,bulletSpeed:440},
    'Pump Shotgun':{mag:6,fireRate:.55,bulletSpeed:360},
    'Assault Rifle':{mag:30,fireRate:.11,bulletSpeed:500},
    'Marksman Rifle':{mag:8,fireRate:.48,bulletSpeed:650},
    'Thunderbolt AR':{mag:36,fireRate:.095,bulletSpeed:530},
    'Wasteland Reaper':{mag:10,fireRate:.38,bulletSpeed:620},
    'ARGUS Prototype':{mag:20,fireRate:.13,bulletSpeed:560},
    'Ashen Nova':{mag:24,fireRate:.105,bulletSpeed:600}
  };
  const rarityColor=name=>({Common:'#d3d6d8',Uncommon:'#69c875',Epic:'#bc7bf1',Legendary:'#f1a24b',Mythic:'#e754d8',Secret:'#44d8ef',Special:'#ffe66b'})[name]||'#fff';
  let slots=[null,null],activeSlot=0,initialized=false;

  const style=document.createElement('style');
  style.textContent=`
    #gun-loadout-panel{position:absolute;inset:0;z-index:60;display:none;place-items:center;background:#05090ced;padding:14px}
    .gun-card{width:min(92vw,560px);max-height:84vh;overflow:auto;background:#10171b;border:2px solid #68757a;box-shadow:0 16px 60px #000;padding:16px}
    .gun-card h2{margin:2px 0 10px;font-size:22px}.gun-kicker{font-size:8px;letter-spacing:2px;color:#879396}
    .gun-slots{display:grid;grid-template-columns:1fr 1fr;gap:8px}.gun-slot{background:#172125;border:2px solid #39464a;padding:10px;min-height:86px}.gun-slot.active{border-color:#d36b63;background:#251719}
    .gun-slot b{display:block;font-size:12px}.gun-slot small{display:block;color:#aeb8ba;margin-top:4px}.gun-slot button{margin-top:8px;width:100%}
    .gun-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.gun-card button{background:#1d292d;color:#fff;border:2px solid #536168;border-radius:6px;padding:9px;font-weight:900}
    .gun-card .primary{background:#713732;border-color:#d36b63}.gun-loot{margin-top:10px;padding:10px;background:#0c1316;border:1px solid #39464a}.gun-loot-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px solid #263338}.gun-loot-row:last-child{border-bottom:0}
    .gun-loot-row button{padding:6px 9px}
    .gun-pickups{margin-top:8px;padding:8px;background:#0c1316;border:1px solid #39464a}
  `;
  document.head.appendChild(style);

  const panel=document.createElement('div');panel.id='gun-loadout-panel';
  panel.innerHTML=`<div class="gun-card"><span class="gun-kicker">FIELD ARMORY · RAID LOADOUT</span><h2>GUN LOADOUT</h2><div class="gun-slots" id="gun-slots"></div><div class="gun-loot" id="gun-loot"></div><div class="gun-actions"><button id="gun-close">CLOSE</button><button id="gun-drop" class="primary">DROP ACTIVE GUN</button></div></div>`;
  document.getElementById('game-shell').appendChild(panel);

  function ensureState(){
    if(!raidInventory||!raidInventory.weapons)return;
    if(initialized)return;
    const w=loadout&&loadout.weapon?{...loadout.weapon,magAmmo:player.ammo,reserve:player.reserve}:null;
    slots=[w,null];activeSlot=0;initialized=true;
  }
  function saveActive(){
    const s=slots[activeSlot];if(!s)return;
    s.magAmmo=player.ammo;s.reserve=player.reserve;
  }
  function equip(index){
    ensureState();if(!slots[index])return;
    saveActive();activeSlot=index;
    const w=slots[index],s=STATS[w.name]||STATS['Rust Pistol'],type=w.ammo||'9mm Ammo';
    loadout={weapon:{...w},ammoType:type,ammo:0,insured:!!w.insured};
    player.mag=s.mag;
    player.ammo=Math.max(0,Math.min(s.mag,Number(w.magAmmo)||0));
    player.ammoType=type;
    player.reserve=Math.max(0,Number(w.reserve)||Number(inv[type]||0));
    inv[type]=player.reserve;
    const card=document.querySelector('.weapon-card b');if(card)card.textContent=w.name.toUpperCase();
    updateHud();updateInventory();render();showMessage('Equipped '+w.name+'.');
  }
  function pickupWeapon(item){
    ensureState();
    const w={name:item.name,rarity:item.rarity?.name||item.rarity||'Common',ammo:item.ammo||'9mm Ammo',magAmmo:0,reserve:Number(inv[item.ammo||'9mm Ammo']||0),insured:false};
    const free=slots.findIndex(x=>!x);
    if(free>=0){slots[free]=w;equip(free)}
    else {saveActive();const dropped=slots[activeSlot];slots[activeSlot]=w;equip(activeSlot);raidInventory.weapons=raidInventory.weapons.filter(x=>x!==dropped)}
    raidInventory.weapons.push(w);inv.Weapons=(Number(inv.Weapons)||0)+1;
    showMessage('Picked up '+w.name+'.');render();
  }
  function render(){
    ensureState();
    const slotsEl=document.getElementById('gun-slots');
    slotsEl.innerHTML=slots.map((w,i)=>w?`<div class="gun-slot ${i===activeSlot?'active':''}"><b>${i===0?'PRIMARY':'SECONDARY'} · ${w.name}</b><small style="color:${rarityColor(w.rarity)}">${w.rarity}</small><small>${w.ammo||'9mm Ammo'} · ${w.magAmmo||0}/${w.reserve||0}</small><button data-equip="${i}">${i===activeSlot?'EQUIPPED':'EQUIP'}</button></div>`:`<div class="gun-slot"><b>${i===0?'PRIMARY':'SECONDARY'} · EMPTY</b><small>Find a weapon in a crate to fill this slot.</small></div>`).join('');
    slotsEl.querySelectorAll('[data-equip]').forEach(b=>b.onclick=()=>equip(Number(b.dataset.equip)));
    const loot=currentCrate&&Array.isArray(currentCrate.loot)?currentCrate.loot.filter(x=>x.type==='weapon'):[];
    const lootEl=document.getElementById('gun-loot');
    lootEl.innerHTML=loot.length?`<b>WEAPONS IN CURRENT CACHE</b>`+loot.map((w,i)=>`<div class="gun-loot-row"><span>🔫 ${w.name}<small style="color:${rarityColor(w.rarity?.name||w.rarity)}"> ${w.rarity?.name||w.rarity}</small></span><button data-pick="${i}" class="primary">PICK UP</button></div>`).join(''):'<small>No weapon is currently highlighted. Open a supply crate to find guns.</small>';
    lootEl.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{const weapons=currentCrate.loot.filter(x=>x.type==='weapon');const item=weapons[Number(b.dataset.pick)];if(!item)return;pickupWeapon(item);currentCrate.loot.splice(currentCrate.loot.indexOf(item),1);render();});
  }
  function open(){if(!running)return;ensureState();render();panel.style.display='grid';paused=true}
  function close(){panel.style.display='none';paused=false}
  function drop(){ensureState();const w=slots[activeSlot];if(!w)return;saveActive();slots[activeSlot]=null;showMessage('Dropped '+w.name+'.');if(raidInventory&&raidInventory.weapons)raidInventory.weapons=raidInventory.weapons.filter(x=>x!==w);close();}

  document.getElementById('gun-close').onclick=close;
  document.getElementById('gun-drop').onclick=drop;

  const invBtn=document.getElementById('inventory-btn');
  if(invBtn){const wrap=document.createElement('button');wrap.className='hud-btn';wrap.id='gun-loadout-btn';wrap.textContent='🔫';wrap.setAttribute('aria-label','Gun Loadout');invBtn.parentNode.insertBefore(wrap,invBtn.nextSibling);wrap.onclick=open}

  const take=document.getElementById('take-all');
  if(take){take.onclick=()=>{
    if(!currentCrate||!Array.isArray(currentCrate.loot))return;
    ensureState();
    const loot=[...currentCrate.loot];
    for(const item of loot){
      if(item.type==='weapon')pickupWeapon(item);
      else if(item.type==='ammo'){inv[item.name]=(Number(inv[item.name])||0)+Number(item.qty||0);raidInventory.ammo[item.name]=(Number(raidInventory.ammo[item.name])||0)+Number(item.qty||0)}
      else if(item.type==='item'){inv[item.name]=(Number(inv[item.name])||0)+Number(item.qty||0);raidInventory.items[item.name]=(Number(raidInventory.items[item.name])||0)+Number(item.qty||0)}
    }
    currentCrate.loot=[];currentCrate.open=true;updateInventory();closeLoot();showMessage('Loot secured.');
  }}

  const lootPanel=document.getElementById('loot-panel');
  if(lootPanel){const btn=document.createElement('button');btn.className='secondary';btn.textContent='GUN LOADOUT';btn.onclick=open;lootPanel.insertBefore(btn,document.getElementById('close-loot'))}

  setInterval(()=>{if(!raid||!raid.active){initialized=false;slots=[null,null];return}ensureState()},500);
})();
