import { openFitting } from './fitting.js';
import {products} from './gravity-products.js';
const space=document.querySelector('#space'), card=document.querySelector('#detail');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const objects=[];
let suppressClickUntil=0;
let active,drag,px=0,py=0,aimX=0,aimY=0,panX=0,panY=0,vx=0,vy=0,last=performance.now();
function select(o){
  active?.node.classList.remove('active');
  active=o;
  o?.node.classList.add('active');
  card.classList.toggle('visible',Boolean(o?.product));
  if(o?.product){
    card.querySelector('strong').textContent=o.product.name;
    card.querySelector('small').textContent=o.product.brand+' · Demo ↗';
    card.querySelector('span').textContent='৳ '+o.product.price.toLocaleString('en-US');
  }
}
function add(index,x,y,w,depth,angle,far=false){
  const product=products[index],camera=!product,i=objects.length;
  const node=document.createElement('div'),float=document.createElement('div'),button=document.createElement(far?'div':'button'),img=new Image();
  node.className='object '+(far?'far':camera?'camera':'');
  node.style.cssText='--x:'+x+';--y:'+y+';--w:'+w+';z-index:'+Math.round(depth*4);
  if(far)node.style.filter='brightness('+(.30+depth*.48)+') blur('+(2.6-depth*2)+'px)';
  float.className='float';button.className='item';img.src='assets/zero/'+(product?.asset??'camera')+'.webp';img.alt=far?'':product?.name??'Vintage rangefinder';img.draggable=false;
  button.append(img);float.append(button);node.append(float);space.append(node);
  const o={node,float,button,product,depth,angle,t:i*1.73,rate:2*Math.PI/(6+(i*1.31)%6),gain:1};objects.push(o);
  if(camera){const label=document.createElement('span');label.className='caption';label.textContent='Try on live ↗';float.append(label)}
  if(far)return;
  if(camera)button.addEventListener('click',()=>{if(performance.now()>=suppressClickUntil){select(null);openFitting(button)}});
  for(const event of ['pointerenter','focus','click'])button.addEventListener(event,()=>{if(!drag?.moved)select(o)});
  for(const event of ['pointerleave','blur'])button.addEventListener(event,()=>{if(active===o)select(null)});
}
let seed=123;function random(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296}
for(let i=0;i<105;i++){
  const x=random()*170-35,y=random()*170-35,d=.10+random()*.42;
  if(Math.abs(x-50)<16&&Math.abs(y-49)<16)continue;
  add(i%8,x,y,3+13*d,d,random()*100-50,true);
}
[[0,12,28,39,1.1,-12],[1,11,99,44,1.25,13],[2,64,12,27,.84,12],[3,94,43,34,1.15,-8],[4,74,100,43,1.24,8],[5,-14,59,27,.88,26],[6,116,81,29,.93,-18],[7,43,-23,28,.83,38],[6,39,126,25,.8,-24],[5,108,-19,28,.9,13],[8,50,49,24,.67,-23]].forEach(args=>add(...args));
space.onpointerdown=e=>{if(!e.isPrimary||e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:panX,startY:panY};vx=vy=0};
window.addEventListener('pointermove',e=>{
 aimX=e.clientX/innerWidth*2-1;aimY=e.clientY/innerHeight*2-1;
 if(!drag||drag.id!==e.pointerId)return;
 const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
 if(!drag.moved&&Math.hypot(dx,dy)<6)return;
 drag.moved=true;space.setPointerCapture(e.pointerId);space.classList.add('drag');select(null);
 const x=Math.tanh((drag.startX+dx)/(innerWidth*.5))*innerWidth*.5,y=Math.tanh((drag.startY+dy)/(innerHeight*.5))*innerHeight*.5;
 vx=(x-panX)*12;vy=(y-panY)*12;panX=x;panY=y;
});
function release(e){if(drag?.id!==e.pointerId)return;if(drag.moved)suppressClickUntil=performance.now()+250;drag=null;space.classList.remove('drag')}
window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);
function frame(now){
 const dt=Math.min(.032,(now-last)/1000);last=now;
 if(!drag){vx+=(-panX*65-vx*16)*dt;vy+=(-panY*65-vy*16)*dt;panX+=vx*dt;panY+=vy*dt}
 px+=(aimX-px)*dt*6;py+=(aimY-py)*dt*6;
 for(const o of objects){
    o.gain+=((active===o ? .06 : 1)-o.gain)*dt*6;
  if(!reduced.matches)o.t+=dt*o.rate*o.gain;
  const dx=reduced.matches?0:Math.sin(o.t)*10,dy=reduced.matches?0:Math.cos(o.t*.9)*17;
  o.node.style.transform='translate3d('+((panX+(reduced.matches?0:px*12))*o.depth)+'px,'+((panY+(reduced.matches?0:py*10))*o.depth)+'px,0)';
  o.float.style.transform='translate('+dx+'px,'+dy+'px) rotate('+(o.angle+(reduced.matches?0:Math.sin(o.t)*3))+'deg)';
  if(!o.product)o.button.style.transform='perspective(650px) rotateY('+(active===o?px*8:0)+'deg) rotateX('+(active===o?-py*7:0)+'deg)';
 }
 if(active?.product){const b=active.button.getBoundingClientRect(),right=b.right+20+card.offsetWidth<innerWidth;
 card.classList.toggle('reverse',!right);card.style.left=Math.max(8,Math.min(innerWidth-card.offsetWidth-8,right?b.right+20:b.left-card.offsetWidth-20))+'px';card.style.top=Math.max(8,Math.min(innerHeight-card.offsetHeight-8,b.top+b.height*.48-card.offsetHeight/2))+'px'}
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
