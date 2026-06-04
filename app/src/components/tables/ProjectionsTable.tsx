import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { fmtCurrency } from '../../utils/formatters'
import type { ProjectionRow } from '../../engine/types'

const PAGE_SIZE = 20

export function ProjectionsTable() {
  const { rows, inputs, showNominal, toggleNominal } = useStore()
  const [page, setPage] = useState(0)

  const totalPages = Math.ceil(rows.length / PAGE_SIZE)
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function rowClass(r: ProjectionRow) {
    if (r.portfolioDeficit) return 'bg-rose-50 border-rose-200'
    if (r.age === inputs.retirementAge) return 'bg-indigo-50 border-indigo-200'
    if (r.milestoneCost > 0) return 'bg-amber-50'
    return ''
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="flex flex-wrap justify-between items-center gap-3 p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleNominal}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {showNominal ? 'Showing Nominal' : "Showing Real (today's $)"}
          </button>
        </div>
        <div className="text-gray-400 text-xs">
          <span className="inline-block w-3 h-3 bg-indigo-100 border border-indigo-300 rounded-sm mr-1" />Retirement&nbsp;
          <span className="inline-block w-3 h-3 bg-amber-100 border border-amber-300 rounded-sm mr-1 ml-2" />Milestone&nbsp;
          <span className="inline-block w-3 h-3 bg-rose-100 border border-rose-300 rounded-sm mr-1 ml-2" />Deficit
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 bg-gray-50">
              <th className="text-left px-3 py-2.5 font-medium">Age</th>
              <th className="text-right px-3 py-2.5 font-medium">Gross Salary</th>
              <th className="text-right px-3 py-2.5 font-medium">Net Worth</th>
              <th className="text-right px-3 py-2.5 font-medium">Stocks</th>
              <th className="text-right px-3 py-2.5 font-medium">401(k)</th>
              <th className="text-right px-3 py-2.5 font-medium">Roth IRA</th>
              <th className="text-right px-3 py-2.5 font-medium">Cash</th>
              <th className="text-right px-3 py-2.5 font-medium">Living Exp</th>
              <th className="text-right px-3 py-2.5 font-medium">SS Income</th>
              <th className="text-left px-3 py-2.5 font-medium">Milestone</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={r.age} className={`border-b border-gray-100 hover:bg-gray-50 ${rowClass(r)}`}>
                <td className="px-3 py-2 font-mono-nums text-gray-700">
                  {r.age}
                  {r.age === inputs.retirementAge && <span className="ml-1 text-indigo-600 text-xs">★</span>}
                </td>
                <td className="px-3 py-2 font-mono-nums text-right text-gray-700">
                  {r.grossSalary > 0 ? fmtCurrency(r.grossSalary, true) : '—'}
                </td>
                <td className={`px-3 py-2 font-mono-nums text-right font-medium ${r.portfolioDeficit ? 'text-rose-600' : 'text-indigo-600'}`}>
                  {fmtCurrency(showNominal ? r.netWorth : r.realNetWorth, true)}
                </td>
                <td className="px-3 py-2 font-mono-nums text-right text-gray-500">{fmtCurrency(r.stocks, true)}</td>
                <td className="px-3 py-2 font-mono-nums text-right text-gray-500">{fmtCurrency(r.k401, true)}</td>
                <td className="px-3 py-2 font-mono-nums text-right text-gray-500">{fmtCurrency(r.rothIRA, true)}</td>
                <td className="px-3 py-2 font-mono-nums text-right text-gray-500">{fmtCurrency(r.cash, true)}</td>
                <td className="px-3 py-2 font-mono-nums text-right text-gray-500">{fmtCurrency(r.livingExpenses, true)}</td>
                <td className="px-3 py-2 font-mono-nums text-right text-gray-500">
                  {r.socialSecurityIncome > 0 ? fmtCurrency(r.socialSecurityIncome, true) : '—'}
                </td>
                <td className="px-3 py-2 text-amber-600">
                  {r.milestoneLabel && (
                    <span>{r.milestoneLabel} ({fmtCurrency(r.milestoneCost, true)})</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200 text-xs text-gray-400">
        <span>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, rows.length)} of {rows.length} years</span>
        <div className="flex gap-1">
          <button onClick={() => setPage(0)} disabled={page === 0}
            className="px-2 py-1 rounded bg-gray-100 disabled:opacity-40 hover:bg-gray-200 text-gray-600">«</button>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="px-2 py-1 rounded bg-gray-100 disabled:opacity-40 hover:bg-gray-200 text-gray-600">‹</button>
          <span className="px-2 py-1">Page {page + 1} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="px-2 py-1 rounded bg-gray-100 disabled:opacity-40 hover:bg-gray-200 text-gray-600">›</button>
          <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}
            className="px-2 py-1 rounded bg-gray-100 disabled:opacity-40 hover:bg-gray-200 text-gray-600">»</button>
        </div>
      </div>
    </div>
  )
}
