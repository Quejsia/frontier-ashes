/* Frontier Ashes — Phase 1, Commit 6: loot UI extraction.
   DOM rendering lives here; loot generation/state rules live in systems/loot.js.
   Legacy loot functions remain in game-v3.js for rollback safety.
*/
import * as Loot from '../src/systems/loot.js';
import * as Inventory from '../src/systems/inventory.js';

const state=globalThis.FrontierAshesLootState;

function rarityColor(name){return({Common:'#d3d6d8',Uncommon:'#69c875',Epic:'#bc7bf1',Legendary:'#f1a24b',Mythic:'#e754d8',Secret:'#44d8ef',Special:'#ffe66b'})[name]||'#fff'}
function icon(item){return item.type==='weapon'?'🔫':item.type==='ammo'?'💥':item.name==='Medkit'?'🧰':item.name==='Canned Food'?'🥫':'🔩'}
function currentCrate(){return state?.getCurrentCrate?.()||null}

function renderLoot(){
  const list=document.getElementById('loot-list');const crate=currentCrate();
  if(!list||!crate)return;
  const items=Array.isArray(crate.loot)?crate.loot:[];
  if(!items.length){list.innerHTML='<div class="loot-empty">CACHE EMPTY — TAKE WHAT YOU NEED.</div>';return}
  list.innerHTML=items.map((item,index)=>{
    const rarity=item.rarity?.name||item.rarity||'Common';
    const qty=item.type==='weapon'?1:Number(item.qty)||0;
    return `<div class="fa-loot-row"><div class="fa-loot-info"><span>${icon(item)} ${item.name}</span><small style="color:${rarityColor(rarity)}">${rarity}</small></div><b>×${qty}</b><button type="button" class="fa-take" data-loot-index="${index}">TAKE</button></div>`;
  }).join('');
  list.querySelectorAll('.fa-take').forEach(button=>button.addEventListener('click',()=>takeOne(Number(button.dataset.lootIndex))));
}

function takeOne(index){
  const crate=currentCrate();if(!crate||!Array.isArray(crate.loot))return;
  const item=crate.loot[index];if(!item)return;
  if(!Inventory.storeLootItem(item))return;
  crate.loot.splice(index,1);renderLoot();
  if(typeof showMessage==='function')showMessage('Taken: '+item.name);
}

function openLoot(c){
  if(!c)return;
  Loot.openLootState(c);
  document.getElementById('loot-panel')?.classList.remove('hidden');
  document.getElementById('interact')?.classList.add('hidden');
  renderLoot();
}
function closeLoot(){
  Loot.closeLootState();
  document.getElementById('loot-panel')?.classList.add('hidden');
  if(typeof updateHud==='function')updateHud();
}
function takeAll(){
  const crate=currentCrate();if(!crate)return;
  const items=Array.isArray(crate.loot)?crate.loot.slice():[];
  if(!items.length){closeLoot();return}
  if(!Inventory.storeLootItems(items))return;
  Loot.markCrateCollected(crate);closeLoot();
  if(typeof showMessage==='function')showMessage('Loot collected');
}

globalThis.openLoot=openLoot;globalThis.closeLoot=closeLoot;globalThis.takeAll=takeAll;
globalThis.nearbyCrate=Loot.nearbyCrate;globalThis.makeCrates=Loot.makeCrates;
globalThis.chooseRarity=Loot.chooseRarity;globalThis.makeLoot=Loot.makeLoot;
globalThis.FrontierAshesLootUI={renderLoot,openLoot,closeLoot,takeAll,takeOne};

const takeButton=document.getElementById('take-all');
if(takeButton){
  takeButton.onclick=takeAll;
  takeButton.addEventListener('pointerup',event=>{
    if(event.pointerType==='touch'){event.preventDefault();event.stopImmediatePropagation();takeAll();}
  },true);
}

const style=document.createElement('style');style.textContent=`
#loot-list{display:grid;grid-template-columns:1fr 1fr;gap:0 10px}
.fa-loot-row{display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:8px;padding:8px 4px;border-bottom:1px solid #263338;min-width:0}
.fa-loot-info{min-width:0}.fa-loot-info span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fa-loot-info small{display:block;font-size:9px;letter-spacing:1px;text-transform:uppercase;margin-top:2px}
.fa-loot-row>b{white-space:nowrap}.fa-take{background:#1d292d;color:#fff;border:2px solid #536168;border-radius:5px;padding:6px 10px;font-weight:900;touch-action:manipulation}
@media(max-width:700px){#loot-list{grid-template-columns:1fr}.fa-loot-row{padding:9px 2px}}
`;document.head.appendChild(style);
