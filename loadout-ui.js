/* Frontier Ashes — Phase 2: stash/loadout UI only.
   This layer sits on top of the existing game without replacing combat or loot. */
(function(){
  const style=document.createElement('style');
  style.textContent=`
  #raid-menu{position:absolute;inset:0;z-index:40;display:grid;place-items:center;background:linear-gradient(#070b0ddd,#070b0df5);padding:14px}
  .raid-card{width:min(92vw,620px);max-height:88vh;overflow:auto;background:#10171bd9;border:2px solid #68757a;box-shadow:0 16px 60px #000;padding:18px}
  .raid-card h2{margin:2px 0 4px;font-size:24px;letter-spacing:1px}.raid-kicker{font-size:8px;letter-spacing:2px;color:#879396}
  .raid-sub{margin:0 0 14px;color:#aeb8ba;font-size:11px}.raid-nav{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}
  .raid-nav button,.weapon-choice{background:#1d292d;border:2px solid #536168;color:#fff;border-radius:6px;padding:10px;font-weight:900}
  .raid-nav button.active,.weapon-choice.selected{background:#713732;border-color:#d36b63}
  .raid-view{display:none}.raid-view.active{display:block}
  .stash-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;max-height:46vh;overflow:auto}.stash-row{display:flex;justify-content:space-between;padding:8px;background:#172125;border:1px solid #303d42;font-size:11px}
  .weapon-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;max-height:38vh;overflow:auto}.weapon-choice{text-align:left;min-height:66px}.weapon-choice b{display:block;font-size:12px}.weapon-choice small{display:block;color:#aeb8ba;margin-top:3px}.weapon-choice .rarity{font-size:9px;letter-spacing:1px;text-transform:uppercase}
  .loadout-summary{margin-top:10px;padding:10px;background:#0c1316;border:1px solid #39464a;font-size:11px}.ammo-pick{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px}.ammo-pick input{width:120px;background:#172125;color:#fff;border:2px solid #536168;border-radius:5px;padding:8px;font-weight:900}
  .raid-note{font-size:9px;color:#9ca8aa;margin:8px 0}.raid-danger{color:#e08b83}.raid-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.raid-actions button{margin-top:0!important}
  @media(max-height:420px){#raid-menu{padding:8px}.raid-card{padding:11px;max-height:94vh}.raid-card h2{font-size:19px}.weapon-grid{max-height:34vh}.stash-grid{max-height:40vh}.raid-nav button,.weapon-choice{padding:7px}}
  `;
  document.head.appendChild(style);

  const screen=document.getElementById('start-screen');
  if(!screen)return;
  const oldStart=document.getElementById('start');
  const menu=document.createElement('div');menu.id='raid-menu';menu.style.display='none';
  menu.innerHTML=`<div class="raid-card">
    <span class="raid-kicker">FRONTIER ASHES · SAFEHOUSE</span><h2 id="raid-title">RAID PREPARATION</h2><p class="raid-sub">Prepare your insured gear before entering the wasteland.</p>
    <div class="raid-nav"><button data-view="stash">STASH</button><button data-view="loadout" class="active">LOADOUT</button><button data-view="deploy">START RAID</button></div>
    <div id="stash-view" class="raid-view"><div class="stash-grid" id="stash-list"></div><button class="secondary" id="stash-back">BACK</button></div>
    <div id="loadout-view" class="raid-view active"><div class="raid-kicker">CHOOSE ONE INSURED WEAPON</div><div class="weapon-grid" id="weapon-list"></div>
      <div class="loadout-summary" id="loadout-summary">Select a weapon.</div>
      <div class="ammo-pick"><span>STARTING AMMO</span><input id="starting-ammo" type="number" min="1" value="1" inputmode="numeric"></div>
      <p class="raid-note">Starting ammo is taken from your permanent stash when you deploy. The weapon is insured.</p>
      <div class="raid-actions"><button class="secondary" id="loadout-back">BACK</button><button class="primary" id="deploy-btn">DEPLOY</button></div>
    </div>
    <div id="deploy-view" class="raid-view"><div class="loadout-summary" id="deploy-summary"></div><p class="raid-note">Your selected weapon is insured. Raid loot will be handled separately in the next phase.</p><button class="primary" id="deploy-now">START RAID</button><button class="secondary" id="deploy-back">BACK TO LOADOUT</button></div>
  </div>`;
  document.getElementById('game-shell').appendChild(menu);

  let selectedWeapon=null;
  const rarityColor=name=>({Common:'#d3d6d8',Uncommon:'#69c875',Epic:'#bc7bf1',Legendary:'#f1a24b',Mythic:'#e754d8',Secret:'#44d8ef',Special:'#ffe66b'})[name]||'#fff';
  function weaponInfo(w){return w||null}
  function renderStash(){
    const el=document.getElementById('stash-list');
    const weapons=stash.weapons.map((w,i)=>`<div class="stash-row"><span>🔫 ${w.name}<small class="rarity" style="color:${rarityColor(w.rarity)}"> ${w.rarity}</small></span><b>INSURED</b></div>`).join('');
    const ammo=Object.entries(stash.ammo).filter(([,v])=>Number(v)>0).map(([k,v])=>`<div class="stash-row"><span>💥 ${k}</span><b>${v}</b></div>`).join('');
    const items=Object.entries(stash.items).filter(([,v])=>Number(v)>0).map(([k,v])=>`<div class="stash-row"><span>🎒 ${k}</span><b>${v}</b></div>`).join('');
    el.innerHTML=(weapons+ammo+items)||'<p class="raid-sub">Your stash is empty.</p>';
  }
  function renderWeapons(){
    const el=document.getElementById('weapon-list');
    if(!stash.weapons.length){el.innerHTML='<p class="raid-sub">No weapons available. A starter Rust Pistol should be in your stash.</p>';return;}
    el.innerHTML=stash.weapons.map((w,i)=>`<button class="weapon-choice ${selectedWeapon===i?'selected':''}" data-index="${i}"><b>🔫 ${w.name}</b><small class="rarity" style="color:${rarityColor(w.rarity)}">${w.rarity}</small><small>${w.ammo||'9mm Ammo'}</small></button>`).join('');
    el.querySelectorAll('[data-index]').forEach(b=>b.onclick=()=>{selectedWeapon=Number(b.dataset.index);renderWeapons();renderSummary()});
  }
  function renderSummary(){
    const s=document.getElementById('loadout-summary'), input=document.getElementById('starting-ammo');
    if(selectedWeapon===null||!stash.weapons[selectedWeapon]){s.innerHTML='Select a weapon from your stash.';input.max=1;input.value=1;return;}
    const w=stash.weapons[selectedWeapon],type=w.ammo||'9mm Ammo',available=Math.max(0,Number(stash.ammo[type]||0));input.max=Math.max(1,available);if(Number(input.value)>available)input.value=available||1;
    s.innerHTML=`<b>INSURED LOADOUT</b><br>🔫 ${w.name} <span class="rarity" style="color:${rarityColor(w.rarity)}">${w.rarity}</span><br>💥 ${type}: ${available} in stash`;
  }
  function showView(name){
    menu.querySelectorAll('.raid-view').forEach(v=>v.classList.remove('active'));document.getElementById(name+'-view').classList.add('active');
    menu.querySelectorAll('.raid-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
    if(name==='stash')renderStash();if(name==='loadout'){renderWeapons();renderSummary()};
    if(name==='deploy')renderDeploy();
  }
  function renderDeploy(){
    const el=document.getElementById('deploy-summary');if(selectedWeapon===null||!stash.weapons[selectedWeapon]){el.innerHTML='No weapon selected.';return;}
    const w=stash.weapons[selectedWeapon],type=w.ammo||'9mm Ammo',amount=Number(document.getElementById('starting-ammo').value)||0;
    el.innerHTML=`<b>READY TO DEPLOY</b><br><br>🔫 ${w.name} · <span class="rarity" style="color:${rarityColor(w.rarity)}">${w.rarity}</span><br>💥 ${type} × ${amount}<br><br>🛡 INSURED WEAPON`;
  }
  function prepareLoadout(){
    if(selectedWeapon===null||!stash.weapons[selectedWeapon]){showView('loadout');return false;}
    const w=stash.weapons[selectedWeapon],type=w.ammo||'9mm Ammo',available=Number(stash.ammo[type]||0),amount=Math.floor(Number(document.getElementById('starting-ammo').value)||0);
    if(available<1){showMessage('Not enough '+type+' in stash');return false;}
    if(amount<1||amount>available){showMessage('Choose 1–'+available+' starting ammo');return false;}
    loadout={weapon:{...w},ammoType:type,ammo:amount,insured:true};
    stash.ammo[type]=available-amount;saveStash();
    raidInventory=emptyRaidInventory();raid={active:false,status:'loadout',extracted:false,extractionProgress:0,extractionPoint:null};
    reset();
    ownedWeapons.push({name:w.name,rarity:w.rarity,ammo:type});inv.Weapons=1;
    Object.keys(inv).forEach(k=>{if(k!=='Weapons')inv[k]=0});inv[type]=amount;
    player.ammo=player.mag;player.reserve=amount;player.ammoType=type;
    const card=document.querySelector('.weapon-card b');if(card)card.textContent=w.name.toUpperCase();
    const ammo=document.getElementById('ammo-text');if(ammo)ammo.textContent=player.ammo+'/'+player.reserve;
    raid.active=true;raid.status='active';
    running=true;paused=false;menu.style.display='none';screen.style.display='none';showMessage('Deployed with insured '+w.name+'.');
    return true;
  }
  function openMenu(){running=false;paused=false;screen.style.display='none';menu.style.display='grid';showView('loadout');renderWeapons();renderSummary()}
  oldStart.onclick=openMenu;
  menu.querySelectorAll('.raid-nav button').forEach(b=>b.onclick=()=>b.dataset.view==='deploy'?showView('loadout'):showView(b.dataset.view));
  document.getElementById('stash-back').onclick=()=>showView('loadout');
  document.getElementById('loadout-back').onclick=()=>{menu.style.display='grid';showView('stash')};
  document.getElementById('deploy-back').onclick=()=>showView('loadout');
  document.getElementById('deploy-btn').onclick=()=>{if(prepareLoadout())return};
  document.getElementById('starting-ammo').oninput=renderDeploy;
  // START RAID nav opens the confirmation view; the DEPLOY button above validates and launches directly.
  menu.querySelector('[data-view="deploy"]').onclick=()=>showView('deploy');
  document.getElementById('deploy-now').onclick=prepareLoadout;
})();