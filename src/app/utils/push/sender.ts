import webpush from 'web-push'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'

// NO ponemos setVapidDetails aquí afuera

export async function sendPushNotification(profileId: string, title: string, body: string, url: string = '/dashboard') {
  // CONFIGURACIÓN DENTRO DE LA FUNCIÓN
  webpush.setVapidDetails(
    'mailto:info@kodatec.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const supabase = getSupabaseAdmin()

  // 1. Buscamos la suscripción del usuario en la DB
  const { data: pushData } = await supabase
    .from('push_subscriptions')
    .select('subscription_json')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (pushData?.subscription_json) {
    try {
      const payload = JSON.stringify({ title, body, url })
      // El JSON que devuelve el navegador ya es compatible con web-push
      const sub = pushData.subscription_json as any
      await webpush.sendNotification(sub, payload)
      console.log(`✅ Push enviada a: ${profileId}`)
    } catch (error) {
      console.error("❌ Error enviando Push:", error)
    }
  }
}