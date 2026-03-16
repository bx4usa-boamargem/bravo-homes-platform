import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// PRD 4.3: Resposta Engine
// Integracao com Evolution API Webhook

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('--- Webhook Received from Evolution API ---');
    
    // Evolution API payload structure check
    // data.message.conversation ou data.message.extendedTextMessage.text
    const messageData = body.data?.message;
    const remoteJid = body.data?.key?.remoteJid || '';
    const senderNumber = remoteJid.split('@')[0];
    
    const messageText = (
      messageData?.conversation || 
      messageData?.extendedTextMessage?.text || 
      ''
    ).toLowerCase().trim();

    if (!senderNumber || !messageText) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    console.log(`De: ${senderNumber} | Mensagem: ${messageText}`);

    // 1. Identificar Empresa pelo Numero de WhatsApp
    const { data: numeroData, error: numeroError } = await supabase
      .from('whatsapp_numeros')
      .select('empresa_id')
      .eq('numero', senderNumber)
      .eq('ativo', true)
      .single();

    if (numeroError || !numeroData) {
      console.warn(`Numero ${senderNumber} nao encontrado ou inativo.`);
      return NextResponse.json({ error: 'Number not registered' }, { status: 404 });
    }

    const { empresa_id } = numeroData;

    // 2. Traduzir intent
    let status_participacao: string | null = null;
    if (messageText.includes('participar') || messageText.includes('quero')) {
      status_participacao = 'participando';
    } else if (messageText.includes('ganhei') || messageText.includes('venci')) {
      status_participacao = 'ganhou';
    } else if (messageText.includes('perdi')) {
      status_participacao = 'perdeu';
    } else if (messageText.includes('nao quis') || messageText.includes('pular') || messageText.includes('ignorar')) {
      status_participacao = 'nao_participou';
    }

    if (!status_participacao) {
      console.log('Intencao nao identificada.');
      return NextResponse.json({ status: 'ignored', reason: 'no_keyword_match' });
    }

    // 3. Atualizar o ULTIMO log de disparo para esta empresa/numero
    // Geralmente o cliente responde ao alerta mais recente.
    const { data: lastLog, error: logError } = await supabase
      .from('logs_disparo')
      .select('id, id_licitacao_gov')
      .eq('empresa_id', empresa_id)
      .eq('numero_whatsapp', senderNumber)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (logError || !lastLog) {
      return NextResponse.json({ error: 'No recent alerts found' }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from('logs_disparo')
      .update({ status_participacao })
      .eq('id', lastLog.id);

    if (updateError) {
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    return NextResponse.json({ 
      status: 'success', 
      updated_log: lastLog.id, 
      intent: status_participacao 
    });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
