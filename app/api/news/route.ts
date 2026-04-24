import { NextResponse } from 'next/server'

const RSS_FEEDS = [
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', source: 'BBC Business' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', source: 'NY Times' },
  { url: 'https://feeds.content.dowjones.io/public/rss/mw_realtimeheadlines', source: 'MarketWatch' },
  { url: 'https://finance.yahoo.com/rss/topstories', source: 'Yahoo Finance' },
  { url: 'https://www.investing.com/rss/news.rss', source: 'Investing.com' },
]

async function parseRSS(feed: { url: string; source: string }) {
  try {
    const res = await fetch(feed.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; InvestBoard/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      next: { revalidate: 1800 }
    })

    if (!res.ok) return []
    const text = await res.text()
    const items: any[] = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let match

    while ((match = itemRegex.exec(text)) !== null) {
      const item = match[1]

      const titleMatch =
        item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
        item.match(/<title>([\s\S]*?)<\/title>/)
      const descMatch =
        item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ||
        item.match(/<description>([\s\S]*?)<\/description>/)
      const linkMatch =
        item.match(/<link>([\s\S]*?)<\/link>/) ||
        item.match(/<link href="([\s\S]*?)"/)
      const dateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)

      const title = titleMatch?.[1]?.replace(/<[^>]*>/g, '').trim()
      const description = descMatch?.[1]?.replace(/<[^>]*>/g, '').substring(0, 250).trim()
      const url = linkMatch?.[1]?.trim()
      const pubDate = dateMatch?.[1]

      if (title && title.length > 10) {
        items.push({
          title,
          description: description || '',
          url: url || '#',
          publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          source: feed.source,
        })
      }
    }

    return items.slice(0, 6)
  } catch (e) {
    console.error(`RSS error for ${feed.source}:`, e)
    return []
  }
}

export async function GET() {
  try {
    const results = await Promise.allSettled(RSS_FEEDS.map(parseRSS))

    const articles = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => (r as PromiseFulfilledResult<any[]>).value)
      .filter(a => a.title && a.title.length > 10)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 20)

    if (articles.length === 0) {
      const fallback = [
        { title: 'Les marchés européens progressent portés par la tech', description: 'Le CAC 40 et le DAX affichent des gains modérés en séance.', url: '#', publishedAt: new Date().toISOString(), source: 'InvestBoard' },
        { title: 'La BCE maintient sa trajectoire de baisse des taux', description: 'Christine Lagarde confirme une approche graduelle sur la politique monétaire.', url: '#', publishedAt: new Date().toISOString(), source: 'InvestBoard' },
        { title: 'NVIDIA dépasse les attentes au T1 2026', description: 'Le fabricant de puces IA annonce des revenus record tirés par la demande des datacenters.', url: '#', publishedAt: new Date().toISOString(), source: 'InvestBoard' },
        { title: 'Les ETFs monde attirent des flux records en 2026', description: 'Les investisseurs particuliers plébiscitent les ETFs UCITS pour leurs PEA.', url: '#', publishedAt: new Date().toISOString(), source: 'InvestBoard' },
        { title: 'Novo Nordisk : pipeline obesity drugs booste les perspectives', description: 'Le groupe danois annonce de nouveaux essais cliniques prometteurs.', url: '#', publishedAt: new Date().toISOString(), source: 'InvestBoard' },
      ]
      return NextResponse.json({ articles: fallback, fetchedAt: new Date().toISOString(), fallback: true })
    }

    return NextResponse.json({ articles, fetchedAt: new Date().toISOString() })
  } catch (e) {
    console.error('News fetch error:', e)
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 })
  }
}