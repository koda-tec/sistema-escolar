import webpush from 'web-push'
import { getSupabaseAdmin } from '@/app/utils/supabase/admin'

webpush.setVapidDetails(
  'mailto:info@kodatec.app',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function sendPushNotification(profileId: string, title: string, body: string, url: string = '/dashboard') {
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
      await webpush.sendNotification(pushData.subscription_json, payload)
      console.log(`✅ Push enviada a: ${profileId}`)
    } catch (error) {
      console.error("❌ Error enviando Push:", error)
      // Si el token expiró o es inválido, podrías borrarlo aquí
    }
  }
}