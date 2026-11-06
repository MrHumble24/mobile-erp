export interface StorefrontStoreView {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
}

export interface StorefrontCategoryView {
  id: string;
  name: string;
}

export interface StorefrontDeliveryZoneView {
  id: string;
  name: string;
  fee: string;
  sortOrder: number;
  isActive?: boolean;
}

export type StorefrontConfigView =
  | { enabled: false }
  | {
      enabled: true;
      shopName: string;
      contactPhone: string | null;
      contactTelegram: string | null;
      showPrices: boolean;
      stores: StorefrontStoreView[];
      categories: StorefrontCategoryView[];
      pickupEnabled: boolean;
      deliveryEnabled: boolean;
      deliveryPricingMode: string;
      deliveryFlatFee: string | null;
      deliveryFreeFrom: string | null;
      deliveryNote: string | null;
      deliveryZones: StorefrontDeliveryZoneView[];
    };

export interface StorefrontProductCard {
  modelId: string;
  brand: string;
  name: string;
  categoryId: string | null;
  categoryName: string | null;
  imageUrl: string | null;
  priceFrom: string | null;
  inStock: number;
  stores: { id: string; name: string }[];
}

export interface StorefrontVariantStore {
  id: string;
  name: string;
  count: number;
}

export interface StorefrontVariant {
  specs: Record<string, unknown>;
  price: string | null;
  count: number;
  stores: StorefrontVariantStore[];
}

export interface StorefrontProductDetail extends StorefrontProductCard {
  variants: StorefrontVariant[];
}

export interface StorefrontSettingsView {
  enabled: boolean;
  showPrices: boolean;
  contactPhone: string | null;
  contactTelegram: string | null;
  categoryIds: string[];
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  deliveryPricingModeCode: string;
  deliveryFlatFee: string | null;
  deliveryFreeFrom: string | null;
  deliveryNote: string | null;
}

export interface PublicStorefrontOrderView {
  id: string;
  statusCode: string;
  statusLabel: string;
  fulfillmentMethod: string;
  productName: string;
  priceSnapshot: string | null;
  deliveryFeeSnapshot: string;
}

export interface StorefrontOrderListItem {
  id: string;
  storeId: string;
  storeName: string;
  modelId: string;
  brand: string;
  productName: string;
  modelName: string;
  specs: Record<string, unknown>;
  customerName: string;
  customerPhone: string;
  note: string | null;
  fulfillmentMethodCode: string;
  fulfillmentMethodLabel: string;
  address: string | null;
  deliveryZoneId: string | null;
  deliveryZoneName: string | null;
  paymentMethodCode: string;
  paymentMethodLabel: string;
  priceSnapshot: string | null;
  deliveryFeeSnapshot: string;
  deviceId: string | null;
  statusCode: string;
  statusLabel: string;
  handledAt: Date | null;
  handledByName: string | null;
  saleId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StorefrontOrderStatusHistoryView {
  id: string;
  fromStatusCode: string | null;
  toStatusCode: string;
  toStatusLabel: string;
  changedAt: Date;
  changedByName: string | null;
  note: string | null;
}

export interface StorefrontOrderDetail extends StorefrontOrderListItem {
  history: StorefrontOrderStatusHistoryView[];
}
