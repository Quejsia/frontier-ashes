/* Frontier Ashes — Phase 2.6: easier loot pickup + in-raid weapon switching. */
(function(){
  const BASE={
    'Rust Pistol':{mag:12,damage:25,fireRate:.18,bulletSpeed:420},'Service Pistol':{mag:15,damage:27,fireRate:.16,bulletSpeed:430},'Combat SMG':{mag:30,damage:19,fireRate:.085,bulletSpeed:440},'Pump Shotgun':{mag:6,damage:45,fireRate:.55,bulletSpeed:360},'Assault Rifle':{mag:30,damage:28,fireRate:.11,bulletSpeed:500},'Marksman Rifle':{mag:8,damage:55,fireRate:.48,bulletSpeed:650},'Thunderbolt AR':{mag:36,damage:32,fireRate:.095,bulletSpeed:530},'Wasteland Reaper':{mag:10,damage:72,fireRate:.38,bulletSpeed:620},'ARGUS Prototype':{mag:20,damage:64,fireRate:.13,bulletSpeed:560},'Ashen Nova':{mag:24,damage:78,fireRate:.105,bulletSpeed:600}
  };
  const R={Common:1,Uncommon:1.08,Epic:1.18,Legendary:1.30,Mythic:1.44,Secret:1.60,Special:1.78};
  const calc=w=>{const b=BASE[w&&w.name]||BASE['Rust Pistol'],m=R[w&&w.rarity]||1;return{mag:Math.max(1,Math.round(b.mag*(1+(m-1)*.55))),damage:Math.round(b.damage*m),fireRate:Math.max(.045,b.fireRate*(1-(m-1)*.20)),bulletSpeed:Math.round(b.bulletSpeed*(1+(m-1)*.35))}};
  const rarityColor=n=>({Common:'#d3d6d8',Uncommon:'#69c875',Epic:'#bc7bf1',Legendary:'#f1a24b',Mythic:'#e754d8',Secret:'#44d8ef',Special:'#ffe66b'})[n]||'#fff';
  const weaponName=w=>w&&w.name?w.name:'Unknown Weapon';
  const ammoType=w=>w&&w.ammo?w.ammo:(w&&w.ammoType?w.ammoType:'9mm Ammo');
  const uid=()=>`raidgun-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
  const ensureRaid=()=>{if(!raidInventory)return false;if(!Array.isArray(raidInventory.weapons))raidInventory.weapons=[];return true};
  const findWeapon=id=>ensureRaid()?raidInventory.weapons.find(w=>w.id===id)||null:null;
  const ensureWeaponFromLoadout=()=>{
    if(!ensureRaid()||!loadout||!loadout.weapon)return null;
    let w=raidInventory.weapons.find(x=>x.name===loadout.weapon.name&&x.insured);
    if(!w){w={id:uid(),name:loadout.weapon.name,rarity:loadout.weapon.rarity||'Common',ammo:loadout.ammoType||loadout.weapon.ammo||'9mm Ammo',magAmmo:Number(player.ammo)||0,reserve:Number(player.reserve)||Number(loadout.ammo)||0,insured:true};raidInventory.weapons.unshift(w)}
    return w;
  };
  let quickSlots=[null,null],quickReady=false;
  function syncCurrent(){
    const w=findWeapon(quickSlots[0])||findWeapon(quickSlots[1]);
    if(!w)return;
    if((loadout&&loadout.weapon&&w.name===loadout.weapon.name)||quickSlots[0]===quickSlots[1]){w.magAmmo=Math.max(0,Number(player.ammo)||0);w.reserve=Math.max(0,Number(player.reserve)||0)}
  }
  function ensureQuickSlots(){
    if(!ensureRaid())return false;
    const current=ensureWeaponFromLoadout();
    if(!quickReady){
      quickSlots[0]=current?current.id:null;
      const other=raidInventory.weapons.find(w=>w.id!==quickSlots[0]);
      quickSlots[1]=other?other.id:null;
      quickReady=true;
    }
    if(!findWeapon(quickSlots[0]))quickSlots[0]=current?current.id:null;
    if(quickSlots[1]&&!findWeapon(quickSlots[1]))quickSlots[1]=null;
    return true;
  }
  function applyWeapon(w){
    if(!w||!ensureRaid())return false;
    syncCurrent();
    const s=calc(w),type=ammoType(w);
    loadout={weapon:{...w},ammoType:type,ammo:Number(w.magAmmo)||0,insured:!!w.insured};
    player.mag=s.mag;
    player.ammo=Math.max(0,Math.min(s.mag,Number(w.magAmmo)||0));
    player.ammoType=type;
    player.reserve=Math.max(0,Number(w.reserve)||Number(inv[type]||0));
    inv[type]=player.reserve;
    const card=document.querySelector('.weapon-card b');if(card)card.textContent=weaponName(w).toUpperCase();
    const ammo=document.getElementById('ammo-text');if(ammo)ammo.textContent=player.ammo+'/'+player.reserve;
    if(typeof updateHud==='function')updateHud();
    showMessage('Equipped '+weaponName(w)+'.');
    return true;
  }
  function switchWeapon(){
    if(!running||paused||lootOpen)return;
    if(!ensureQuickSlots())return;
    const currentId=(loadout&&loadout.weapon)?(findWeapon(quickSlots[0])&&findWeapon(quickSlots[0]).name===loadout.weapon.name?quickSlots[0]:quickSlots[1]):quickSlots[0];
    const targetId=currentId===quickSlots[0]?quickSlots[1]:quickSlots[0];
    const target=findWeapon(targetId);
    if(!target){showMessage('No second gun equipped yet. Open GUN LOADOUT and equip one.');return}
    applyWeapon(target);
  }
  function setSecondaryFromLoadout(){
    if(!ensureRaid())return;
    const panel=document.getElementById('gun-loadout-panel');
    if(!panel)return;
    const slots=panel.querySelectorAll('#gun-slots .gun-slot');
    if(slots.length<2)return;
    const names=[];
    slots.forEach(el=>{const b=el.querySelector('b');if(b)names.push(b.textContent.replace(/^PRIMARY · |^SECONDARY · /,'' ).trim())});
    if(!names.length)return;
    const found=names.map(n=>raidInventory.weapons.find(w=>w.name===n)).filter(Boolean);
    if(found[0])quickSlots[0]=found[0].id;
    if(found[1])quickSlots[1]=found[1].id;
    quickReady=true;
  }
  function takeItem(item){
    if(!item)return false;
    ensureRaid();
    if(item.type==='weapon'){
      const w={id:uid(),name:item.name,rarity:item.rarity?.name||item.rarity||'Common',ammo:item.ammo||'9mm Ammo',magAmmo:Number(item.magAmmo)||0,reserve:Number(item.reserve)||0,insured:false};
      raidInventory.weapons.push(w);inv.Weapons=Math.max(0,Number(inv.Weapons)||0)+1;
      if(!quickSlots[0]||!findWeapon(quickSlots[0])){quickSlots[0]=w.id;quickReady=true}
      else if(!quickSlots[1]||!findWeapon(quickSlots[1])){quickSlots[1]=w.id;quickReady=true}
      return true;
    }
    if(item.type==='ammo'){
      const qty=Math.max(0,Number(item.qty)||0);inv[item.name]=(Number(inv[item.name])||0)+qty;raidInventory.ammo[item.name]=(Number(raidInventory.ammo[item.name])||0)+qty;
      if(ammoType(loadout&&loadout.weapon)===item.name){player.reserve=(Number(player.reserve)||0)+qty;const active=findWeapon(loadout&&loadout.weapon?quickSlots[0]:null);if(active)active.reserve=player.reserve}
      return true;
    }
    if(item.type==='item'){
      const qty=Math.max(0,Number(item.qty)||0);inv[item.name]=(Number(inv[item.name])||0)+qty;raidInventory.items[item.name]=(Number(raidInventory.items[item.name])||0)+qty;return true;
    }
    return false;
  }
  function normalizeLoot(){
    if(!currentCrate)return [];
    if(Array.isArray(currentCrate.loot))return currentCrate.loot.map((item,i)=>({item,index:i}));
    if(currentCrate.loot&&typeof currentCrate.loot==='object')return Object.entries(currentCrate.loot).map(([name,qty],i)=>({item:{type:name.includes('Ammo')?'ammo':(['Scrap','Canned Food','Medkit'].includes(name)?'item':'item'),name,qty:Number(qty)||0,rarity:{name:'Common'}},key:name,index:i}));
    return [];
  }
  function label(item){return item.type==='weapon'?'🔫':item.type==='ammo'?'💥':item.name==='Medkit'?'🧰':item.name==='Canned Food'?'🥫':'🔩'}
  function renderLoot(){
    const list=document.getElementById('loot-list');if(!list||!currentCrate)return;
    const rows=normalizeLoot();
    if(!rows.length){list.innerHTML='<div class="loot-empty">CACHE EMPTY — TAKE WHAT YOU NEED.</div>';return}
    list.innerHTML=rows.map((row,i)=>{const item=row.item||{};const rarity=item.rarity?.name||item.rarity||'Common';const qty=item.type==='weapon'?'×1':'×'+(Number(item.qty)||0);return `<div class="fa-loot-row"><div class="fa-loot-info"><span>${label(item)} ${item.name}</span><small style="color:${rarityColor(rarity)}">${rarity}</small></div><b>${qty}</b><button type="button" class="fa-take" data-loot-index="${i}">TAKE</button></div>`}).join('');
    list.querySelectorAll('.fa-take').forEach(btn=>btn.onclick=()=>takeOne(Number(btn.dataset.lootIndex)));
  }
  function takeOne(displayIndex){
    const rows=normalizeLoot(),row=rows[displayIndex];if(!row||!currentCrate)return;
    const item=row.item;
    if(!takeItem(item))return;
    if(Array.isArray(currentCrate.loot))currentCrate.loot.splice(row.index,1);else if(currentCrate.loot&&row.key)delete currentCrate.loot[row.key];
    if(typeof updateInventory==='function')updateInventory();renderLoot();showMessage('Taken: '+item.name);
  }
  function takeEverything(){
    const rows=normalizeLoot();if(!rows.length){showMessage('The cache is already empty.');return}
    rows.slice().forEach(row=>takeItem(row.item));
    if(Array.isArray(currentCrate.loot))currentCrate.loot=[];else currentCrate.loot={};
    currentCrate.open=true;renderLoot();if(typeof updateInventory==='function')updateInventory();
    if(typeof closeLoot==='function')closeLoot();showMessage('Loot secured.');
  }
  const style=document.createElement('style');style.textContent=`
    #loot-list{display:grid;grid-template-columns:1fr 1fr;gap:0 10px}
    .fa-loot-row{display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:8px;padding:8px 4px;border-bottom:1px solid #263338;min-width:0}
    .fa-loot-info{min-width:0}.fa-loot-info span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fa-loot-info small{display:block;font-size:9px;letter-spacing:1px;text-transform:uppercase;margin-top:2px}
    .fa-loot-row>b{white-space:nowrap}.fa-take{background:#1d292d;color:#fff;border:2px solid #536168;border-radius:5px;padding:6px 10px;font-weight:900;touch-action:manipulation}
    .fa-switch{position:absolute;right:136px;top:14px;z-index:18;background:#1d292d;color:#fff;border:2px solid #536168;border-radius:7px;min-width:64px;height:48px;font-weight:900;box-shadow:0 4px 12px #0008;touch-action:manipulation}
    .fa-switch small{display:block;font-size:7px;letter-spacing:1px;color:#aeb8ba}.fa-switch b{font-size:10px}
    @media(max-width:700px){#loot-list{grid-template-columns:1fr}.fa-switch{right:136px;top:10px;min-width:58px;height:44px}.fa-loot-row{padding:9px 2px}}
  `;document.head.appendChild(style);

  // Replace the legacy loot renderer after all legacy scripts have loaded.
  const originalOpenLoot=window.openLoot||openLoot;
  if(typeof originalOpenLoot==='function'){
    window.openLoot=function(c){originalOpenLoot(c);setTimeout(renderLoot,0);};
  }
  const take=document.getElementById('take-all');if(take){take.onclick=takeEverything;take.addEventListener('pointerup',e=>{if(e.pointerType==='touch'){e.preventDefault();takeEverything()}})}

  const switchBtn=document.createElement('button');switchBtn.type='button';switchBtn.className='fa-switch';switchBtn.id='fa-switch-weapon';switchBtn.innerHTML='<small>WEAPON</small><b>SWITCH ↔</b>';document.getElementById('game-shell').appendChild(switchBtn);
  switchBtn.onclick=switchWeapon;switchBtn.addEventListener('pointerup',e=>{if(e.pointerType==='touch'){e.preventDefault();switchWeapon()}});
  const weaponCard=document.querySelector('.weapon-card');if(weaponCard){weaponCard.style.cursor='pointer';weaponCard.title='Tap to switch between Primary and Secondary';weaponCard.addEventListener('click',switchWeapon)}
  document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='q'){e.preventDefault();switchWeapon()}});

  // When the loadout UI is opened, read its actual two slots so quick-switch follows swaps.
  const observer=new MutationObserver(()=>{if(document.getElementById('gun-loadout-panel')?.style.display==='grid')setSecondaryFromLoadout()});
  observer.observe(document.getElementById('game-shell'),{subtree:true,attributes:true,attributeFilter:['style']});
  setInterval(()=>{if(!raid||!raid.active){quickReady=false;quickSlots=[null,null];return}ensureQuickSlots();if(document.getElementById('gun-loadout-panel')?.style.display==='grid')setSecondaryFromLoadout()},800);
})();
