
import React, { useState, useRef, useEffect } from 'react';
import { User, NotificationSettings } from '../types';
import { DEPARTMENTS } from '../constants';

interface SettingsProps {
  user: User;
  onSave: (updatedUser: User) => void;
}

type SettingsTab = 'profil' | 'notifications' | 'confidentialite' | 'theme';

const Settings: React.FC<SettingsProps> = ({ user, onSave }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profil');
  const [formData, setFormData] = useState<User>({ ...user });
  const [theme, setTheme] = useState<'clair' | 'sombre'>('clair');
  const [textSize, setTextSize] = useState<'petit' | 'moyen' | 'grand'>('moyen');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // État initial basé sur les données réelles de l'utilisateur
  const [notifications, setNotifications] = useState<NotificationSettings>(
    user.notification_settings || {
      email: true,
      desktop: true,
      mobile: true,
      posts: true,
      events: true,
      messages: true,
      birthdays: true,
      polls: true
    }
  );

  const [privacy, setPrivacy] = useState({
    email: true,
    phone: false,
    birthday: true
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    setFormData({ ...user });
    setNotifications(user.notification_settings || notifications);
  };

  const handleSave = () => {
    onSave({
      ...formData,
      notification_settings: notifications
    });
  };

  const toggleNotification = (key: keyof NotificationSettings) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const togglePrivacy = (key: keyof typeof privacy) => {
    setPrivacy(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const Switch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <button 
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-green-600' : 'bg-slate-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Paramètres</h1>
        <p className="text-slate-500 mt-2">Gérez vos préférences et personnalisez votre expérience.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 px-6">
          {(['profil', 'notifications', 'confidentialite', 'theme'] as SettingsTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-bold capitalize transition-all relative ${
                activeTab === tab ? 'text-green-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                {tab === 'profil' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                {tab === 'notifications' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
                {tab === 'confidentialite' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                {tab === 'theme' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>}
                {tab}
              </div>
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-8 min-h-[500px]">
          {activeTab === 'profil' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row gap-10">
                <div className="shrink-0">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-4">Photo de profil</label>
                  <div className="relative w-32 h-32 group">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept="image/*" 
                      className="hidden" 
                    />
                    <div className="w-full h-full rounded-3xl overflow-hidden border-4 border-slate-50 transition-all group-hover:border-green-500 cursor-pointer shadow-sm" onClick={handleAvatarClick}>
                      <img src={formData.avatar} className="w-full h-full object-cover" alt="Avatar" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-6">
                   <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Accès & Sécurité</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Identifiant (Email)</label>
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none transition-all font-bold" />
                        <p className="text-[10px] text-slate-400 italic">C'est l'email que vous utilisez pour vous connecter.</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nouveau Mot de passe</label>
                        <input type="text" name="password" value={formData.password || ''} onChange={handleInputChange} placeholder="Saisir nouveau mot de passe" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none transition-all font-bold" />
                      </div>
                   </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Informations Personnelles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nom complet</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Département</label>
                    <select name="department" value={formData.department} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none transition-all appearance-none bg-slate-50 font-medium">
                      {DEPARTMENTS.filter(d => d !== "Toute l'équipe").map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Téléphone</label>
                    <input type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange} placeholder="+33 6 00 00 00 00" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fonction</label>
                    <input type="text" name="job_function" value={formData.job_function || ''} onChange={handleInputChange} placeholder="Ex: Collaborateur Star Fruits" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none transition-all" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-10 animate-in fade-in duration-300">
              <section className="space-y-6">
                <h3 className="text-lg font-bold text-slate-800">Canaux de notification</h3>
                <div className="space-y-4">
                  {[
                    { id: 'email', label: 'Email', sub: 'Recevez les notifications par email' },
                    { id: 'desktop', label: 'Notifications bureau', sub: 'Recevez les notifications sur votre navigateur' },
                    { id: 'mobile', label: 'Notifications mobiles', sub: 'Recevez les notifications sur votre téléphone' }
                  ].map(channel => (
                    <div key={channel.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div>
                        <p className="font-medium text-slate-700">{channel.label}</p>
                        <p className="text-xs text-slate-400">{channel.sub}</p>
                      </div>
                      <Switch checked={notifications[channel.id as keyof NotificationSettings]} onChange={() => toggleNotification(channel.id as keyof NotificationSettings)} />
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-6">
                <h3 className="text-lg font-bold text-slate-800">Types de notifications</h3>
                <div className="space-y-4">
                  {[
                    { id: 'posts', label: 'Nouveaux posts' },
                    { id: 'events', label: 'Événements' },
                    { id: 'messages', label: 'Messages directs' },
                    { id: 'birthdays', label: 'Anniversaires' },
                    { id: 'polls', label: 'Nouveaux sondages' }
                  ].map(type => (
                    <div key={type.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <span className="font-medium text-slate-700">{type.label}</span>
                      <Switch checked={notifications[type.id as keyof NotificationSettings]} onChange={() => toggleNotification(type.id as keyof NotificationSettings)} />
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'confidentialite' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <section className="space-y-6">
                <h3 className="text-lg font-bold text-slate-800">Visibilité du profil</h3>
                <div className="space-y-6">
                  {[
                    { id: 'email', label: 'Adresse email', sub: 'Visible par les autres membres de l\'équipe' },
                    { id: 'phone', label: 'Numéro de téléphone', sub: 'Visible par les autres membres de l\'équipe' },
                    { id: 'birthday', label: 'Date d\'anniversaire', sub: 'Visible dans les célébrations' }
                  ].map(item => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div>
                        <p className="font-medium text-slate-700">{item.label}</p>
                        <p className="text-xs text-slate-400">{item.sub}</p>
                      </div>
                      <Switch checked={privacy[item.id as keyof typeof privacy]} onChange={() => togglePrivacy(item.id as keyof typeof privacy)} />
                    </div>
                  ))}
                </div>
              </section>

              <section className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-4">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-600 h-fit">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <h4 className="font-bold text-amber-800 text-sm">Gestion des données</h4>
                  <p className="text-xs text-amber-700 mt-1">Les modérateurs et administrateurs peuvent toujours voir vos informations professionnelles de base pour assurer le bon fonctionnement de l'entreprise.</p>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="space-y-10 animate-in fade-in duration-300">
              <section className="space-y-6">
                <h3 className="text-lg font-bold text-slate-800">Thème</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setTheme('clair')}
                    className={`flex flex-col items-center gap-4 p-8 rounded-2xl border-2 transition-all ${theme === 'clair' ? 'border-green-500 bg-green-50' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <svg className={`w-8 h-8 ${theme === 'clair' ? 'text-green-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
                    <span className={`font-bold ${theme === 'clair' ? 'text-green-800' : 'text-slate-600'}`}>Clair</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setTheme('sombre')}
                    className={`flex flex-col items-center gap-4 p-8 rounded-2xl border-2 transition-all ${theme === 'sombre' ? 'border-green-500 bg-green-50' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <svg className={`w-8 h-8 ${theme === 'sombre' ? 'text-green-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                    <span className={`font-bold ${theme === 'sombre' ? 'text-green-800' : 'text-slate-600'}`}>Sombre</span>
                  </button>
                </div>
              </section>

              <section className="space-y-6">
                <h3 className="text-lg font-bold text-slate-800">Taille du texte</h3>
                <div className="space-y-3">
                  {[
                    { id: 'petit', label: 'Petit', sub: 'Aa' },
                    { id: 'moyen', label: 'Moyen', sub: 'Aa' },
                    { id: 'grand', label: 'Grand', sub: 'Aa' }
                  ].map(size => (
                    <button 
                      key={size.id}
                      type="button"
                      onClick={() => setTextSize(size.id as any)}
                      className={`w-full flex items-center justify-between px-6 py-4 rounded-xl border-2 transition-all ${textSize === size.id ? 'border-green-500 bg-green-50' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                      <span className="font-medium text-slate-700">{size.label}</span>
                      <span className={`text-slate-400 font-bold ${size.id === 'petit' ? 'text-xs' : size.id === 'grand' ? 'text-xl' : 'text-base'}`}>{size.sub}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-4">
          <button 
            type="button" 
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-100 transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Réinitialiser
          </button>
          <button 
            type="button" 
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 shadow-md shadow-green-200 transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            Enregistrer les modifications
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
