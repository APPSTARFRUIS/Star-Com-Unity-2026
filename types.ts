
export enum UserRole {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATEUR',
  USER = 'USER'
}

export interface NotificationSettings {
  inApp: boolean;
  email: boolean;
  desktop: boolean;
  mobile: boolean;
  posts: boolean;
  events: boolean;
  messages: boolean;
  birthdays: boolean;
  polls: boolean;
  newsletters: boolean;
  celebrations: boolean;
  highlights: boolean;
  points: boolean;
}

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  avatar: string;
  department: string;
  company: string;
  birthday?: string;
  points: number;
  phone?: string;
  job_function?: string;
  notification_settings?: NotificationSettings;
}


export type NotificationKind =
  | 'message'
  | 'post'
  | 'event'
  | 'poll'
  | 'newsletter'
  | 'celebration'
  | 'game'
  | 'highlight'
  | 'points'
  | 'document'
  | 'system';

export interface AppNotification {
  id: string;
  userId: string;
  kind: NotificationKind;
  title: string;
  message: string;
  linkView?: string;
  entityId?: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface AppConfig {
  appName: string;
  appSlogan: string;
  logoUrl: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  documentCategories: string[];
  gameCategories: string[];
}

export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  CHECKBOX = 'CHECKBOX',
  DROPDOWN = 'DROPDOWN',
  SHORT_TEXT = 'SHORT_TEXT',
  PARAGRAPH = 'PARAGRAPH',
  NUMBER = 'NUMBER',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  URL = 'URL',
  DATE = 'DATE',
  TIME = 'TIME',
  LINEAR_SCALE = 'LINEAR_SCALE',
  RATING = 'RATING',
  RANKING = 'RANKING',
  GRID = 'GRID',
  FILE = 'FILE',
  SECTION = 'SECTION'
}

export interface Attachment {
  name: string;
  type: string;
  data: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  description?: string;
  attachment?: Attachment;
  options?: string[];
  required: boolean;
  minValue?: number;
  maxValue?: number;
  minLabel?: string;
  maxLabel?: string;
  gridRows?: string[];
  gridCols?: string[];
  showOtherOption?: boolean;
}

export interface PollSettings {
  collectEmail: boolean;
  limitOneResponse: boolean;
  shuffleQuestions: boolean;
  showResults: boolean;
  showProgressBar: boolean;
  confirmationMessage: string;
}

export interface PollResponse {
  userId: string;
  userEmail: string;
  answers: Record<string, any>;
  submittedAt: string;
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  settings: PollSettings;
  responses: PollResponse[];
  endDate: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  targetDepartments: string[];
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  role: UserRole;
  title: string;
  content: string;
  attachments?: Attachment[];
  category: string;
  likes: number;
  comments: Comment[];
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  attachments?: Attachment[];
  createdAt: string;
}

export type IdeaStatus = 'Suggestion' | 'À l\'étude' | 'Planifiée' | 'Réalisée' | 'Refusée';

export interface Idea {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  title: string;
  description: string;
  category: string;
  status: IdeaStatus;
  votes: string[]; 
  comments: Comment[];
  createdAt: string;
}

export interface DocumentFile {
  id: string;
  name: string;
  type: string;
  size: number;
  category: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  data: string;
}

export type EventType = 'Réunion' | 'Formation' | 'Événement social' | 'Autre';

export interface CompanyEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  participants: string[];
  createdBy: string;
  attendees: string[];
}

export type MoodValue = 1 | 2 | 3 | 4 | 5;

export interface MoodEntry {
  id: string;
  userId: string;
  value: MoodValue;
  comment?: string;
  createdAt: string;
  department: string;
}

export interface Celebration {
  id: string;
  type: 'success' | 'welcome' | 'anniversary';
  title: string;
  description: string;
  date: string;
  userIds?: string[];
  userName?: string;
  userAvatar?: string;
  likes: string[];
  createdBy: string;
}

export type NewsletterBlockType = 'text' | 'image' | 'video' | 'button' | 'gallery';

export interface NewsletterBlock {
  id: string;
  type: NewsletterBlockType;
  content: string; 
  label?: string; 
  images?: string[]; 
}

export interface NewsletterArticle {
  id: string;
  title: string;
  summary: string;
  image?: string; 
  category: string;
  blocks: NewsletterBlock[];
}

export interface Newsletter {
  id: string;
  title: string;
  summary: string;
  coverImage?: string;
  publishedAt: string;
  authorName: string;
  readCount: number;
  articles: NewsletterArticle[];
}

export type WellnessCategory = 'Physique' | 'Mental' | 'Nutrition' | 'Sommeil' | 'Travail';

export interface WellnessContent {
  id: string;
  type: 'article' | 'video';
  title: string;
  summary: string;
  content?: string;
  mediaUrl?: string; 
  category: WellnessCategory;
  duration?: string; 
  author: string;
  createdAt: string;
}

export interface WellnessChallenge {
  id: string;
  title: string;
  description: string;
  points: number;
  isActive: boolean;
}

export type GameType = 'Quiz' | 'Memory' | 'Objets Cachés' | 'Chronologie' | 'Trivial' | 'Pari';
export type GameCategory = string;

export type QuizType = 'QCU' | 'QCM' | 'Vrai/Faux';

export interface QuizQuestion {
  id: string;
  type: QuizType; 
  question: string;
  options: string[];
  correctIndices: number[]; 
  trivialCategory?: string; 
}

export interface TimelineItem {
  id: string;
  text: string;
  year: number;
}

export interface HiddenObject {
  id: string;
  label: string;
  question?: string; 
  x: number; 
  y: number; 
  radius: number; 
}

export interface SportFixture {
  id: string;
  homeTeam: string;
  awayTeam: string;
  eventDate: string;
  closingDate: string;
  homeScore?: number;
  awayScore?: number;
  isFinished?: boolean;
  roundLabel?: string;
  venue?: string;
}

export interface CompanyGame {
  id: string;
  title: string;
  description: string;
  type: GameType;
  category: GameCategory;
  difficulty: 'Facile' | 'Moyen' | 'Difficile';
  duration: string; 
  status: 'Actif' | 'Inactif' | 'Terminé';
  createdAt: string;
  createdBy: string;
  thumbnail?: string;
  teamA?: string;
  teamB?: string;
  matchDate?: string;
  betClosingDate?: string;
  result?: 'A' | 'Nul' | 'B'; 
  isProcessed?: boolean; 
  questions?: QuizQuestion[]; 
  memoryItems?: string[]; 
  timelineItems?: TimelineItem[]; 
  hiddenObjects?: HiddenObject[]; 
  hiddenObjectsImage?: string; 
  sportEvents?: SportFixture[];
  sportName?: string;
  exactScorePoints?: number;
  outcomePoints?: number;
  rewardPoints: number;

  // Parcours pédagogique (optionnel). Un jeu sans learningPath reste un jeu libre.
  learningPath?: string;
  levelNumber?: number;
  levelTitle?: string;
  passingScore?: number;
}

export interface GameCompletion {
  id: string;
  userId: string;
  gameId: string;
  bestScore: number;
  passed: boolean;
  completedAt?: string | null;
  lastPlayedAt: string;
}

export interface GamePrediction {
  id?: string;
  userId: string;
  gameId: string;
  eventId?: string;
  homeScore?: number;
  awayScore?: number;
  choice?: 'A' | 'Nul' | 'B';
  submittedAt: string;
  pointsAwarded?: number;
  awarded?: boolean;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number;
  image?: string;
  stock: number;
  category: 'Badge' | 'Goodies' | 'Avantage' | 'Expérience';
}

export interface PointsTransaction {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  date: string;
  type: 'earn' | 'spend';
  orderStatus?: 'pending' | 'distributed';
  distributedAt?: string | null;
}

export type EngagementType = 'countdown' | 'raffle' | 'contest' | 'advent' | 'mission' | 'season' | 'predictions';

export interface AdventOpening {
  id: string;
  animationId: string;
  userId: string;
  dayNumber: number;
  outcome: {
    isCorrect?: boolean;
    instantWin?: boolean;
    answer?: string;
  };
  pointsAwarded: number;
  openedAt: string;
}

export interface EngagementAnimation {
  id: string;
  type: EngagementType;
  title: string;
  description: string;
  startDate?: string;
  endDate?: string;
  imageUrl?: string;
  pointsCost: number;
  rewardLabel?: string;
  rewardPoints: number;
  status: 'active' | 'closed' | 'draft';
  createdBy: string;
  config: Record<string, any>;
  participants: string[];
  winnerIds: string[];
  createdAt: string;
}
