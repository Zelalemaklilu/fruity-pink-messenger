import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const TERMS_VERSION = '1.0.0';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { device_hash, user_agent } = await req.json();

    // Get client IP from headers
    const ip_address = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                       req.headers.get('x-real-ip') || 
                       'unknown';

    // Use service role for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if wallet already exists
    const { data: existingWallet } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingWallet?.status === 'active') {
      return new Response(
        JSON.stringify({ success: true, message: 'Wallet already activated', wallet: existingWallet }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Start transaction - Record terms acceptance
    const { error: termsError } = await supabaseAdmin
      .from('wallet_terms_acceptance')
      .insert({
        user_id: user.id,
        terms_version: TERMS_VERSION,
        ip_address,
        device_hash: device_hash || null,
        user_agent: user_agent || null,
      });

    if (termsError) {
      console.error('Terms acceptance error:', termsError);
      return new Response(
        JSON.stringify({ error: 'Failed to record terms acceptance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create or update wallet
    let wallet;
    if (existingWallet) {
      const { data, error } = await supabaseAdmin
        .from('wallets')
        .update({
          status: 'active',
          terms_accepted_at: new Date().toISOString(),
          terms_version: TERMS_VERSION,
        })
        .eq('id', existingWallet.id)
        .select()
        .single();
      
      if (error) throw error;
      wallet = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('wallets')
        .insert({
          user_id: user.id,
          status: 'active',
          terms_accepted_at: new Date().toISOString(),
          terms_version: TERMS_VERSION,
        })
        .select()
        .single();
      
      if (error) throw error;
      wallet = data;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Wallet activated successfully',
        wallet: {
          id: wallet.id,
          status: wallet.status,
          currency: wallet.currency,
          balance: 0,
          terms_accepted_at: wallet.terms_accepted_at,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Wallet activation error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
