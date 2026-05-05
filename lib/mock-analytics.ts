/**
 * Mock analytics data for the extended dashboard analytics section.
 * These are demo-only fixtures; replace with real API calls when available.
 */

export interface DailyVolume {
  /** ISO date YYYY-MM-DD */
  date: string
  /** Number of orders */
  units: number
  /** Total revenue in ARS */
  revenue: number
}

export interface ClientRankingEntry {
  id: string
  name: string
  orderCount: number
  totalSpend: number
  avgOrderValue: number
  lastOrderDate: string
}

export interface TopDishEntry {
  id: string
  name: string
  orderCount: number
  revenue: number
}

/** 30 days of daily order volume — April 2026 */
export const MOCK_DAILY_VOLUME: DailyVolume[] = [
  { date: "2026-04-01", units: 8,  revenue: 1240.50 },
  { date: "2026-04-02", units: 11, revenue: 1820.00 },
  { date: "2026-04-03", units: 9,  revenue: 1380.75 },
  { date: "2026-04-04", units: 15, revenue: 2640.00 },
  { date: "2026-04-05", units: 14, revenue: 2480.50 },
  { date: "2026-04-06", units: 7,  revenue: 1050.00 },
  { date: "2026-04-07", units: 10, revenue: 1670.25 },
  { date: "2026-04-08", units: 12, revenue: 2100.00 },
  { date: "2026-04-09", units: 9,  revenue: 1490.50 },
  { date: "2026-04-10", units: 11, revenue: 1850.75 },
  { date: "2026-04-11", units: 17, revenue: 3120.00 },
  { date: "2026-04-12", units: 16, revenue: 2890.50 },
  { date: "2026-04-13", units: 8,  revenue: 1280.00 },
  { date: "2026-04-14", units: 10, revenue: 1720.25 },
  { date: "2026-04-15", units: 13, revenue: 2210.00 },
  { date: "2026-04-16", units: 11, revenue: 1960.75 },
  { date: "2026-04-17", units: 9,  revenue: 1530.00 },
  { date: "2026-04-18", units: 20, revenue: 3840.50 },
  { date: "2026-04-19", units: 18, revenue: 3340.00 },
  { date: "2026-04-20", units: 12, revenue: 2020.25 },
  { date: "2026-04-21", units: 10, revenue: 1680.00 },
  { date: "2026-04-22", units: 14, revenue: 2450.75 },
  { date: "2026-04-23", units: 11, revenue: 1890.00 },
  { date: "2026-04-24", units: 13, revenue: 2180.50 },
  { date: "2026-04-25", units: 19, revenue: 3680.00 },
  { date: "2026-04-26", units: 17, revenue: 3020.75 },
  { date: "2026-04-27", units: 9,  revenue: 1450.00 },
  { date: "2026-04-28", units: 12, revenue: 2060.25 },
  { date: "2026-04-29", units: 15, revenue: 2750.00 },
  { date: "2026-04-30", units: 11, revenue: 1920.50 },
]

export const MOCK_CLIENT_RANKING: ClientRankingEntry[] = [
  { id: "c1",  name: "Jessica Lee",    orderCount: 12, totalSpend: 3245.00, avgOrderValue: 270.42, lastOrderDate: "2026-04-30" },
  { id: "c2",  name: "Sarah Johnson",  orderCount: 10, totalSpend: 1895.50, avgOrderValue: 189.55, lastOrderDate: "2026-04-29" },
  { id: "c3",  name: "John Smith",     orderCount: 9,  totalSpend: 1125.00, avgOrderValue: 125.00, lastOrderDate: "2026-04-28" },
  { id: "c4",  name: "Emily Davis",    orderCount: 8,  totalSpend: 538.00,  avgOrderValue: 67.25,  lastOrderDate: "2026-04-27" },
  { id: "c5",  name: "Lisa Wang",      orderCount: 7,  totalSpend: 1097.25, avgOrderValue: 156.75, lastOrderDate: "2026-04-25" },
  { id: "c6",  name: "David Chen",     orderCount: 6,  totalSpend: 468.00,  avgOrderValue: 78.00,  lastOrderDate: "2026-04-22" },
  { id: "c7",  name: "Alex Wilson",    orderCount: 5,  totalSpend: 950.00,  avgOrderValue: 190.00, lastOrderDate: "2026-04-20" },
  { id: "c8",  name: "Robert Miller",  orderCount: 4,  totalSpend: 720.50,  avgOrderValue: 180.13, lastOrderDate: "2026-04-18" },
  { id: "c9",  name: "Amanda Taylor",  orderCount: 3,  totalSpend: 435.75,  avgOrderValue: 145.25, lastOrderDate: "2026-04-15" },
  { id: "c10", name: "Chris Anderson", orderCount: 2,  totalSpend: 490.00,  avgOrderValue: 245.00, lastOrderDate: "2026-04-10" },
]

export const MOCK_TOP_DISHES: TopDishEntry[] = [
  { id: "d1",  name: "Seafood tower (large)",      orderCount: 23, revenue: 2300.00 },
  { id: "d2",  name: "Chef tasting menu",          orderCount: 20, revenue: 3400.00 },
  { id: "d3",  name: "Grilled Salmon",             orderCount: 18, revenue:  630.00 },
  { id: "d4",  name: "Margherita Pizza",           orderCount: 17, revenue:  510.00 },
  { id: "d5",  name: "Caesar Salad",               orderCount: 16, revenue:  200.00 },
  { id: "d6",  name: "Sushi combo (chef choice)",  orderCount: 14, revenue: 1736.00 },
  { id: "d7",  name: "BBQ Ribs (half rack)",       orderCount: 12, revenue:  354.00 },
  { id: "d8",  name: "Ribeye Steak (16oz)",        orderCount: 11, revenue:  924.00 },
  { id: "d9",  name: "Chicken Tikka Masala",       orderCount: 10, revenue:  185.00 },
  { id: "d10", name: "Grill surf & turf bundle",   orderCount:  9, revenue:  900.00 },
]

/** Filter daily volume entries within an inclusive ISO date range. */
export function filterVolumeByDateRange(from: string, to: string): DailyVolume[] {
  return MOCK_DAILY_VOLUME.filter((d) => d.date >= from && d.date <= to)
}

/** Sum units + revenue across a set of daily entries. */
export function computeVolumeSummary(data: DailyVolume[]): { units: number; revenue: number } {
  return data.reduce(
    (acc, d) => ({ units: acc.units + d.units, revenue: acc.revenue + d.revenue }),
    { units: 0, revenue: 0 },
  )
}

/** Client with the highest order count. */
export function getTopClient(): ClientRankingEntry {
  return MOCK_CLIENT_RANKING.reduce((a, b) => (a.orderCount >= b.orderCount ? a : b))
}

/** Dish with the highest order count. */
export function getTopDish(): TopDishEntry {
  return MOCK_TOP_DISHES.reduce((a, b) => (a.orderCount >= b.orderCount ? a : b))
}
