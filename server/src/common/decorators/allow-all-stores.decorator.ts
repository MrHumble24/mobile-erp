import { SetMetadata } from '@nestjs/common';

export const ALLOW_ALL_STORES_KEY = 'allow_all_stores';

/**
 * Marks a read-only endpoint as accepting `X-Store-Id: all` (ADR 0045).
 * A write endpoint or an endpoint without this decorator rejects `all` with 400.
 */
export const AllowAllStores = () => SetMetadata(ALLOW_ALL_STORES_KEY, true);
