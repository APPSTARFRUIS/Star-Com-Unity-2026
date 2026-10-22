import React, { useMemo, useRef, useState } from 'react';
import { CATEGORIES } from '../constants';
import { Post, User, Attachment, SocialPostType } from '../types';
import { uploadMediaToStorage } from '../storageUtils';

interface Props { currentUser: User; users?: User[]; onPostCreated: (post: any) => void; }
const TYPES: {id:SocialPostType;label:string;icon:string}[] = [
  {id:'publication',label:'Publication',icon:'💬'}, {id:'question',label:'Question',icon:'❓'},
  {id:'poll',label:'Sondage',icon:'📊'}, {id:'bravo',label:'Bravo',icon:'👏'}
];
const PostCreator: React.FC<Props> = ({ currentUser, users = [], onPostCreated }) => {
  const [open,setOpen]=useState(false), [postType,setPostType]=useState<SocialPostType>('publication');
  const [title,setTitle]=useState(''), [content,setContent]=useState(''), [category,setCategory]=useState(CATEGORIES[0]);
  const [attachments,setAttachments]=useState<Attachment[]>([]), [uploadProgress,setUploadProgress]=useState<number|null>(null);
  const [uploadingFileName,setUploadingFileName]=useState(''), [linkUrl,setLinkUrl]=useState('');
  const [audience,setAudience]=useState<string[]>([]), [pollOptions,setPollOptions]=useState(['','']);
  const fileRef=useRef<HTMLInputElement>(null);
  const companies=useMemo(()=>Array.from(new Set(users.map(u=>u.company).filter(Boolean))).sort(),[users]);
  const mentions=useMemo(()=>users.filter(u=>content.toLowerCase().includes(`@${u.name.toLowerCase()}`)).map(u=>u.id),[content,users]);
  const submit=(e:React.FormEvent)=>{e.preventDefault(); if(!content.trim() && !title.trim())return; const opts=pollOptions.map(x=>x.trim()).filter(Boolean); if(postType==='poll'&&opts.length<2){alert('Ajoutez au moins 2 choix.');return;} onPostCreated({title:title.trim()||({question:'Question',poll:'Sondage',bravo:'Bravo',publication:'Publication'} as any)[postType],content,category,attachments:attachments.length?attachments:undefined,postType,audienceCompanies:audience,linkUrl:linkUrl.trim()||undefined,pollOptions:postType==='poll'?opts:undefined,mentionedUserIds:mentions}); setTitle('');setContent('');setAttachments([]);setLinkUrl('');setPollOptions(['','']);setAudience([]);setOpen(false); };
  const upload=async(e:React.ChangeEvent<HTMLInputElement>)=>{const fs=e.target.files;if(!fs)return;const out:Attachment[]=[];for(const f of Array.from(fs)){try{setUploadingFileName(f.name);setUploadProgress(0);const url=await uploadMediaToStorage(f,'posts',setUploadProgress);out.push({name:f.name,type:f.type,data:url});}catch(err:any){alert(err?.message||`Upload impossible : ${f.name}`)}finally{setUploadProgress(null);setUploadingFileName('')}}setAttachments(v=>[...v,...out]);e.target.value='';};
  return <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
    {!open?<div className="flex gap-3 items-center"><img src={currentUser.avatar} className="w-10 h-10 rounded-full"/><button onClick={()=>setOpen(true)} className="flex-1 text-left bg-slate-50 border rounded-full px-5 py-3 text-slate-500">Partager des nouvelles, une question ou un bravo…</button></div>:
    <form onSubmit={submit} className="space-y-4">
      <div className="flex justify-between items-center"><b>Créer une publication</b><button type="button" onClick={()=>setOpen(false)}>✕</button></div>
      <div className="flex flex-wrap gap-2">{TYPES.map(t=><button type="button" key={t.id} onClick={()=>setPostType(t.id)} className={`px-3 py-2 rounded-xl border text-sm font-bold ${postType===t.id?'bg-green-700 text-white border-green-700':'bg-white'}`}>{t.icon} {t.label}</button>)}</div>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder={postType==='bravo'?'Ex. Bravo à l’équipe commerciale !':'Titre (facultatif)'} className="w-full border rounded-xl px-4 py-2"/>
      <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Écrivez votre message… Utilisez @Nom Prénom pour mentionner un collègue." className="w-full min-h-32 border rounded-xl px-4 py-3"/>
      <div className="flex flex-wrap gap-2 items-center text-sm"><span className="font-bold text-slate-500">Mise en forme</span><button type="button" onClick={()=>setContent(v=>v+' **texte**') } className="border rounded px-2 py-1 font-bold">B</button><button type="button" onClick={()=>setContent(v=>v+' *texte*') } className="border rounded px-2 py-1 italic">I</button><button type="button" onClick={()=>setContent(v=>v+'\n• ') } className="border rounded px-2 py-1">☷ Liste</button><button type="button" onClick={()=>setContent(v=>v+' [lien](https://)') } className="border rounded px-2 py-1">🔗 Lien</button><select defaultValue="" onChange={e=>{if(e.target.value){setContent(v=>`${v}${v&&!v.endsWith(' ')?' ':''}@${e.target.value} `);e.currentTarget.value=''}}} className="border rounded px-2 py-1"><option value="">@ Mentionner…</option>{users.map(u=><option key={u.id} value={u.name}>{u.name}</option>)}</select></div>
      {postType==='poll'&&<div className="space-y-2"><b className="text-sm">Choix du sondage</b>{pollOptions.map((o,i)=><div key={i} className="flex gap-2"><input value={o} onChange={e=>setPollOptions(v=>v.map((x,j)=>j===i?e.target.value:x))} placeholder={`Choix ${i+1}`} className="flex-1 border rounded-lg px-3 py-2"/>{pollOptions.length>2&&<button type="button" onClick={()=>setPollOptions(v=>v.filter((_,j)=>j!==i))}>✕</button>}</div>)}<button type="button" onClick={()=>setPollOptions(v=>[...v,''])} className="text-green-700 font-bold text-sm">+ Ajouter un choix</button></div>}
      <div className="grid md:grid-cols-2 gap-3"><div><label className="text-xs font-bold text-slate-500">CATÉGORIE</label><select value={category} onChange={e=>setCategory(e.target.value)} className="w-full border rounded-lg px-3 py-2">{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div><div><label className="text-xs font-bold text-slate-500">AUDIENCE</label><select value={audience[0]||''} onChange={e=>setAudience(e.target.value?[e.target.value]:[])} className="w-full border rounded-lg px-3 py-2"><option value="">Tout STAR GROUP</option>{companies.map(c=><option key={c}>{c}</option>)}</select></div></div>
      <input value={linkUrl} onChange={e=>setLinkUrl(e.target.value)} placeholder="Lien web ou vidéo YouTube (facultatif)" className="w-full border rounded-xl px-4 py-2"/>
      {uploadProgress!==null&&<div className="bg-green-50 rounded-xl p-3 text-sm"><b>{uploadingFileName}</b> — {uploadProgress}%<div className="h-2 bg-green-100 rounded mt-2"><div className="h-2 bg-green-600 rounded" style={{width:`${uploadProgress}%`}}/></div></div>}
      {attachments.length>0&&<div className="flex flex-wrap gap-2">{attachments.map((a,i)=><span key={i} className="bg-slate-100 rounded-lg px-3 py-2 text-xs">{a.name} <button type="button" onClick={()=>setAttachments(v=>v.filter((_,j)=>j!==i))}>×</button></span>)}</div>}
      <div className="flex flex-wrap gap-2 items-center"><input ref={fileRef} type="file" multiple className="hidden" onChange={upload}/><button type="button" onClick={()=>fileRef.current?.click()} className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-sm">📎 Photo / GIF / document / vidéo depuis l’ordinateur</button><button type="button" onClick={()=>setContent(v=>v+' 😊')} className="px-3 py-2 bg-slate-100 rounded-xl">😊</button><span className="text-xs text-slate-500">Vidéo locale conservée (jusqu’à 500 Mo selon le stockage configuré).</span></div>
      <div className="flex justify-end"><button disabled={uploadProgress!==null} className="bg-green-700 text-white px-7 py-2.5 rounded-xl font-bold">Publier</button></div>
    </form>}
  </div>
};
export default PostCreator;
