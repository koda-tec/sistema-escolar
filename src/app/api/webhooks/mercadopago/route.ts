import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { Resend } from 'resend'
import { sendPushNotification } from '@/app/utils/push/sender'

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  console.log("--- 📥 WEBHOOK MERCADO PAGO RECIBIDO ---");

  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || url.searchParams.get('topic');
    const dataId = url.searchParams.get('data.id') || url.searchParams.get('id');

    if (type === 'payment' && dataId) {
      const payment = new Payment(client);
      const p = await payment.get({ id: dataId });

      if (p.status === 'approved') {
        // 1. Extraemos el ID del usuario de la referencia externa
        const userId = p.external_reference; 
        
        if (!userId) {
          console.error("❌ Webhook: El pago no tiene external_reference (userId)");
          return new Response('Sin referencia de usuario', { status: 200 });
        }

        const supabaseAdmin = getSupabaseAdmin();
        const resend = new Resend(process.env.RESEND_API_KEY);

        // 2. ACTUALIZAR BASE DE DATOS
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
          console.error("❌ Error Supabase al activar suscripción:", dbError.message);
          throw dbError;
        }

        console.log(`✅ Usuario ${userId} activado en DB.`);

        // 3. ENVIAR EMAIL DE CONFIRMACIÓN (Resend)
        if (profile?.email) {
          try {
            await resend.emails.send({
              from: 'KodaEd <pagos@kodatec.app>',
              to: [profile.email],
              subject: '✅ Acceso KodaEd Activado - ¡Bienvenido!',
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 20px; overflow: hidden; background-color: #ffffff;">
                  <div style="background-color: #10b981; padding: 40px 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 26px;">¡Pago Exitoso!</h1>
                  </div>
                  <div style="padding: 40px; color: #1e293b;">
                    <p style="font-size: 18px;">Hola <strong>${profile.full_name}</strong>,</p>
                    <p>Tu abono anual de <strong>$30.000</strong> ha sido procesado correctamente.</p>
                    <p>Ya puedes acceder a todas las funciones de KodaEd por el resto del ciclo lectivo.</p>
                    <div style="text-align: center; margin-top: 35px;">
                      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="background-color: #0f172a; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">
                        Entrar al Panel
                      </a>
                    </div>
                  </div>
                </div>
              `
            });
            console.log("📧 Email de confirmación enviado.");
          } catch (e) {
            console.error("❌ Falló el envío de Email:", e);
          }
        }

        // 4. ENVIAR NOTIFICACIÓN PUSH (Vibración en celular)
        try {
          await sendPushNotification(
            userId,
            "✅ ¡Acceso Activado!",
            "Tu pago fue procesado con éxito. Ya podés ver todo el contenido.",
            "/dashboard"
          );
          console.log("🚀 Notificación Push enviada.");
        } catch (e) {
          console.error("❌ Falló el envío de la Push:", e);
        }
      }
    }

    // Mercado Pago requiere que siempre respondamos 200
    return new Response('OK', { status: 200 });

  } catch (error: any) {
    console.error('❌ Error crítico en Webhook:', error.message);
    return new Response('Error Interno', { status: 200 }); 
  }
}