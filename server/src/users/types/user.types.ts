import { UserProfileView } from '../../auth/types/auth.types.js';

/** User projection returned to clients. Never carries passwordHash. */
export interface UserView {
  id: string;
  email: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  profile: UserProfileView | null;
  roles: string[];
  stores: { id: string; name: string }[];
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  profile: {
    firstName: string;
    lastName?: string;
    phone?: string;
    telegramHandle?: string;
    avatarUrl?: string;
    locale?: string;
  };
  roleCodes: string[];
  storeIds?: string[];
}

export interface PermissionOverride {
  permissionCode: string;
  granted: boolean;
  reason?: string;
}

export interface UserListFilters {
  search?: string;
  role?: string;
  /** undefined = all; true/false filter account state. */
  active?: boolean;
  page: number;
  pageSize: number;
}

export interface PaginatedUsers {
  items: UserView[];
  total: number;
  page: number;
  pageSize: number;
}
