-- Fix search_path for prevent_transaction_modification function
CREATE OR REPLACE FUNCTION public.prevent_transaction_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Wallet transactions are immutable and cannot be modified or deleted';
END;
$$;