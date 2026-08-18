import React, { useMemo, useState } from 'react';
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

const personEmail = (person: Person) => person.email || '';
const personPhone = (person: Person) => person.phone || '';

const personJobDescription = (person: Person) =>
  ('role' in person ? person.job_description : person.jobDescription) || '';

const personNote = (person: Person) =>
  ('role' in person ? person.personal_note : person.personalNote) ||
  (!('role' in person) ? person.about : '') ||
  '';

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
  const [sub, setSub] = useState<SubView>('list');
  const activeEntities = useMemo(
    () => entities.filter(entity => entity.active).sort((a, b) => a.sortOrder - b.sortOrder),
    [entities]
  );
  const group = activeEntities.find(entity => entity.entityType === 'group');
  const [selectedEntityId, setSelectedEntityId] = useState(group?.id || activeEntities[0]?.id || '');
  const [query, setQuery] = useState('');
  const [profile, setProfile] = useState<Person | null>(null);

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

  const entityServices = useMemo(
    () => selectedEntity
      ? services
          .filter(service => service.active && service.entityId === selectedEntity.id)
          .sort((a, b) => a.sortOrder - b.sortOrder)
      : [],
    [services, selectedEntity?.id]
  );

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
    if (sub === 'org') setSub('org');
  };

  const exportPdf = async () => {
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    pdf.setProperties({
      title: 'Organigramme Star Group',
      subject: 'Organigramme interactif Star Group',
      author: 'Star ComUnity'
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;

    const children = activeEntities.filter(entity => entity.entityType !== 'group');

    const companyPage = new Map<string, number>();
    const personPage = new Map<string, number>();

    let nextPage = 2;
    children.forEach(entity => {
      companyPage.set(entity.id, nextPage++);
    });

    const people: Array<{ key: string; person: Person; entity: OrgEntity; serviceName?: string }> = [];
    children.forEach(entity => {
      users
        .filter(user => norm(user.company) === norm(entity.name))
        .forEach(user => {
          people.push({ key: `user-${user.id}`, person: user, entity, serviceName: user.department });
        });

      contacts
        .filter(contact => contact.entityId === entity.id)
        .forEach(contact => {
          people.push({ key: `contact-${contact.id}`, person: contact, entity });
        });
    });

    people.forEach(item => {
      personPage.set(item.key, nextPage++);
    });

    const addHeader = (title: string, subtitle?: string) => {
      pdf.setFillColor(15, 23, 42);
      pdf.roundedRect(margin, 10, contentWidth, 20, 5, 5, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text(title, margin + 8, 22);
      if (subtitle) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.text(subtitle, pageWidth - margin - 8, 22, { align: 'right' });
      }
      pdf.setTextColor(15, 23, 42);
    };

    const addFooter = () => {
      pdf.setDrawColor(226, 232, 240);
      pdf.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text('Star ComUnity · Organigramme', margin, pageHeight - 5);
      pdf.text(`${pdf.getCurrentPageInfo().pageNumber}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
    };

    const addImageSafe = async (
      url: string | null | undefined,
      x: number,
      y: number,
      w: number,
      h: number
    ) => {
      const data = await imageAsDataUrl(url);
      if (!data) return false;
      try {
        pdf.addImage(data, 'JPEG', x, y, w, h, undefined, 'FAST');
        return true;
      } catch {
        try {
          pdf.addImage(data, 'PNG', x, y, w, h, undefined, 'FAST');
          return true;
        } catch {
          return false;
        }
      }
    };

    // PAGE 1 — GROUP
    addHeader(group?.name || 'Star Group', 'Vue d’ensemble · cliquez sur une structure');
    pdf.setFontSize(11);
    pdf.setTextColor(71, 85, 105);
    pdf.text(
      'Filiales, entreprises et actionnaires pépiniéristes',
      margin,
      40
    );

    const cols = 3;
    const gap = 7;
    const cardW = (contentWidth - gap * (cols - 1)) / cols;
    const cardH = 52;

    for (let index = 0; index < children.length; index += 1) {
      const entity = children[index];
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = margin + col * (cardW + gap);
      const y = 50 + row * (cardH + gap);

      pdf.setFillColor(248, 250, 252);
      pdf.setDrawColor(203, 213, 225);
      pdf.roundedRect(x, y, cardW, cardH, 5, 5, 'FD');

      if (entity.logoUrl) {
        await addImageSafe(entity.logoUrl, x + 6, y + 7, 26, 18);
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(15, 23, 42);
      pdf.text(entity.name, x + 6, y + 33);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(22, 101, 52);
      pdf.text(
        entity.entityType === 'shareholder'
          ? 'ACTIONNAIRE PÉPINIÉRISTE'
          : 'FILIALE / ENTREPRISE',
        x + 6,
        y + 41
      );

      const targetPage = companyPage.get(entity.id);
      if (targetPage) {
        pdf.link(x, y, cardW, cardH, { pageNumber: targetPage, top: 0 });
      }
    }
    addFooter();

    // COMPANY / ENTITY PAGES
    for (const entity of children) {
      pdf.addPage('a4', 'landscape');
      addHeader(entity.name, entity.entityType === 'shareholder' ? 'Actionnaire pépiniériste' : 'Organigramme entreprise');

      if (entity.logoUrl) {
        await addImageSafe(entity.logoUrl, margin, 38, 32, 22);
      }

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(22, 101, 52);
      pdf.text('← RETOUR STAR GROUP', pageWidth - margin, 42, { align: 'right' });
      pdf.link(pageWidth - margin - 43, 35, 43, 10, { pageNumber: 1, top: 0 });

      const eu = users.filter(user => norm(user.company) === norm(entity.name));
      const es = services
        .filter(service => service.active && service.entityId === entity.id)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const ec = contacts.filter(contact => contact.entityId === entity.id);

      const serviceCols = 3;
      const serviceGap = 6;
      const serviceW = (contentWidth - serviceGap * (serviceCols - 1)) / serviceCols;
      let cursorY = 66;
      let serviceIndex = 0;

      const drawPersonPdfCard = async (
        person: Person,
        serviceName: string | undefined,
        x: number,
        y: number,
        w: number,
        key: string
      ) => {
        const h = 29;
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(226, 232, 240);
        pdf.roundedRect(x, y, w, h, 4, 4, 'FD');

        const avatar = await imageAsDataUrl(personAvatar(person));
        if (avatar) {
          try {
            pdf.addImage(avatar, 'JPEG', x + 3, y + 4, 19, 19, undefined, 'FAST');
          } catch {
            try { pdf.addImage(avatar, 'PNG', x + 3, y + 4, 19, 19, undefined, 'FAST'); } catch {}
          }
        }

        const textX = x + 25;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9.5);
        pdf.setTextColor(15, 23, 42);
        pdf.text(person.name, textX, y + 8);

        pdf.setFontSize(7.3);
        pdf.setTextColor(22, 101, 52);
        pdf.text((personJob(person) || serviceName || 'Poste à renseigner').slice(0, 40), textX, y + 14);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6.7);
        pdf.setTextColor(100, 116, 139);
        pdf.text((personEmail(person) || 'Email non renseigné').slice(0, 48), textX, y + 20);
        pdf.text((personPhone(person) || 'Téléphone non renseigné').slice(0, 34), textX, y + 25);

        const target = personPage.get(key);
        if (target) {
          pdf.link(x, y, w, h, { pageNumber: target, top: 0 });
        }

        return h;
      };

      if (es.length) {
        for (const service of es) {
          const col = serviceIndex % serviceCols;
          const row = Math.floor(serviceIndex / serviceCols);
          const x = margin + col * (serviceW + serviceGap);
          const y = cursorY + row * 77;

          pdf.setFillColor(241, 245, 249);
          pdf.setDrawColor(203, 213, 225);
          pdf.roundedRect(x, y, serviceW, 70, 5, 5, 'FD');

          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9);
          pdf.setTextColor(71, 85, 105);
          const titleLines = pdf.splitTextToSize(service.name.toUpperCase(), serviceW - 8);
          pdf.text(titleLines, x + 4, y + 7);

          const members = eu.filter(user => user.department === service.name);
          let memberY = y + 16;
          for (const user of members.slice(0, 2)) {
            await drawPersonPdfCard(user, service.name, x + 4, memberY, serviceW - 8, `user-${user.id}`);
            memberY += 31;
          }

          if (members.length > 2) {
            pdf.setFontSize(7);
            pdf.setTextColor(100, 116, 139);
            pdf.text(`+ ${members.length - 2} autre(s) collaborateur(s)`, x + 5, y + 66);
          }

          serviceIndex += 1;
        }

        cursorY += Math.ceil(es.length / serviceCols) * 77;
      }

      if (ec.length && cursorY < 175) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(15, 23, 42);
        pdf.text('Membres / contacts', margin, cursorY + 2);
        let x = margin;
        let y = cursorY + 7;

        for (const contact of ec) {
          await drawPersonPdfCard(contact, undefined, x, y, 84, `contact-${contact.id}`);
          x += 90;
          if (x + 84 > pageWidth - margin) {
            x = margin;
            y += 34;
          }
        }
      }

      addFooter();
    }

    // PERSON PAGES
    for (const item of people) {
      pdf.addPage('a4', 'landscape');
      addHeader(item.person.name, `${item.entity.name}${item.serviceName ? ` · ${item.serviceName}` : ''}`);

      const leftX = margin;
      const leftY = 38;
      const leftW = 92;
      const leftH = 150;

      pdf.setFillColor(15, 23, 42);
      pdf.roundedRect(leftX, leftY, leftW, leftH, 7, 7, 'F');

      const avatarData = await imageAsDataUrl(personAvatar(item.person));
      if (avatarData) {
        try {
          pdf.addImage(avatarData, 'JPEG', leftX + 10, leftY + 10, 48, 48, undefined, 'FAST');
        } catch {
          try { pdf.addImage(avatarData, 'PNG', leftX + 10, leftY + 10, 48, 48, undefined, 'FAST'); } catch {}
        }
      }

      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text(
        pdf.splitTextToSize(item.person.name, leftW - 18),
        leftX + 9,
        leftY + 70
      );

      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(11);
      pdf.setTextColor(203, 213, 225);
      pdf.text(
        pdf.splitTextToSize(personJob(item.person) || 'Fonction non renseignée', leftW - 18),
        leftX + 9,
        leftY + 86
      );

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(226, 232, 240);
      pdf.text('TÉLÉPHONE', leftX + 9, leftY + 112);
      pdf.setFontSize(9);
      pdf.text(
        pdf.splitTextToSize(personPhone(item.person) || '—', leftW - 18),
        leftX + 9,
        leftY + 120
      );

      pdf.setFontSize(8);
      pdf.text('EMAIL', leftX + 9, leftY + 135);
      pdf.setFontSize(9);
      pdf.text(
        pdf.splitTextToSize(personEmail(item.person) || '—', leftW - 18),
        leftX + 9,
        leftY + 143
      );

      const rightX = leftX + leftW + 10;
      const rightW = pageWidth - rightX - margin;

      pdf.setTextColor(15, 23, 42);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.text((item.serviceName || item.entity.name).toUpperCase(), rightX, 52);
      pdf.setDrawColor(6, 78, 59);
      pdf.setLineWidth(0.8);
      pdf.line(rightX, 58, rightX + rightW, 58);

      pdf.setFontSize(17);
      pdf.text('Métier', rightX, 75);
      pdf.setFillColor(248, 250, 252);
      pdf.setDrawColor(203, 213, 225);
      pdf.roundedRect(rightX, 82, rightW, 45, 4, 4, 'FD');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(51, 65, 85);
      const missionLines = pdf.splitTextToSize(
        personJobDescription(item.person) || 'Métier / missions à renseigner.',
        rightW - 10
      );
      pdf.text(missionLines.slice(0, 10), rightX + 5, 91);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(17);
      pdf.setTextColor(15, 23, 42);
      pdf.text('À propos', rightX, 143);
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(203, 213, 225);
      pdf.roundedRect(rightX, 150, rightW, 38, 4, 4, 'D');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(51, 65, 85);
      const noteLines = pdf.splitTextToSize(
        personNote(item.person) || 'Anecdote / information personnelle à renseigner.',
        rightW - 10
      );
      pdf.text(noteLines.slice(0, 8), rightX + 5, 159);

      const entityPage = companyPage.get(item.entity.id);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(22, 101, 52);
      pdf.text('← RETOUR À L’ENTREPRISE', pageWidth - margin, 35, { align: 'right' });
      if (entityPage) {
        pdf.link(pageWidth - margin - 50, 29, 50, 10, { pageNumber: entityPage, top: 0 });
      }

      pdf.text('STAR GROUP', pageWidth - margin, 195, { align: 'right' });
      pdf.link(pageWidth - margin - 25, 189, 25, 8, { pageNumber: 1, top: 0 });

      addFooter();
    }

    pdf.save(`Organigramme-Star-Group-${new Date().toISOString().slice(0, 10)}.pdf`);
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
          <p className="text-slate-500">Star Group, filiales et actionnaires pépiniéristes.</p>
        </div>
        <div className="flex bg-white rounded-2xl border p-1">
          {[
            ['list', 'Liste'],
            ['department', 'Services'],
            ['org', 'Organigramme']
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setSub(id as SubView)}
              className={`px-5 py-2 rounded-xl font-bold ${
                sub === id ? 'bg-[#14532d] text-white' : 'text-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 bg-white border border-slate-200 rounded-2xl p-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 self-center mr-2">
          Structure
        </span>
        {activeEntities.map(entity => (
          <button
            key={entity.id}
            onClick={() => choose(entity.id)}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 ${
              selectedEntity?.id === entity.id
                ? 'bg-slate-900 text-white'
                : 'bg-slate-50 text-slate-600'
            }`}
          >
            {entity.logoUrl && (
              <img
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
              <h2 className="text-2xl font-black">{selectedEntity?.name}</h2>
            </div>

            <button
              onClick={() => void exportPdf()}
              className="px-5 py-3 rounded-xl bg-green-700 text-white font-black text-xs shadow-lg"
            >
              Télécharger le PDF interactif
            </button>
          </div>

          {selectedEntity?.entityType === 'group' ? (
            <div className="bg-slate-100 rounded-[40px] p-8 md:p-10 min-h-[560px]">
              <div className="flex justify-center">
                <div className="bg-slate-950 text-white px-10 py-5 rounded-[24px] font-black flex items-center gap-4 shadow-xl">
                  {selectedEntity.logoUrl && (
                    <img
                      src={selectedEntity.logoUrl}
                      alt=""
                      className="w-12 h-12 bg-white object-contain rounded-xl p-1"
                    />
                  )}
                  <span className="text-xl">{selectedEntity.name}</span>
                </div>
              </div>

              <div className="w-px h-12 bg-slate-300 mx-auto" />

              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                {activeEntities
                  .filter(entity => entity.entityType !== 'group')
                  .map(entity => (
                    <button
                      key={entity.id}
                      onClick={() => setSelectedEntityId(entity.id)}
                      className="bg-white border border-slate-200 rounded-[26px] p-6 hover:border-green-500 hover:shadow-xl transition-all text-center"
                    >
                      <div className="h-20 flex items-center justify-center">
                        {entity.logoUrl ? (
                          <img
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
                  onClick={() => group && setSelectedEntityId(group.id)}
                  className="text-xs font-black text-green-700 mb-5"
                >
                  ← Retour Star Group
                </button>
              </div>

              <div className="flex justify-center">
                <div className="bg-white border border-slate-200 rounded-[26px] px-10 py-5 text-center shadow-sm">
                  {selectedEntity?.logoUrl && (
                    <img
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
