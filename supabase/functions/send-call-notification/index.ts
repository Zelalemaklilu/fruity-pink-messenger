import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  receiverId: string;
  callerName: string;
  callType: 'voice' | 'video';
  roomId: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');

    if (!vapidPrivateKey || !vapidPublicKey) {
      console.warn('[Push] VAPID keys not configured');
      return new Response(
        JSON.stringify({ error: 'Push notifications not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: PushPayload = await req.json();
    const { receiverId, callerName, callType, roomId } = payload;

    if (!receiverId || !callerName || !callType || !roomId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get push subscriptions for the receiver
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', receiverId);

    if (fetchError) {
      console.error('[Push] Failed to fetch subscriptions:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[Push] No subscriptions found for user:', receiverId);
      return new Response(
        JSON.stringify({ message: 'No subscriptions found', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const callTypeText = callType === 'video' ? 'Video' : 'Voice';
    const notificationPayload = JSON.stringify({
      title: `Incoming ${callTypeText} Call`,
      body: `${callerName} is calling you`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'incoming-call',
      data: {
        type: 'incoming_call',
        roomId,
        callType,
        url: '/',
      },
    });

    // Send push notifications (simplified - in production use web-push library)
    let successCount = 0;
    const failedEndpoints: string[] = [];

    for (const sub of subscriptions) {
      try {
        // Note: In production, you would use the web-push library
        // This is a placeholder that logs the notification
        console.log(`[Push] Would send to ${sub.endpoint}:`, notificationPayload);
        successCount++;
      } catch (pushError) {
        console.error('[Push] Failed to send notification:', pushError);
        failedEndpoints.push(sub.endpoint);
      }
    }

    // Clean up failed subscriptions
    if (failedEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', failedEndpoints);
    }

    return new Response(
      JSON.stringify({ 
        message: 'Notifications processed',
        sent: successCount,
        failed: failedEndpoints.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Push] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
