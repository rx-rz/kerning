export const APP_ROUTES = {
    SIGNUP: '/auth/signup',
    LOGIN: '/auth/login',
    DASHBOARD: '/dashboard',
    VERIFY_EMAIL: (email) => `/auth/verify-email?email=${encodeURIComponent(email)}`,
}
