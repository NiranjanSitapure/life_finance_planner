// Shared types for Recharts custom tooltip components
export type ChartTooltipPayload = {
  dataKey: string
  name: string
  value: number
  color?: string
  fill?: string
}

export type ChartTooltipProps = {
  active?: boolean
  payload?: ChartTooltipPayload[]
  label?: number
}
