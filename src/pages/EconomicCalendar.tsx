import { Card } from '../components/ui'
import { CalendarClock } from 'lucide-react'

export default function EconomicCalendar() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <div className="text-center py-10">
          <CalendarClock size={28} className="text-slate-600 mx-auto mb-4" />
          <p className="font-medium mb-1.5">No economic calendar provider connected</p>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Real-time economic events (rate decisions, CPI releases, employment data) require a paid data provider —
            wire one up in <code className="text-slate-400">app/controllers/markets_controller.ts</code> and this page
            will list real events instead of this notice.
          </p>
        </div>
      </Card>
    </div>
  )
}
