export const CORE_USER_NAME = "Enshore Insight";
export const CORE_USER_EMAIL = "insight@enshoresubsea.com";

export function isCoreUserEmail(email: string) {
  return email.trim().toLowerCase() === CORE_USER_EMAIL;
}
