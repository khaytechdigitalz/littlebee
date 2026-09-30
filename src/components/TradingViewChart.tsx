import { useEffect, useRef, useState, memo } from 'react'
import { useTheme } from '../context/ThemeContext'

interface Props {
  symbol?: string
  interval?: string // '1' | '5' | '15' | '60' | 'D' | 'W' | 'M'
  chartStyle?: '1' | '3' // 1 = candles, 3 = line
  height?: number
  showVolume?: boolean
}

function ChartFallback({ height }: { height: number }) {
  return (
    <div
      className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-base-border text-slate-500"
      style={{ height }}
    >
      <svg width="180" height="56" viewBox="0 0 180 56" fill="none">
        <polyline
          points="0,40 20,32 40,38 60,20 80,28 100,10 120,22 140,14 160,18 180,6"
          stroke="var(--accent)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="text-xs">Live chart unavailable — showing a placeholder</p>
      <p className="text-[11px] text-slate-600">Check your connection to load the TradingView widget</p>
    </div>
  )
}

function TradingViewChart({
  symbol = 'BINANCE:BTCUSDT',
  interval = 'D',
  chartStyle = '1',
  height = 420,
  showVolume = true,
}: Props) {
  const container = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  const { colorMode } = useTheme()

  useEffect(() => {
    if (!container.current) return
    setFailed(false)
    container.current.innerHTML = ''

    const widgetDiv = document.createElement('div')
    widgetDiv.className = 'tradingview-widget-container__widget'
    widgetDiv.style.height = '100%'
    widgetDiv.style.width = '100%'
    container.current.appendChild(widgetDiv)

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval,
      timezone: 'Etc/UTC',
      theme: colorMode,
      style: chartStyle,
      locale: 'en',
      withdateranges: true,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      studies: showVolume ? ['Volume@tv-basicstudies'] : [],
      support_host: 'https://www.tradingview.com',
    })

    const timeout = setTimeout(() => setFailed(true), 6000)
    script.onload = () => clearTimeout(timeout)
    script.onerror = () => {
      clearTimeout(timeout)
      setFailed(true)
    }
    container.current.appendChild(script)

    return () => clearTimeout(timeout)
  }, [symbol, interval, chartStyle, showVolume, colorMode])

  if (failed) return <ChartFallback height={height} />

  return <div className="tradingview-widget-container h-full w-full" ref={container} style={{ height }} />
}

// TradingView's embed script reloads on every prop change; memoizing keeps it
// from tearing down when unrelated parts of the page re-render.
export default memo(TradingViewChart)
