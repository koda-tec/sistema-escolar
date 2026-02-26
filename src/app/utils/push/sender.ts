import webpush from 'web-push'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'

export async function sendPushNotification(profileId: string, title: string, body: string, url: string = '/dashboard') {
  console.log(`📡 SENDER: Configurando VAPID para enviar a ${profileId}`)
  
  webpush.setVapidDetails(
    'mailto:info@kodatec.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const supabase = getSupabaseAdmin()

  // 1. Buscamos la suscripción del usuario en la DB
  const { data: pushData, error } = await supabase
    .from('push_subscriptions')
    .select('subscription_json')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (error) {
    console.error("❌ SENDER: Error buscando suscripción en DB:", error.message)
    return
  }

  if (!pushData) {
    console.log(`⚠️ SENDER: El usuario ${profileId} no tiene ningún celular registrado para Push.`)
    return
  }

  console.log(`✅ SENDER: Suscripción encontrada. Enviando señal a Google/Apple...`)

  try {
    const payload = JSON.stringify({ title, body, url })
    await webpush.sendNotification(pushData.subscription_json as any, payload)
    console.log(`🚀 SENDER: Notificación Push enviada con éxito!`)
  } catch (error: any) {
    console.error("❌ SENDER: Falló el envío final a través del navegado:", error.message)
  }
}