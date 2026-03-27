
export type StatusCliente = 'Ativo' | 'Inativo' | 'Cancelado';
export type StatusLead = 'Em Teste' | 'Convertido' | 'Nao Converteu' | 'Expirado';
export type Origem = 'Organico' | 'Ads' | 'Indicacao';

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  dataInicio: string; // ISO Date
  proximoVencimento: string; // ISO Date
  valorMensal: number;
  status: StatusCliente;
  origem: Origem;
  dispositivo?: string;
  observacoes?: string;
  historicoPagamentos: string[]; // ISO Dates
  dataCriacao: string;
}

export interface Lead {
  id: string;
  nome: string;
  telefone: string;
  dataInicioTeste: string; // ISO Date
  dataFimTeste: string; // ISO Date
  status: StatusLead;
  origem: Origem;
  motivoNaoConversao?: string;
  observacoes?: string;
}

export interface Investimento {
  id: string;
  data: string; // ISO Date
  plataforma: 'Facebook' | 'Google' | 'TikTok' | 'Influencer' | 'Outros';
  valor: number;
  observacoes?: string;
}

export interface Indicacao {
  id: string;
  clienteIndicadorId: string;
  clienteIndicadoId: string;
  dataIndicacao: string;
  statusRecompensa: 'Pendente' | 'Entregue';
}

export interface TemplateMensagem {
  id: string;
  titulo: string;
  conteudo: string;
  categoria: 'Boas-vindas' | 'Cobranca' | 'Suporte' | 'Vendas';
}

export interface Task {
  id: string;
  text: string;
  isCompleted: boolean;
  priority: 'Alta' | 'Media' | 'Baixa';
  createdAt: string;
}

export interface DashboardMetrics {
  ativos: number;
  receitaMensal: number;
  leadsEmTeste: number;
  taxaConversao: number;
}

export enum PhaseStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_FOR_USER = 'WAITING_FOR_USER',
  COMPLETED = 'COMPLETED'
}

export interface ProjectPhase {
  id: number;
  title: string;
  description: string;
  details: string[];
  status: PhaseStatus;
  iconName: string;
}

export interface UserQuestion {
  id: number;
  question: string;
  context: string;
  isCritical: boolean;
}

// --- SECURITY TYPES ---

export interface SecurityLog {
  id: string;
  timestamp: string;
  event: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'PASSWORD_CHANGED' | '2FA_ENABLED' | '2FA_DISABLED' | 'DATA_EXPORT' | 'SESSION_REVOKED';
  ip: string;
  device: string;
  details?: string;
}

export interface UserSession {
  id: string;
  email: string;
  token: string;
  expiry: number;
  device: string;
  browser: string;
  ip: string;
  lastActive: string;
}

// --- PLANS & SUBSCRIPTION TYPES ---

export type PlanId = 'starter' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'canceled' | 'suspended';

export interface PlanLimit {
  clientes: number; // -1 for unlimited
  leads: number;
  templates: number;
  stormAI: number;
}

export interface Plan {
  id: PlanId;
  nome: string;
  precoMensal: number;
  precoAnual: number;
  limites: PlanLimit;
  recursos: string[];
  popular: boolean;
  cor: string;
}

export interface UserProfile {
  id?: string; // Admin needs ID
  email: string;
  password?: string; // Stored locally for demo purposes
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  backupCodes?: string[];
  // New Profile Fields
  name?: string;
  whatsapp?: string;
  businessName?: string;
  // Subscription Fields
  planId: PlanId;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string; // ISO Date
  createdAt?: string; // For Admin
  isAdmin?: boolean; // Permissão de Super Admin via Firebase
}

// --- ADMIN TYPES ---

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  planId: PlanId;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  method: 'pix' | 'credit_card';
}
