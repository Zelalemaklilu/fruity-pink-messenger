-- =============================================
-- PRODUCTION WALLET SYSTEM - LEDGER-BASED
-- =============================================

-- 1. Create wallet status enum
CREATE TYPE public.wallet_status AS ENUM ('active', 'suspended', 'pending_activation');

-- 2. Create transaction type enum
CREATE TYPE public.wallet_transaction_type AS ENUM (
  'deposit',      -- Adding money to wallet
  'withdrawal',   -- Removing money from wallet
  'transfer_in',  -- Received from another user
  'transfer_out', -- Sent to another user
  'adjustment'    -- Admin adjustment (credit/debit)
);

-- 3. Create transaction status enum
CREATE TYPE public.wallet_transaction_status AS ENUM (
  'pending',
  'completed',
  'failed',
  'reversed'
);

-- 4. Create wallets table
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status wallet_status NOT NULL DEFAULT 'pending_activation',
  currency TEXT NOT NULL DEFAULT 'ETB',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  terms_accepted_at TIMESTAMP WITH TIME ZONE,
  terms_version TEXT,
  CONSTRAINT valid_currency CHECK (currency IN ('ETB', 'USD', 'EUR'))
);

-- 5. Create wallet_transactions table (immutable ledger)
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
  idempotency_key TEXT UNIQUE, -- Prevents duplicate transactions
  transaction_type wallet_transaction_type NOT NULL,
  status wallet_transaction_status NOT NULL DEFAULT 'completed',
  amount DECIMAL(18, 2) NOT NULL,
  balance_before DECIMAL(18, 2) NOT NULL,
  balance_after DECIMAL(18, 2) NOT NULL,
  reference_id UUID, -- Links transfer pairs
  counterparty_wallet_id UUID REFERENCES public.wallets(id),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT valid_balance CHECK (balance_after >= 0)
);

-- 6. Create wallet_terms_acceptance table (audit trail)
CREATE TABLE public.wallet_terms_acceptance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  terms_version TEXT NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  device_hash TEXT,
  user_agent TEXT
);

-- 7. Create index for fast balance lookups
CREATE INDEX idx_wallet_transactions_wallet_id ON public.wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);
CREATE INDEX idx_wallet_transactions_idempotency ON public.wallet_transactions(idempotency_key);
CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);

-- 8. Enable RLS on all tables
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_terms_acceptance ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies for wallets
CREATE POLICY "Users can view their own wallet"
  ON public.wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet"
  ON public.wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet status only via functions"
  ON public.wallets FOR UPDATE
  USING (auth.uid() = user_id);

-- 10. RLS Policies for wallet_transactions (READ ONLY for users)
CREATE POLICY "Users can view their own transactions"
  ON public.wallet_transactions FOR SELECT
  USING (
    wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid())
  );

-- NO INSERT/UPDATE/DELETE policies for users - only via server functions

-- 11. RLS Policies for wallet_terms_acceptance
CREATE POLICY "Users can view their own terms acceptance"
  ON public.wallet_terms_acceptance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own terms acceptance"
  ON public.wallet_terms_acceptance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 12. Function to compute wallet balance from transactions
CREATE OR REPLACE FUNCTION public.get_wallet_balance(p_wallet_id UUID)
RETURNS DECIMAL(18, 2)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance DECIMAL(18, 2);
BEGIN
  SELECT COALESCE(
    (SELECT balance_after 
     FROM public.wallet_transactions 
     WHERE wallet_id = p_wallet_id 
       AND status = 'completed'
     ORDER BY created_at DESC 
     LIMIT 1),
    0.00
  ) INTO v_balance;
  
  RETURN v_balance;
END;
$$;

-- 13. Function to check if user has accepted terms
CREATE OR REPLACE FUNCTION public.has_accepted_wallet_terms(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.wallets 
    WHERE user_id = p_user_id 
      AND status = 'active'
      AND terms_accepted_at IS NOT NULL
  );
$$;

-- 14. Function to get user's wallet
CREATE OR REPLACE FUNCTION public.get_user_wallet(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  status wallet_status,
  currency TEXT,
  balance DECIMAL(18, 2),
  terms_accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security check
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Can only access own wallet';
  END IF;

  RETURN QUERY
  SELECT 
    w.id,
    w.user_id,
    w.status,
    w.currency,
    public.get_wallet_balance(w.id) as balance,
    w.terms_accepted_at,
    w.created_at
  FROM public.wallets w
  WHERE w.user_id = p_user_id;
END;
$$;

-- 15. Trigger to update wallets.updated_at
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 16. Prevent direct modifications to wallet_transactions (immutable ledger)
CREATE OR REPLACE FUNCTION public.prevent_transaction_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Wallet transactions are immutable and cannot be modified or deleted';
END;
$$;

CREATE TRIGGER prevent_wallet_transaction_update
  BEFORE UPDATE ON public.wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_transaction_modification();

CREATE TRIGGER prevent_wallet_transaction_delete
  BEFORE DELETE ON public.wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_transaction_modification();