import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'
import { MercadoPagoConfig, Payment } from 'mercadopago'

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const dataId = searchParams.get('data.id');

  if (type === 'payment' && dataId) {
    const payment = new Payment(client);
    const p = await payment.get({ id: dataId });

    if (p.status === 'approved') {
      const userId = p.external_reference; // Aquí guardamos el ID del padre
      const supabaseAdmin = getSupabaseAdmin();

      // ACTUALIZAR ACCESO EN LA BASE DE DATOS
      await supabaseAdmin
        .from('profiles')
        .update({ 
          subscription_active: true,
          subscription_expiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
        })
        .eq('id', userId);
        
      console.log(`✅ Pago aprobado para el usuario: ${userId}`);
    }
  }

  return new Response('OK', { status: 200 });
}