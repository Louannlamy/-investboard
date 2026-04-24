import { NextResponse } from 'next/server'

const ASSETS = [
  // Actifs US → Finnhub
  { id: 'SPY',  ticker: 'SPY',  source: 'finnhub' },
  { id: 'QQQ',  ticker: 'QQQ',  source: 'finnhub' },
  { id: 'VIG',  ticker: 'VIG',  source: 'finnhub' },
  { id: 'MSCI', ticker: 'MSCI', source: 'finnhub' },
  { id: 'NVDA', ticker: 'NVDA', source: 'finnhub' },
  { id: 'MSFT', ticker: 'MSFT', source: 'finnhub' },
  { id: 'IBIT', ticker: 'IBIT', source: 'finnhub' },
  { id: 'ARKK', ticker: 'ARKK', source: 'finnhub' },
  { id: 'AGG',  ticker: 'AGG',  source: 'finnhub' },
  { id: 'VWO',  ticker: 'VWO',  source: 'finnhub' },

  // Actifs européens → Yahoo Finance (prix réels Euronext)
  { id: 'IWDA', ticker: 'IWDA.AS', source: 'yahoo' },
  { id: 'VWCE', ticker: 'VWCE.DE', source: 'yahoo' },
  { id: 'ERNS', ticker: 'CSH2.PA', source: 'yahoo' },
  { id: 'HLTH', ticker: 'HEAL.L',  source: 'yahoo' },
  { id: 'ASML', ticker: 'ASML.AS', source: 'yahoo' },
  { id: 'NOVO', ticker: 'NVO', source: 'finnhub' },
  { id: 'SEMI', ticker: 'SEMI.PA', source: 'yahoo' },
  { id: 'LVMH', ticker: 'MC.PA',  source: 'yahoo' },
]

async function fetchFinnhub(ticker: string, key: string) {
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${key}`,
    { next: { revalidate: 300 } }
  )
  const data = await res.json()
  if (data.c && data.c > 0) {
    return {
      price: data.c,
      change: data.d || 0,
      changePercent: data.dp || 0,
    }
  }
  return null
}

async function fetchYahoo(ticker: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; InvestBoard/1.0)',
      'Accept': 'application/json',
    },
    next: { revalidate: 300 }
  })
  const data = await res.json()
  const quote = data?.chart?.result?.[0]
  if (!quote) return null

  const meta = quote.meta
  const price = meta.regularMarketPrice
  const prevClose = meta.chartPreviousClose || meta.previousClose
  const change = price - prevClose
  const changePercent = (change / prevClose) * 100

  if (price && price > 0) {
    return {
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
    }
  }
  return null
}

export async function GET() {
  const key = process.env.FINNHUB_API_KEY
  if (!key) {
    return NextResponse.json({ error: 'Missing Finnhub API key' }, { status: 500 })
  }

  const results: Record<string, { price: number; change: number; changePercent: number }> = {}

  for (const asset of ASSETS) {
    try {
      let data = null
      if (asset.source === 'finnhub') {
        data = await fetchFinnhub(asset.ticker, key)
        await new Promise(r => setTimeout(r, 150))
      } else {
        data = await fetchYahoo(asset.ticker)
        await new Promise(r => setTimeout(r, 200))
      }
      if (data) results[asset.id] = data
    } catch (e) {
      console.error(`Error fetching ${asset.ticker}:`, e)
    }
  }

  return NextResponse.json({
    prices: results,
    updatedAt: new Date().toISOString(),
  })
}