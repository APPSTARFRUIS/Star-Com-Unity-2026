import React from 'react';

export type MascotLayerItem = {
  id:string; image_url?:string; category:string;
  layer_x?:number|null; layer_y?:number|null; layer_width?:number|null;
  layer_rotation?:number|null; pair_mode?:boolean|null; pair_gap?:number|null;
};

const defaults: Record<string,{x:number;y:number;width:number;rotation:number;pair:boolean;gap:number}> = {
  glasses:{x:50,y:48,width:48,rotation:0,pair:false,gap:0},
  hat:{x:50,y:18,width:54,rotation:0,pair:false,gap:0},
  clothing:{x:50,y:65,width:62,rotation:0,pair:false,gap:0},
  shoes:{x:50,y:88,width:25,rotation:0,pair:true,gap:13},
  accessory:{x:50,y:62,width:38,rotation:0,pair:false,gap:0},
  background:{x:50,y:50,width:100,rotation:0,pair:false,gap:0},
  souvenir:{x:50,y:62,width:34,rotation:0,pair:false,gap:0},
};

export function layerValues(item:MascotLayerItem){
  const d=defaults[item.category]||defaults.accessory;
  return {x:item.layer_x??d.x,y:item.layer_y??d.y,width:item.layer_width??d.width,rotation:item.layer_rotation??d.rotation,pair:item.pair_mode??d.pair,gap:item.pair_gap??d.gap};
}

export default function MascotLayer({item}:{item:MascotLayerItem}){
  if(!item.image_url)return null;
  if(item.category==='background') return <img src={item.image_url} alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',pointerEvents:'none',zIndex:0}}/>;
  const v=layerValues(item);
  const common:React.CSSProperties={position:'absolute',top:`${v.y}%`,width:`${v.width}%`,height:'auto',objectFit:'contain',pointerEvents:'none',zIndex:10};
  if(v.pair){
    return <>
      <img src={item.image_url} alt="" style={{...common,left:`calc(${v.x}% - ${v.gap}%)`,transform:`translate(-50%,-50%) rotate(${-v.rotation}deg) scaleX(-1)`}}/>
      <img src={item.image_url} alt="" style={{...common,left:`calc(${v.x}% + ${v.gap}%)`,transform:`translate(-50%,-50%) rotate(${v.rotation}deg)`}}/>
    </>;
  }
  return <img src={item.image_url} alt="" style={{...common,left:`${v.x}%`,transform:`translate(-50%,-50%) rotate(${v.rotation}deg)`}}/>;
}
