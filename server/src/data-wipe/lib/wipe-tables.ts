/**
 * Table-group classification for the data wipe (ADR 0057).
 *
 * Every `@@map` table in the Prisma schema belongs to exactly ONE group here.
 * `wipe-tables.spec.ts` reads the schema and fails if any table is in no group
 * or in two — so a table added later must be classified before the build passes.
 *
 * Table names are compile-time string literals in THIS file and nowhere else:
 * nothing from a request ever names a table. The ALWAYS and CATALOG lists are in
 * FK-safe delete order (children before parents) so the erase runs in one
 * transaction with no `CASCADE` (a cascade could reach a KEPT table).
 */

/** Everything the shop did. Erased on every wipe. Children-before-parents. */
export const ALWAYS_TABLES = [
  // shop-page orders (handoff 022): they point at sales and products, so they go first
  'storefront_order_status_history',
  'storefront_orders',
  'cash_transactions',
  'bonus_transactions',
  'qc_defects',
  'qc_inspections',
  'warranties',
  'sale_returns',
  'customer_purchases',
  'credit_payments',
  'credit_instalments',
  'repair_parts',
  'repair_payments',
  'repair_status_history',
  'repairs',
  'device_status_history',
  'sync_conflicts',
  'unit_prices',
  'stock_movements',
  'stock_transfer_lines',
  'stock_transfers',
  'partner_payments',
  'sales',
  'consignments',
  'customer_credits',
  'expenses',
  'expense_recurrences',
  'shifts',
  'devices',
  'shipments',
] as const;

/** The people the shop deals with. Erased only when the owner ticks the box. */
export const CONTACTS_TABLES = ['customers', 'partners', 'suppliers'] as const;

/**
 * The product catalogue, its prices, customs lists, stock-alert rules and the
 * links from products to the reference lists. Erased only when the owner ticks
 * the box. Children-before-parents. `unit_prices` is NOT here: it is a per-unit
 * price tied to a device, so it dies with the device (ALWAYS).
 */
export const CATALOG_TABLES = [
  'stock_alert_rules',
  'ref_model_links',
  'product_prices',
  'customs_price_list_items',
  'customs_price_lists',
  'device_models',
  'product_categories',
] as const;

/**
 * Never erased: accounts, roles and permissions, branches, all settings, the
 * backup log + settings + provider config, secrets, the lists the system needs
 * to work (statuses, types, price levels, cash/card accounts, product kinds),
 * the user-managed expense-category list, the phone reference lists, and the
 * record of who erased what.
 */
export const KEPT_TABLES = [
  // identity, access, branches, settings
  'users',
  'user_profiles',
  'roles',
  'permissions',
  'role_permissions',
  'user_roles',
  'user_permissions',
  'session_gate',
  'user_stores',
  'stores',
  'store_settings',
  // backups + secrets
  'backup_run_statuses',
  'backup_target_statuses',
  'backup_providers',
  'backup_settings',
  'backup_runs',
  'backup_targets',
  'restore_runs',
  'backup_provider_configs',
  'backup_provider_statuses',
  'backup_oauth_states',
  'secrets',
  // phone reference lists (free public lists, not our inventory)
  'ref_apple_box_codes',
  'ref_imei_tacs',
  // lookups the system needs to work
  'device_statuses',
  'defect_types',
  'cosmetic_grades',
  'consignment_statuses',
  'stock_movement_types',
  'cash_accounts',
  'cash_transaction_types',
  'repair_statuses',
  'bonus_transaction_types',
  'product_kinds',
  'price_levels',
  // the shop page's own settings and its order statuses (handoff 022)
  'storefront_settings',
  'storefront_order_statuses',
  // user-managed list (configured once, like an account; seeded in seed.sql)
  'expense_categories',
  // the record of who erased what
  'data_wipe_runs',
] as const;

export interface WipeOptions {
  contacts: boolean;
  catalog: boolean;
}

/** The tables to erase, in FK-safe delete order, for the chosen options. */
export function tablesToErase(opts: WipeOptions): string[] {
  return [
    ...ALWAYS_TABLES,
    ...(opts.contacts ? CONTACTS_TABLES : []),
    ...(opts.catalog ? CATALOG_TABLES : []),
  ];
}

/** Every table named by any group (for the classification test). */
export const ALL_CLASSIFIED_TABLES: readonly string[] = [
  ...ALWAYS_TABLES,
  ...CONTACTS_TABLES,
  ...CATALOG_TABLES,
  ...KEPT_TABLES,
];
