import React,{useEffect,useMemo,useState} from 'react';
import MascotLayer,{MascotLayerItem} from './MascotLayer';

export type MascotMood='idle'|'happy'|'celebrate'|'outfit'|'tap'|'sleepy'|'proud'|'curious';
type Mood=MascotMood;
export default function MascotCanvas({items=[],className='',interactive=false,onPointerDown,onPointerMove,onPointerUp,onPointerCancel,canvasRef,mood='idle',onMascotClick}: {
 items?:MascotLayerItem[]; className?:string; interactive?:boolean; mood?:Mood; onMascotClick?:()=>void;
 onPointerDown?:React.PointerEventHandler<HTMLDivElement>; onPointerMove?:React.PointerEventHandler<HTMLDivElement>;
 onPointerUp?:React.PointerEventHandler<HTMLDivElement>; onPointerCancel?:React.PointerEventHandler<HTMLDivElement>; canvasRef?:React.Ref<HTMLDivElement>;
}){
 const [blink,setBlink]=useState(false);
 useEffect(()=>{if(interactive)return;let timer:number;const schedule=()=>{timer=window.setTimeout(()=>{setBlink(true);window.setTimeout(()=>setBlink(false),140);schedule()},3500+Math.random()*4500)};schedule();return()=>window.clearTimeout(timer)},[interactive]);
 const anim=mood==='celebrate'?'mascot-celebrate':mood==='happy'?'mascot-happy':mood==='outfit'?'mascot-outfit':mood==='tap'?'mascot-tap':mood==='sleepy'?'mascot-sleepy':mood==='proud'?'mascot-proud':mood==='curious'?'mascot-curious':'mascot-idle';
 const backgrounds=useMemo(()=>items.filter(it=>it.category==='background'),[items]);
 const foregrounds=useMemo(()=>items.filter(it=>it.category!=='background'),[items]);
 const hasUniverse=backgrounds.length>0;
 return <div className={`relative aspect-square overflow-hidden ${hasUniverse?'bg-white':'bg-gradient-to-b from-green-50 to-amber-50'} ${interactive?'touch-none select-none':''} ${className}`}
   ref={canvasRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel} onClick={!interactive?onMascotClick:undefined}>
   {backgrounds.map((it,index)=><MascotLayer key={it.id||`bg-${index}`} item={it}/>)}
   {hasUniverse&&<div className="absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-white/5 pointer-events-none z-[1]"/>}
   <div className={`absolute inset-0 z-[5] ${anim}`}>
    <img src="/mascot-pear.png" draggable={false} className={`absolute pointer-events-none transition-all duration-300 ${hasUniverse?'left-[12%] top-[10%] w-[76%] h-[82%]':'inset-0 w-full h-full'} object-contain z-[1] ${blink?'scale-y-[0.985]':''}`} alt="Ma Poire"/>
    {foregrounds.map((it,index)=><MascotLayer key={it.id||index} item={it}/>)}
   </div>
   <MoodEffect mood={mood}/>
 </div>;
}

function MoodEffect({mood}:{mood:Mood}){
 if(mood==='sleepy')return <div className="absolute right-[13%] top-[15%] z-[70] pointer-events-none mascot-mood-float"><span className="text-2xl font-black text-indigo-700">Z</span><span className="ml-1 text-lg font-black text-indigo-500">z</span><span className="ml-1 text-sm font-black text-indigo-400">z</span></div>;
 if(mood==='proud')return <div className="absolute inset-0 z-[70] pointer-events-none mascot-mood-sparkles"><span>✦</span><span>★</span><span>✦</span></div>;
 if(mood==='curious')return <div className="absolute right-[10%] top-[12%] z-[70] pointer-events-none mascot-mood-float text-4xl font-black text-amber-600">?</div>;
 if(mood==='happy')return <div className="absolute inset-0 z-[70] pointer-events-none mascot-mood-hearts"><span>♥</span><span>♥</span></div>;
 if(mood==='celebrate')return <div className="absolute inset-0 pointer-events-none z-[80] mascot-sparkles"><span>✦</span><span>•</span><span>★</span><span>•</span><span>✦</span></div>;
 return null;
}
