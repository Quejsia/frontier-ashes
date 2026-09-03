const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
ctx.imageSmoothingEnabled=false;

const W=480,H=270;
const world={w:1400,h:900};
const player={x:700,y:450,r:10,speed:115,hp:100,maxHp:100,angle:0,ammo:12,mag:12,reserve:60,reloading:false,dodgeCooldown:0,invuln:0,dodgeVX:0,dodgeVY:0};
const camera={x:0,y:0};
let running=false,paused=false,last=0,shootHeld=false,shootCooldown=0,lootOpen=false,gameOverTimer=null;
let enemies=[],bullets=[],particles=[],crates=[];
const inv={Scrap:0,'9mm Ammo':60,'Canned Food':0,Medkit:0};

const keys={};
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.key===' ')e.preventDefault()});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);

const joystick={active:false,id:null,x:0,y:0};
const joy=document.getElementById('joystick'),stick=document.getElementById('stick');
function joyPoint(e){
  const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  let x=e.clientX-cx,y=e.clientY-cy,m=Math.hypot(x,y),max=42;
  if(m>max){x=x/m*max;y=y/m*max}
  joystick.x=x/max;joystick.y=y/max;stick.style.transform=`translate(${x}px,${y}px)`;
}
joy.addEventListener('pointerdown',e=>{e.preventDefault();joystick.active=true;joystick.id=e.pointerId;joy.setPointerCapture(e.pointerId);joyPoint(e)});
joy.addEventListener('pointermove',e=>{if(joystick.active&&e.pointerId===joystick.id)joyPoint(e)});
['pointerup','pointercancel'].forEach(t=>joy.addEventListener(t,e=>{if(e.pointerId===joystick.id){joystick.active=false;joystick.x=joystick.y=0;stick.style.transform=''}}));

const aimZone=document.getElementById('aim-zone');
const reticle=document.getElementById('aim-reticle');
const aim={active:false,id:null};
function canvasPoint(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}}
function updateAim(e){
  const p=canvasPoint(e),ps={x:player.x-camera.x,y:player.y-camera.y},dx=p.x-ps.x,dy=p.y-ps.y;
  if(Math.hypot(dx,dy)>5)player.angle=Math.atan2(dy,dx);
  const zr=aimZone.getBoundingClientRect();reticle.style.left=`${e.clientX-zr.left}px`;reticle.style.top=`${e.clientY-zr.top}px`;
}
aimZone.addEventListener('pointerdown',e=>{if(paused||lootOpen||!running)return;e.preventDefault();aim.active=true;aim.id=e.pointerId;aimZone.setPointerCapture(e.pointerId);reticle.style.display='block';updateAim(e)});
aimZone.addEventListener('pointermove',e=>{if(aim.active&&e.pointerId===aim.id)updateAim(e)});
['pointerup','pointercancel'].forEach(t=>aimZone.addEventListener(t,e=>{if(e.pointerId===aim.id){aim.active=false;aim.id=null;reticle.style.display='none'}}));

const shoot=document.getElementById('shoot');
shoot.addEventListener('pointerdown',e=>{e.preventDefault();shootHeld=true;shoot.setPointerCapture(e.pointerId);fire()});
['pointerup','pointercancel'].forEach(t=>shoot.addEventListener(t,()=>shootHeld=false));
document.getElementById('reload').onclick=reload;
document.getElementById('dodge').onclick=dodge;
document.getElementById('interact').onclick=interact;
document.getElementById('inventory-btn').onclick=()=>togglePanel('inventory-panel');
document.getElementById('pause-btn').onclick=()=>{paused=true;togglePanel('pause-panel')};
document.getElementById('resume').onclick=()=>{paused=false;togglePanel('pause-panel')};
document.getElementById('close-inventory').onclick=()=>togglePanel('inventory-panel');
document.getElementById('close-loot').onclick=closeLoot;
document.getElementById('take-all').onclick=takeAll;
document.getElementById('start').onclick=()=>{document.getElementById('start-screen').style.display='none';reset();running=true;showMessage('Explore the ruins. Move near a crate and tap OPEN.');};

function reset(){
  if(gameOverTimer){clearTimeout(gameOverTimer);gameOverTimer=null}
  player.x=700;player.y=450;player.hp=100;player.ammo=12;player.reserve=60;player.reloading=false;player.dodgeCooldown=0;player.invuln=0;player.dodgeVX=0;player.dodgeVY=0;
  enemies=[enemy(480,330),enemy(880,320),enemy(980,570),enemy(590,650)];
  crates=[{x:780,y:530,open:false,loot:null},{x:350,y:610,open:false,loot:null},{x:1100,y:300,open:false,loot:null}];
  inv.Scrap=0;inv['9mm Ammo']=60;inv['Canned Food']=0;inv.Medkit=0;updateInventory();updateHud();
}
function enemy(x,y){return{x,y,r:9,hp:45,maxHp:45,speed:42,hit:0}}
function worldToScreen(x,y){return{x:x-camera.x,y:y-camera.y}}
function fire(){
  if(!running||paused||lootOpen||player.reloading||shootCooldown>0)return;
  if(player.ammo<=0){showMessage('OUT OF AMMO — tap reload');return}
  player.ammo--;shootCooldown=.18;
  const a=player.angle;bullets.push({x:player.x+Math.cos(a)*12,y:player.y+Math.sin(a)*12,vx:Math.cos(a)*420,vy:Math.sin(a)*420,life:1.1});
  burst(player.x+Math.cos(a)*12,player.y+Math.sin(a)*12,4);updateHud();
}
function reload(){
  if(player.reloading||player.ammo===player.mag||player.reserve<=0)return;
  player.reloading=true;showMessage('Reloading...');
  setTimeout(()=>{if(!player.reloading)return;const n=Math.min(player.mag-player.ammo,player.reserve);player.ammo+=n;player.reserve-=n;inv['9mm Ammo']=player.reserve;player.reloading=false;updateHud();showMessage('Reloaded')},650);
}
function dodge(){
  if(!running||paused||lootOpen||player.dodgeCooldown>0)return;
  const m=moveInput();let dx=m.x,dy=m.y;
  if(!dx&&!dy){dx=Math.cos(player.angle);dy=Math.sin(player.angle)}
  player.invuln=.34;player.dodgeCooldown=1.0;player.dodgeVX=dx*380;player.dodgeVY=dy*380;showMessage('DODGE!');
}
function moveInput(){
  let x=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),y=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);
  if(joystick.active){x=joystick.x;y=joystick.y}
  const m=Math.hypot(x,y);return m>0?{x:x/m,y:y/m}:{x:0,y:0};
}
function nearestEnemy(){let best=null,bd=Infinity;for(const e of enemies){if(e.hp<=0)continue;const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<bd){bd=d;best=e}}return best}
function update(dt){
  if(!running||paused)return;
  shootCooldown=Math.max(0,shootCooldown-dt);player.dodgeCooldown=Math.max(0,player.dodgeCooldown-dt);player.invuln=Math.max(0,player.invuln-dt);
  const m=moveInput();let vx=m.x*player.speed,vy=m.y*player.speed;
  if(player.invuln){vx+=player.dodgeVX;vy+=player.dodgeVY;player.dodgeVX*=Math.pow(.04,dt);player.dodgeVY*=Math.pow(.04,dt)}
  player.x=Math.max(20,Math.min(world.w-20,player.x+vx*dt));player.y=Math.max(20,Math.min(world.h-20,player.y+vy*dt));
  if(!aim.active){const target=nearestEnemy();if(target)player.angle=Math.atan2(target.y-player.y,target.x-player.x)}
  if(shootHeld)fire();
  for(const b of bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(b.life<=0)continue;for(const e of enemies){if(e.hp>0&&Math.hypot(b.x-e.x,b.y-e.y)<e.r+3){e.hp-=25;b.life=0;e.hit=.08;burst(e.x,e.y,5);if(e.hp<=0){inv.Scrap+=3;showMessage('+3 SCRAP')}break}}}
  bullets=bullets.filter(b=>b.life>0&&b.x>0&&b.y>0&&b.x<world.w&&b.y<world.h);
  for(const e of enemies){if(e.hp<=0)continue;e.hit=Math.max(0,e.hit-dt);const dx=player.x-e.x,dy=player.y-e.y,d=Math.hypot(dx,dy)||1;if(d>22){e.x+=dx/d*e.speed*dt;e.y+=dy/d*e.speed*dt}if(d<24&&player.invuln<=0)player.hp-=18*dt}
  for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt}particles=particles.filter(p=>p.life>0);
  camera.x=Math.max(0,Math.min(world.w-W,player.x-W/2));camera.y=Math.max(0,Math.min(world.h-H,player.y-H/2));
  if(player.hp<=0&&!gameOverTimer){player.hp=0;showMessage('You were overwhelmed — restarting...');gameOverTimer=setTimeout(()=>{gameOverTimer=null;reset()},900)}
  updateHud();
}
function draw(){ctx.clearRect(0,0,W,H);drawWorld();drawCrates();drawBullets();drawEnemies();drawPlayer();drawParticles()}
function drawWorld(){
  ctx.fillStyle='#26382b';ctx.fillRect(0,0,W,H);const sx=Math.floor(camera.x/32)*32,sy=Math.floor(camera.y/32)*32;
  for(let y=sy;y<camera.y+H+32;y+=32)for(let x=sx;x<camera.x+W+32;x+=32){const px=x-camera.x,py=y-camera.y;ctx.fillStyle=((x/32+y/32)%2===0)?'#2a3b2e':'#2d4032';ctx.fillRect(px,py,31,31)}
  ctx.fillStyle='#343a38';ctx.fillRect(0,220-camera.y,W,70);ctx.fillRect(635-camera.x,0,78,H);
  for(const b of [[80,90,150,85],[880,90,170,100],[1050,650,190,120],[160,700,150,100]]){const[x,y,w,h]=b;ctx.fillStyle='#4a4b46';ctx.fillRect(x-camera.x,y-camera.y,w,h);ctx.fillStyle='#242b29';for(let xx=x+15;xx<x+w-10;xx+=35)ctx.fillRect(xx-camera.x,y+18-camera.y,18,20)}
  for(const t of [[120,350],[200,470],[1130,470],[1250,180],[360,170],[1180,780]]){const[x,y]=t;ctx.fillStyle='#16261c';ctx.fillRect(x-3-camera.x,y+5-camera.y,6,15);ctx.fillStyle='#102117';ctx.fillRect(x-12-camera.x,y-10-camera.y,24,20);ctx.fillRect(x-18-camera.x,y-camera.y,36,14)}
}
function drawPlayer(){const p=worldToScreen(player.x,player.y);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(player.angle);ctx.fillStyle=player.invuln?'#e8f3f3':'#d9b47a';ctx.fillRect(-7,-8,14,16);ctx.fillStyle='#38454a';ctx.fillRect(3,-3,13,6);ctx.fillStyle='#10181b';ctx.fillRect(-5,-11,10,5);ctx.restore()}
function drawEnemies(){for(const e of enemies)if(e.hp>0){const p=worldToScreen(e.x,e.y);ctx.fillStyle=e.hit?'#fff':'#9d493f';ctx.fillRect(p.x-8,p.y-8,16,16);ctx.fillStyle='#201517';ctx.fillRect(p.x-5,p.y-4,10,4);ctx.fillStyle='#171c1a';ctx.fillRect(p.x-10,p.y-14,20,3);ctx.fillStyle='#7fce66';ctx.fillRect(p.x-10,p.y-14,20*Math.max(0,e.hp/e.maxHp),3)}}
function drawCrates(){for(const c of crates){if(c.open)continue;const p=worldToScreen(c.x,c.y);ctx.fillStyle='#8c6337';ctx.fillRect(p.x-10,p.y-8,20,16);ctx.fillStyle='#c49a5a';ctx.fillRect(p.x-2,p.y-8,4,16)}}
function drawBullets(){ctx.fillStyle='#f3d28b';for(const b of bullets){const p=worldToScreen(b.x,b.y);ctx.fillRect(p.x-2,p.y-2,4,4)}}
function burst(x,y,n){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=30+Math.random()*70;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.25})}}
function drawParticles(){ctx.fillStyle='#e1ad64';for(const p of particles){const s=2+3*p.life/.25,q=worldToScreen(p.x,p.y);ctx.fillRect(q.x-s/2,q.y-s/2,s,s)}}
function nearbyCrate(){return crates.find(c=>!c.open&&Math.hypot(c.x-player.x,c.y-player.y)<42)||null}
function interact(){if(lootOpen)return;const c=nearbyCrate();if(!c){showMessage('Move closer to a crate');return}openLoot(c)}
function openLoot(c){lootOpen=true;c.loot={Scrap:8,'9mm Ammo':18,'Canned Food':2};document.getElementById('loot-panel').classList.remove('hidden');document.getElementById('interact').classList.add('hidden');document.getElementById('loot-list').innerHTML='<div class="loot-row"><span>🧰 Scrap</span><b>+8</b></div><div class="loot-row"><span>💥 9mm Ammo</span><b>+18</b></div><div class="loot-row"><span>🥫 Canned Food</span><b>+2</b></div>'}
function takeAll(){const c=crates.find(c=>c.loot);if(c){for(const[k,v]of Object.entries(c.loot))inv[k]=(inv[k]||0)+v;player.reserve+=c.loot['9mm Ammo']||0;inv['9mm Ammo']=player.reserve;c.loot=null;c.open=true}closeLoot();showMessage('Loot collected')}
function closeLoot(){lootOpen=false;document.getElementById('loot-panel').classList.add('hidden');updateHud()}
function togglePanel(id){document.getElementById(id).classList.toggle('hidden')}
let inventoryHTML='';
function updateInventory(){const next=Object.entries(inv).map(([k,v])=>`<div class="inv-row"><span>${k}</span><b>${v}</b></div>`).join('');if(next!==inventoryHTML){inventoryHTML=next;document.getElementById('inventory-list').innerHTML=next}}
let lastHp=-1,lastAmmo=-1,lastReserve=-1,lastDodge=-1,lastNear=false;
function updateHud(){
  const hp=Math.ceil(player.hp);if(hp!==lastHp){lastHp=hp;document.getElementById('hp-fill').style.width=`${Math.max(0,player.hp/player.maxHp*100)}%`;document.getElementById('hp-text').textContent=`${hp}/${player.maxHp}`}
  if(player.ammo!==lastAmmo||player.reserve!==lastReserve){lastAmmo=player.ammo;lastReserve=player.reserve;document.getElementById('ammo-text').textContent=`${player.ammo}/${player.reserve}`}
  const dodgeBtn=document.getElementById('dodge');if(player.dodgeCooldown>0){const sec=Math.ceil(player.dodgeCooldown);if(lastDodge!==sec){dodgeBtn.textContent=String(sec);lastDodge=sec}dodgeBtn.classList.add('cooling')}else{if(lastDodge!==0){dodgeBtn.textContent='🏃';lastDodge=0}dodgeBtn.classList.remove('cooling')}
  const near=!!nearbyCrate(),interactBtn=document.getElementById('interact');if(near!==lastNear){lastNear=near;interactBtn.classList.toggle('hidden',!near||lootOpen)}else if(lootOpen)interactBtn.classList.add('hidden');
  updateInventory();
}
let msgTimer=0;function showMessage(t){const el=document.getElementById('message');el.textContent=t;el.style.opacity=1;clearTimeout(msgTimer);msgTimer=setTimeout(()=>el.style.opacity=0,1300)}
function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop)}
updateInventory();updateHud();requestAnimationFrame(loop);