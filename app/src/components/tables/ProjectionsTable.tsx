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
    if (r.portfolioDeficit) return 'bg-red-900/20 border-red-800'
    if (r.age === inputs.retirementAge) return 'bg-teal-900/20 border-teal-800'
    if (r.milestoneCost > 0) return 'bg-amber-900/10'
    return ''
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      <div className="flex flex-wrap justify-between items-center gap-3 p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleNominal}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            {showNominal ? 'Showing Nominal' : 'Showing Inflation-adjusted'}
          </button>
        </div>
        <div className="text-slate-500 text-xs">
          <span className="inline-block w-3 h-3 bg-teal-800 rounded-sm mr-1" />Retirement&nbsp;
          <span className="inline-block w-3 h-3 bg-amber-900 rounded-sm mr-1 ml-2" />Milestone&nbsp;
          <span className="inline-block w-3 h-3 bg-red-900 rounded-sm mr-1 ml-2" />Deficit
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400">
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
              <tr key={r.age} className={`border-b border-slate-700/50 hover:bg-slate-700/30 ${rowClass(r)}`}>
                <td className="px-3 py-2 font-mono-nums text-slate-300">
                  {r.age}
                  {r.age === inputs.retirementAge && <span className="ml-1 text-teal-400 text-xs">★</span>}
                </td>
                <td className="px-3 py-2 font-mono-nums text-right text-slate-300">
                  {r.grossSalary > 0 ? fmtCurrency(r.grossSalary, true) : '—'}
                </td>
                <td className={`px-3 py-2 font-mono-nums text-right font-medium ${r.portfolioDeficit ? 'text-red-400' : 'text-teal-400'}`}>
                  {fmtCurrency(showNominal ? r.netWorth : r.realNetWorth, true)}
                </td>
                <td className="px-3 py-2 font-mono-nums text-right text-slate-400">{fmtCurrency(r.stocks, true)}</td>
                <td className="px-3 py-2 font-mono-nums text-right text-slate-400">{fmtCurrency(r.k401, true)}</td>
                <td className="px-3 py-2 font-mono-nums text-right text-slate-400">{fmtCurrency(r.rothIRA, true)}</td>
                <td className="px-3 py-2 font-mono-nums text-right text-slate-400">{fmtCurrency(r.cash, true)}</td>
                <td className="px-3 py-2 font-mono-nums text-right text-slate-400">{fmtCurrency(r.livingExpenses, true)}</td>
                <td className="px-3 py-2 font-mono-nums text-right text-slate-400">
                  {r.socialSecurityIncome > 0 ? fmtCurrency(r.socialSecurityIncome, true) : '—'}
                </td>
                <td className="px-3 py-2 text-amber-400">
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
      <div className="flex justify-between items-center px-4 py-3 border-t border-slate-700 text-xs text-slate-400">
        <span>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, rows.length)} of {rows.length} years</span>
        <div className="flex gap-1">
          <button onClick={() => setPage(0)} disabled={page === 0}
            className="px-2 py-1 rounded bg-slate-700 disabled:opacity-40 hover:bg-slate-600">«</button>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="px-2 py-1 rounded bg-slate-700 disabled:opacity-40 hover:bg-slate-600">‹</button>
          <span className="px-2 py-1">Page {page + 1} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="px-2 py-1 rounded bg-slate-700 disabled:opacity-40 hover:bg-slate-600">›</button>
          <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}
            className="px-2 py-1 rounded bg-slate-700 disabled:opacity-40 hover:bg-slate-600">»</button>
        </div>
      </div>
    </div>
  )
}
