# Storefront Order Feature

Modal dialog and form enabling customers to place orders on the public storefront.

## Capabilities
- Gathers customer name, phone, chosen branch, and optional note.
- Restricts branch selection to branches holding stock for the selected variant.
- Implements bot honeypot field (`hp`) silently accepted and dropped by server.
- Shows clear error messages for out-of-stock and rate-limiting responses.
- Shows pickup shop contact phone upon successful submission.
