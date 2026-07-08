export const OAUTH_SIGNUP_ROLE_COOKIE = "pawpath_signup_role";
export const OAUTH_TERMS_COOKIE = "pawpath_terms_accepted";

export function isGoogleAuthConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
}

export function getGoogleOAuthRedirectUris(appUrl: string) {
  const base = appUrl.replace(/\/$/, "");
  return [`${base}/api/auth/callback/google`];
}
