import React from 'react';
import { AppConfig, User } from '../types';

const ExternalToolsView: React.FC<{ currentUser: User; appConfig: AppConfig }> = ({ currentUser, appConfig }) => {
  const tools = (appConfig.externalTools || [])
    .filter(tool => tool.enabled && (tool.audienceCompanies?.includes('*') || tool.audienceCompanies?.includes(currentUser.company)))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return <div className="max-w-6xl mx-auto space-y-8 text-left">
    <div><p className="text-xs font-black uppercase tracking-[0.25em] text-green-700">Accès rapides</p><h2 className="text-3xl font-black text-slate-900">Mes outils</h2><p className="text-slate-500 mt-2">Retrouvez ici les applications mises à disposition pour votre entreprise.</p></div>
    {tools.length ? <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">{tools.map(tool => <a key={tool.id} href={tool.url} target="_blank" rel="noopener noreferrer" className="group bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm hover:shadow-xl hover:border-green-300 transition-all flex items-center gap-5">
      <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">{tool.logoUrl ? <img src={tool.logoUrl} alt="" className="w-full h-full object-contain p-2"/> : <span className="text-xl font-black text-green-800">{tool.name.slice(0,2).toUpperCase()}</span>}</div>
      <div className="min-w-0 flex-1"><h3 className="text-lg font-black text-slate-900">{tool.name}</h3><p className="text-sm text-slate-500 mt-1">{tool.description || 'Ouvrir l’application'}</p><span className="inline-flex items-center gap-1 mt-3 text-xs font-black uppercase tracking-wider text-green-700">Accéder <span aria-hidden>↗</span></span></div>
    </a>)}</div> : <div className="bg-white border border-slate-200 rounded-[28px] p-10 text-center text-slate-500">Aucun outil externe n’est actuellement disponible pour votre entreprise.</div>}
  </div>;
};
export default ExternalToolsView;
