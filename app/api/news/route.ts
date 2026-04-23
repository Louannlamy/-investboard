import { NextResponse } from 'next/server'

export async function GET() {
  const key = process.env.NEWS_API_KEY
  if (!key) {
    return NextResponse.json({ error: 'Missing NewsAPI key' }, { status: 500 })
  }

  try {
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=bourse+CAC40+investissement+ETF+marchés+financiers&language=fr&sortBy=publishedAt&pageSize=10&apiKey=${key}`,
      { next: { revalidate: 3600 } }
    )
    const data = await res.json()

    const englishRes = await fetch(
      `https://newsapi.org/v2/everything?q=stock+market+ETF+S%26P500+investing+Fed&language=en&sortBy=publishedAt&pageSize=10&apiKey=${key}`,
      { next: { revalidate: 3600 } }
    )
    const englishData = await englishRes.json()

    const articles = [
      ...(data.articles || []),
      ...(englishData.articles || []),
    ]
      .filter((a: any) => a.title && a.description)
      .slice(0, 15)
      .map((a: any) => ({
        title: a.title,
        description: a.description,
        source: a.source?.name,
        publishedAt: a.publishedAt,
        url: a.url,
      }))

    return NextResponse.json({
      articles,
      fetchedAt: new Date().toISOString(),
    })
  } catch (e) {
    console.error('News fetch error:', e)
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 })
  }
}