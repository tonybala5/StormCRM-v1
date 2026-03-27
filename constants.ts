import { ProjectPhase, PhaseStatus, UserQuestion, Plan } from './types';

export const PLANS: Plan[] = [
  {
    id: "starter",
    nome: "Free (Teste)",
    precoMensal: 0,
    precoAnual: 0,
    limites: {
      clientes: 5,
      leads: 30,
      templates: 5,
      stormAI: 3
    },
    recursos: [
      "15 dias de teste grátis",
      "Limite de 30 leads (testes)",
      "Gestão básica de clientes",
      "Prova social estratégica"
    ],
    popular: false,
    cor: "#94a3b8"
  },
  {
    id: "professional",
    nome: "Pro",
    precoMensal: 49.90,
    precoAnual: 499.00,
    limites: {
      clientes: -1,
      leads: -1,
      templates: -1,
      stormAI: 100
    },
    recursos: [
      "Tudo Ilimitado",
      "Storm AI (100 consultas)",
      "Métricas avançadas",
      "Investimento em Ads",
      "Suporte via WhatsApp"
    ],
    popular: true,
    cor: "#10b981"
  },
  {
    id: "enterprise",
    nome: "Enterprise",
    precoMensal: 99.90,
    precoAnual: 999.00,
    limites: {
      clientes: -1,  // -1 = ilimitado
      leads: -1,
      templates: -1,
      stormAI: -1
    },
    recursos: [
      "Tudo do Professional +",
      "Clientes ilimitados",
      "Multi-usuários (10)",
      "API de integração",
      "Suporte WhatsApp",
      "Treinamento incluso"
    ],
    popular: false,
    cor: "#f59e0b"
  }
];

export const PROJECT_PHASES: ProjectPhase[] = [
  {
    id: 1,
    title: 'Analise de Requisitos & Escopo',
    description: 'Entendimento profundo do problema a ser resolvido.',
    details: [
      'Definição da funcionalidade principal (Core Loop).',
      'Identificação do público-alvo e caso de uso.',
      'Listagem de permissões necessárias (Câmera, Mic, Geo).',
      'Escolha dos modelos de IA (Gemini Flash vs Pro vs Veo).'
    ],
    status: PhaseStatus.WAITING_FOR_USER,
    iconName: 'ClipboardList'
  },
  {
    id: 2,
    title: 'Arquitetura Técnica & Design System',
    description: 'Fundação sólida com React, TypeScript e Tailwind.',
    details: [
      'Configuração do Vite/React 18+ com TypeScript estrito.',
      'Setup do Tailwind CSS para responsividade mobile-first.',
      'Definição de estrutura de pastas escalável (services/, components/).',
      'Implementação do Google GenAI SDK (Gemini).'
    ],
    status: PhaseStatus.PENDING,
    iconName: 'Layers'
  },
  {
    id: 3,
    title: 'Desenvolvimento Core (Lógica)',
    description: 'Implementação dos serviços e integração com APIs.',
    details: [
      'Criação do geminiService.ts para abstrair chamadas de IA.',
      'Gerenciamento de estado (Hooks/Context) para dados da aplicação.',
      'Lógica de streaming de resposta em tempo real.',
      'Tratamento de erros e estados de carregamento.'
    ],
    status: PhaseStatus.PENDING,
    iconName: 'Cpu'
  },
  {
    id: 4,
    title: 'Interface do Usuário (UI/UX)',
    description: 'Construção visual com foco em estética e usabilidade.',
    details: [
      'Desenvolvimento de componentes reutilizáveis.',
      'Layout responsivo (Grid/Flexbox).',
      'Feedback visual (Toasts, Spinners, Animações).',
      'Visualização de dados (se necessário).'
    ],
    status: PhaseStatus.PENDING,
    iconName: 'Palette'
  },
  {
    id: 5,
    title: 'Polimento & Entrega',
    description: 'Refinamento final e validação.',
    details: [
      'Revisão de acessibilidade (contraste, aria-labels).',
      'Otimização de performance.',
      'Testes de casos de borda (falha de rede, inputs inválidos).',
      'Entrega do código final limpo e documentado.'
    ],
    status: PhaseStatus.PENDING,
    iconName: 'Rocket'
  }
];

export const INITIAL_QUESTIONS: UserQuestion[] = [
  {
    id: 1,
    question: "Qual é o objetivo principal do App?",
    context: "Ex: Um chat de suporte, um gerador de vídeos, um analisador de imagens médicas?",
    isCritical: true
  },
  {
    id: 2,
    question: "O app precisa de 'olhos' ou 'ouvidos'?",
    context: "Precisamos acessar a Câmera, Microfone ou Localização do usuário?",
    isCritical: false
  },
  {
    id: 3,
    question: "Existe alguma preferência visual?",
    context: "Ex: Tema escuro futurista, Corporativo limpo, Minimalista?",
    isCritical: false
  }
];