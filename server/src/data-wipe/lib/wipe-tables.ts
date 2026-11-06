/**
 * Table-group classification for the data wipe and factory reset (ADR 0057, 0061).
 *
 * Every `@@map` table in the Prisma schema belongs to exactly ONE group here:
 *   - Plain erase: ALWAYS, plus opt-in CONTACTS and CATALOG. KEPT is untouched.
 *   - Factory reset: ALWAYS, CONTACTS, CATALOG and RESET_ERASED_KEPT.
 *     NEVER_ERASED tables are untouched (except older backup runs outside the
 *     safety backup).
 *
 * `wipe-tables.spec.ts` reads the schema and fails if any table is unclassified,
 * double-classified, or if any KEPT table lacks a reset label.
 *
 * Table names are compile-time string literals in THIS file and nowhere else:
 * nothing from a request ever names a table. The lists are in FK-safe delete
 * order (children before parents) so the erase runs in one transaction with no
 * CASCADE (a cascade could reach a kept table).
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
 * Kept during a plain data wipe, but ERASED by a factory reset (returns system
 * to first-boot setup wizard). Children-before-parents.
 */
export const RESET_ERASED_KEPT_TABLES = [
  'session_gate',
  'user_roles',
  'user_permissions',
  'user_stores',
  'user_profiles',
  'users',
  'store_settings',
  'stores',
  'company_profiles',
  'restore_runs',
  'backup_targets',
  'backup_provider_configs',
  'backup_oauth_states',
  'backup_settings',
  'secrets',
  'storefront_settings',
] as const;

/**
 * NEVER erased by any operation: roles, permissions, system lookups, reference
 * lists, and the two exceptions from the Decided table (safety backup run in
 * backup_runs, and reset record in data_wipe_runs).
 */
export const NEVER_ERASED_TABLES = [
  // access control & roles (seeded in seed.sql)
  'roles',
  'permissions',
  'role_permissions',
  // themes
  'themes',
  // backup lookups
  'backup_run_statuses',
  'backup_target_statuses',
  'backup_providers',
  'backup_provider_statuses',
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
  'storefront_order_statuses',
  // user-managed list seeded in seed.sql
  'expense_categories',
  // Exception 1: safety backup run row
  'backup_runs',
  // Exception 2: reset audit run row
  'data_wipe_runs',
] as const;

/**
 * Kept during a plain data wipe (ADR 0057).
 * Combined from RESET_ERASED_KEPT_TABLES and NEVER_ERASED_TABLES.
 */
export const KEPT_TABLES = [
  ...RESET_ERASED_KEPT_TABLES,
  ...NEVER_ERASED_TABLES,
] as const;

/** All tables completely deleted by a factory reset, in FK-safe order. */
export const RESET_TABLES = [
  ...ALWAYS_TABLES,
  ...CONTACTS_TABLES,
  ...CATALOG_TABLES,
  ...RESET_ERASED_KEPT_TABLES,
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

/** All tables completely deleted by a factory reset, in FK-safe order. */
export function tablesToReset(): string[] {
  return [...RESET_TABLES];
}

/** Every table named by any group (for the classification test). */
export const ALL_CLASSIFIED_TABLES: readonly string[] = [
  ...ALWAYS_TABLES,
  ...CONTACTS_TABLES,
  ...CATALOG_TABLES,
  ...KEPT_TABLES,
];
