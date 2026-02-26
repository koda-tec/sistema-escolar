import webpush from 'web-push'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'

export async function sendPushNotification(profileId: string, title: string, body: string, url: string = '/dashboard') {
  console.log(`📡 SENDER: Configurando VAPID para enviar a ${profileId}`)
  
  // 1. Configuración de llaves (Dentro de la función para evitar error de Build)
  webpush.setVapidDetails(
    'mailto:info@kodatec.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const supabase = getSupabaseAdmin()

  // 2. Buscamos la suscripción del usuario en la DB
  const { data: pushData, error } = await supabase
    .from('push_subscriptions')
    .select('subscription_json')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (error) {
    console.error("❌ SENDER: Error buscando suscripción en DB:", error.message)
    return
  }

  if (!pushData || !pushData.subscription_json) {
    console.log(`⚠️ SENDER: El usuario ${profileId} no tiene ningún dispositivo registrado.`)
    return
  }

  console.log(`✅ SENDER: Suscripción encontrada. Preparando envío...`)

  try {
    // 3. Preparamos el mensaje (Payload)
    const payload = JSON.stringify({ 
      title: title, 
      body: body, 
      url: url 
    })

    // 4. ENVÍO FINAL
    // Aquí usamos pushData.subscription_json directamente
    const sub = pushData.subscription_json as any;
    
    await webpush.sendNotification(sub, payload)
    
    console.log(`🚀 SENDER: Notificación Push enviada con éxito!`)
  } catch (error: any) {
    console.error("❌ SENDER: Falló el envío a través del servidor del navegador:", error.message)
    
    // Si el error es 410 (Gone) o 404 (Not Found), el token ya no sirve
    if (error.statusCode === 410 || error.statusCode === 404) {
        console.log("🧹 Borrando suscripción obsoleta...");
        await supabase.from('push_subscriptions').delete().eq('profile_id', profileId);
    }
  }
}