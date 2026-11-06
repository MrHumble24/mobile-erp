# Stock Transfers Module

Inter-branch inventory transfer documents (Change 9, ADR 0045).

## Responsibilities
- Track transfers between stores (`SENT`, `RECEIVED`, `CANCELLED`).
- Transfer IMEI/SERIAL units (status `IN_TRANSIT` with audit history).
- Transfer QUANTITY accessories (`TRANSFER_OUT` and `TRANSFER_IN` with frozen moving-average cost).
- Cancellation reverts goods to source store. No money movement.
- Enforce that in-transit units cannot be sold, consigned, or re-transferred.
