import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { createClient } from '@/app/utils/supabase/server'

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });

// CRÍTICO: Evita que Next intente pre-renderizar esto en el build
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: 'ciclo-2026',
            title: 'KodaEd - Abono Anual Ciclo Lectivo 2026',
            quantity: 1,
            unit_price: 30000,
            currency_id: 'ARS'
          }
        ],
        payer: {
          email: 'test_user_123@testuser.com',
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?status=success`,
          failure: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?status=failure`,
          pending: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?status=pending`,
        },
        auto_return: 'approved',
        external_reference: user.id, // ID del padre para el Webhook
        // IMPORTANTE: Mercado Pago exige HTTPS para la notificación
        notification_url: 'https://sistema-escolar-dusky.vercel.app/api/webhooks/mercadopago', 
      }
    });

    // Devolvemos el init_point que es la URL de la ventana de pago
    return NextResponse.json({ id: result.id, init_point: result.init_point });

  } catch (error: any) {
    console.error("Error Checkout MP:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}