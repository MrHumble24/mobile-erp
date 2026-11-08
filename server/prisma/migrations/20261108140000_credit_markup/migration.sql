-- Change 0068: one disclosed, fixed Murabaha margin on a customer credit.
-- Default 0 keeps every existing credit an interest-free instalment sale.
-- The server folds the margin into the credit's Sale.salePrice rows, so the
-- derived agreed total, returns and the credit-limit gate need no change.
ALTER TABLE "customer_credits"
  ADD COLUMN "markupAmount" DECIMAL(14,2) NOT NULL DEFAULT 0;
