import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { Resend } from 'resend'

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  console.log("--- 📥 NUEVO WEBHOOK DE MERCADO PAGO ---");

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || url.searchParams.get('topic');
    const dataId = url.searchParams.get('data.id') || url.searchParams.get('id');

    if (type === 'payment' && dataId) {
      const payment = new Payment(client);
      const p = await payment.get({ id: dataId });

      console.log(`🔍 Estado del pago ${dataId}: ${p.status}`);

      if (p.status === 'approved') {
        const userId = p.external_reference; 
        console.log(`👤 ID de Usuario recuperado: ${userId}`);

        const supabaseAdmin = getSupabaseAdmin();

        // 1. ACTUALIZAR BASE DE DATOS (Lo que ya funcionaba)
        const { data: profile, error: dbError } = await supabaseAdmin
          .from('profiles')
          .update({ 
            subscription_active: true,
            subscription_expiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
          })
          .eq('id', userId)
          .select('email, full_name')
          .single();

        if (dbError) {
          console.error("❌ Error Supabase al actualizar pago:", dbError.message);
          throw dbError;
        }

        console.log(`✅ DB Actualizada. Intentando enviar mail a: ${profile?.email}`);

        // 2. ENVIAR MAIL DE CONFIRMACIÓN
        if (profile?.email) {
          try {
            const emailRes = await resend.emails.send({
              from: 'KodaEd <pagos@kodatec.app>',
              to: [profile.email],
              subject: '✅ Acceso KodaEd Activado - ¡Bienvenido!',
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 20px; overflow: hidden; background-color: #ffffff;">
                  <div style="background-color: #10b981; padding: 40px 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 26px;">¡Todo listo!</h1>
                  </div>
                  <div style="padding: 40px; color: #1e293b;">
                    <p style="font-size: 18px;">Hola <strong>${profile.full_name}</strong>,</p>
                    <p>Tu pago de <strong>$30.000</strong> ha sido procesado con éxito.</p>
                    <p>Ya tenés acceso total a las inasistencias y libretas por todo el ciclo lectivo.</p>
                    <div style="text-align: center; margin-top: 35px;">
                      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="background-color: #0f172a; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">
                        Entrar al Panel
                      </a>
                    </div>
                  </div>
                </div>
              `
            });

            if (emailRes.error) {
              console.error("❌ Error de Resend dentro del Webhook:", emailRes.error);
            } else {
              console.log("📧 Mail enviado con éxito:", emailRes.data?.id);
            }

          } catch (errMail: any) {
            console.error("❌ Falló la ejecución de Resend:", errMail.message);
          }
        } else {
          console.warn("⚠️ El perfil no tiene email registrado, no se mandó la notificación.");
        }
      }
    }

    return new Response('OK', { status: 200 });

  } catch (error: any) {
    console.error('❌ Error General Webhook:', error.message);
    return new Response('Error', { status: 200 }); // Respondemos 200 para que MP no reintente fallos de lógica
  }
}