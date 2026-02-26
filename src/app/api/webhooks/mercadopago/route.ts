// src/app/api/webhooks/mercadopago/route.ts

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { Resend } from 'resend' // Agregamos Resend

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
const resend = new Resend(process.env.RESEND_API_KEY);

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || url.searchParams.get('topic');
    const dataId = url.searchParams.get('data.id') || url.searchParams.get('id');

    if (type === 'payment' && dataId) {
      const payment = new Payment(client);
      const p = await payment.get({ id: dataId });

      if (p.status === 'approved') {
        const userId = p.external_reference; 
        const supabaseAdmin = getSupabaseAdmin();

        // 1. Actualizamos la suscripción en la DB
        const { data: profile, error } = await supabaseAdmin
          .from('profiles')
          .update({ 
            subscription_active: true,
            subscription_expiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
          })
          .eq('id', userId)
          .select('email, full_name') // Traemos los datos para el mail
          .single();

        if (!error && profile?.email) {
          // 2. ENVIAMOS MAIL DE CONFIRMACIÓN DE PAGO
          await resend.emails.send({
            from: 'KodaEd <pagos@kodatec.app>',
            to: [profile.email],
            subject: '✅ Pago Confirmado - Acceso KodaEd Activado',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; background-color: #ffffff;">
                <div style="background-color: #10b981; padding: 40px 20px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 26px;">¡Todo listo!</h1>
                  <p style="color: #d1fae5; font-size: 14px; margin-top: 10px;">Tu pago ha sido procesado con éxito</p>
                </div>
                <div style="padding: 40px; color: #1e293b; line-height: 1.6;">
                  <p style="font-size: 18px;">Hola <strong>${profile.full_name}</strong>,</p>
                  <p>Gracias por activar el acceso a la plataforma <strong>KodaEd</strong> para el ciclo lectivo actual.</p>
                  
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 25px; margin: 25px 0; text-align: center;">
                    <p style="margin: 0; color: #64748b; font-size: 11px; font-weight: bold; text-transform: uppercase;">Monto abonado</p>
                    <p style="margin: 10px 0; font-size: 24px; font-weight: 800; color: #1e293b;">$30.000,00</p>
                    <p style="margin: 0; font-size: 12px; color: #10b981; font-weight: bold;">Acceso Full habilitado hasta ${new Date().getFullYear() + 1}</p>
                  </div>

                  <p>Ya podés ingresar a la App para ver el seguimiento de tus hijos, recibir notificaciones de inasistencia y descargar libretas.</p>

                  <div style="text-align: center; margin-top: 35px;">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="background-color: #0f172a; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">
                      Ir al Panel de Familia
                    </a>
                  </div>
                </div>
              </div>
            `
          });
          console.log(`✅ Pago y mail confirmados para: ${userId}`);
        }
      }
    }

    return new Response('OK', { status: 200 });

  } catch (error: any) {
    console.error('Webhook Error:', error.message);
    return new Response('Error Interno', { status: 200 });
  }
}