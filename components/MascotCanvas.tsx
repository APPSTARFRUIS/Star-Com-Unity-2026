import React,{useEffect,useState} from 'react';
import MascotLayer,{MascotLayerItem} from './MascotLayer';

type Mood='idle'|'happy'|'celebrate'|'outfit'|'tap';
export default function MascotCanvas({items=[],className='',interactive=false,onPointerDown,onPointerMove,onPointerUp,onPointerCancel,canvasRef,mood='idle',onMascotClick}: {
 items?:MascotLayerItem[]; className?:string; interactive?:boolean; mood?:Mood; onMascotClick?:()=>void;
 onPointerDown?:React.PointerEventHandler<HTMLDivElement>; onPointerMove?:React.PointerEventHandler<HTMLDivElement>;
 onPointerUp?:React.PointerEventHandler<HTMLDivElement>; onPointerCancel?:React.PointerEventHandler<HTMLDivElement>; canvasRef?:React.Ref<HTMLDivElement>;
}){
 const [blink,setBlink]=useState(false);
 useEffect(()=>{if(interactive)return;let timer:number;const schedule=()=>{timer=window.setTimeout(()=>{setBlink(true);window.setTimeout(()=>setBlink(false),140);schedule()},3500+Math.random()*4500)};schedule();return()=>window.clearTimeout(timer)},[interactive]);
 const anim=mood==='celebrate'?'mascot-celebrate':mood==='happy'?'mascot-happy':mood==='outfit'?'mascot-outfit':mood==='tap'?'mascot-tap':'mascot-idle';
 return <div className={`relative aspect-square overflow-hidden bg-gradient-to-b from-green-50 to-amber-50 ${interactive?'touch-none select-none':''} ${className}`}
   ref={canvasRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel} onClick={!interactive?onMascotClick:undefined}>
   <div className={`absolute inset-0 ${anim}`}>
    <img src="/mascot-pear.png" draggable={false} className={`absolute inset-0 w-full h-full object-contain z-[1] pointer-events-none transition-transform ${blink?'scale-y-[0.985]':''}`} alt="Ma Poire"/>
    {items.map((it,index)=><MascotLayer key={it.id||index} item={it}/>)}
   </div>
   {mood==='celebrate'&&<div className="absolute inset-0 pointer-events-none z-[80] mascot-sparkles"><span>✦</span><span>•</span><span>✦</span><span>•</span><span>✦</span></div>}
 </div>;
}
