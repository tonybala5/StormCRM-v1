import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

declare const Deno: any;

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  const hoje = new Date().toISOString().split('T')[0]
  const em7dias = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]

  // Buscar clientes que vencem nos próximos 7 dias
  const { data: vencendo, error } = await supabase
    .from('clientes')
    .select('id, nome, proximo_vencimento, user_id')
    .gte('proximo_vencimento', hoje)
    .lte('proximo_vencimento', em7dias)
    .eq('status', 'Ativo')

  if (error) return new Response(JSON.stringify({ error }), { status: 500 })

  // Agrupar por usuário (dono da conta)
  const porUsuario: Record<string, any[]> = {}
  for (const cliente of vencendo || []) {
    if (!porUsuario[cliente.user_id]) {
      porUsuario[cliente.user_id] = []
    }
    porUsuario[cliente.user_id].push(cliente)
  }

  // Criar notificação consolidada por usuário
  let notificacoesEnviadas = 0;
  for (const [userId, clientes] of Object.entries(porUsuario)) {
    const count = clientes.length;
    await supabase.from('notificacoes').insert({
      user_id: userId,
      tipo: 'vencimentos',
      titulo: `${count} cliente(s) vencem em breve`,
      mensagem: `Verifique os vencimentos de ${clientes[0].nome} e outros para os próximos 7 dias.`,
      lida: false
    });
    notificacoesEnviadas++;
  }

  return new Response(JSON.stringify({ success: true, notifications: notificacoesEnviadas }), {
    headers: { 'Content-Type': 'application/json' }
  })
})