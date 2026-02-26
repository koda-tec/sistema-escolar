import webpush from 'web-push'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'

/**
 * Función maestra para enviar notificaciones Push a un usuario específico.
 */
export async function sendPushNotification(
  profileId: string, 
  title: string, 
  body: string, 
  url: string = '/dashboard'
) {
  console.log(`📡 SENDER: Iniciando proceso para el usuario ${profileId}`);

  // 1. Configuración de llaves VAPID (Dentro de la función para que no falle el Build de Vercel)
  try {
    webpush.setVapidDetails(
      'mailto:info@kodatec.app',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );
  } catch (err) {
    console.error("❌ SENDER: Error configurando VAPID Keys. Verificá las variables de entorno.");
    return;
  }

  const supabase = getSupabaseAdmin();

  // 2. Buscamos el token de suscripción del usuario en la base de datos
  const { data: pushData, error: dbError } = await supabase
    .from('push_subscriptions')
    .select('subscription_json')
    .eq('profile_id', profileId)
    .maybeSingle();

  if (dbError) {
    console.error("❌ SENDER: Error al consultar Supabase:", dbError.message);
    return;
  }

  if (!pushData || !pushData.subscription_json) {
    console.log(`⚠️ SENDER: El usuario ${profileId} no tiene dispositivos registrados para Push.`);
    return;
  }

  console.log(`✅ SENDER: Token encontrado. Preparando señal de envío...`);

  try {
    // 3. Preparamos el mensaje en formato STRING JSON (Vital para que Android lo lea bien)
    const payload = JSON.stringify({
      title: title,
      body: body,
      url: url
    });

    // 4. Recuperamos el objeto de suscripción que guardó el navegador
    const subscription = pushData.subscription_json as any;

    // 5. ENVÍO FINAL
    await webpush.sendNotification(subscription, payload);
    
    console.log(`🚀 SENDER: ¡Notificación Push enviada con éxito!`);

  } catch (error: any) {
    console.error("❌ SENDER: Falló el envío a través del servidor del navegador.");
    console.error("Detalle del error:", error.message);

    // 6. LIMPIEZA AUTOMÁTICA (Self-healing)
    // Si el error es 410 (Gone) o 404 (Not Found), significa que el usuario
    // desinstaló la app o el token expiró. Borramos el registro para no gastar recursos.
    if (error.statusCode === 410 || error.statusCode === 404) {
        console.log(`🧹 Borrando suscripción obsoleta de ${profileId} (Error ${error.statusCode})`);
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('profile_id', profileId);
    }
  }
}