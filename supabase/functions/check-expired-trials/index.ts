import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

declare const Deno: any;

serve(async (req) => {
  // Inicializar Supabase Admin
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Atualizar trials expirados
  const { data: expired, error } = await supabase
    .from('profiles')
    .update({ status: 'expired' })
    .eq('status', 'trial')
    .lt('trial_ends_at', new Date().toISOString())
    .select()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  // Criar notificação para cada usuário expirado
  for (const user of expired || []) {
    await supabase.from('notificacoes').insert({
      user_id: user.id,
      tipo: 'trial_expirado',
      titulo: 'Seu período de teste terminou',
      mensagem: 'Assine agora para continuar usando o Storm CRM!',
      lida: false
    })
  }

  return new Response(JSON.stringify({ 
    success: true, 
    expired_count: expired?.length || 0 
  }), { 
    headers: { 'Content-Type': 'application/json' } 
  })
})