import React, { useMemo, useRef, useState } from 'react';
import { OrgContact, OrgEntity, OrgEntityType, OrgService } from '../types';
import { uploadMediaToStorage } from '../storageUtils';

interface Props {
  entities: OrgEntity[];
  services: OrgService[];
  contacts: OrgContact[];
  onAddEntity: (entity: Omit<OrgEntity, 'id'>) => Promise<void>;
  onUpdateEntity: (id: string, changes: Partial<OrgEntity>) => Promise<void>;
  onDeleteEntity: (id: string) => Promise<void>;
  onAddService: (service: Omit<OrgService, 'id'>) => Promise<void>;
  onUpdateService: (id: string, changes: Partial<OrgService>) => Promise<void>;
  onDeleteService: (id: string) => Promise<void>;
  onAddContact: (contact: Omit<OrgContact, 'id'>) => Promise<void>;
  onUpdateContact: (id: string, changes: Partial<OrgContact>) => Promise<void>;
  onDeleteContact: (id: string) => Promise<void>;
}

const typeLabels: Record<OrgEntityType, string> = {
  group: 'Groupe', subsidiary: 'Filiale / entreprise', shareholder: 'Actionnaire pépiniériste'
};

const OrganizationAdmin: React.FC<Props> = ({
  entities, services, contacts,
  onAddEntity, onUpdateEntity, onDeleteEntity,
  onAddService, onUpdateService, onDeleteService,
  onAddContact, onUpdateContact, onDeleteContact
}) => {
  const [selectedId, setSelectedId] = useState<string>(entities[0]?.id || '');
  const selected = entities.find(e => e.id === selectedId) || entities[0];
  const [entityName, setEntityName] = useState('');
  const [entityType, setEntityType] = useState<OrgEntityType>('shareholder');
  const [newService, setNewService] = useState('');
  const [contact, setContact] = useState({ name: '', email: '', phone: '', jobTitle: '', about: '' });
  const logoRef = useRef<HTMLInputElement>(null);
  const selectedServices = useMemo(() => services.filter(s => s.entityId === selected?.id && s.active).sort((a,b)=>a.sortOrder-b.sortOrder), [services, selected?.id]);
  const selectedContacts = useMemo(() => contacts.filter(c => c.entityId === selected?.id).sort((a,b)=>a.sortOrder-b.sortOrder), [contacts, selected?.id]);

  const addEntity = async () => {
    const name = entityName.trim(); if (!name) return;
    await onAddEntity({ name, entityType, parentId: entities.find(e=>e.entityType==='group')?.id || null, logoUrl: null, sortOrder: entities.length + 1, active: true });
    setEntityName('');
  };

  const uploadLogo = async (file?: File) => {
    if (!file || !selected) return;
    const url = await uploadMediaToStorage(file, 'organization/logos');
    await onUpdateEntity(selected.id, { logoUrl: url });
  };

  return <div className="space-y-6 text-left">
    <div>
      <h2 className="text-2xl font-black text-slate-800">Organisation du Groupe</h2>
      <p className="text-sm text-slate-500 mt-1">Entreprises, actionnaires pépiniéristes, logos, services et membres externes.</p>
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
      <div className="bg-white border border-slate-200 rounded-[28px] p-5 space-y-5">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Structures</p>
          {entities.filter(e=>e.active).sort((a,b)=>a.sortOrder-b.sortOrder).map(e => <button key={e.id} type="button" onClick={()=>setSelectedId(e.id)} className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left ${selected?.id===e.id?'bg-purple-50 border border-purple-200':'bg-slate-50 border border-transparent'}`}>
            <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">{e.logoUrl ? <img src={e.logoUrl} className="w-full h-full object-contain"/> : <span className="font-black text-slate-300">{e.name.slice(0,2).toUpperCase()}</span>}</div>
            <div className="min-w-0"><p className="font-black text-slate-800 truncate">{e.name}</p><p className="text-[9px] uppercase font-black text-slate-400">{typeLabels[e.entityType]}</p></div>
          </button>)}
        </div>
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <input value={entityName} onChange={e=>setEntityName(e.target.value)} placeholder="Nouvelle structure..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"/>
          <select value={entityType} onChange={e=>setEntityType(e.target.value as OrgEntityType)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"><option value="subsidiary">Filiale / entreprise</option><option value="shareholder">Actionnaire pépiniériste</option></select>
          <button onClick={()=>void addEntity()} className="w-full py-2.5 rounded-xl bg-purple-600 text-white font-black">Ajouter la structure</button>
        </div>
      </div>

      {selected && <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-[28px] p-6">
          <div className="flex flex-col md:flex-row gap-5 md:items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">{selected.logoUrl?<img src={selected.logoUrl} className="w-full h-full object-contain"/>:<span className="text-xl font-black text-slate-300">LOGO</span>}</div>
              <div><h3 className="text-xl font-black">{selected.name}</h3><p className="text-xs font-bold text-slate-400 uppercase">{typeLabels[selected.entityType]}</p></div>
            </div>
            <div className="flex gap-2"><input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e=>void uploadLogo(e.target.files?.[0])}/><button onClick={()=>logoRef.current?.click()} className="px-4 py-2 rounded-xl bg-green-50 text-green-700 font-black text-xs">Ajouter / changer le logo</button>{selected.entityType!=='group'&&<button onClick={()=>confirm(`Supprimer ${selected.name} ?`)&&void onDeleteEntity(selected.id)} className="px-4 py-2 rounded-xl bg-red-50 text-red-600 font-black text-xs">Supprimer</button>}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-[28px] p-6 space-y-4">
            <div><h3 className="font-black text-lg">Services de {selected.name}</h3><p className="text-xs text-slate-400">Chaque structure possède sa propre liste. Aucun service n'est partagé automatiquement.</p></div>
            <div className="flex gap-2"><input value={newService} onChange={e=>setNewService(e.target.value)} placeholder="Ex. Administration, Commercial..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"/><button onClick={async()=>{const n=newService.trim();if(!n)return;await onAddService({entityId:selected.id,name:n,sortOrder:selectedServices.length+1,active:true});setNewService('')}} className="px-4 rounded-xl bg-purple-600 text-white font-black">+</button></div>
            <div className="space-y-2">{selectedServices.map(service=><div key={service.id} className="flex items-center gap-2 bg-slate-50 rounded-xl p-3"><input defaultValue={service.name} onBlur={e=>{const n=e.target.value.trim();if(n&&n!==service.name)void onUpdateService(service.id,{name:n})}} className="flex-1 bg-transparent font-bold outline-none"/><button onClick={()=>confirm('Supprimer ce service ?')&&void onDeleteService(service.id)} className="text-red-500 font-black px-2">×</button></div>)}{selectedServices.length===0&&<p className="text-sm italic text-slate-400">Aucun service configuré.</p>}</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[28px] p-6 space-y-4">
            <div><h3 className="font-black text-lg">Membres / contacts externes</h3><p className="text-xs text-slate-400">Pour les actionnaires pépiniéristes ou personnes qui n'ont pas de compte dans l'application.</p></div>
            <div className="grid grid-cols-2 gap-2"><input value={contact.name} onChange={e=>setContact({...contact,name:e.target.value})} placeholder="Nom" className="col-span-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"/><input value={contact.jobTitle} onChange={e=>setContact({...contact,jobTitle:e.target.value})} placeholder="Fonction" className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"/><input value={contact.email} onChange={e=>setContact({...contact,email:e.target.value})} placeholder="Email" className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"/><input value={contact.phone} onChange={e=>setContact({...contact,phone:e.target.value})} placeholder="Téléphone" className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"/><input value={contact.about} onChange={e=>setContact({...contact,about:e.target.value})} placeholder="À propos" className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"/></div>
            <button onClick={async()=>{if(!contact.name.trim())return;await onAddContact({entityId:selected.id,name:contact.name.trim(),email:contact.email||null,phone:contact.phone||null,jobTitle:contact.jobTitle||null,avatarUrl:null,about:contact.about||null,sortOrder:selectedContacts.length+1});setContact({name:'',email:'',phone:'',jobTitle:'',about:''})}} className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-black">Ajouter un membre</button>
            <div className="space-y-2">{selectedContacts.map(c=><div key={c.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3"><div><p className="font-black">{c.name}</p><p className="text-xs text-slate-400">{c.jobTitle||c.email||''}</p></div><button onClick={()=>confirm('Supprimer ce membre ?')&&void onDeleteContact(c.id)} className="text-red-500 font-black px-2">×</button></div>)}</div>
          </div>
        </div>
      </div>}
    </div>
  </div>;
};
export default OrganizationAdmin;
