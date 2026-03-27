import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

declare const Deno: any;

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  const hoje = new Date().toISOString()

  // Leads com teste expirado (data_fim_teste < hoje)
  const { data: expired, error } = await supabase
    .from('leads')
    .update({ status: 'Expirado' })
    .eq('status', 'Em Teste')
    .lt('data_fim_teste', hoje)
    .select()

  if (error) return new Response(JSON.stringify({ error }), { status: 500 })

  // Notificar usuários
  for (const lead of expired || []) {
    await supabase.from('notificacoes').insert({
      user_id: lead.user_id,
      tipo: 'lead_expirado',
      titulo: `Teste expirado: ${lead.nome}`,
      mensagem: 'O período de teste acabou. Entre em contato para tentar converter em venda!',
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