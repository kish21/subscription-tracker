/**
 * Core Domain Entities and Types for Subscription Tracker.
 *
 * Rules:
 *   - Typed domain models (never raw dicts or free text).
 *   - Money is strictly stored and calculated as integer minor units (ADR-004).
 *   - Every subscription belongs to an owning userId tenant key (ADR-005).
 *   - Dates across boundaries are ISO 8601 calendar strings (YYYY-MM-DD).
 */

export const ALLOWED_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD'] as const

export type AllowedCurrency = (typeof ALLOWED_CURRENCIES)[number]

export const BILLING_CYCLES = ['monthly', 'quarterly', 'semiannual', 'yearly'] as const

export type BillingCycle = (typeof BILLING_CYCLES)[number]

export const BILLING_CYCLE_MONTHS: Record<BillingCycle, number> = {
  monthly: 1,
  quarterly: 3,
  semiannual: 6,
  yearly: 12,
}

export const CATEGORIES = [
  'Streaming',
  'Software',
  'Cloud & Hosting',
  'News & Reading',
  'Music & Audio',
  'Gaming',
  'Health & Fitness',
  'Utilities',
  'Other',
] as const

export type Category = (typeof CATEGORIES)[number]

export const SUBSCRIPTION_STATUSES = ['active', 'cancelled'] as const
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number]

export interface User {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image?: string | null
  currency: AllowedCurrency
  createdAt: Date
  updatedAt: Date
}

export interface Subscription {
  id: string
  userId: string
  name: string
  priceMinorUnits: number // e.g. 1499 = $14.99 / 1499 cents. Integer minor units only.
  currency: AllowedCurrency
  billingCycle: BillingCycle
  category: Category
  nextRenewalDate: string // YYYY-MM-DD
  status: SubscriptionStatus
  idempotencyKey?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface UpcomingRenewalItem {
  id: string
  name: string
  priceMinorUnits: number
  currency: AllowedCurrency
  billingCycle: BillingCycle
  category: Category
  renewalDate: string // YYYY-MM-DD
  daysUntilRenewal: number // 0..upcomingWindowDays
}

export interface CategorySpendBreakdown {
  category: Category
  totalMonthlyMinorUnits: number
  percentage: number // 0.0 to 100.0, rounded to 1 decimal place at boundary
  subscriptionCount: number
}

export interface DashboardSummary {
  totalMonthlyMinorUnits: number
  totalYearlyMinorUnits: number
  currency: AllowedCurrency
  activeCount: number
  upcomingCount: number
  upcomingWindowDays: number
  upcomingRenewals: UpcomingRenewalItem[]
  categoryBreakdown: CategorySpendBreakdown[]
}

/* ------------------------------------------------------------------ *
 * Pure Money & Cycle Normalisation Arithmetic (ADR-004)
 * ------------------------------------------------------------------ */

/**
 * Converts major units (e.g. 14.99 dollars) to integer minor units (1499 cents).
 * Guards against floating-point imprecision by rounding to nearest integer.
 */
export function toMinorUnits(majorUnits: number): number {
  if (!Number.isFinite(majorUnits) || majorUnits < 0) {
    throw new TypeError(`Major units amount must be a finite non-negative number: ${majorUnits}`)
  }
  return Math.round(majorUnits * 100)
}

/**
 * Converts integer minor units (e.g. 1499 cents) to decimal major units (14.99).
 */
export function fromMinorUnits(minorUnits: number): number {
  if (!Number.isInteger(minorUnits) || minorUnits < 0) {
    throw new TypeError(`Minor units must be a non-negative integer: ${minorUnits}`)
  }
  return minorUnits / 100
}

/**
 * Normalises a price to a monthly minor-units amount based on its billing cycle.
 * Monthly = price
 * Quarterly = price / 3
 * Semiannual = price / 6
 * Yearly = price / 12
 * Uses integer rounding for display consistency.
 */
export function normalizeMonthlyMinorUnits(priceMinorUnits: number, cycle: BillingCycle): number {
  const months = BILLING_CYCLE_MONTHS[cycle]
  if (!months || months <= 0) {
    throw new Error(`Invalid billing cycle: ${cycle}`)
  }
  return Math.round(priceMinorUnits / months)
}

/**
 * Normalises a price to a yearly minor-units amount based on its billing cycle.
 * Monthly = price * 12
 * Quarterly = price * 4
 * Semiannual = price * 2
 * Yearly = price
 */
export function normalizeYearlyMinorUnits(priceMinorUnits: number, cycle: BillingCycle): number {
  const months = BILLING_CYCLE_MONTHS[cycle]
  if (!months || months <= 0) {
    throw new Error(`Invalid billing cycle: ${cycle}`)
  }
  return Math.round((priceMinorUnits * 12) / months)
}
