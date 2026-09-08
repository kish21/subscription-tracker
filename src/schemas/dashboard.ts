import { z } from 'zod'
import { billingCycleSchema, categorySchema, currencySchema, dateStringSchema } from './common'

export const upcomingRenewalSchema = z.object({
  id: z.string(),
  name: z.string(),
  priceMinorUnits: z.number().int(),
  currency: currencySchema,
  billingCycle: billingCycleSchema,
  category: categorySchema,
  renewalDate: dateStringSchema,
  daysUntilRenewal: z.number().int().min(0),
})

export type UpcomingRenewal = z.infer<typeof upcomingRenewalSchema>

export const categorySpendBreakdownSchema = z.object({
  category: categorySchema,
  totalMonthlyMinorUnits: z.number().int().min(0),
  percentage: z.number().min(0).max(100),
  subscriptionCount: z.number().int().min(0),
})

export type CategorySpendBreakdownItem = z.infer<typeof categorySpendBreakdownSchema>

export const dashboardSummarySchema = z.object({
  totalMonthlyMinorUnits: z.number().int().min(0),
  totalYearlyMinorUnits: z.number().int().min(0),
  currency: currencySchema,
  activeCount: z.number().int().min(0),
  upcomingCount: z.number().int().min(0),
  upcomingWindowDays: z.number().int().positive(),
  upcomingRenewals: z.array(upcomingRenewalSchema),
  categoryBreakdown: z.array(categorySpendBreakdownSchema),
})

export type DashboardSummaryResponse = z.infer<typeof dashboardSummarySchema>
