export const PRODUCT_PORTFOLIO = [
  { key: "portfolio-photography-dark", image: "/showcase/portfolio-photography-dark.webp", width: 1920, height: 898, feature: "portfolio" },
  { key: "portfolio-editorial-grid", image: "/showcase/portfolio-editorial-grid.webp", width: 1920, height: 882, feature: "portfolio" },
  { key: "portfolio-editorial-menu", image: "/showcase/portfolio-editorial-menu.webp", width: 1920, height: 898, feature: "portfolio" },
] as const;

export const PRODUCT_JOURNEY = [
  { key: "customer-journey-value", image: "/showcase/customer-journey-value.webp", width: 1920, height: 965, feature: "journey" },
  { key: "customer-journey-response-rate", image: "/showcase/customer-journey-response-rate.webp", width: 1920, height: 920, feature: "journey" },
  { key: "customer-journey-steps", image: "/showcase/customer-journey-steps.webp", width: 1920, height: 897, feature: "journey" },
  { key: "customer-journey-import", image: "/showcase/customer-journey-import.webp", width: 1920, height: 893, feature: "journey" },
  { key: "customer-journey-faq", image: "/showcase/customer-journey-faq.webp", width: 1920, height: 923, feature: "journey" },
] as const;

const QUALIFIED_REQUEST = { key: "qualified-request", image: "/showcase/qualified-request-form.webp", width: 1920, height: 1081, feature: "leads" } as const;

export const PRODUCT_LEADS = [
  QUALIFIED_REQUEST,
  { key: "leads-vehicle-selection", image: "/showcase/leads-vehicle-selection.webp", width: 1920, height: 1004, feature: "leads" },
  { key: "leads-contact-form", image: "/showcase/leads-contact-form.webp", width: 1920, height: 1017, feature: "leads" },
] as const;

const APPOINTMENT_REQUEST = { key: "appointment-request", image: "/showcase/appointment-request.webp", width: 1920, height: 982, feature: "appointments" } as const;
const APPOINTMENT_CALENDAR = { key: "appointment-calendar", image: "/showcase/appointment-calendar.webp", width: 1920, height: 1089, feature: "appointments" } as const;
const APPOINTMENT_SLOTS = { key: "appointment-slots", image: "/showcase/appointment-slots.webp", width: 1920, height: 1087, feature: "followups" } as const;
const AUDIENCE_GEOGRAPHY = { key: "audience-geography", image: "/showcase/audience-geography.webp", width: 886, height: 1792, feature: "analytics" } as const;
const PROSPECT_DASHBOARD = { key: "prospect-dashboard", image: "/showcase/prospect-dashboard.webp", width: 1920, height: 979, feature: "analytics" } as const;
const PROSPECT_RESULTS = { key: "prospect-results", image: "/showcase/prospect-results.webp", width: 1920, height: 983, feature: "contacts" } as const;

export const PRODUCT_CONTACTS = [
  PROSPECT_RESULTS,
  { key: "contacts-book", image: "/showcase/contacts-book.webp", width: 1920, height: 881, feature: "contacts" },
  { key: "contacts-referral-network", image: "/showcase/contacts-referral-network.webp", width: 1920, height: 794, feature: "contacts" },
  { key: "contacts-pipeline", image: "/showcase/contacts-pipeline.webp", width: 1920, height: 961, feature: "contacts" },
] as const;

export const PRODUCT_SHOWCASE = [
  ...PRODUCT_PORTFOLIO,
  ...PRODUCT_LEADS,
  APPOINTMENT_REQUEST,
  APPOINTMENT_CALENDAR,
  ...PRODUCT_JOURNEY,
  APPOINTMENT_SLOTS,
  AUDIENCE_GEOGRAPHY,
  PROSPECT_DASHBOARD,
  ...PRODUCT_CONTACTS,
] as const;

export const PRODUCT_TOUR = [
  PRODUCT_PORTFOLIO[0],
  PRODUCT_LEADS[0],
  PRODUCT_CONTACTS[0],
  APPOINTMENT_REQUEST,
  PRODUCT_JOURNEY[0],
  AUDIENCE_GEOGRAPHY,
] as const;

export type ProductTourFeature = (typeof PRODUCT_TOUR)[number]["feature"];
