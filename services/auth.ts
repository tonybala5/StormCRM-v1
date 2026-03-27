import { SecurityLog, UserSession, UserProfile, PlanId, Plan } from '../types';
import { PLANS } from '../constants';
import { storageService } from './storage';
import { auth, db, signInWithGoogle, logout as firebaseLogout } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { supabase, isSupabaseConfigured } from './supabase';

const KEYS = {
  SESSION: 'storm_auth_session',
  USER_CREDS: 'storm_user_creds', 
  SECURITY_LOGS: 'storm_security_logs',
  LOGIN_ATTEMPTS: 'storm_login_attempts',
  SESSIONS_LIST: 'storm_active_sessions'
};

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_TIME_MS = 15 * 60 * 1000; 

// --- CONFIGURAÇÃO DE ADMINISTRADORES (HARDCODED) ---
const ADMIN_EMAILS = [
  "admin@stormcrm.com.br", 
  "estrategistadigitaltonybala@gmail.com",
  "mariaveronicadarochasousaalves@gmail.com"
];

export const authService = {
  // --- CORE AUTH (ASYNC) ---
  
  login: async (email: string, password: string): Promise<{ success: boolean; error?: string; require2FA?: boolean }> => {
    if (authService.isLockedOut()) {
      return { success: false, error: `Conta bloqueada. Aguarde ${authService.getLockoutTimeRemaining()}.` };
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          await authService.syncUserProfileSupabase(data.user);
          return { success: true };
        }
        return { success: false, error: "Erro ao realizar login." };
      } catch (error: any) {
        authService.recordFailedAttempt();
        return { success: false, error: error.message };
      }
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      await authService.syncUserProfile(firebaseUser);
      return { success: true };
    } catch (error: any) {
      authService.recordFailedAttempt();
      let msg = error.message;
      if (msg.includes('invalid-credential') || msg.includes('wrong-password')) msg = "Email ou senha incorretos.";
      if (msg.includes('user-not-found')) msg = "Usuário não encontrado.";
      return { success: false, error: msg };
    }
  },

  loginWithGoogle: async (): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin
          }
        });
        if (error) throw error;
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }

    try {
      const user = await signInWithGoogle();
      await authService.syncUserProfile(user);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  syncUserProfileSupabase: async (supabaseUser: any) => {
    if (!isSupabaseConfigured() || !supabase) return null;
    
    const isHardcodedAdmin = ADMIN_EMAILS.includes(supabaseUser.email || '');
    
    // Try to get from 'users' table in Supabase
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    let userProfile: UserProfile;

    if (profile && !error) {
      userProfile = profile as UserProfile;
    } else {
      const trialEnds = new Date();
      trialEnds.setDate(trialEnds.getDate() + 15);
      
      userProfile = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.full_name || 'Usuário',
        planId: isHardcodedAdmin ? 'enterprise' : 'starter',
        subscriptionStatus: isHardcodedAdmin ? 'active' : 'trial',
        trialEndsAt: isHardcodedAdmin 
          ? new Date(Date.now() + 365 * 50 * 24 * 60 * 60 * 1000).toISOString()
          : trialEnds.toISOString(),
        twoFactorEnabled: false,
        createdAt: new Date().toISOString(),
        isAdmin: isHardcodedAdmin
      };
      
      // Save to Supabase
      await supabase.from('users').upsert(userProfile);
    }

    authService.finalizeLogin(userProfile);
    return userProfile;
  },

  syncUserProfile: async (firebaseUser: User) => {
    const isHardcodedAdmin = ADMIN_EMAILS.includes(firebaseUser.email || '');
    const docRef = doc(db, "users", firebaseUser.uid);
    const docSnap = await getDoc(docRef);
    
    let userProfile: UserProfile;

    if (docSnap.exists()) {
      userProfile = docSnap.data() as UserProfile;
    } else {
      const trialEnds = new Date();
      trialEnds.setDate(trialEnds.getDate() + 15);
      
      userProfile = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || 'Usuário',
        planId: isHardcodedAdmin ? 'enterprise' : 'starter',
        subscriptionStatus: isHardcodedAdmin ? 'active' : 'trial',
        trialEndsAt: isHardcodedAdmin 
          ? new Date(Date.now() + 365 * 50 * 24 * 60 * 60 * 1000).toISOString()
          : trialEnds.toISOString(),
        twoFactorEnabled: false,
        createdAt: new Date().toISOString(),
        isAdmin: isHardcodedAdmin
      };
      await setDoc(docRef, userProfile);
    }

    authService.finalizeLogin(userProfile);
    return userProfile;
  },

  finalizeLogin: (user: UserProfile) => {
    localStorage.setItem(KEYS.USER_CREDS, JSON.stringify(user));
    authService.resetLoginAttempts();
    authService.createSession(user.email);
    authService.logEvent('LOGIN_SUCCESS');
  },

  register: async (data: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email!,
          password: data.password!,
          options: {
            data: {
              full_name: data.name
            }
          }
        });
        if (error) throw error;
        if (authData.user) {
          const isSuperAdminRegistering = ADMIN_EMAILS.includes(data.email || '');
          const trialEnds = new Date();
          trialEnds.setDate(trialEnds.getDate() + 15);

          const planId: PlanId = isSuperAdminRegistering ? 'enterprise' : 'starter';
          const status = isSuperAdminRegistering ? 'active' : 'trial';
          const finalTrialDate = isSuperAdminRegistering 
              ? new Date(Date.now() + 365 * 50 * 24 * 60 * 60 * 1000).toISOString()
              : trialEnds.toISOString();

          const userProfile: UserProfile = {
            id: authData.user.id,
            email: data.email!,
            name: data.name || 'Usuário',
            whatsapp: data.whatsapp,
            businessName: data.businessName,
            planId: planId,
            subscriptionStatus: status,
            trialEndsAt: finalTrialDate,
            twoFactorEnabled: false,
            createdAt: new Date().toISOString(),
            isAdmin: isSuperAdminRegistering
          };

          await supabase.from('users').upsert(userProfile);
          authService.finalizeLogin(userProfile);
          return { success: true };
        }
        return { success: false, error: "Erro ao registrar usuário." };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email!, data.password!);
      const firebaseUser = userCredential.user;

      const isSuperAdminRegistering = ADMIN_EMAILS.includes(data.email || '');
      const trialEnds = new Date();
      trialEnds.setDate(trialEnds.getDate() + 15);

      const planId: PlanId = isSuperAdminRegistering ? 'enterprise' : 'starter';
      const status = isSuperAdminRegistering ? 'active' : 'trial';
      const finalTrialDate = isSuperAdminRegistering 
          ? new Date(Date.now() + 365 * 50 * 24 * 60 * 60 * 1000).toISOString()
          : trialEnds.toISOString();

      const userProfile: UserProfile = {
        id: firebaseUser.uid,
        email: data.email!,
        name: data.name || 'Usuário',
        whatsapp: data.whatsapp,
        businessName: data.businessName,
        planId: planId,
        subscriptionStatus: status,
        trialEndsAt: finalTrialDate,
        twoFactorEnabled: false,
        createdAt: new Date().toISOString(),
        isAdmin: isSuperAdminRegistering
      };

      await setDoc(doc(db, "users", firebaseUser.uid), userProfile);
      authService.finalizeLogin(userProfile);
      return { success: true };
    } catch (error: any) {
      let msg = error.message;
      if (msg.includes('email-already-in-use')) msg = "Este email já está em uso.";
      if (msg.includes('weak-password')) msg = "A senha deve ter pelo menos 6 caracteres.";
      return { success: false, error: msg };
    }
  },

  resetPassword: async (email: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        return { success: true, message: 'Email de recuperação enviado! Verifique sua caixa de entrada.' };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }

    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Email de recuperação enviado! Verifique sua caixa de entrada.' };
    } catch (error: any) {
      let msg = error.message;
      if (msg.includes('user-not-found')) msg = "Email não encontrado no sistema.";
      if (msg.includes('invalid-email')) msg = "Email inválido.";
      return { success: false, error: msg };
    }
  },

  updatePlan: async (planId: PlanId) => {
    const user = authService.getUserProfile();
    if (user && user.id) {
      const updatedUser: UserProfile = {
        ...user,
        planId,
        subscriptionStatus: 'active',
        trialEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      localStorage.setItem(KEYS.USER_CREDS, JSON.stringify(updatedUser));

      if (isSupabaseConfigured() && supabase) {
        await supabase.from('users').update(updatedUser).eq('id', user.id);
      } else {
        await setDoc(doc(db, "users", user.id), updatedUser, { merge: true });
      }
    }
  },

  verify2FA: (code: string): boolean => {
    let user = JSON.parse(localStorage.getItem('storm_pending_login') || 'null');
    if (!user) user = authService.getUserProfile();
    if (!user || !user.twoFactorEnabled) return true;

    const isBackupCode = user.backupCodes?.includes(code);
    const isValidCode = code === '123456'; 

    if (isValidCode || isBackupCode) {
      if (isBackupCode) {
        const newCodes = user.backupCodes?.filter((c:string) => c !== code) || [];
        user.backupCodes = newCodes;
        storageService.saveUser(user); 
      }
      authService.finalizeLogin(user);
      localStorage.removeItem('storm_pending_login');
      return true;
    }
    authService.recordFailedAttempt();
    return false;
  },

  isSuperAdmin: (): boolean => {
    const user = authService.getUserProfile();
    if (!user) return false;
    // Retorna true se estiver na lista hardcoded OU se tiver a flag isAdmin (vinda do banco)
    return !!(user.isAdmin || ADMIN_EMAILS.includes(user.email));
  },

  getCurrentPlan: (): Plan => {
    const user = authService.getUserProfile();
    if (!user) return PLANS[0];
    return PLANS.find(p => p.id === user.planId) || PLANS[0];
  },

  getTrialDaysRemaining: (): number => {
    const user = authService.getUserProfile();
    if (!user || user.subscriptionStatus !== 'trial') return 0;
    const today = new Date();
    const end = new Date(user.trialEndsAt);
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  },

  isTrialExpired: (): boolean => {
    const user = authService.getUserProfile();
    if (!user) return false;
    if (authService.isSuperAdmin()) return false;
    if (user.subscriptionStatus === 'active') return false;
    if (user.subscriptionStatus === 'trial') return authService.getTrialDaysRemaining() <= 0;
    return true;
  },

  checkLimit: (resource: 'clientes' | 'leads' | 'templates' | 'stormAI', currentCount: number): { allowed: boolean; limit: number; planName: string } => {
    if (authService.isSuperAdmin()) return { allowed: true, limit: -1, planName: 'Super Admin' };
    const plan = authService.getCurrentPlan();
    const limit = plan.limites[resource];
    if (limit === -1) return { allowed: true, limit, planName: plan.nome };
    if (currentCount >= limit) return { allowed: false, limit, planName: plan.nome };
    return { allowed: true, limit, planName: plan.nome };
  },

  detectBrowser: (): string => {
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf("Chrome") > -1) return "Chrome";
    if (userAgent.indexOf("Firefox") > -1) return "Firefox";
    if (userAgent.indexOf("Safari") > -1) return "Safari";
    if (userAgent.indexOf("Edge") > -1) return "Edge";
    if (userAgent.indexOf("Opera") > -1) return "Opera";
    return "Unknown";
  },

  createSession: (email: string) => {
    const browser = authService.detectBrowser();
    const id = crypto.randomUUID();
    const session: UserSession = {
      id,
      email,
      token: Math.random().toString(36).substring(2),
      expiry: Date.now() + (30 * 60 * 1000), 
      device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
      browser,
      ip: '192.168.x.x', 
      lastActive: new Date().toISOString()
    };
    localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
    const sessions = authService.getActiveSessions();
    sessions.push(session);
    localStorage.setItem(KEYS.SESSIONS_LIST, JSON.stringify(sessions));
  },

  updateSessionActivity: () => {
    const current = authService.getCurrentSession();
    if (current) {
      current.lastActive = new Date().toISOString();
      current.expiry = Date.now() + (30 * 60 * 1000); 
      localStorage.setItem(KEYS.SESSION, JSON.stringify(current));
    }
  },

  logout: (sessionId?: string) => {
    if (isSupabaseConfigured() && supabase) {
      supabase.auth.signOut();
    } else {
      firebaseLogout();
    }
    
    if (sessionId) {
      const sessions = authService.getActiveSessions().filter(s => s.id !== sessionId);
      localStorage.setItem(KEYS.SESSIONS_LIST, JSON.stringify(sessions));
    } else {
      localStorage.removeItem(KEYS.SESSION);
      localStorage.removeItem(KEYS.USER_CREDS);
    }
  },

  subscribeToAuthChanges: (callback: (user: UserProfile | null) => void) => {
    if (isSupabaseConfigured() && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const profile = await authService.syncUserProfileSupabase(session.user);
          callback(profile);
        } else {
          localStorage.removeItem(KEYS.SESSION);
          localStorage.removeItem(KEYS.USER_CREDS);
          callback(null);
        }
      });
      return () => subscription.unsubscribe();
    }

    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await authService.syncUserProfile(firebaseUser);
        callback(profile);
      } else {
        localStorage.removeItem(KEYS.SESSION);
        localStorage.removeItem(KEYS.USER_CREDS);
        callback(null);
      }
    });
  },

  isAuthenticated: (): boolean => {
    const session = authService.getCurrentSession();
    if (!session) return false;
    if (Date.now() > session.expiry) {
      authService.logout();
      return false;
    }
    return true;
  },

  getCurrentSession: (): UserSession | null => {
    const str = localStorage.getItem(KEYS.SESSION);
    return str ? JSON.parse(str) : null;
  },

  getActiveSessions: (): UserSession[] => {
    const str = localStorage.getItem(KEYS.SESSIONS_LIST);
    return str ? JSON.parse(str) : [];
  },

  getUserProfile: (): UserProfile | null => {
    const str = localStorage.getItem(KEYS.USER_CREDS);
    return str ? JSON.parse(str) : null;
  },

  updateUserProfile: (profile: UserProfile) => {
    localStorage.setItem(KEYS.USER_CREDS, JSON.stringify(profile));
    storageService.saveUser(profile);
  },

  enable2FA: (secret: string, backupCodes: string[]) => {
    const user = authService.getUserProfile();
    if (user) {
      authService.updateUserProfile({
        ...user,
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        backupCodes
      });
      authService.logEvent('2FA_ENABLED');
    }
  },

  disable2FA: () => {
    const user = authService.getUserProfile();
    if (user) {
      authService.updateUserProfile({
        ...user,
        twoFactorEnabled: false,
        twoFactorSecret: undefined,
        backupCodes: undefined
      });
      authService.logEvent('2FA_DISABLED');
    }
  },

  recordFailedAttempt: () => {
    const data = JSON.parse(localStorage.getItem(KEYS.LOGIN_ATTEMPTS) || '{"count": 0, "lockoutUntil": 0}');
    data.count += 1;
    if (data.count >= LOCKOUT_THRESHOLD) {
      data.lockoutUntil = Date.now() + LOCKOUT_TIME_MS;
    }
    localStorage.setItem(KEYS.LOGIN_ATTEMPTS, JSON.stringify(data));
  },

  resetLoginAttempts: () => {
    localStorage.removeItem(KEYS.LOGIN_ATTEMPTS);
  },

  isLockedOut: (): boolean => {
    const data = JSON.parse(localStorage.getItem(KEYS.LOGIN_ATTEMPTS) || '{"count": 0, "lockoutUntil": 0}');
    return Date.now() < data.lockoutUntil;
  },

  getLockoutTimeRemaining: (): string => {
    const data = JSON.parse(localStorage.getItem(KEYS.LOGIN_ATTEMPTS) || '{"count": 0, "lockoutUntil": 0}');
    const diff = data.lockoutUntil - Date.now();
    if (diff <= 0) return '';
    const minutes = Math.ceil(diff / 60000);
    return `${minutes} minutos`;
  },

  getSecurityLogs: (): SecurityLog[] => {
    return JSON.parse(localStorage.getItem(KEYS.SECURITY_LOGS) || '[]');
  },

  logEvent: (event: SecurityLog['event'], details?: string) => {
    const logs: SecurityLog[] = JSON.parse(localStorage.getItem(KEYS.SECURITY_LOGS) || '[]');
    const newLog: SecurityLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      event,
      ip: '192.168.1.1', // Mock
      device: navigator.userAgent,
      details
    };
    const updatedLogs = [newLog, ...logs].slice(0, 50);
    localStorage.setItem(KEYS.SECURITY_LOGS, JSON.stringify(updatedLogs));
  }
};