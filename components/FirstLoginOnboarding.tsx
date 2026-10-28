import React, { useState } from 'react';

interface Props {
  userName: string;
  onFinish: () => Promise<void> | void;
  onNavigate: (view: any) => void;
}

const slides = [
  {
    title: "Bienvenue dans Star Com'Unity",
    text: "Votre espace interne pour retrouver l'essentiel de la vie du groupe, vos collègues et vos outils au même endroit.",
    bullets: ["Actualités et temps forts", "Équipe et messagerie", "Documents, ressources et outils"]
  },
  {
    title: "Participez à la vie de l'équipe",
    text: "Star Com'Unity est aussi un espace participatif : vous pouvez suivre les événements, répondre aux sondages et prendre part aux animations.",
    bullets: ["Sondages et boîte à idées", "Célébrations et vie d'équipe", "Jeux, pronostics et classements"]
  },
  {
    title: "Apprenez à votre rythme",
    text: "E-learning regroupe les contenus utiles pour mieux connaître le groupe, ses métiers, son histoire et ses marques.",
    bullets: ["Ressources pédagogiques", "Parcours et quiz", "Progression visible dans Mon espace"]
  },
  {
    title: "Choisissez vos notifications",
    text: "Vous gardez la main sur les alertes que vous souhaitez recevoir. Vous pourrez modifier ces choix à tout moment dans Paramètres.",
    bullets: ["Notifications dans l'application", "Notifications sur ordinateur", "Choix par type de contenu"]
  }
];

const FirstLoginOnboarding: React.FC<Props> = ({ userName, onFinish, onNavigate }) => {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const slide = slides[step];
  const last = step === slides.length - 1;

  const finish = async (destination: 'accueil' | 'parametres' = 'accueil') => {
    if (saving) return;
    setSaving(true);
    try {
      await onFinish();
      onNavigate(destination);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-white/20">
        <div className="bg-[#14532d] px-6 sm:px-10 py-7 text-white">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-green-200">Première connexion</p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-black">{step === 0 ? `Bienvenue${userName ? ` ${userName.split(' ')[0]}` : ''} !` : slide.title}</h2>
            </div>
            <span className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{step + 1}/{slides.length}</span>
          </div>
        </div>

        <div className="px-6 sm:px-10 py-8">
          {step === 0 && <h3 className="text-xl font-black text-slate-900 mb-3">{slide.title}</h3>}
          <p className="text-slate-600 leading-relaxed">{slide.text}</p>

          <div className="mt-7 grid gap-3">
            {slide.bullets.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
                <span className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-black">✓</span>
                <span className="font-bold text-slate-700">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex gap-2">
            {slides.map((_, i) => <span key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-8 bg-green-700' : 'w-2 bg-slate-200'}`} />)}
          </div>

          <div className="mt-8 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <button
              type="button"
              onClick={() => step > 0 ? setStep(step - 1) : void finish('accueil')}
              className="px-5 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100"
            >
              {step > 0 ? 'Précédent' : 'Passer la présentation'}
            </button>

            {!last ? (
              <button type="button" onClick={() => setStep(step + 1)} className="px-6 py-3 rounded-xl bg-[#14532d] text-white font-black hover:bg-green-900">
                Continuer
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <button type="button" disabled={saving} onClick={() => void finish('parametres')} className="px-5 py-3 rounded-xl border border-green-700 text-green-800 font-black hover:bg-green-50 disabled:opacity-50">
                  Régler mes notifications
                </button>
                <button type="button" disabled={saving} onClick={() => void finish('accueil')} className="px-6 py-3 rounded-xl bg-[#14532d] text-white font-black hover:bg-green-900 disabled:opacity-50">
                  Entrer dans Star Com'Unity
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirstLoginOnboarding;
