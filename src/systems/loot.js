// Frontier Ashes — Phase 1, Commit 6: loot state system.
// Non-destructive extraction. Legacy loot functions remain in game-v3.js.

let cratesOpened=0;

const RARITIES=[
  {name:'Common',weight:54},{name:'Uncommon',weight:24},{name:'Epic',weight:11},
  {name:'Legendary',weight:6},{name:'Mythic',weight:3},{name:'Secret',weight:1},{name:'Special',weight:1}
];
const WEAPONS=[
  {name:'Rust Pistol',rarities:['Common'],ammo:'9mm Ammo'},
  {name:'Service Pistol',rarities:['Common','Uncommon'],ammo:'9mm Ammo'},
  {name:'Combat SMG',rarities:['Uncommon','Epic'],ammo:'9mm Ammo'},
  {name:'Pump Shotgun',rarities:['Uncommon','Epic'],ammo:'12 Gauge'},
  {name:'Assault Rifle',rarities:['Epic','Legendary'],ammo:'5.56 Ammo'},
  {name:'Marksman Rifle',rarities:['Epic','Legendary'],ammo:'7.62 Ammo'},
  {name:'Thunderbolt AR',rarities:['Legendary','Mythic'],ammo:'5.56 Ammo'},
  {name:'Wasteland Reaper',rarities:['Mythic'],ammo:'7.62 Ammo'},
  {name:'ARGUS Prototype',rarities:['Secret'],ammo:'Energy Cell'},
  {name:'Ashen Nova',rarities:['Special'],ammo:'Energy Cell'}
];
const AMMO={'9mm Ammo':{min:8,max:30},'12 Gauge':{min:4,max:16},'5.56 Ammo':{min:10,max:32},'7.62 Ammo':{min:8,max:24},'Energy Cell':{min:4,max:18}};
const CONSUMABLES=[{name:'Scrap',min:4,max:14},{name:'Canned Food',min:1,max:4},{name:'Medkit',min:1,max:2}];

export function getCrates(){return globalThis.FrontierAshesLootState?.getCrates?.()||[]}
export function getCurrentCrate(){return globalThis.FrontierAshesLootState?.getCurrentCrate?.()||null}

export function makeCrates(count){
  const positions=[];
  for(let i=0;i<count;i++){
    let x,y,tries=0;
    do{x=70+Math.random()*1240;y=70+Math.random()*760;tries++}
    while(positions.some(p=>Math.hypot(p.x-x,p.y-y)<75)&&tries<100);
    positions.push({x,y,open:false,loot:null});
  }
  return positions;
}

export function chooseRarity(forceMin=0){
  const order=['Common','Uncommon','Epic','Legendary','Mythic','Secret','Special'];
  const pool=RARITIES.filter(r=>order.indexOf(r.name)>=forceMin);
  const total=pool.reduce((s,r)=>s+r.weight,0);
  let roll=Math.random()*total;
  for(const rarity of pool){roll-=rarity.weight;if(roll<=0)return rarity}
  return pool[0];
}

export function makeLoot(){
  const pity8=cratesOpened>0&&cratesOpened%8===0;
  const pity20=cratesOpened>0&&cratesOpened%20===0;
  let count=4+Math.floor(Math.random()*5),items=[];
  for(let i=0;i<count;i++){
    const rarity=chooseRarity(pity20?3:pity8?2:0),roll=Math.random();
    if(roll<.28){
      const c=CONSUMABLES[Math.floor(Math.random()*CONSUMABLES.length)];
      const qty=c.min+Math.floor(Math.random()*(c.max-c.min+1));
      items.push({type:'item',name:c.name,qty,rarity});
    }else if(roll<.62){
      const names=Object.keys(AMMO),name=names[Math.floor(Math.random()*names.length)],cfg=AMMO[name];
      const qty=cfg.min+Math.floor(Math.random()*(cfg.max-cfg.min+1));
      items.push({type:'ammo',name,qty,rarity});
    }else{
      let choices=WEAPONS.filter(w=>w.rarities.includes(rarity.name));
      if(!choices.length)choices=WEAPONS.filter(w=>w.rarities.includes('Common'));
      const weapon=choices[Math.floor(Math.random()*choices.length)];
      const finalRarity=weapon.rarities.includes(rarity.name)?rarity:{name:'Common'};
      items.push({type:'weapon',name:weapon.name,qty:1,rarity:finalRarity,ammo:weapon.ammo});
    }
  }
  if(!items.some(i=>i.type==='ammo')){
    const qty=10+Math.floor(Math.random()*21);
    items[0]={type:'ammo',name:'9mm Ammo',qty,rarity:{name:'Common'}};
  }
  return items;
}

export function nearbyCrate(){
  const state=globalThis.FrontierAshesLootState;
  const p=state?.getPlayer?.();
  const crates=state?.getCrates?.()||[];
  return p?crates.find(c=>!c.open&&Math.hypot(c.x-p.x,c.y-p.y)<50)||null:null;
}

export function openLootState(crate){
  if(!crate)return null;
  cratesOpened++;
  crate.loot=makeLoot();
  globalThis.FrontierAshesLootState?.setCurrentCrate?.(crate);
  globalThis.FrontierAshesLootState?.setLootOpen?.(true);
  return crate;
}

export function closeLootState(){
  globalThis.FrontierAshesLootState?.setLootOpen?.(false);
  globalThis.FrontierAshesLootState?.clearCurrentCrate?.();
}

export function markCrateCollected(crate){
  if(!crate)return;
  globalThis.FrontierAshesLootState?.markCrateOpened?.(crate);
}

export { cratesOpened };

// Backward-compatible facades for the modular entry point during migration.
export function takeAll(){globalThis.takeAll?.()}
export function closeLoot(){globalThis.closeLoot?.()}
