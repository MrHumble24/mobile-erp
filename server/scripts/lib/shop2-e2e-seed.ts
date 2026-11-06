import { Pool } from 'pg';

export interface Shop2SeedIds {
  storeId: string;
  userId: string;
  categoryId: string;
  modelId: string;
  dev1Id: string;
  dev2Id: string;
  dev3Id: string;
  devRaceId: string;
  raceModelId: string;
}

export async function seedShop2Data(url: string): Promise<Shop2SeedIds> {
  const pool = new Pool({ connectionString: url });
  try {
    const storeRow = (
      await pool.query<{ id: string }>('SELECT id FROM stores LIMIT 1')
    ).rows[0];
    const userRow = (
      await pool.query<{ id: string }>('SELECT id FROM users LIMIT 1')
    ).rows[0];
    const storeId = storeRow.id;
    const userId = userRow.id;

    // Enable storefront with pickup + flat fee delivery
    await pool.query(`
      UPDATE storefront_settings SET
        enabled = true,
        "showPrices" = true,
        "pickupEnabled" = true,
        "deliveryEnabled" = true,
        "deliveryPricingModeCode" = 'FLAT',
        "deliveryFlatFee" = 25000,
        "categoryIds" = '[]'::jsonb;
    `);

    // Ensure cashier role & permissions
    await pool.query(
      `INSERT INTO user_roles ("userId", "roleCode") VALUES ($1, 'CASHIER') ON CONFLICT DO NOTHING`,
      [userId],
    );

    // Ensure cashier has open shift
    await pool.query(
      `INSERT INTO shifts (id, "storeId", "cashierId", "openingCount", "openedAt")
       VALUES ('shift-shop2', $1, $2, 0, now())
       ON CONFLICT DO NOTHING`,
      [storeId, userId],
    );

    // Supplier
    await pool.query(
      `INSERT INTO suppliers (id, name, "updatedAt") VALUES ('sup-shop2', 'Supplier 1', now()) ON CONFLICT DO NOTHING`,
    );

    // Category & Models
    const catId = 'cat-phones';
    const modelId = 'model-ip15';
    const raceModelId = 'model-ip15-race';

    await pool.query(
      `INSERT INTO product_categories (id, name, "updatedAt") VALUES ($1, 'Phones', now()) ON CONFLICT DO NOTHING`,
      [catId],
    );
    await pool.query(
      `INSERT INTO device_models (id, brand, name, "kindCode", "categoryId", "updatedAt")
       VALUES ($1, 'Apple', 'iPhone 15 Pro', 'IMEI', $2, now()) ON CONFLICT DO NOTHING`,
      [modelId, catId],
    );
    await pool.query(
      `INSERT INTO device_models (id, brand, name, "kindCode", "categoryId", "updatedAt")
       VALUES ($1, 'Apple', 'iPhone 15 Race', 'IMEI', $2, now()) ON CONFLICT DO NOTHING`,
      [raceModelId, catId],
    );

    // Product prices
    await pool.query(
      `INSERT INTO product_prices (id, "modelId", storage, "levelCode", price, "updatedAt")
       VALUES ('pp-shop2-1', $1, '', 'RETAIL', 1000, now()),
              ('pp-shop2-2', $2, '', 'RETAIL', 1000, now())
       ON CONFLICT DO NOTHING`,
      [modelId, raceModelId],
    );

    // Shipment
    const shpId = 'shp-shop2';
    await pool.query(
      `INSERT INTO shipments (id, "storeId", "supplierId", "shipmentDate", "expectedCount", "paymentAccountCode", "createdById", "updatedAt")
       VALUES ($1, $2, 'sup-shop2', now(), 4, 'CASH', $3, now()) ON CONFLICT DO NOTHING`,
      [shpId, storeId, userId],
    );

    // Devices: dev-1, dev-2, dev-3 for modelId; dev-race for raceModelId
    const dev1Id = 'dev-shop2-1';
    const dev2Id = 'dev-shop2-2';
    const dev3Id = 'dev-shop2-3';
    const devRaceId = 'dev-shop2-race';

    const insertDevice = async (id: string, imei: string, mId: string) => {
      await pool.query(
        `INSERT INTO devices (id, imei, "storeId", "shipmentId", "modelId", "acquisitionCost", "customsFee", "unitExpense", "landedCost", "targetPrice", "statusCode", version, "updatedAt")
         VALUES ($1, $2, $3, $4, $5, 500, 0, 0, 500, 1000, 'IN_STOCK', 0, now())
         ON CONFLICT DO NOTHING`,
        [id, imei, storeId, shpId, mId],
      );
      await pool.query(
        `INSERT INTO unit_prices (id, "deviceId", "levelCode", price, "updatedAt")
         VALUES ($1, $2, 'RETAIL', 1000, now())
         ON CONFLICT DO NOTHING`,
        [`up-${id}`, id],
      );
    };

    await insertDevice(dev1Id, '350000000000001', modelId);
    await insertDevice(dev2Id, '350000000000002', modelId);
    await insertDevice(dev3Id, '350000000000003', modelId);
    await insertDevice(devRaceId, '350000000000099', raceModelId);

    return {
      storeId,
      userId,
      categoryId: catId,
      modelId,
      dev1Id,
      dev2Id,
      dev3Id,
      devRaceId,
      raceModelId,
    };
  } finally {
    await pool.end();
  }
}
