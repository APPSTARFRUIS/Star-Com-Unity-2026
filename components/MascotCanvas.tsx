import React from 'react';
import MascotLayer,{MascotLayerItem} from './MascotLayer';

/** Canonical square coordinate system shared by Admin and user views.
 * All mascot accessory coordinates are percentages of this exact canvas,
 * so an accessory positioned in Admin renders identically everywhere.
 */
export default function MascotCanvas({items=[],className='',interactive=false,onPointerDown,onPointerMove,onPointerUp,onPointerCancel,canvasRef}:{
 items?:MascotLayerItem[]; className?:string; interactive?:boolean;
 onPointerDown?:React.PointerEventHandler<HTMLDivElement>; onPointerMove?:React.PointerEventHandler<HTMLDivElement>;
 onPointerUp?:React.PointerEventHandler<HTMLDivElement>; onPointerCancel?:React.PointerEventHandler<HTMLDivElement>;
 canvasRef?:React.Ref<HTMLDivElement>;
}){
 return <div className={`relative aspect-square overflow-hidden bg-gradient-to-b from-green-50 to-amber-50 ${interactive?'touch-none select-none':''} ${className}`}
   ref={canvasRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}>
   <img src="/mascot-pear.png" draggable={false} className="absolute inset-0 w-full h-full object-contain z-[1] pointer-events-none" alt="Ma Poire"/>
   {items.map((it,index)=><MascotLayer key={it.id||index} item={it}/>)}
 </div>;
}
