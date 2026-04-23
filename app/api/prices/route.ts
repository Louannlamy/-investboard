import { NextResponse } from 'next/server'

const ASSETS = [
  { id: 'IWDA', ticker: 'IWDA' },
  { id: 'VWCE', ticker: 'VWCE' },
  { id: 'SPY', ticker: 'SPY' },
  { id: 'QQQ', ticker: 'QQQ' },
  { id: 'NVDA', ticker: 'NVDA' },
  { id: 'MSFT', ticker: 'MSFT' },
  { id: 'ASML', ticker: 'ASML' },
  { id: 'NOVO', ticker: 'NVO' },
  { id: 'LVMH', ticker: 'MC' },
  { id: 'SEMI', ticker: 'SOXX' },
  { id: 'MSCI', ticker: 'MSCI' },
  { id: 'HLTH', ticker: 'IHI' },
  { id: 'VWO', ticker: 'VWO' },
  { id: 'VIG', ticker: 'VIG' },
  { id: 'IBIT', ticker: 'IBIT' },
  { id: 'ARKK', ticker: 'ARKK' },
  { id: 'AGG', ticker: 'AGG' },
  { id: 'ERNS', ticker: 'CSH2' },
]

export async function GET() {
  const key = process.env.FINNHUB_API_KEY
  if (!key) {
    return NextResponse.json({ error: 'Missing Finnhub API key' }, { status: 500 })
  }

  const results: Record<string, { price: number; change: number; changePercent: number }> = {}

  for (const asset of ASSETS) {
    try {
      const res = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${asset.ticker}&token=${key}`,
        { next: { revalidate: 300 } }
      )
      const data = await res.json()
      if (data.c && data.c > 0) {
        results[asset.id] = {
          price: data.c,
          change: data.d || 0,
          changePercent: data.dp || 0,
        }
      }
      await new Promise(r => setTimeout(r, 150))
    } catch (e) {
      console.error(`Error fetching ${asset.ticker}:`, e)
    }
  }

  return NextResponse.json({
    prices: results,
    updatedAt: new Date().toISOString(),
  })
}