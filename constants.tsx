
import { Post, User, UserRole, CompanyEvent, AppConfig, Reward } from './types';

export const INITIAL_CONFIG: AppConfig = {
  appName: 'Star ComUnity',
  appSlogan: 'Le mur social de votre entreprise',
  logoUrl: 'logo.png',
  welcomeTitle: 'Bonjour, {name} !',
  welcomeSubtitle: 'Voici les dernières actualités de la matinée.',
  documentCategories: ['Général', 'RH', 'Finance', 'Technique', 'Juridique']
};

export const INITIAL_USERS: User[] = [
  {
    id: 'admin-ludivine',
    email: 'ludivine.tramier@star-fruits.com',
    password: 'Admin',
    name: 'Ludivine Tramier',
    role: UserRole.ADMIN,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ludivine',
    department: 'Direction',
    // Added missing company property
    company: 'Star fruits',
    birthday: '01-15',
    points: 1500
  },
  {
    id: '1',
    email: 'admin@company.com',
    password: 'Admin',
    name: 'Alice Admin',
    role: UserRole.ADMIN,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
    department: 'Service Administratif, RH & Financier',
    // Added missing company property
    company: 'Star fruits',
    birthday: '05-20',
    points: 450
  },
  {
    id: '2',
    email: 'mod@company.com',
    password: 'Mod',
    name: 'Marc Mod',
    role: UserRole.MODERATOR,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marc',
    department: 'Service Communication',
    // Added missing company property
    company: 'Star fruits',
    birthday: '12-10',
    points: 320
  },
  {
    id: '3',
    email: 'juridique@company.com',
    password: 'User',
    name: 'Julien Juriste',
    role: UserRole.USER,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Julien',
    department: 'Service Juridique',
    // Added missing company property
    company: 'Star fruits',
    birthday: '01-28',
    points: 120
  },
  {
    id: '4',
    email: 'varietal@company.com',
    password: 'User',
    name: 'Sophie Semis',
    role: UserRole.USER,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
    department: 'Pôle Variétal',
    // Added missing company property
    company: 'Star fruits',
    birthday: '03-12',
    points: 800
  }
];

export const INITIAL_REWARDS: Reward[] = [
  { id: 'r1', title: 'Petit-déjeuner avec la direction', description: 'Un moment privilégié pour échanger sur la stratégie autour d\'un café.', cost: 500, category: 'Expérience', stock: 5, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=400' },
  { id: 'r2', title: 'Goodies Star Fruits Pack', description: 'Gourde, carnet et tote bag aux couleurs de l\'entreprise.', cost: 200, category: 'Goodies', stock: 20, image: 'https://images.unsplash.com/photo-1540331547168-8b6472b78339?q=80&w=400' },
  { id: 'r3', title: 'Badge "Expert Innovation"', description: 'Un badge doré affiché sur votre profil pendant 1 mois.', cost: 100, category: 'Badge', stock: 999, image: 'https://images.unsplash.com/photo-1598124146163-36819847286d?q=80&w=400' },
  { id: 'r4', title: 'Une demi-journée de congé bonus', description: 'Parce que vous avez été exemplaire ! (Soumis à validation RH)', cost: 1000, category: 'Avantage', stock: 3, image: 'https://images.unsplash.com/photo-1533750516457-a7f992034fec?q=80&w=400' }
];

export const INITIAL_POSTS: Post[] = [
  {
    id: 'p1',
    userId: 'admin-ludivine',
    userName: 'Ludivine Tramier',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ludivine',
    role: UserRole.ADMIN,
    title: 'Bienvenue sur notre nouveau Mur Social Star ComUnity !',
    content: 'Nous sommes ravis de lancer Star ComUnity. Utilisez cet espace pour partager des nouvelles, célébrer les succès et rester connectés avec vos collègues.',
    category: 'Général',
    likes: 12,
    comments: [],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    attachments: [
      {
        name: 'Welcome Image',
        type: 'image/jpeg',
        data: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800'
      }
    ]
  }
];

export const INITIAL_EVENTS: CompanyEvent[] = [
  {
    id: 'e1',
    type: 'Réunion',
    title: 'Lancement du nouveau catalogue',
    description: 'Présentation des nouvelles variétés pour la saison 2026.',
    location: 'Salle de conférence A',
    date: '2026-01-13',
    startTime: '09:00',
    endTime: '11:00',
    participants: ['Toute l\'équipe'],
    createdBy: 'admin-ludivine',
    attendees: ['admin-ludivine', '1', '2']
  }
];

export const CATEGORIES: string[] = ['Général', 'RH', 'Événements', 'Social', 'Tech'];

export const DEPARTMENTS: string[] = [
  'Direction',
  'Service Administratif, RH & Financier',
  'Service Communication',
  'Pôle Variétal',
  'Service Variétés Filière',
  'Pôle Marques',
  'Service Juridique'
];