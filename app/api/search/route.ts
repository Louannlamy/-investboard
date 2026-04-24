import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    // Search via Yahoo Finance
    const res = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&lang=fr-FR&region=FR&quotesCount=8&newsCount=0`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; InvestBoard/1.0)',
          'Accept': 'application/json',
        },
      }
    )

    const data = await res.json()
    const quotes = data?.quotes || []

    const results = quotes
      .filter((q: any) => q.symbol && q.shortname || q.longname)
      .filter((q: any) => ['EQUITY', 'ETF', 'MUTUALFUND'].includes(q.quoteType))
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        exchange: q.exchange,
        type: q.quoteType,
        currency: q.currency || 'USD',
      }))
      .slice(0, 6)

    return NextResponse.json({ results })
  } catch (e) {
    console.error('Search error:', e)
    return NextResponse.json({ results: [] })
  }
}

export async function POST(request: Request) {
  try {
    const { symbol } = await request.json()

    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; InvestBoard/1.0)',
          'Accept': 'application/json',
        },
      }
    )

    const data = await res.json()
    const result = data?.chart?.result?.[0]
    if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const meta = result.meta
    const price = meta.regularMarketPrice
    const prevClose = meta.chartPreviousClose || meta.previousClose
    const change = price - prevClose
    const changePercent = (change / prevClose) * 100
    const currency = meta.currency || 'USD'

    return NextResponse.json({
      symbol,
      name: meta.longName || meta.shortName || symbol,
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      currency,
      exchange: meta.exchangeName,
      marketCap: meta.marketCap,
    })
  } catch (e) {
    console.error('Price fetch error:', e)
    return NextResponse.json({ error: 'Failed to fetch price' }, { status: 500 })
  }
}