import React, { useState, useMemo } from 'react';
import { User, UserRole } from '../types';
import { DEPARTMENTS } from '../constants';

interface TeamViewProps {
  users: User[];
}

type TeamSubView = 'list' | 'department' | 'org';

interface UserCardProps {
  user: User;
  small?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({ user, small = false }) => {
  const isLeader = user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR;
  
  return (
    <div className={`bg-white rounded-xl border transition-all flex items-center gap-3 ${
      small ? 'w-56 p-3' : 'p-4 shadow-sm hover:shadow-md'
    } ${isLeader ? 'border-green-200 ring-1 ring-green-100' : 'border-slate-200'}`}>
      <div className="relative shrink-0">
        <img src={user.avatar} className={`${small ? 'w-9 h-9' : 'w-12 h-12'} rounded-full border border-slate-100 object-cover`} alt="" />
        {isLeader && (
          <div className="absolute -top-1 -right-1 bg-green-600 text-white p-0.5 rounded-full shadow-sm" title="Responsable / Admin">
            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
          </div>
        )}
      </div>
      <div className="overflow-hidden">
        <h4 className={`font-bold text-slate-900 truncate ${small ? 'text-xs' : 'text-sm'}`}>{user.name}</h4>
        <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
        {isLeader && <span className="text-[8px] font-black text-green-600 uppercase tracking-widest">Responsable</span>}
      </div>
    </div>
  );
};

const TeamView: React.FC<TeamViewProps> = ({ users }) => {
  const [activeSubView, setActiveSubView] = useState<TeamSubView>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('Tous');

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = selectedDept === 'Tous' || user.department === selectedDept;
      return matchesSearch && matchesDept;
    });
  }, [users, searchQuery, selectedDept]);

  const usersByDept = useMemo(() => {
    const map: Record<string, User[]> = {};
    DEPARTMENTS.forEach(dept => {
      map[dept] = users.filter(u => u.department === dept);
    });
    return map;
  }, [users]);

  // Logic for Org Chart based on Departments
  const directionMembers = usersByDept['Direction'] || [];
  const otherDepts = DEPARTMENTS.filter(d => d !== 'Direction');

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Annuaire & Équipe</h1>
          <p className="text-slate-500">Organisation et structure de Star Fruits.</p>
        </div>
        
        <div className="flex bg-white rounded-2xl border border-slate-200 p-1 shadow-sm shrink-0">
          {[
            { id: 'list', label: 'Liste' },
            { id: 'department', label: 'Services' },
            { id: 'org', label: 'Organigramme' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveSubView(tab.id as TeamSubView)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeSubView === tab.id ? 'bg-[#14532d] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeSubView === 'list' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Rechercher un collègue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all shadow-sm"
              />
            </div>
            <select 
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all shadow-sm font-bold text-slate-700 appearance-none min-w-[200px]"
              style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
            >
              <option value="Tous">Tous les services</option>
              {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredUsers.map(user => (
              <UserCard key={user.id} user={user} />
            ))}
            {filteredUsers.length === 0 && (
              <div className="col-span-full py-32 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
                <p className="text-slate-400 font-medium italic">Aucun collaborateur trouvé pour cette recherche.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubView === 'department' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {DEPARTMENTS.map(dept => (
            <div key={dept} className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">{dept}</h3>
                <span className="bg-white px-2 py-1 rounded-lg text-[10px] font-black text-slate-400 border border-slate-100">
                  {usersByDept[dept].length} membres
                </span>
              </div>
              <div className="p-5 grid grid-cols-1 gap-3">
                {usersByDept[dept].length > 0 ? (
                  usersByDept[dept].sort((a,b) => (a.role === UserRole.ADMIN ? -1 : 1)).map(user => (
                    <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-2xl transition-colors group">
                      <img src={user.avatar} className="w-10 h-10 rounded-full border border-slate-100" alt="" />
                      <div>
                        <p className={`text-sm font-bold group-hover:text-green-700 ${user.role === UserRole.ADMIN ? 'text-slate-900' : 'text-slate-600'}`}>
                          {user.name}
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{user.role}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic p-4 text-center">Ce service n'a pas encore de membres</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSubView === 'org' && (
        <div className="bg-[#f1f5f9] rounded-[48px] p-8 md:p-12 shadow-inner overflow-x-auto min-h-[700px]">
          <div className="flex flex-col items-center min-w-[1000px]">
            {/* Level 1: Direction */}
            <div className="flex flex-col items-center">
              <div className="bg-slate-800 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6 shadow-xl">
                Direction Générale
              </div>
              <div className="flex flex-wrap justify-center gap-6">
                {directionMembers.map(user => (
                  <div key={user.id} className="animate-in zoom-in duration-500">
                    <UserCard user={user} small />
                  </div>
                ))}
              </div>
            </div>

            {/* Main Connector Line */}
            <div className="w-px h-16 bg-slate-300 mt-6 mb-0"></div>
            <div className="h-px bg-slate-300 w-[80%] mx-auto"></div>
            
            {/* Grid of Departments */}
            <div className="grid grid-cols-3 xl:grid-cols-6 gap-x-8 gap-y-12 mt-0 w-full pt-10">
               {otherDepts.map((dept, idx) => (
                 <div key={dept} className="flex flex-col items-center relative group">
                    {/* Secondary vertical connectors */}
                    <div className="absolute -top-10 left-1/2 w-px h-10 bg-slate-300"></div>
                    
                    <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl mb-6 shadow-sm group-hover:border-green-500 transition-colors z-10">
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center block leading-tight">
                         {dept}
                       </span>
                    </div>

                    <div className="space-y-3">
                       {usersByDept[dept].length > 0 ? (
                         usersByDept[dept]
                           .sort((a,b) => (a.role === UserRole.ADMIN || a.role === UserRole.MODERATOR ? -1 : 1))
                           .map(user => (
                             <div key={user.id} className="animate-in fade-in slide-in-from-top-2 duration-700" style={{ animationDelay: `${idx * 100}ms` }}>
                               <UserCard user={user} small />
                             </div>
                           ))
                       ) : (
                         <div className="w-56 h-12 border border-dashed border-slate-300 rounded-xl flex items-center justify-center">
                            <span className="text-[10px] text-slate-400 italic">Poste à pourvoir</span>
                         </div>
                       )}
                    </div>
                 </div>
               ))}
            </div>
            
            <div className="mt-20 flex flex-col items-center">
               <div className="flex gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-green-600"></div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Responsable de service</span>
               </div>
               <p className="text-[10px] text-slate-400 max-w-sm text-center italic">
                 Cet organigramme est mis à jour automatiquement par le service RH.
               </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamView;