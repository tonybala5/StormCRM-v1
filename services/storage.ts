import { Cliente, Lead, TemplateMensagem, Investimento, Indicacao, Task, UserProfile, Transaction } from '../types';
import { db, auth, isFirebaseConfigured, handleFirestoreError, OperationType } from './firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, setDoc, query, where } from 'firebase/firestore';
import { supabase, isSupabaseConfigured } from './supabase';

const KEYS = {
  CLIENTES: 'storm_clientes',
  LEADS: 'storm_leads',
  TEMPLATES: 'storm_templates',
  INVESTIMENTOS: 'storm_investimentos',
  INDICACOES: 'storm_indicacoes',
  TASKS: 'storm_tasks',
  USERS_DB: 'storm_users_db',
  TRANSACTIONS: 'storm_transactions'
};

const DEFAULT_TEMPLATES: TemplateMensagem[] = []; 
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const storageService = {
  // --- CLIENTES ---
  getClientes: async (): Promise<Cliente[]> => {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('clientes').select('*');
      if (error) {
        console.error("Supabase Error (clientes):", error);
        return [];
      }
      return data as Cliente[];
    }

    if (isFirebaseConfigured() && db && auth?.currentUser) {
      try {
        // Query Clientes collection where uid matches current user
        const q = query(collection(db, "clientes"), where("uid", "==", auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cliente));
      } catch (e) { 
        handleFirestoreError(e, OperationType.LIST, "clientes");
        return []; 
      }
    }
    
    // Fallback LocalStorage
    await delay(100);
    const data = localStorage.getItem(KEYS.CLIENTES);
    return data ? JSON.parse(data) : [];
  },

  saveCliente: async (cliente: Cliente): Promise<void> => {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('clientes').upsert(cliente);
      if (error) console.error("Supabase Save Error (clientes):", error);
      return;
    }

    if (isFirebaseConfigured() && db && auth?.currentUser) {
       try {
         const payload = { ...cliente, uid: auth.currentUser.uid };
         await setDoc(doc(db, "clientes", cliente.id), payload, { merge: true });
         return;
       } catch (e) {
         handleFirestoreError(e, OperationType.WRITE, `clientes/${cliente.id}`);
       }
    }

    await delay(100);
    const clientes = JSON.parse(localStorage.getItem(KEYS.CLIENTES) || '[]');
    const existsIndex = clientes.findIndex((c: Cliente) => c.id === cliente.id);
    if (existsIndex >= 0) clientes[existsIndex] = cliente;
    else clientes.push(cliente);
    localStorage.setItem(KEYS.CLIENTES, JSON.stringify(clientes));
  },

  deleteCliente: async (id: string): Promise<void> => {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('clientes').delete().eq('id', id);
      if (error) console.error("Supabase Delete Error (clientes):", error);
      return;
    }

    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, "clientes", id));
        return;
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `clientes/${id}`);
      }
    }
    await delay(100);
    const clientes = JSON.parse(localStorage.getItem(KEYS.CLIENTES) || '[]');
    const filtered = clientes.filter((c: Cliente) => c.id !== id);
    localStorage.setItem(KEYS.CLIENTES, JSON.stringify(filtered));
  },

  // --- LEADS ---
  getLeads: async (): Promise<Lead[]> => {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('leads').select('*');
      if (error) {
        console.error("Supabase Error (leads):", error);
        return [];
      }
      return data as Lead[];
    }

    if (isFirebaseConfigured() && db && auth?.currentUser) {
      try {
        const q = query(collection(db, "leads"), where("uid", "==", auth.currentUser.uid));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, "leads");
        return [];
      }
    }
    await delay(100);
    return JSON.parse(localStorage.getItem(KEYS.LEADS) || '[]');
  },
  
  saveLead: async (lead: Lead): Promise<void> => {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('leads').upsert(lead);
      if (error) console.error("Supabase Save Error (leads):", error);
      return;
    }

    if (isFirebaseConfigured() && db && auth?.currentUser) {
      try {
        await setDoc(doc(db, "leads", lead.id), { ...lead, uid: auth.currentUser.uid }, { merge: true });
        return;
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `leads/${lead.id}`);
      }
    }
    const leads = JSON.parse(localStorage.getItem(KEYS.LEADS) || '[]');
    const existsIndex = leads.findIndex((l: Lead) => l.id === lead.id);
    if (existsIndex >= 0) leads[existsIndex] = lead;
    else leads.push(lead);
    localStorage.setItem(KEYS.LEADS, JSON.stringify(leads));
  },

  deleteLead: async (id: string): Promise<void> => {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) console.error("Supabase Delete Error (leads):", error);
      return;
    }

    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, "leads", id));
        return;
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `leads/${id}`);
      }
    }
    const leads = JSON.parse(localStorage.getItem(KEYS.LEADS) || '[]');
    const filtered = leads.filter((l: Lead) => l.id !== id);
    localStorage.setItem(KEYS.LEADS, JSON.stringify(filtered));
  },

  // --- TEMPLATES ---
  getTemplates: async (): Promise<TemplateMensagem[]> => {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('templates').select('*');
      if (error) {
        console.error("Supabase Error (templates):", error);
        return [];
      }
      return data as TemplateMensagem[];
    }

    if (isFirebaseConfigured() && db && auth?.currentUser) {
      try {
        const q = query(collection(db, "templates"), where("uid", "==", auth.currentUser.uid));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TemplateMensagem));
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, "templates");
        return [];
      }
    }
    await delay(100);
    const data = localStorage.getItem(KEYS.TEMPLATES);
    return data ? JSON.parse(data) : DEFAULT_TEMPLATES;
  },

  saveTemplate: async (template: TemplateMensagem): Promise<void> => {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('templates').upsert(template);
      if (error) console.error("Supabase Save Error (templates):", error);
      return;
    }

    if (isFirebaseConfigured() && db && auth?.currentUser) {
      try {
        await setDoc(doc(db, "templates", template.id), { ...template, uid: auth.currentUser.uid }, { merge: true });
        return;
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `templates/${template.id}`);
      }
    }
    const templates = JSON.parse(localStorage.getItem(KEYS.TEMPLATES) || '[]');
    const existsIndex = templates.findIndex((t: TemplateMensagem) => t.id === template.id);
    if (existsIndex >= 0) templates[existsIndex] = template;
    else templates.push(template);
    localStorage.setItem(KEYS.TEMPLATES, JSON.stringify(templates));
  },

  deleteTemplate: async (id: string): Promise<void> => {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('templates').delete().eq('id', id);
      if (error) console.error("Supabase Delete Error (templates):", error);
      return;
    }

    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, "templates", id));
        return;
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `templates/${id}`);
      }
    }
    const templates = JSON.parse(localStorage.getItem(KEYS.TEMPLATES) || '[]');
    const filtered = templates.filter((t: TemplateMensagem) => t.id !== id);
    localStorage.setItem(KEYS.TEMPLATES, JSON.stringify(filtered));
  },

  // --- INVESTIMENTOS ---
  getInvestimentos: async (): Promise<Investimento[]> => {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('investimentos').select('*');
      if (error) {
        console.error("Supabase Error (investimentos):", error);
        return [];
      }
      return data as Investimento[];
    }

    if (isFirebaseConfigured() && db && auth?.currentUser) {
      try {
        const q = query(collection(db, "investimentos"), where("uid", "==", auth.currentUser.uid));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Investimento));
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, "investimentos");
        return [];
      }
    }
    return JSON.parse(localStorage.getItem(KEYS.INVESTIMENTOS) || '[]');
  },

  saveInvestimento: async (item: Investimento): Promise<void> => {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('investimentos').upsert(item);
      if (error) console.error("Supabase Save Error (investimentos):", error);
      return;
    }

    if (isFirebaseConfigured() && db && auth?.currentUser) {
      try {
        await setDoc(doc(db, "investimentos", item.id), { ...item, uid: auth.currentUser.uid }, { merge: true });
        return;
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `investimentos/${item.id}`);
      }
    }
    const items = JSON.parse(localStorage.getItem(KEYS.INVESTIMENTOS) || '[]');
    const existsIndex = items.findIndex((i: Investimento) => i.id === item.id);
    if (existsIndex >= 0) items[existsIndex] = item;
    else items.push(item);
    localStorage.setItem(KEYS.INVESTIMENTOS, JSON.stringify(items));
  },

  deleteInvestimento: async (id: string): Promise<void> => {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('investimentos').delete().eq('id', id);
      if (error) console.error("Supabase Delete Error (investimentos):", error);
      return;
    }

    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, "investimentos", id));
        return;
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `investimentos/${id}`);
      }
    }
    const items = JSON.parse(localStorage.getItem(KEYS.INVESTIMENTOS) || '[]');
    const filtered = items.filter((i: Investimento) => i.id !== id);
    localStorage.setItem(KEYS.INVESTIMENTOS, JSON.stringify(filtered));
  },

  // --- INDICACOES ---
  getIndicacoes: async (): Promise<Indicacao[]> => {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('indicacoes').select('*');
      if (error) {
        console.error("Supabase Error (indicacoes):", error);
        return [];
      }
      return data as Indicacao[];
    }

    if (isFirebaseConfigured() && db && auth?.currentUser) {
      try {
        const q = query(collection(db, "indicacoes"), where("uid", "==", auth.currentUser.uid));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Indicacao));
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, "indicacoes");
        return [];
      }
    }
    return JSON.parse(localStorage.getItem(KEYS.INDICACOES) || '[]');
  },

  saveIndicacao: async (item: Indicacao): Promise<void> => {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('indicacoes').upsert(item);
      if (error) console.error("Supabase Save Error (indicacoes):", error);
      return;
    }

    if (isFirebaseConfigured() && db && auth?.currentUser) {
      try {
        await setDoc(doc(db, "indicacoes", item.id), { ...item, uid: auth.currentUser.uid }, { merge: true });
        return;
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `indicacoes/${item.id}`);
      }
    }
    const items = JSON.parse(localStorage.getItem(KEYS.INDICACOES) || '[]');
    const idx = items.findIndex((i: Indicacao) => i.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.push(item);
    localStorage.setItem(KEYS.INDICACOES, JSON.stringify(items));
  },

  deleteIndicacao: async (id: string): Promise<void> => {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('indicacoes').delete().eq('id', id);
      if (error) console.error("Supabase Delete Error (indicacoes):", error);
      return;
    }

    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, "indicacoes", id));
        return;
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `indicacoes/${id}`);
      }
    }
    const items = JSON.parse(localStorage.getItem(KEYS.INDICACOES) || '[]');
    const filtered = items.filter((i: Indicacao) => i.id !== id);
    localStorage.setItem(KEYS.INDICACOES, JSON.stringify(filtered));
  },

  // --- TASKS ---
  getTasks: async (): Promise<Task[]> => {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('tasks').select('*');
      if (error) {
        console.error("Supabase Error (tasks):", error);
        return [];
      }
      return data as Task[];
    }

    if (isFirebaseConfigured() && db && auth?.currentUser) {
      try {
        const q = query(collection(db, "tasks"), where("uid", "==", auth.currentUser.uid));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, "tasks");
        return [];
      }
    }
    return JSON.parse(localStorage.getItem(KEYS.TASKS) || '[]');
  },

  saveTask: async (task: Task): Promise<void> => {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('tasks').upsert(task);
      if (error) console.error("Supabase Save Error (tasks):", error);
      return;
    }

    if (isFirebaseConfigured() && db && auth?.currentUser) {
      try {
        await setDoc(doc(db, "tasks", task.id), { ...task, uid: auth.currentUser.uid }, { merge: true });
        return;
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `tasks/${task.id}`);
      }
    }
    const tasks = JSON.parse(localStorage.getItem(KEYS.TASKS) || '[]');
    const idx = tasks.findIndex((t: Task) => t.id === task.id);
    if (idx >= 0) tasks[idx] = task;
    else tasks.push(task);
    localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
  },

  deleteTask: async (id: string): Promise<void> => {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) console.error("Supabase Delete Error (tasks):", error);
      return;
    }

    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, "tasks", id));
        return;
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `tasks/${id}`);
      }
    }
    const tasks = JSON.parse(localStorage.getItem(KEYS.TASKS) || '[]');
    const filtered = tasks.filter((t: Task) => t.id !== id);
    localStorage.setItem(KEYS.TASKS, JSON.stringify(filtered));
  },

  // --- USERS & TRANSACTIONS (MOCK / ADMIN) ---
  
  getUsers: async (): Promise<UserProfile[]> => {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('users').select('*');
      if (error) {
        console.error("Supabase Error (users):", error);
        return [];
      }
      return data as UserProfile[];
    }

    if (isFirebaseConfigured() && db) {
      try {
          const snapshot = await getDocs(collection(db, "users"));
          return snapshot.docs.map(doc => doc.data() as UserProfile);
      } catch (e) { 
        handleFirestoreError(e, OperationType.LIST, "users");
        return []; 
      }
    }
    const data = localStorage.getItem(KEYS.USERS_DB);
    return data ? JSON.parse(data) : [];
  },

  saveUser: async (user: UserProfile): Promise<void> => {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('users').upsert(user);
      if (error) console.error("Supabase Save Error (users):", error);
      return;
    }

    if (isFirebaseConfigured() && db && user.id) {
        try {
          await setDoc(doc(db, "users", user.id), user, { merge: true });
          return;
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `users/${user.id}`);
        }
    }
    const users = JSON.parse(localStorage.getItem(KEYS.USERS_DB) || '[]');
    const idx = users.findIndex((u: UserProfile) => u.email === user.email);
    if (idx >= 0) users[idx] = user;
    else users.push(user);
    localStorage.setItem(KEYS.USERS_DB, JSON.stringify(users));
  },

  deleteUser: async (email: string): Promise<void> => {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('users').delete().eq('email', email);
      if (error) console.error("Supabase Delete Error (users):", error);
      return;
    }

    // Firebase delete requires Admin SDK or Cloud Functions, frontend cannot delete Auth users easily.
    // Simulando apenas a remoção do profile
    const users = JSON.parse(localStorage.getItem(KEYS.USERS_DB) || '[]');
    const filtered = users.filter((u: UserProfile) => u.email !== email);
    localStorage.setItem(KEYS.USERS_DB, JSON.stringify(filtered));
  },

  getTransactions: async (): Promise<Transaction[]> => {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('transactions').select('*');
      if (error) {
        console.error("Supabase Error (transactions):", error);
        return [];
      }
      return data as Transaction[];
    }

     if (isFirebaseConfigured() && db) {
       try {
         const snapshot = await getDocs(collection(db, "transactions"));
         return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
       } catch (e) {
         handleFirestoreError(e, OperationType.LIST, "transactions");
         return [];
       }
     }
    const data = localStorage.getItem(KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  },

  saveTransaction: async (tx: Transaction): Promise<void> => {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('transactions').upsert(tx);
      if (error) console.error("Supabase Save Error (transactions):", error);
      return;
    }

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, "transactions", tx.id), tx, { merge: true });
        return;
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `transactions/${tx.id}`);
      }
    }
    const txs = JSON.parse(localStorage.getItem(KEYS.TRANSACTIONS) || '[]');
    const idx = txs.findIndex((t: Transaction) => t.id === tx.id);
    if (idx >= 0) txs[idx] = tx;
    else txs.push(tx);
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(txs));
  },

  // --- SYSTEM ---
  createBackup: (): string => {
    const backupData: Record<string, any> = {};
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('storm_')) {
            backupData[key] = JSON.parse(localStorage.getItem(key) || 'null');
        }
    });
    return JSON.stringify(backupData, null, 2);
  },

  restoreBackup: (jsonData: string): boolean => {
      try {
          const data = JSON.parse(jsonData);
          if (typeof data !== 'object') return false;

          Object.keys(data).forEach(key => {
              if (key.startsWith('storm_')) {
                  localStorage.setItem(key, JSON.stringify(data[key]));
              }
          });
          return true;
      } catch (e) {
          console.error("Backup Restore Failed", e);
          return false;
      }
  },

  fullReset: () => {
    localStorage.clear();
    window.location.reload();
  }
};
