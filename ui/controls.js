/* Frontier Ashes — Phase 1, Commit 5: controls extraction.
   Non-destructive migration layer. The legacy control listeners remain in
   game-v3.js until this module is proven in-game and the user approves any
   legacy removal. This module therefore exposes the extracted control logic
   without registering a second set of listeners or changing live behavior.
*/
(function(){
  const keys={};
  const joystick={active:false,id:null,x:0,y:0};
  const fireStick={active:false,id:null};

  function keyDown(e){
    keys[e.key.toLowerCase()]=true;
    if(e.key===' ')e.preventDefault();
  }

  function keyUp(e){
    keys[e.key.toLowerCase()]=false;
  }

  function joyPoint(e,joy,stick){
    const r=joy.getBoundingClientRect();
    const cx=r.left+r.width/2;
    const cy=r.top+r.height/2;
    let x=e.clientX-cx;
    let y=e.clientY-cy;
    const m=Math.hypot(x,y);
    const max=Math.max(30,r.width*.36);
    if(m>max){x=x/m*max;y=y/m*max}
    joystick.x=x/max;
    joystick.y=y/max;
    stick.style.transform=`translate(${x}px,${y}px)`;
  }

  function firePoint(e,shoot,redStick,playerState){
    const r=shoot.getBoundingClientRect();
    const cx=r.left+r.width/2;
    const cy=r.top+r.height/2;
    let x=e.clientX-cx;
    let y=e.clientY-cy;
    const m=Math.hypot(x,y);
    const max=Math.max(22,r.width*.34);
    if(m>max){x=x/m*max;y=y/m*max}
    if(m>5)playerState.angle=Math.atan2(y,x);
    redStick.style.transform=`translate(${x}px,${y}px)`;
  }

  window.FrontierAshesControls={
    keys,
    joystick,
    fireStick,
    keyDown,
    keyUp,
    joyPoint,
    firePoint
  };
})();
