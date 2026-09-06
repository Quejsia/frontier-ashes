/* Frontier Ashes — Phase 2.3: reliable raid gun storage.
   Guns found in crates are first stored in the temporary raid backpack. The
   separate field loadout equips from that backpack, so TAKE ALL can never
   silently delete a weapon. */
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
    .gun-card{width:min(94vw,620px);max-height:88vh;overflow:auto;background:#10171b;border:2px solid #68757a;box-shadow:0 16px 60px #000;padding:16px}
    .gun-card h2{margin:2px 0 10px;font-size:22px}.gun-kicker{font-size:8px;letter-spacing:2px;color:#879396}
    .gun-slots{display:grid;grid-template-columns:1fr 1fr;gap:8px}.gun-slot{background:#172125;border:2px solid #39464a;padding:10px;min-height:86px}.gun-slot.active{border-color:#d36b63;background:#251719}
    .gun-slot b{display:block;font-size:12px}.gun-slot small{display:block;color:#aeb8ba;margin-top:4px}.gun-slot button{margin-top:8px;width:100%}
    .gun-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.gun-card button{background:#1d292d;color:#fff;border:2px solid #536168;border-radius:6px;padding:9px;font-weight:900}
    .gun-card .primary{background:#713732;border-color:#d36b63}.gun-backpack{margin-top:10px;padding:10px;background:#0c1316;border:1px solid #39464a}.gun-backpack-row{display:grid;grid-template-columns:1fr auto;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #263338}.gun-backpack-row:last-child{border-bottom:0}.gun-backpack-row b{display:block;font-size:11px}.gun-backpack-row small{color:#aeb8ba}.gun-backpack-row button{padding:6px 9px}.gun-loot{margin-top:10px;padding:10px;background:#0c1316;border:1px solid #39464a}.gun-loot-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px solid #263338}.gun-loot-row:last-child{border-bottom:0}.gun-loot-row button{padding:6px 9px}
    .raid-weapons-box{margin-top:10px;padding:10px;background:#0c1316;border:1px solid #39464a}.raid-weapon-row{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #263338}.raid-weapon-row:last-child{border-bottom:0}.raid-weapon-row small{display:block;color:#aeb8ba}
  `;
  document.head.appendChild(style);

  const panel=document.createElement('div');panel.id='gun-loadout-panel';
  panel.innerHTML=`<div class="gun-card">
    <span class="gun-kicker">FIELD ARMORY · RAID LOADOUT</span><h2>GUN LOADOUT</h2>
    <div class="gun-slots" id="gun-slots"></div>
    <div class="gun-backpack" id="gun-backpack"></div>
    <div class="gun-loot" id="gun-loot"></div>
    <div class="gun-actions"><button id="gun-close">CLOSE</button><button id="gun-store-note" class="primary">GUNS AUTO-STORE ON TAKE ALL</button></div>
  </div>`;
  document.getElementById('game-shell').appendChild(panel);

  const getWeaponName=w=>w&&w.name?w.name:'Unknown Weapon';
  const getAmmoType=w=>w&&w.ammo?w.ammo:'9mm Ammo';
  const makeWeapon=item=>({
    id:`raidgun-${Date.now()}-${Math.random().toString(36).slice(2,9)}`,
    name:item.name,
    rarity:item.rarity?.name||item.rarity||'Common',
    ammo:getAmmoType(item),
    magAmmo:Number(item.magAmmo)||0,
    reserve:Number(item.reserve)||0,
    insured:false
  });

  function ensureRaid(){
    if(!raidInventory)return false;
    if(!Array.isArray(raidInventory.weapons))raidInventory.weapons=[];
    return true;
  }

  function ensureState(){
    if(!ensureRaid()||initialized)return;
    const starter=loadout&&loadout.weapon?{
      id:`insured-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      name:loadout.weapon.name,
      rarity:loadout.weapon.rarity||'Common',
      ammo:loadout.ammoType||loadout.weapon.ammo||'9mm Ammo',
      magAmmo:Number(player.ammo)||0,
      reserve:Number(player.reserve)||Number(loadout.ammo)||0,
      insured:true
    }:null;
    raidInventory.weapons=starter?[starter]:[];
    slots=[starter?starter.id:null,null];
    activeSlot=0;
    initialized=true;
  }

  function findWeapon(id){return raidInventory.weapons.find(w=>w.id===id)||null}
  function syncWeapon(w){
    if(!w)return;
    w.magAmmo=Math.max(0,Number(player.ammo)||0);
    w.reserve=Math.max(0,Number(player.reserve)||0);
  }
  function syncActive(){const w=findWeapon(slots[activeSlot]);if(w)syncWeapon(w)}

  function equip(index){
    ensureState();
    const id=slots[index],w=findWeapon(id);if(!w)return;
    syncActive();activeSlot=index;
    const s=STATS[getWeaponName(w)]||STATS['Rust Pistol'],type=getAmmoType(w);
    loadout={weapon:{...w},ammoType:type,ammo:Number(w.magAmmo)||0,insured:!!w.insured};
    player.mag=s.mag;
    player.ammo=Math.max(0,Math.min(s.mag,Number(w.magAmmo)||0));
    player.ammoType=type;
    player.reserve=Math.max(0,Number(w.reserve)||Number(inv[type]||0));
    inv[type]=player.reserve;
    const card=document.querySelector('.weapon-card b');if(card)card.textContent=getWeaponName(w).toUpperCase();
    updateHud();
    updateInventory();
    render();
    renderMainInventory();
    showMessage('Equipped '+getWeaponName(w)+'.');
  }

  function addRaidWeapon(item){
    ensureState();
    const w=makeWeapon(item);
    const ammo=getAmmoType(w);
    w.reserve=Math.max(0,Number(inv[ammo]||0));
    raidInventory.weapons.push(w);
    inv.Weapons=Math.max(0,Number(inv.Weapons)||0)+1;

    const free=slots.findIndex(id=>!id);
    if(free>=0){
      slots[free]=w.id;
      equip(free);
    }
    renderMainInventory();
    return w;
  }

  function removeRaidWeapon(id){
    const index=raidInventory.weapons.findIndex(w=>w.id===id);
    if(index<0)return false;
    raidInventory.weapons.splice(index,1);
    slots=slots.map(slotId=>slotId===id?null:slotId);
    if(Number(inv.Weapons)>0)inv.Weapons--;
    return true;
  }

  function pickupWeapon(item){
    if(!item||item.type!=='weapon')return null;
    const w=addRaidWeapon(item);
    showMessage('Stored '+w.name+' in raid backpack.');
    render();
    return w;
  }

  function render(){
    ensureState();
    const slotsEl=document.getElementById('gun-slots');
    slotsEl.innerHTML=slots.map((id,i)=>{
      const w=findWeapon(id);
      return w?`<div class="gun-slot ${i===activeSlot?'active':''}"><b>${i===0?'PRIMARY':'SECONDARY'} · ${getWeaponName(w)}</b><small style="color:${rarityColor(w.rarity)}">${w.rarity}${w.insured?' · INSURED':''}</small><small>${getAmmoType(w)} · ${Number(w.magAmmo)||0}/${Number(w.reserve)||0}</small><button data-equip="${i}">${i===activeSlot?'EQUIPPED':'EQUIP'}</button></div>`:`<div class="gun-slot"><b>${i===0?'PRIMARY':'SECONDARY'} · EMPTY</b><small>Use EQUIP on a carried gun to fill this slot.</small></div>`;
    }).join('');
    slotsEl.querySelectorAll('[data-equip]').forEach(b=>b.onclick=()=>equip(Number(b.dataset.equip)));

    const backpack=raidInventory.weapons||[];
    const backpackEl=document.getElementById('gun-backpack');
    backpackEl.innerHTML=`<b>RAID BACKPACK · ${backpack.length} GUN${backpack.length===1?'':'S'}</b>`+(backpack.length?backpack.map(w=>{
      const slotIndex=slots.indexOf(w.id),equipped=slotIndex>=0;
      return `<div class="gun-backpack-row"><span><b>${getWeaponName(w)}</b><small style="color:${rarityColor(w.rarity)}">${w.rarity}${equipped?' · '+(slotIndex===0?'PRIMARY':'SECONDARY'):''}</small></span><button data-equip-id="${w.id}" class="primary">${equipped?'EQUIPPED':'EQUIP'}</button></div>`;
    }).join(''):'<small>No guns stored yet. TAKE ALL will save every gun you loot here.</small>');
    backpackEl.querySelectorAll('[data-equip-id]').forEach(b=>b.onclick=()=>{
      const id=b.dataset.equipId,w=findWeapon(id);if(!w)return;
      const existing=slots.indexOf(id);
      if(existing>=0){equip(existing);return;}
      const free=slots.findIndex(x=>!x);
      if(free>=0){slots[free]=id;equip(free);return;}
      showMessage('Both weapon slots are full — drop or swap a gun first.');
    });

    const loot=currentCrate&&Array.isArray(currentCrate.loot)?currentCrate.loot.filter(x=>x.type==='weapon'):[];
    const lootEl=document.getElementById('gun-loot');
    lootEl.innerHTML=loot.length?`<b>WEAPONS IN CURRENT CACHE</b>`+loot.map((w,i)=>`<div class="gun-loot-row"><span>🔫 ${getWeaponName(w)}<small style="color:${rarityColor(w.rarity?.name||w.rarity)}"> ${w.rarity?.name||w.rarity}</small></span><button data-pick="${i}" class="primary">STORE</button></div>`).join(''):'<small>No weapon is currently highlighted. Open a supply crate to find guns.</small>';
    lootEl.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{
      if(!currentCrate||!Array.isArray(currentCrate.loot))return;
      const weapons=currentCrate.loot.filter(x=>x.type==='weapon');
      const item=weapons[Number(b.dataset.pick)];if(!item)return;
      pickupWeapon(item);
      const index=currentCrate.loot.indexOf(item);if(index>=0)currentCrate.loot.splice(index,1);
      render();
    });
  }

  function renderMainInventory(){
    const inventory=document.getElementById('inventory-panel');if(!inventory||!ensureRaid())return;
    let box=document.getElementById('raid-weapons-box');
    if(!box){
      box=document.createElement('div');box.id='raid-weapons-box';box.className='raid-weapons-box';
      const close=inventory.querySelector('#close-inventory');inventory.insertBefore(box,close||null);
    }
    const backpack=raidInventory.weapons||[];
    box.innerHTML=`<b>RAID GUNS · ${backpack.length}</b>`+(backpack.length?backpack.map(w=>`<div class="raid-weapon-row"><span>🔫 ${getWeaponName(w)}<small style="color:${rarityColor(w.rarity)}">${w.rarity}${slots.includes(w.id)?' · EQUIPPED':''}</small></span><span>${Number(w.magAmmo)||0}/${Number(w.reserve)||0}</span></div>`).join(''):'<small>No guns in your raid backpack.</small>');
  }

  function open(){if(!running)return;ensureState();syncActive();render();panel.style.display='grid';paused=true}
  function close(){panel.style.display='none';paused=false;renderMainInventory()}

  document.getElementById('gun-close').onclick=close;

  const invBtn=document.getElementById('inventory-btn');
  if(invBtn){
    const wrap=document.createElement('button');wrap.className='hud-btn';wrap.id='gun-loadout-btn';wrap.textContent='🔫';wrap.setAttribute('aria-label','Gun Loadout');
    invBtn.parentNode.insertBefore(wrap,invBtn.nextSibling);wrap.onclick=open;
    invBtn.addEventListener('click',()=>renderMainInventory());
  }

  const take=document.getElementById('take-all');
  if(take){
    take.onclick=()=>{
      if(!currentCrate||!Array.isArray(currentCrate.loot))return;
      ensureState();
      const loot=[...currentCrate.loot];
      let gunCount=0;
      for(const item of loot){
        if(item.type==='weapon'){pickupWeapon(item);gunCount++;continue;}
        if(item.type==='ammo'){
          inv[item.name]=(Number(inv[item.name])||0)+Number(item.qty||0);
          raidInventory.ammo[item.name]=(Number(raidInventory.ammo[item.name])||0)+Number(item.qty||0);
          continue;
        }
        if(item.type==='item'){
          inv[item.name]=(Number(inv[item.name])||0)+Number(item.qty||0);
          raidInventory.items[item.name]=(Number(raidInventory.items[item.name])||0)+Number(item.qty||0);
        }
      }
      currentCrate.loot=[];currentCrate.open=true;
      updateInventory();renderMainInventory();closeLoot();
      showMessage(gunCount?`Loot secured · ${gunCount} gun${gunCount===1?'':'s'} stored.`:'Loot secured.');
    };
  }

  const lootPanel=document.getElementById('loot-panel');
  if(lootPanel){
    const btn=document.createElement('button');btn.className='secondary';btn.textContent='GUN LOADOUT';btn.onclick=open;
    lootPanel.insertBefore(btn,document.getElementById('close-loot'));
  }

  const oldUpdateInventory=window.updateInventory;
  if(typeof oldUpdateInventory==='function'){
    window.updateInventory=function(){
      oldUpdateInventory.apply(this,arguments);
      renderMainInventory();
    };
  }

  setInterval(()=>{
    if(!raid||!raid.active){initialized=false;slots=[null,null];return;}
    ensureState();
    syncActive();
    renderMainInventory();
  },500);
})();
