export const ROUTES = {
  HOME: "/",
  MARKETPLACE: "/marketplace",
  LOGIN: "/login",
  REGISTER: "/register",
  VENDOR: {
    DASHBOARD: "/vendor/dashboard",
    SERVICES: "/vendor/services",
    BOOKINGS: "/vendor/bookings",
    AVAILABILITY: "/vendor/availability",
    EARNINGS: "/vendor/earnings",
    WALLET: "/vendor/wallet",
    MESSAGES: "/vendor/messages",
    REVIEWS: "/vendor/reviews",
    NOTIFICATIONS: "/vendor/notifications",
    SETTINGS: "/vendor/settings",
  },
  CUSTOMER: {
    DASHBOARD: "/customer/dashboard",
    ORDERS: "/customer/orders",
    MESSAGES: "/customer/messages",
    WALLET: "/customer/wallet",
    WISHLIST: "/customer/wishlist",
    SETTINGS: "/customer/settings",
    ADDRESSES: "/customer/addresses",
  }
} as const;
