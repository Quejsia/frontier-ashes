/* Frontier Ashes — Phase 1, Commit 1: joystick visual correction only.
   This is a non-destructive patch. The original joystick implementation remains
   in game-v3.js until the controls extraction is separately tested and approved.
*/
(function(){
  const joy=document.getElementById('joystick');
  const stick=document.getElementById('stick');
  if(!joy||!stick)return;

  const state={active:false,id:null};

  function resetVisual(){
    stick.style.transform='translate3d(0,0,0)';
  }

  function updateVisual(e){
    const r=joy.getBoundingClientRect();
    const cx=r.left+r.width/2;
    const cy=r.top+r.height/2;
    let x=e.clientX-cx;
    let y=e.clientY-cy;
    const distance=Math.hypot(x,y);

    // Keep the knob fully inside the joystick base. The old implementation
    // used a percentage of the base width, which could push the knob outside
    // the ring on larger/portrait layouts.
    const knobRadius=Math.min(stick.offsetWidth,stick.offsetHeight)/2;
    const travel=Math.max(0,Math.min(r.width,r.height)/2-knobRadius-3);

    if(distance>travel&&distance>0){
      x=x/distance*travel;
      y=y/distance*travel;
    }

    stick.style.transform=`translate3d(${x}px,${y}px,0)`;
  }

  joy.addEventListener('pointerdown',e=>{
    state.active=true;
    state.id=e.pointerId;
    updateVisual(e);
  });

  joy.addEventListener('pointermove',e=>{
    if(state.active&&e.pointerId===state.id)updateVisual(e);
  });

  function release(e){
    if(!state.active||e.pointerId===undefined||e.pointerId===state.id){
      state.active=false;
      state.id=null;
      resetVisual();
    }
  }

  joy.addEventListener('pointerup',release);
  joy.addEventListener('pointercancel',release);
  joy.addEventListener('lostpointercapture',release);
  window.addEventListener('blur',release);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)release({})});
})();
