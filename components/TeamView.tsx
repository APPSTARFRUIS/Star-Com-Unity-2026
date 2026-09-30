import React, { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import { OrgContact, OrgEntity, OrgService, User } from '../types';

interface Props {
  users: User[];
  entities: OrgEntity[];
  services: OrgService[];
  contacts: OrgContact[];
  gamificationStats?: Record<string, { earned: number; purchases: number; gains: number }>;
}

type SubView = 'list' | 'department' | 'org';
type Person = User | OrgContact;

const norm = (value?: string | null) =>
  (value || '').trim().toLocaleLowerCase('fr-FR');

const fallbackAvatar = (name: string) =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

const personAvatar = (person: Person) =>
  ('role' in person ? person.avatar : person.avatarUrl) || fallbackAvatar(person.name);

const personJob = (person: Person) =>
  ('role' in person ? person.job_function : person.jobTitle) || '';

const personEmail = (person: Person) => ('role' in person && person.profile_visibility?.email === false) ? '' : (person.email || '');
const personPhone = (person: Person) => ('role' in person && person.profile_visibility?.phone === false) ? '' : (person.phone || '');

const personJobDescription = (person: Person) =>
  ('role' in person ? person.job_description : person.jobDescription) || '';

const personNote = (person: Person) =>
  ('role' in person ? person.personal_note : person.personalNote) ||
  (!('role' in person) ? person.about : '') ||
  '';

const ResilientImage = ({ src, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const [resolvedSrc, setResolvedSrc] = useState(src);
  const [retried, setRetried] = useState(false);

  useEffect(() => {
    setResolvedSrc(src);
    setRetried(false);
  }, [src]);

  if (!resolvedSrc) return null;

  return (
    <img
      {...props}
      src={resolvedSrc}
      loading="eager"
      decoding="async"
      onError={(event) => {
        props.onError?.(event);
        if (retried || !src) return;
        setRetried(true);
        const separator = src.includes('?') ? '&' : '?';
        setResolvedSrc(`${src}${separator}sc_retry=${Date.now()}`);
      }}
    />
  );
};

const imageAsDataUrl = async (url?: string | null): Promise<string | null> => {
  if (!url) return null;
  if (url.startsWith('data:')) return url;

  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const imageAsHighResPng = async (
  url?: string | null,
  targetWidthPx = 900,
  targetHeightPx = 600
): Promise<string | null> => {
  const source = await imageAsDataUrl(url);
  if (!source) return null;

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = source;
    });

    const naturalWidth = Math.max(1, image.naturalWidth || image.width || 1);
    const naturalHeight = Math.max(1, image.naturalHeight || image.height || 1);
    const scale = Math.min(targetWidthPx / naturalWidth, targetHeightPx / naturalHeight);
    const width = Math.max(1, Math.round(naturalWidth * scale));
    const height = Math.max(1, Math.round(naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(width, Math.min(targetWidthPx, naturalWidth * 4));
    canvas.height = Math.max(height, Math.min(targetHeightPx, naturalHeight * 4));

    const ctx = canvas.getContext('2d');
    if (!ctx) return source;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const ratio = Math.min(canvas.width / naturalWidth, canvas.height / naturalHeight);
    const drawWidth = naturalWidth * ratio;
    const drawHeight = naturalHeight * ratio;
    const drawX = (canvas.width - drawWidth) / 2;
    const drawY = (canvas.height - drawHeight) / 2;

    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    return canvas.toDataURL('image/png', 1);
  } catch {
    return source;
  }
};

const ProfileModal = ({
  person,
  entityName,
  serviceName,
  onClose
}: {
  person: Person;
  entityName: string;
  serviceName?: string;
  onClose: () => void;
}) => {
  const job = personJob(person);
  const jobDescription = personJobDescription(person);
  const note = personNote(person);

  return (
    <div
      className="fixed inset-0 z-[250] bg-slate-950/65 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[34px] max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-2xl grid lg:grid-cols-[38%_62%] overflow-hidden"
        onClick={event => event.stopPropagation()}
      >
        <div className="bg-slate-950 text-white p-8 md:p-10 flex flex-col">
          <img
            src={personAvatar(person)}
            alt={person.name}
            className="w-44 h-44 rounded-[36px] object-cover border-4 border-white/90 shadow-xl"
          />
          <h2 className="text-3xl font-black mt-7 leading-tight">{person.name}</h2>
          <p className="text-lg italic text-slate-300 mt-2">{job || 'Fonction non renseignée'}</p>

          <div className="mt-7 inline-flex self-start rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-widest">
            {entityName}{serviceName ? ` · ${serviceName}` : ''}
          </div>

          <div className="mt-9 space-y-4 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Téléphone</p>
              <p className="font-semibold mt-1 break-words">{personPhone(person) || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Email</p>
              <p className="font-semibold mt-1 break-all">{personEmail(person) || '—'}</p>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-10">
          <div className="pb-5 border-b-2 border-emerald-900">
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-800">
              {serviceName || entityName}
            </p>
            <h3 className="text-3xl font-black text-slate-950 mt-2">{job || 'Collaborateur'}</h3>
          </div>

          <section className="mt-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-emerald-900 flex items-center justify-center text-2xl">🔧</div>
              <h4 className="text-2xl font-black text-slate-900">Métier</h4>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-700 whitespace-pre-wrap leading-relaxed">
              {jobDescription || 'Métier / missions à renseigner dans la fiche utilisateur.'}
            </div>
          </section>

          <section className="mt-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-emerald-900 flex items-center justify-center text-2xl">i</div>
              <h4 className="text-2xl font-black text-slate-900">À propos</h4>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 text-slate-700 whitespace-pre-wrap leading-relaxed min-h-[90px]">
              {note || 'Anecdote / information personnelle à renseigner dans la fiche utilisateur.'}
            </div>
          </section>

          <button
            onClick={onClose}
            className="mt-9 w-full py-4 rounded-2xl bg-slate-950 text-white font-black"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

const PersonMiniCard = ({
  person,
  onClick
}: {
  person: Person;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-left hover:border-emerald-400 hover:shadow-md transition-all"
  >
    <div className="flex items-start gap-3">
      <img
        src={personAvatar(person)}
        alt={person.name}
        className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
      />
      <div className="min-w-0">
        <p className="font-black text-slate-900 truncate">{person.name}</p>
        <p className="text-[11px] font-bold text-emerald-700 truncate">
          {personJob(person) || 'Poste à renseigner'}
        </p>
        <p className="text-[10px] text-slate-400 truncate mt-1">{personEmail(person) || 'Email non renseigné'}</p>
        <p className="text-[10px] text-slate-400 truncate">{personPhone(person) || 'Téléphone non renseigné'}</p>
      </div>
    </div>
  </button>
);

const TeamView: React.FC<Props> = ({ users, entities, services, contacts }) => {
  const [sub, setSub] = useState<SubView>('org');

  // Secours mobile : si org_entities tarde, on reconstruit temporairement les structures depuis les profils.
  const fallbackEntities = useMemo<OrgEntity[]>(() => {
    const companies = Array.from(new Set(users.map(user => (user.company || '').trim()).filter(Boolean)));
    return companies.map((company, index) => ({
      id: `fallback-${norm(company).replace(/[^a-z0-9]+/g, '-')}`,
      name: company,
      entityType: norm(company) === norm('Star Group') ? 'group' : 'subsidiary',
      parentId: null,
      logoUrl: null,
      sortOrder: index,
      active: true
    }));
  }, [users]);

  const activeEntities = useMemo(() => {
    const source = entities.some(entity => entity.active) ? entities : fallbackEntities;
    return source.filter(entity => entity.active).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [entities, fallbackEntities]);
  const group = activeEntities.find(entity => entity.entityType === 'group');
  const [selectedEntityId, setSelectedEntityId] = useState(group?.id || activeEntities[0]?.id || '');
  const [orgOverview, setOrgOverview] = useState(true);
  const [query, setQuery] = useState('');
  const [profile, setProfile] = useState<Person | null>(null);

  // Safari peut fournir profils et structures à quelques secondes d'écart.
  // Quand les vraies structures arrivent après le premier rendu, on recale
  // automatiquement la sélection au lieu de rester sur un id de secours.
  useEffect(() => {
    if (!activeEntities.length) return;
    const selectionStillExists = activeEntities.some(entity => entity.id === selectedEntityId);
    if (!selectionStillExists) {
      const preferred =
        activeEntities.find(entity => entity.entityType === 'group') ||
        activeEntities[0];
      setSelectedEntityId(preferred.id);
    }
  }, [activeEntities, selectedEntityId]);

  const selectedEntity =
    activeEntities.find(entity => entity.id === selectedEntityId) ||
    group ||
    activeEntities[0];

  const entityUsers = useMemo(
    () => selectedEntity
      ? users.filter(user => norm(user.company) === norm(selectedEntity.name))
      : [],
    [users, selectedEntity?.name]
  );

  const entityServices = useMemo(() => {
    if (!selectedEntity) return [];

    const configured = services
      .filter(service => service.active && service.entityId === selectedEntity.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    if (configured.length) return configured;

    const departments = Array.from(new Set(entityUsers.map(user => (user.department || '').trim()).filter(Boolean)));
    return departments.map((name, index) => ({
      id: `fallback-service-${selectedEntity.id}-${index}`,
      entityId: selectedEntity.id,
      name,
      sortOrder: index,
      active: true
    }));
  }, [services, selectedEntity?.id, entityUsers]);

  const entityContacts = useMemo(
    () => selectedEntity
      ? contacts
          .filter(contact => contact.entityId === selectedEntity.id)
          .sort((a, b) => a.sortOrder - b.sortOrder)
      : [],
    [contacts, selectedEntity?.id]
  );

  const filtered = entityUsers.filter(user =>
    !query ||
    norm(user.name).includes(norm(query)) ||
    norm(user.email).includes(norm(query)) ||
    norm(user.job_function).includes(norm(query))
  );

  const selectedProfileService =
    profile && 'role' in profile ? profile.department : undefined;

  const choose = (id: string) => {
    setSelectedEntityId(id);
    setOrgOverview(false);
    if (sub === 'org') setSub('org');
  };

  const showOrgOverview = () => {
    setSub('org');
    setOrgOverview(true);
  };

  const exportPdf = async () => {
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    pdf.setDisplayMode('fullwidth', 'single');
    pdf.setProperties({ title: 'Organigramme Star Group', subject: 'Organigramme interactif Star Group', author: 'Star ComUnity' });

    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;
    const children = activeEntities.filter(entity => entity.entityType !== 'group');
    const founders = children.filter(entity => entity.entityType === 'shareholder');
    const companies = children.filter(entity => entity.entityType !== 'shareholder');
    const structurePages = [group, ...children].filter(Boolean) as OrgEntity[];
    const isStarFruits = (entity: OrgEntity) => norm(entity.name) === 'star fruits';

    const companyPage = new Map<string, number>();
    const servicePage = new Map<string, number>();
    const personPage = new Map<string, number>();
    const personReturnPage = new Map<string, number>();
    const people: Array<{ key: string; person: Person; entity: OrgEntity; serviceName?: string }> = [];

    structurePages.forEach(entity => {
      users.filter(user => norm(user.company) === norm(entity.name)).forEach(user =>
        people.push({ key: `user-${user.id}`, person: user, entity, serviceName: user.department })
      );
      contacts.filter(contact => contact.entityId === entity.id).forEach(contact =>
        people.push({ key: `contact-${contact.id}`, person: contact, entity })
      );
    });

    const normalEntityPageCount = (entity: OrgEntity) => {
      const eu = users.filter(user => norm(user.company) === norm(entity.name));
      const es = services.filter(service => service.active && service.entityId === entity.id).sort((a, b) => a.sortOrder - b.sortOrder);
      const ec = contacts.filter(contact => contact.entityId === entity.id);
      let chunks = 0;
      es.forEach(service => { chunks += Math.max(1, Math.ceil(eu.filter(user => user.department === service.name).length / 3)); });
      chunks += Math.ceil(ec.length / 3);
      return Math.max(1, Math.ceil(chunks / 3));
    };

    // Exact page map: page 1 is always the general view.
    let nextPage = 2;
    structurePages.forEach(entity => {
      companyPage.set(entity.id, nextPage);
      if (isStarFruits(entity)) {
        nextPage += 1; // Star Fruits services overview
        const es = services.filter(service => service.active && service.entityId === entity.id).sort((a, b) => a.sortOrder - b.sortOrder);
        es.forEach(service => { servicePage.set(service.id, nextPage++); });
        if (contacts.some(contact => contact.entityId === entity.id)) servicePage.set(`${entity.id}-contacts`, nextPage++);
      } else {
        nextPage += normalEntityPageCount(entity);
      }
    });
    people.forEach(item => personPage.set(item.key, nextPage++));

    const addHeader = (title: string, subtitle?: string) => {
      pdf.setFillColor(15, 23, 42); pdf.roundedRect(margin, 10, contentWidth, 20, 5, 5, 'F');
      pdf.setTextColor(255, 255, 255); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(18); pdf.text(title, margin + 8, 22);
      if (subtitle) { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.text(subtitle, pageWidth - margin - 8, 22, { align: 'right' }); }
      pdf.setTextColor(15, 23, 42);
    };
    const addFooter = () => {
      pdf.setDrawColor(226, 232, 240); pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(100, 116, 139);
      pdf.text('Star ComUnity · Organigramme', margin, pageHeight - 6);
      pdf.text(`${pdf.getCurrentPageInfo().pageNumber}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
    };
    const addBackButton = (label: string, targetPage: number) => {
      const buttonW = 62, buttonH = 11, x = pageWidth - margin - buttonW, y = 35;
      pdf.setFillColor(22, 101, 52); pdf.roundedRect(x, y, buttonW, buttonH, 3, 3, 'F');
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.3); pdf.setTextColor(255, 255, 255);
      pdf.text(label, x + buttonW / 2, y + 7.1, { align: 'center' });
      pdf.link(x, y, buttonW, buttonH, { pageNumber: targetPage, top: 0 }); pdf.setTextColor(15, 23, 42);
    };
    const addImageSafe = async (url: string | null | undefined, x: number, y: number, w: number, h: number) => {
      const data = await imageAsHighResPng(url, 1200, 800); if (!data) return false;
      try { const props = pdf.getImageProperties(data); const ratio = props.width / props.height; const boxRatio = w / h;
        const drawW = ratio > boxRatio ? w : h * ratio; const drawH = ratio > boxRatio ? w / ratio : h;
        pdf.addImage(data, 'PNG', x + (w - drawW) / 2, y + (h - drawH) / 2, drawW, drawH, undefined, 'SLOW'); return true;
      } catch { return false; }
    };
    const drawPersonPdfCard = async (person: Person, x: number, y: number, w: number, key: string) => {
      const h = 31; pdf.setFillColor(255, 255, 255); pdf.setDrawColor(226, 232, 240); pdf.roundedRect(x, y, w, h, 4, 4, 'FD');
      const avatar = await imageAsDataUrl(personAvatar(person)); if (avatar) { try { pdf.addImage(avatar, 'JPEG', x + 3, y + 4, 19, 19, undefined, 'FAST'); } catch { try { pdf.addImage(avatar, 'PNG', x + 3, y + 4, 19, 19, undefined, 'FAST'); } catch {} } }
      const textX = x + 25; pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9.2); pdf.setTextColor(15, 23, 42); pdf.text(person.name, textX, y + 8, { maxWidth: w - 29 });
      pdf.setFontSize(7.1); pdf.setTextColor(22, 101, 52); pdf.text((personJob(person) || 'Poste à renseigner').slice(0, 42), textX, y + 14);
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6.5); pdf.setTextColor(100, 116, 139); pdf.text((personEmail(person) || 'Email non renseigné').slice(0, 50), textX, y + 20); pdf.text((personPhone(person) || 'Téléphone non renseigné').slice(0, 36), textX, y + 26);
      const target = personPage.get(key); if (target) pdf.link(x, y, w, h, { pageNumber: target, top: 0 });
    };

    // PAGE 1 — GENERAL OVERVIEW
    addHeader(group?.name || 'Star Group', 'Vue d’ensemble · cliquez sur une structure');
    let groupY = 46;
    if (founders.length) {
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(100, 116, 139); pdf.text('MEMBRES FONDATEURS', margin, 39);
      const founderCols = Math.min(4, Math.max(1, founders.length)), founderGap = 6;
      const founderW = Math.min(62, (contentWidth - founderGap * (founderCols - 1)) / founderCols), founderH = 25;
      const founderStartX = margin + (contentWidth - (founderCols * founderW + (founderCols - 1) * founderGap)) / 2;
      for (let index = 0; index < founders.length; index++) { const entity = founders[index], row = Math.floor(index / founderCols), col = index % founderCols;
        const x = founderStartX + col * (founderW + founderGap), y = 43 + row * (founderH + 5);
        pdf.setFillColor(255,255,255); pdf.setDrawColor(203,213,225); pdf.roundedRect(x,y,founderW,founderH,4,4,'FD');
        if (entity.logoUrl) await addImageSafe(entity.logoUrl,x+4,y+4,16,10); pdf.setFont('helvetica','bold'); pdf.setFontSize(9); pdf.setTextColor(15,23,42); pdf.text(entity.name,x+4,y+19,{maxWidth:founderW-8});
        const target=companyPage.get(entity.id); if(target) pdf.link(x,y,founderW,founderH,{pageNumber:target,top:0}); }
      groupY = 43 + Math.ceil(founders.length / founderCols) * (founderH + 5) + 8;
    }
    if (group) { const w=82,h=32,x=(pageWidth-w)/2; pdf.setFillColor(15,23,42); pdf.roundedRect(x,groupY,w,h,6,6,'F'); if(group.logoUrl) await addImageSafe(group.logoUrl,x+6,groupY+5,22,22);
      pdf.setFont('helvetica','bold'); pdf.setFontSize(15); pdf.setTextColor(255,255,255); pdf.text(group.name,x+34,groupY+20); const target=companyPage.get(group.id); if(target) pdf.link(x,groupY,w,h,{pageNumber:target,top:0}); }
    const cols=3,gap=7,cardW=(contentWidth-gap*(cols-1))/cols,cardH=52,companiesY=groupY+43;
    for(let index=0;index<companies.length;index++){const entity=companies[index],row=Math.floor(index/cols),col=index%cols,x=margin+col*(cardW+gap),y=companiesY+row*(cardH+gap);
      pdf.setFillColor(248,250,252);pdf.setDrawColor(203,213,225);pdf.roundedRect(x,y,cardW,cardH,5,5,'FD');if(entity.logoUrl) await addImageSafe(entity.logoUrl,x+6,y+7,26,18);
      pdf.setFont('helvetica','bold');pdf.setFontSize(13);pdf.setTextColor(15,23,42);pdf.text(entity.name,x+6,y+33);pdf.setFontSize(8);pdf.setTextColor(22,101,52);pdf.text('FILIALE / ENTREPRISE',x+6,y+41);
      const target=companyPage.get(entity.id);if(target)pdf.link(x,y,cardW,cardH,{pageNumber:target,top:0});}
    addFooter();

    for (const entity of structurePages) {
      const eu = users.filter(user => norm(user.company) === norm(entity.name));
      const es = services.filter(service => service.active && service.entityId === entity.id).sort((a,b)=>a.sortOrder-b.sortOrder);
      const ec = contacts.filter(contact => contact.entityId === entity.id);

      if (isStarFruits(entity)) {
        // STAR FRUITS — intermediate services page.
        pdf.addPage('a4','landscape'); addHeader(entity.name, 'Services · cliquez sur un service'); if(entity.logoUrl) await addImageSafe(entity.logoUrl,margin,36,30,20); addBackButton('RETOUR VUE GENERALE',1);
        const entries: Array<{id:string;name:string;count:number}> = es.map(s=>({id:s.id,name:s.name,count:eu.filter(u=>u.department===s.name).length}));
        if(ec.length) entries.push({id:`${entity.id}-contacts`,name:'Membres / contacts',count:ec.length});
        const c=3,g=8,w=(contentWidth-g*(c-1))/c,h=38,startY=64;
        entries.forEach((entry,index)=>{const row=Math.floor(index/c),col=index%c,x=margin+col*(w+g),y=startY+row*(h+g);pdf.setFillColor(248,250,252);pdf.setDrawColor(203,213,225);pdf.roundedRect(x,y,w,h,5,5,'FD');pdf.setFont('helvetica','bold');pdf.setFontSize(11);pdf.setTextColor(15,23,42);pdf.text(entry.name,x+6,y+15,{maxWidth:w-12});pdf.setFont('helvetica','normal');pdf.setFontSize(8);pdf.setTextColor(100,116,139);pdf.text(`${entry.count} collaborateur${entry.count>1?'s':''}`,x+6,y+27);const target=servicePage.get(entry.id);if(target)pdf.link(x,y,w,h,{pageNumber:target,top:0});}); addFooter();

        for (const service of es) {
          pdf.addPage('a4','landscape'); addHeader(service.name, `${entity.name} · collaborateurs`); addBackButton('RETOUR SERVICES', companyPage.get(entity.id)!);
          const members=eu.filter(user=>user.department===service.name); const c=3,g=7,w=(contentWidth-g*(c-1))/c,startY=64;
          if(!members.length){pdf.setFont('helvetica','normal');pdf.setFontSize(11);pdf.setTextColor(148,163,184);pdf.text('Aucun collaborateur rattaché à ce service.',margin,startY+10);}
          for(let i=0;i<members.length;i++){const row=Math.floor(i/c),col=i%c,key=`user-${members[i].id}`;personReturnPage.set(key,servicePage.get(service.id)!);await drawPersonPdfCard(members[i],margin+col*(w+g),startY+row*36,w,key);} addFooter();
        }
        if(ec.length){pdf.addPage('a4','landscape');addHeader('Membres / contacts',`${entity.name} · collaborateurs`);addBackButton('RETOUR SERVICES',companyPage.get(entity.id)!);const c=3,g=7,w=(contentWidth-g*(c-1))/c,startY=64;
          for(let i=0;i<ec.length;i++){const row=Math.floor(i/c),col=i%c,key=`contact-${ec[i].id}`;personReturnPage.set(key,servicePage.get(`${entity.id}-contacts`)!);await drawPersonPdfCard(ec[i],margin+col*(w+g),startY+row*36,w,key);}addFooter();}
        continue;
      }

      // Other entities keep their existing direct company -> collaborators flow.
      type EntityChunk={title:string;people:Array<{person:Person;key:string}>;continuation?:boolean}; const chunks:EntityChunk[]=[];
      es.forEach(service=>{const members=eu.filter(user=>user.department===service.name);if(!members.length){chunks.push({title:service.name,people:[]});return;}for(let i=0;i<members.length;i+=3)chunks.push({title:service.name,continuation:i>0,people:members.slice(i,i+3).map(user=>({person:user,key:`user-${user.id}`}))});});
      for(let i=0;i<ec.length;i+=3)chunks.push({title:'Membres / contacts',continuation:i>0,people:ec.slice(i,i+3).map(contact=>({person:contact,key:`contact-${contact.id}`}))}); if(!chunks.length)chunks.push({title:'Organisation',people:[]});
      const pages:EntityChunk[][]=[];for(let i=0;i<chunks.length;i+=3)pages.push(chunks.slice(i,i+3));
      for(let pageIndex=0;pageIndex<pages.length;pageIndex++){pdf.addPage('a4','landscape');addHeader(entity.name,`${entity.entityType==='shareholder'?'Actionnaire pépiniériste':'Organigramme entreprise'}${pages.length>1?` · ${pageIndex+1}/${pages.length}`:''}`);if(entity.logoUrl)await addImageSafe(entity.logoUrl,margin,36,30,20);addBackButton('RETOUR VUE GENERALE',1);
        const c=3,g=7,w=(contentWidth-g*(c-1))/c,topY=64;for(let col=0;col<pages[pageIndex].length;col++){const chunk=pages[pageIndex][col],x=margin+col*(w+g),title=`${chunk.title}${chunk.continuation?' · suite':''}`,h=Math.max(48,18+Math.max(1,chunk.people.length)*34);pdf.setFillColor(241,245,249);pdf.setDrawColor(203,213,225);pdf.roundedRect(x,topY,w,h,5,5,'FD');pdf.setFont('helvetica','bold');pdf.setFontSize(9);pdf.setTextColor(71,85,105);pdf.text(pdf.splitTextToSize(title.toUpperCase(),w-8),x+4,topY+7);
          if(!chunk.people.length){pdf.setFont('helvetica','normal');pdf.setFontSize(7.5);pdf.setTextColor(148,163,184);pdf.text('Aucun collaborateur rattaché',x+4,topY+23);}else{let personY=topY+16;for(const p of chunk.people){personReturnPage.set(p.key,companyPage.get(entity.id)!);await drawPersonPdfCard(p.person,x+4,personY,w-8,p.key);personY+=34;}}}addFooter();}
    }

    // PERSON PAGES
    for(const item of people){pdf.addPage('a4','landscape');addHeader(item.person.name,`${item.entity.name}${item.serviceName?` · ${item.serviceName}`:''}`);const leftX=margin,leftY=38,leftW=92,leftH=146;pdf.setFillColor(15,23,42);pdf.roundedRect(leftX,leftY,leftW,leftH,7,7,'F');const avatarData=await imageAsDataUrl(personAvatar(item.person));if(avatarData){try{pdf.addImage(avatarData,'JPEG',leftX+10,leftY+10,48,48,undefined,'FAST');}catch{try{pdf.addImage(avatarData,'PNG',leftX+10,leftY+10,48,48,undefined,'FAST');}catch{}}}
      pdf.setTextColor(255,255,255);pdf.setFont('helvetica','bold');pdf.setFontSize(18);pdf.text(pdf.splitTextToSize(item.person.name,leftW-18),leftX+9,leftY+70);pdf.setFont('helvetica','italic');pdf.setFontSize(11);pdf.setTextColor(203,213,225);pdf.text(pdf.splitTextToSize(personJob(item.person)||'Fonction non renseignée',leftW-18),leftX+9,leftY+86);pdf.setFont('helvetica','normal');pdf.setFontSize(8);pdf.setTextColor(226,232,240);pdf.text('TÉLÉPHONE',leftX+9,leftY+112);pdf.setFontSize(9);pdf.text(pdf.splitTextToSize(personPhone(item.person)||'—',leftW-18),leftX+9,leftY+120);pdf.setFontSize(8);pdf.text('EMAIL',leftX+9,leftY+135);pdf.setFontSize(9);pdf.text(pdf.splitTextToSize(personEmail(item.person)||'—',leftW-18),leftX+9,leftY+143);
      const rightX=leftX+leftW+10,rightW=pageWidth-rightX-margin;pdf.setTextColor(15,23,42);pdf.setFont('helvetica','bold');pdf.setFontSize(20);pdf.text((item.serviceName||item.entity.name).toUpperCase(),rightX,52);pdf.setDrawColor(6,78,59);pdf.setLineWidth(.8);pdf.line(rightX,58,rightX+rightW,58);pdf.setFontSize(17);pdf.text('Métier',rightX,75);pdf.setFillColor(248,250,252);pdf.setDrawColor(203,213,225);pdf.roundedRect(rightX,82,rightW,45,4,4,'FD');pdf.setFont('helvetica','normal');pdf.setFontSize(10);pdf.setTextColor(51,65,85);pdf.text(pdf.splitTextToSize(personJobDescription(item.person)||'Métier / missions à renseigner.',rightW-10).slice(0,10),rightX+5,91);pdf.setFont('helvetica','bold');pdf.setFontSize(17);pdf.setTextColor(15,23,42);pdf.text('À propos',rightX,143);pdf.setFillColor(255,255,255);pdf.setDrawColor(203,213,225);pdf.roundedRect(rightX,150,rightW,34,4,4,'D');pdf.setFont('helvetica','normal');pdf.setFontSize(10);pdf.setTextColor(51,65,85);pdf.text(pdf.splitTextToSize(personNote(item.person)||'Anecdote / information personnelle à renseigner.',rightW-10).slice(0,6),rightX+5,159);
      const returnPage=personReturnPage.get(item.key)||companyPage.get(item.entity.id);if(returnPage)addBackButton(isStarFruits(item.entity)?'RETOUR SERVICE':'RETOUR ENTREPRISE',returnPage);addFooter();}

    pdf.setPage(1);
    pdf.save(`Organigramme-Star-Group-${new Date().toISOString().slice(0,10)}.pdf`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-7">
      {profile && selectedEntity && (
        <ProfileModal
          person={profile}
          entityName={'role' in profile ? profile.company : selectedEntity.name}
          serviceName={selectedProfileService}
          onClose={() => setProfile(null)}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Annuaire & Équipe</h1>
          <p className="text-slate-500">Star Group, filiales et membres fondateurs.</p>
        </div>
        <div className="flex bg-white rounded-2xl border p-1 w-full md:w-auto overflow-x-auto">
          {[
            ['org', 'Organigramme'],
            ['department', 'Services'],
            ['list', 'Liste']
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setSub(id as SubView)}
              className={`px-5 py-2 rounded-xl font-bold shrink-0 ${
                sub === id ? 'bg-[#14532d] text-white' : 'text-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 bg-white border border-slate-200 rounded-2xl p-3 overflow-x-auto md:flex-wrap">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 self-center mr-2">
          {sub === 'org' ? 'Organigramme' : 'Structure'}
        </span>
        {sub === 'org' && (
          <button
            type="button"
            onClick={showOrgOverview}
            className={`px-4 py-2 rounded-xl text-xs font-black ${
              orgOverview ? 'bg-emerald-700 text-white' : 'bg-slate-50 text-slate-600'
            }`}
          >
            Vue générale
          </button>
        )}
        {activeEntities.map(entity => (
          <button
            key={entity.id}
            onClick={() => choose(entity.id)}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shrink-0 ${
              !orgOverview && selectedEntity?.id === entity.id
                ? 'bg-slate-900 text-white'
                : 'bg-slate-50 text-slate-600'
            }`}
          >
            {entity.logoUrl && (
              <ResilientImage
                src={entity.logoUrl}
                alt=""
                className="w-5 h-5 object-contain bg-white rounded"
              />
            )}
            {entity.name}
          </button>
        ))}
      </div>

      {sub === 'list' && (
        <div className="space-y-5">
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={`Rechercher dans ${selectedEntity?.name || ''}...`}
            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filtered.map(user => (
              <PersonMiniCard
                key={user.id}
                person={user}
                onClick={() => setProfile(user)}
              />
            ))}
            {entityContacts.map(contact => (
              <PersonMiniCard
                key={contact.id}
                person={contact}
                onClick={() => setProfile(contact)}
              />
            ))}
          </div>
        </div>
      )}

      {sub === 'department' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entityServices.map(service => {
            const members = entityUsers.filter(user => user.department === service.name);

            return (
              <div
                key={service.id}
                className="bg-white border border-slate-200 rounded-[28px] overflow-hidden shadow-sm"
              >
                <div className="p-5 bg-slate-50 border-b flex justify-between gap-3">
                  <h3 className="font-black uppercase text-sm text-slate-800">{service.name}</h3>
                  <span className="text-xs text-slate-400">{members.length}</span>
                </div>
                <div className="p-4 space-y-3">
                  {members.map(user => (
                    <PersonMiniCard
                      key={user.id}
                      person={user}
                      onClick={() => setProfile(user)}
                    />
                  ))}
                  {!members.length && (
                    <p className="text-xs italic text-slate-400 p-3">Aucun membre</p>
                  )}
                </div>
              </div>
            );
          })}

          {!entityServices.length && (
            <div className="col-span-full py-20 text-center text-slate-400 italic">
              Aucun service configuré pour {selectedEntity?.name}.
            </div>
          )}
        </div>
      )}

      {sub === 'org' && (
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Organigramme interactif
              </p>
              <h2 className="text-2xl font-black">
                {orgOverview ? 'Vue générale des structures' : selectedEntity?.name}
              </h2>
            </div>

            <button
              onClick={() => void exportPdf()}
              className="px-5 py-3 rounded-xl bg-green-700 text-white font-black text-xs shadow-lg"
            >
              Télécharger le PDF interactif
            </button>
          </div>

          {orgOverview ? (
            <div className="bg-slate-100 rounded-[40px] p-8 md:p-10 min-h-[560px]">
              {activeEntities.some(entity => entity.entityType === 'shareholder') && (
                <div className="mb-8">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 mb-4 text-center">Membres fondateurs</p>
                  <div className="flex flex-wrap justify-center gap-4">
                    {activeEntities.filter(entity => entity.entityType === 'shareholder').map(entity => (
                      <button key={entity.id} type="button" onClick={() => choose(entity.id)} className="bg-white border border-slate-200 rounded-[22px] px-6 py-4 min-w-[190px] hover:border-green-500 hover:shadow-lg transition-all text-center">
                        <div className="h-14 flex items-center justify-center">
                          {entity.logoUrl ? <ResilientImage src={entity.logoUrl} alt="" className="max-h-12 max-w-[130px] object-contain" /> : <span className="text-slate-300 font-black">LOGO</span>}
                        </div>
                        <p className="font-black text-base mt-2">{entity.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => group && choose(group.id)}
                  className="bg-slate-950 text-white px-10 py-5 rounded-[24px] font-black flex items-center gap-4 shadow-xl hover:scale-[1.02] transition-transform"
                >
                  {group?.logoUrl && (
                    <ResilientImage
                      src={group.logoUrl}
                      alt=""
                      className="w-12 h-12 bg-white object-contain rounded-xl p-1"
                    />
                  )}
                  <span className="text-xl">{group?.name || 'Star Group'}</span>
                </button>
              </div>

              <div className="mt-10 grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                {activeEntities
                  .filter(entity => entity.entityType !== 'group' && entity.entityType !== 'shareholder')
                  .map(entity => (
                    <button
                      key={entity.id}
                      onClick={() => choose(entity.id)}
                      className="bg-white border border-slate-200 rounded-[26px] p-6 hover:border-green-500 hover:shadow-xl transition-all text-center"
                    >
                      <div className="h-20 flex items-center justify-center">
                        {entity.logoUrl ? (
                          <ResilientImage
                            src={entity.logoUrl}
                            alt=""
                            className="max-h-16 max-w-[160px] object-contain"
                          />
                        ) : (
                          <span className="text-slate-300 font-black">LOGO</span>
                        )}
                      </div>
                      <p className="font-black text-xl mt-3">{entity.name}</p>
                      <p className="text-[10px] uppercase text-slate-400 font-bold mt-1">
                        {entity.entityType === 'shareholder'
                          ? 'Actionnaire pépiniériste'
                          : 'Filiale / entreprise'}
                      </p>
                    </button>
                  ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-100 rounded-[40px] p-6 md:p-8 min-h-[560px]">
              <div className="flex justify-center">
                <button
                  onClick={showOrgOverview}
                  className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-black mb-5 shadow-md"
                >
                  ← Retour à la vue générale
                </button>
              </div>

              <div className="flex justify-center">
                <div className="bg-white border border-slate-200 rounded-[26px] px-10 py-5 text-center shadow-sm">
                  {selectedEntity?.logoUrl && (
                    <ResilientImage
                      src={selectedEntity.logoUrl}
                      alt=""
                      className="h-16 max-w-[180px] mx-auto object-contain"
                    />
                  )}
                  <h3 className="font-black text-2xl mt-2">{selectedEntity?.name}</h3>
                </div>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5 mt-9">
                {entityServices.map(service => {
                  const members = entityUsers.filter(user => user.department === service.name);

                  return (
                    <div
                      key={service.id}
                      className="bg-white border border-slate-200 rounded-[26px] overflow-hidden shadow-sm"
                    >
                      <div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
                        <h4 className="text-xs font-black uppercase text-slate-600 text-center">
                          {service.name}
                        </h4>
                      </div>
                      <div className="p-4 space-y-3">
                        {members.map(user => (
                          <PersonMiniCard
                            key={user.id}
                            person={user}
                            onClick={() => setProfile(user)}
                          />
                        ))}
                        {!members.length && (
                          <p className="text-xs italic text-slate-400 text-center py-4">
                            Aucun collaborateur
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {entityContacts.map(contact => (
                  <div
                    key={contact.id}
                    className="bg-white border border-slate-200 rounded-[26px] p-4"
                  >
                    <PersonMiniCard
                      person={contact}
                      onClick={() => setProfile(contact)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamView;
