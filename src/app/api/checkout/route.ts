import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { createClient } from '@/app/utils/supabase/server'

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });

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
            unit_price: 30000, // Tu precio definido
            currency_id: 'ARS'
          }
        ],
        payer: {
          email: user.email,
        },
        // Donde vuelve el usuario después de pagar
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?status=success`,
          failure: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?status=failure`,
        },
        auto_return: 'approved',
        // El ID de usuario para saber a quién desbloquear luego
        external_reference: user.id, 
        // Esta es la URL que Mercado Pago llamará por "atrás"
        notification_url: 'https://sistema-escolar-dusky.vercel.app/api/webhooks/mercadopago', 
      }
    });

    return NextResponse.json({ id: result.id, init_point: result.init_point });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}