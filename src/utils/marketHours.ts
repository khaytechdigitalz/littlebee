/**
 * Real session-hours math for the three major exchanges, computed from the
 * actual current time in each timezone via Intl — not stored/fabricated
 * data. Approximate (doesn't special-case exchange holidays), but the
 * open/closed status and countdown are genuinely derived from "now".
 */

interface Session {
  city: string
  timeZone: string
  openHour: number
  openMinute: number
  closeHour: number
  closeMinute: number
}

const SESSIONS: Session[] = [
  { city: 'New York', timeZone: 'America/New_York', openHour: 9, openMinute: 30, closeHour: 16, closeMinute: 0 },
  { city: 'London', timeZone: 'Europe/London', openHour: 8, openMinute: 0, closeHour: 16, closeMinute: 30 },
  { city: 'Tokyo', timeZone: 'Asia/Tokyo', openHour: 9, openMinute: 0, closeHour: 15, closeMinute: 0 },
]

function partsInZone(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hour12: false,
  })
  const parts = fmt.formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return {
    hour: Number(get('hour')) % 24,
    minute: Number(get('minute')),
    weekday: get('weekday'),
  }
}

export function getMarketHoursStatus(now: Date = new Date()) {
  return SESSIONS.map((s) => {
    const { hour, minute, weekday } = partsInZone(now, s.timeZone)
    const minutesNow = hour * 60 + minute
    const openMinutes = s.openHour * 60 + s.openMinute
    const closeMinutes = s.closeHour * 60 + s.closeMinute
    const isWeekend = weekday === 'Sat' || weekday === 'Sun'
    const isOpen = !isWeekend && minutesNow >= openMinutes && minutesNow < closeMinutes

    let label: string
    if (isOpen) {
      const left = closeMinutes - minutesNow
      label = `${Math.floor(left / 60)}h ${left % 60}m left`
    } else {
      const minutesUntilOpen = isWeekend || minutesNow >= closeMinutes ? openMinutes + 24 * 60 - minutesNow : openMinutes - minutesNow
      const normalized = ((minutesUntilOpen % (24 * 60)) + 24 * 60) % (24 * 60)
      label = `${Math.floor(normalized / 60)}h ${normalized % 60}m to go`
    }

    return { city: s.city, status: isOpen ? 'open' : 'closed', timeLeft: label }
  })
}
