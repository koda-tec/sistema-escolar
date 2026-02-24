import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'
import { MercadoPagoConfig, Payment } from 'mercadopago'

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    
    // Mercado Pago envía 'type' y 'data.id' o 'topic' e 'id'
    const type = url.searchParams.get('type') || url.searchParams.get('topic');
    const dataId = url.searchParams.get('data.id') || url.searchParams.get('id');

    if (type === 'payment' && dataId) {
      const payment = new Payment(client);
      const p = await payment.get({ id: dataId });

      if (p.status === 'approved') {
        const userId = p.external_reference; // Recuperamos el UUID del padre
        const supabaseAdmin = getSupabaseAdmin();

        // 1. Actualizamos la suscripción
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ 
            subscription_active: true,
            subscription_expiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
          })
          .eq('id', userId);

        if (error) {
          console.error('Error actualizando perfil en Webhook:', error.message);
        } else {
          console.log(`✅ ¡Pago exitoso! Usuario ${userId} activado.`);
        }
      }
    }

    // SIEMPRE responder 200 a Mercado Pago para que no re-envíe la notificación
    return new Response('OK', { status: 200 });

  } catch (error: any) {
    console.error('Webhook Error:', error.message);
    // Respondemos 200 igual para que MP deje de intentar si hay un error de código
    return new Response('Error Interno', { status: 200 });
  }
}