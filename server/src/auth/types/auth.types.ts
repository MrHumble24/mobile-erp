export interface AuthCredentials {
  id: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
}

export interface UserProfileView {
  firstName: string;
  lastName: string | null;
  phone: string | null;
  telegramHandle: string | null;
  avatarUrl: string | null;
  locale: string;
}

/** Shape returned by GET /auth/me and inside the login response. */
export interface MeView {
  id: string;
  email: string;
  profile: UserProfileView | null;
  roles: string[];
  permissions: string[];
}
