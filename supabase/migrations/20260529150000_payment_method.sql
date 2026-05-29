-- Add payment_method column to installment_logs
ALTER TABLE installment_logs ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'Cash';
ALTER TABLE installment_logs ADD COLUMN IF NOT EXISTS payment_date_input date;