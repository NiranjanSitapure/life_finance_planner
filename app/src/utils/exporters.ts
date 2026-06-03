import type { ProjectionRow } from '../engine/types'

export function exportCSV(rows: ProjectionRow[], filename = 'financial_projections.csv') {
  const headers = [
    'Age', 'Year', 'Gross Salary', 'Post-Tax Income', 'Living Expenses',
    'Debt Payments', 'Net Savings', 'Stocks', 'Bonds', 'Cash',
    'Roth IRA', '401k', 'HSA', 'Social Security',
    'Net Worth', 'Real Net Worth', 'Stock Alloc %',
    'Milestone Cost', 'Milestone', 'Cap Gains Tax'
  ]

  const csvRows = rows.map(r => [
    r.age, r.year, r.grossSalary, r.postTaxIncome, r.livingExpenses,
    r.debtPayments, r.netSavings, r.stocks, r.bonds, r.cash,
    r.rothIRA, r.k401, r.hsa, r.socialSecurityIncome,
    r.netWorth, r.realNetWorth, (r.stockAllocationPct * 100).toFixed(1),
    r.milestoneCost, r.milestoneLabel, r.capGainsTaxPaid
  ].map(v => typeof v === 'string' && v.includes(',') ? `"${v}"` : v).join(','))

  const csv = [headers.join(','), ...csvRows].join('\n')
  download(csv, filename, 'text/csv')
}

export function exportJSON(data: object, filename = 'finance_settings.json') {
  download(JSON.stringify(data, null, 2), filename, 'application/json')
}

function download(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
