'use client'

import { useState, useEffect, useCallback } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler)

// ── ASSET DATABASE ──────────────────────────────────────────────
const ASSETS = [
  { id:'IWDA', name:'iShares Core MSCI World UCITS', cat:'low', pea:true, peaAlt:null, what:'ETF UCITS — 1 500 entreprises dans 23 pays développés. Frais 0.20%/an.', p10:9.8, p15:10.2 },
  { id:'VWCE', name:'Vanguard FTSE All-World UCITS', cat:'low', pea:true, peaAlt:null, what:'~3 700 actions mondiales développés + émergents. Frais 0.22%/an.', p10:10.1, p15:null },
  { id:'ERNS', name:'Amundi ETF Overnight €STR', cat:'low', pea:true, peaAlt:null, what:'ETF monétaire euros. Frais 0.10%/an.', p10:1.8, p15:1.6 },
  { id:'AGG', name:'iShares Core US Agg Bond', cat:'low', pea:false, peaAlt:'IEAG', what:'ETF obligataire US. Équivalent PEA: IEAG.', p10:2.1, p15:2.8 },
  { id:'SPY', name:'SPDR S&P 500 ETF', cat:'mid', pea:false, peaAlt:'CSP1', what:'Les 500 plus grandes US. Équivalent PEA: CSP1.', p10:13.2, p15:14.1 },
  { id:'QQQ', name:'Invesco NASDAQ-100 ETF', cat:'mid', pea:false, peaAlt:'EQQQ', what:'Top 100 tech US. Équivalent PEA: EQQQ.', p10:17.8, p15:18.3 },
  { id:'VIG', name:'Vanguard Dividend Appreciation', cat:'mid', pea:false, peaAlt:'VGWD', what:'ETFs dividendes croissants. Équivalent PEA: VGWD.', p10:11.4, p15:12.1 },
  { id:'HLTH', name:'iShares Healthcare Innovation UCITS', cat:'mid', pea:true, peaAlt:null, what:'ETF santé mondial UCITS. Frais 0.25%/an.', p10:10.4, p15:11.2 },
  { id:'MSCI', name:'MSCI Inc.', cat:'mid', pea:false, peaAlt:null, what:'Fournisseur indices boursiers. CTO uniquement.', p10:22.8, p15:null },
  { id:'NVDA', name:'NVIDIA Corporation', cat:'high', pea:false, peaAlt:'SEMI', what:'Leader GPU pour l\'IA. Équivalent PEA: SEMI.', p10:58.2, p15:44.1 },
  { id:'MSFT', name:'Microsoft Corporation', cat:'high', pea:false, peaAlt:'EQQQ', what:'Azure, Office, IA. Équivalent PEA: EQQQ.', p10:29.1, p15:23.4 },
  { id:'ASML', name:'ASML Holding', cat:'high', pea:true, peaAlt:null, what:'Monopole machines lithographie EUV. Pays-Bas, éligible PEA.', p10:31.4, p15:28.7 },
  { id:'NOVO', name:'Novo Nordisk', cat:'high', pea:true, peaAlt:null, what:'N°1 insuline & obésité (Ozempic). Danemark, éligible PEA.', p10:25.4, p15:22.8 },
  { id:'SEMI', name:'iShares MSCI Global Semiconductors UCITS', cat:'high', pea:true, peaAlt:null, what:'ETF semis UCITS. NVIDIA, TSMC, Broadcom... Frais 0.35%.', p10:26.8, p15:23.1 },
  { id:'VWO', name:'iShares Core MSCI Emerging Markets UCITS', cat:'high', pea:true, peaAlt:null, what:'Marchés émergents UCITS. Inde, Chine, Taiwan...', p10:4.2, p15:5.8 },
  { id:'LVMH', name:'LVMH Moët Hennessy', cat:'high', pea:true, peaAlt:null, what:'N°1 mondial luxe. Paris, éligible PEA.', p10:18.4, p15:19.2 },
  { id:'IBIT', name:'iShares Bitcoin Trust ETF', cat:'high', pea:false, peaAlt:null, what:'ETF Bitcoin spot BlackRock. CTO uniquement.', p10:null, p15:null },
  { id:'ARKK', name:'ARK Innovation ETF', cat:'high', pea:false, peaAlt:null, what:'ETF actif Cathie Wood. Sous-performance chronique.', p10:4.1, p15:null },
]

type Price = { price: number; change: number; changePercent: number }
type Signal = 'buy' | 'hold' | 'sell'
type PortfolioPosition = { assetId: string; qty: number; buyPrice: number; date: string }

export default function InvestBoard() {
  const [activeTab, setActiveTab] = useState('market')
  const [prices, setPrices] = useState<Record<string, Price>>({})
  const [news, setNews] = useState<any[]>([])
  const [analysis, setAnalysis] = useState<any>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [pricesLoading, setPricesLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [curCat, setCurCat] = useState('all')
  const [peaMode, setPeaMode] = useState(false)
  const [portfolio, setPortfolio] = useState<PortfolioPosition[]>([])
  const [posAsset, setPosAsset] = useState('IWDA')
  const [posQty, setPosQty] = useState('')
  const [posBuyPrice, setPosBuyPrice] = useState('')
  const [posDate, setPosDate] = useState('')
  const [simInit, setSimInit] = useState(1000)
  const [simMonthly, setSimMonthly] = useState(200)
  const [simYears, setSimYears] = useState(20)
  const [simRate, setSimRate] = useState(11.5)

  // Load portfolio from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ib_portfolio')
    if (saved) setPortfolio(JSON.parse(saved))
    fetchPrices()
    fetchNews()
  }, [])

  const fetchPrices = async () => {
    setPricesLoading(true)
    try {
      const res = await fetch('/api/prices')
      const data = await res.json()
      if (data.prices) {
        setPrices(data.prices)
        setLastUpdated(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
      }
    } catch (e) { console.error(e) }
    setPricesLoading(false)
  }

  const fetchNews = async () => {
    try {
      const res = await fetch('/api/news')
      const data = await res.json()
      if (data.articles) setNews(data.articles)
    } catch (e) { console.error(e) }
  }

  const fetchAnalysis = useCallback(async () => {
    setAnalysisLoading(true)
    try {
      const res = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prices, news, portfolio }),
      })
      const data = await res.json()
      if (data.analysis) setAnalysis(data.analysis)
    } catch (e) { console.error(e) }
    setAnalysisLoading(false)
  }, [prices, news, portfolio])

  const savePortfolio = (p: PortfolioPosition[]) => {
    setPortfolio(p)
    localStorage.setItem('ib_portfolio', JSON.stringify(p))
  }

  const addPosition = () => {
    if (!posQty || !posBuyPrice) return
    const newPos = { assetId: posAsset, qty: parseFloat(posQty), buyPrice: parseFloat(posBuyPrice), date: posDate || new Date().toISOString().split('T')[0] }
    savePortfolio([...portfolio, newPos])
    setPosQty(''); setPosBuyPrice(''); setPosDate('')
  }

  const removePosition = (idx: number) => {
    const updated = portfolio.filter((_, i) => i !== idx)
    savePortfolio(updated)
  }

  const getSignal = (id: string): Signal => {
    if (analysis?.assetSignals?.[id]?.signal) return analysis.assetSignals[id].signal
    const defaultSignals: Record<string, Signal> = {
      IWDA:'buy', VWCE:'buy', ERNS:'hold', AGG:'hold', SPY:'buy', QQQ:'buy',
      VIG:'buy', HLTH:'buy', MSCI:'buy', NVDA:'hold', MSFT:'buy', ASML:'buy',
      NOVO:'buy', SEMI:'buy', VWO:'hold', LVMH:'buy', IBIT:'hold', ARKK:'sell'
    }
    return defaultSignals[id] || 'hold'
  }

  const getPrice = (id: string) => prices[id]?.price || 0
  const getChange = (id: string) => prices[id]?.changePercent || 0

  // DCA Calculator
  const calcDCA = (rate: number, init: number, monthly: number, years: number) => {
    let v = init
    const mr = rate / 100 / 12
    for (let m = 0; m < years * 12; m++) v = v * (1 + mr) + monthly
    return Math.round(v)
  }

  const filteredAssets = ASSETS
    .filter(a => curCat === 'all' || a.cat === curCat)
    .filter(a => !peaMode || a.pea)

  const today = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })

  // Portfolio calculations
  const portRows = (() => {
    const merged: Record<string, { asset: typeof ASSETS[0], positions: PortfolioPosition[] }> = {}
    portfolio.forEach(p => {
      const asset = ASSETS.find(a => a.id === p.assetId)
      if (!asset) return
      if (!merged[p.assetId]) merged[p.assetId] = { asset, positions: [] }
      merged[p.assetId].positions.push(p)
    })
    return Object.values(merged).map(({ asset, positions }) => {
      const totalQty = positions.reduce((s, p) => s + p.qty, 0)
      const avgBuy = positions.reduce((s, p) => s + p.buyPrice * p.qty, 0) / totalQty
      const currentPrice = getPrice(asset.id) || avgBuy
      const value = totalQty * currentPrice
      const invested = totalQty * avgBuy
      const gain = value - invested
      const gainPct = (gain / invested) * 100
      return { asset, totalQty, avgBuy, currentPrice, value, invested, gain, gainPct }
    })
  })()

  const totalValue = portRows.reduce((s, r) => s + r.value, 0)
  const totalInvested = portRows.reduce((s, r) => s + r.invested, 0)
  const totalGain = totalValue - totalInvested
  const totalGainPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#fff', minHeight: '100vh', color: '#111827' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 0 14px', borderBottom:'1px solid rgba(0,0,0,0.07)', marginBottom:20, flexWrap:'wrap', gap:12 }}>
          <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:20, display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#059669', boxShadow:'0 0 0 3px #d1fae5' }}></div>
            InvestBoard
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <div style={{ fontSize:11, color:'#6b7280', fontFamily:'DM Mono', background:'#f8f9fc', border:'1px solid rgba(0,0,0,0.07)', borderRadius:20, padding:'5px 12px' }}>
              {lastUpdated ? `✅ Mis à jour à ${lastUpdated}` : 'Chargement des cours...'}
            </div>
            <button onClick={fetchPrices} disabled={pricesLoading} style={{ background:'#6366f1', color:'#fff', border:'none', borderRadius:8, padding:'6px 14px', fontSize:11, cursor:'pointer', opacity: pricesLoading ? 0.6 : 1 }}>
              {pricesLoading ? '⏳ Chargement...' : '↺ Actualiser'}
            </button>
          </div>
          <div style={{ fontSize:10, color:'#9ca3af', fontStyle:'italic', textAlign:'right', lineHeight:1.5 }}>
            À titre informatif uniquement.<br/>Pas un conseil certifié.
          </div>
        </div>

        {/* NAV TABS */}
        <div style={{ display:'flex', borderBottom:'2px solid rgba(0,0,0,0.07)', marginBottom:24, overflowX:'auto' }}>
          {[['market','📈 Marché'],['portfolio','💼 Mon Portfolio'],['simulator','🧮 Simulateur DCA'],['news','📰 Actualités']].map(([id,label]) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{ padding:'12px 20px', fontSize:13, fontWeight: activeTab===id ? 600 : 500, cursor:'pointer', border:'none', background:'none', color: activeTab===id ? '#6366f1' : '#6b7280', borderBottom: activeTab===id ? '2px solid #6366f1' : '2px solid transparent', marginBottom:-2, whiteSpace:'nowrap', fontFamily:'DM Sans' }}>
              {label}
            </button>
          ))}
        </div>

        {/* ══ TAB: MARCHÉ ══ */}
        {activeTab === 'market' && (
          <div>
            {/* Date & Analysis button */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
              <div style={{ fontSize:13, color:'#6b7280' }}>📅 {today}</div>
              <button onClick={fetchAnalysis} disabled={analysisLoading} style={{ background: analysisLoading ? '#e5e7eb' : '#6366f1', color: analysisLoading ? '#6b7280' : '#fff', border:'none', borderRadius:10, padding:'8px 18px', fontSize:12, cursor:'pointer', fontFamily:'DM Sans', fontWeight:600 }}>
                {analysisLoading ? '⏳ Analyse en cours...' : '🤖 Générer l\'analyse IA du jour'}
              </button>
            </div>

            {/* AI Analysis card */}
            {analysis && (
              <div style={{ background: analysis.sentiment === 'haussier' ? '#f0fdf8' : analysis.sentiment === 'baissier' ? '#fff5f5' : '#f8f9fc', border:`1px solid ${analysis.sentiment === 'haussier' ? 'rgba(5,150,105,0.2)' : analysis.sentiment === 'baissier' ? 'rgba(220,38,38,0.2)' : 'rgba(0,0,0,0.07)'}`, borderRadius:14, padding:20, marginBottom:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <span style={{ fontFamily:'Syne', fontWeight:700, fontSize:15 }}>🤖 Analyse IA — {today}</span>
                  <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background: analysis.sentiment === 'haussier' ? '#d1fae5' : analysis.sentiment === 'baissier' ? '#fee2e2' : '#f0f2f8', color: analysis.sentiment === 'haussier' ? '#059669' : analysis.sentiment === 'baissier' ? '#dc2626' : '#6b7280', fontFamily:'DM Mono', fontWeight:600 }}>
                    {analysis.sentiment} — {analysis.sentimentScore}/100
                  </span>
                </div>
                <p style={{ fontSize:13, lineHeight:1.7, color:'#374151', marginBottom:12 }}>{analysis.summary}</p>
                {analysis.keyEvents?.length > 0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {analysis.keyEvents.map((e: string, i: number) => (
                      <span key={i} style={{ fontSize:11, background:'rgba(99,102,241,0.08)', color:'#6366f1', padding:'3px 10px', borderRadius:20 }}>📌 {e}</span>
                    ))}
                  </div>
                )}
                {analysis.macroOutlook && (
                  <p style={{ fontSize:12, color:'#6b7280', marginTop:10, fontStyle:'italic' }}>🌐 {analysis.macroOutlook}</p>
                )}
              </div>
            )}

            {/* Filters */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, flexWrap:'wrap' }}>
              <div style={{ display:'flex', gap:3, background:'#f8f9fc', border:'1px solid rgba(0,0,0,0.07)', borderRadius:11, padding:3 }}>
                {[['all','Tous'],['low','Faible'],['mid','Modéré'],['high','Élevé']].map(([id,label]) => (
                  <button key={id} onClick={() => setCurCat(id)} style={{ padding:'6px 13px', borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer', border:'none', background: curCat===id ? '#fff' : 'none', color: curCat===id ? '#111827' : '#6b7280', boxShadow: curCat===id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', fontFamily:'DM Sans' }}>
                    {label}
                  </button>
                ))}
              </div>
              <button onClick={() => setPeaMode(!peaMode)} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 13px', borderRadius:9, fontSize:12, fontWeight:600, cursor:'pointer', background: peaMode ? '#0891b2' : '#cffafe', color: peaMode ? '#fff' : '#0891b2', border:`1.5px solid ${peaMode ? '#0891b2' : 'rgba(8,145,178,0.3)'}`, fontFamily:'DM Sans' }}>
                🏦 Filtre PEA {peaMode ? '✓' : ''}
              </button>
            </div>

            {/* Assets table */}
            <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:15, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.08)', marginBottom:20 }}>
              <div style={{ padding:'13px 18px', borderBottom:'1px solid rgba(0,0,0,0.07)', background:'#f8f9fc', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontFamily:'Syne', fontSize:14, fontWeight:700 }}>
                  {curCat === 'all' ? 'Tous les actifs' : curCat === 'low' ? 'Faible risque' : curCat === 'mid' ? 'Modéré' : 'Élevé'}
                  {peaMode ? ' — PEA uniquement' : ''}
                </span>
                <span style={{ fontSize:11, color:'#6b7280' }}>↓ Cliquer pour les détails</span>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'#f8f9fc' }}>
                      {['Actif','PEA','Prix live','Auj.','10 ans','15 ans','Signal'].map(h => (
                        <th key={h} style={{ padding:'9px 13px', fontSize:10, textTransform:'uppercase', letterSpacing:'.07em', color:'#6b7280', fontFamily:'DM Mono', textAlign: h==='Actif' ? 'left' : 'center', borderBottom:'1px solid rgba(0,0,0,0.07)', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssets.map(asset => {
                      const price = getPrice(asset.id)
                      const change = getChange(asset.id)
                      const signal = getSignal(asset.id)
                      const aiReason = analysis?.assetSignals?.[asset.id]?.reason
                      const catColors = { low:'#059669', mid:'#d97706', high:'#dc2626' }
                      const catColor = catColors[asset.cat as keyof typeof catColors]
                      return (
                        <tr key={asset.id} style={{ borderBottom:'1px solid rgba(0,0,0,0.07)', transition:'background .1s' }}
                          onMouseEnter={e => (e.currentTarget.style.background='#f8f9fc')}
                          onMouseLeave={e => (e.currentTarget.style.background='#fff')}>
                          <td style={{ padding:'11px 13px' }}>
                            <div style={{ fontWeight:600, fontSize:13, marginBottom:2 }}>{asset.name}</div>
                            <div style={{ fontSize:11, color:'#6b7280', maxWidth:240 }}>{asset.what.substring(0,70)}…</div>
                            <div style={{ marginTop:3, display:'flex', alignItems:'center', gap:3, flexWrap:'wrap' }}>
                              <span style={{ fontFamily:'DM Mono', fontSize:10, color:'#6366f1', background:'#ede9fe', padding:'2px 6px', borderRadius:4 }}>{asset.id}</span>
                              <span style={{ fontSize:9, fontWeight:600, padding:'2px 6px', borderRadius:4, background: asset.cat==='low' ? '#d1fae5' : asset.cat==='mid' ? '#fef3c7' : '#fee2e2', color: catColor, textTransform:'uppercase' }}>
                                {asset.cat==='low'?'Faible':asset.cat==='mid'?'Modéré':'Élevé'}
                              </span>
                              <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:4, background: asset.pea ? '#cffafe' : '#f3f4f6', color: asset.pea ? '#0891b2' : '#9ca3af' }}>
                                {asset.pea ? 'PEA ✅' : 'Non PEA'}
                              </span>
                              {!asset.pea && asset.peaAlt && peaMode && (
                                <span style={{ fontSize:10, color:'#0891b2', fontFamily:'DM Mono' }}>↳ {asset.peaAlt}</span>
                              )}
                            </div>
                            {aiReason && (
                              <div style={{ fontSize:11, color:'#6366f1', marginTop:4, fontStyle:'italic' }}>🤖 {aiReason}</div>
                            )}
                          </td>
                          <td style={{ textAlign:'center', padding:'11px 13px' }}>{asset.pea ? '✅' : '❌'}</td>
                          <td style={{ padding:'11px 13px', textAlign:'center' }}>
                            <span style={{ fontFamily:'DM Mono', fontSize:13, fontWeight:500 }}>
                              {price > 0 ? price.toLocaleString('fr-FR', { minimumFractionDigits:2, maximumFractionDigits:2 })+' €' : '—'}
                            </span>
                          </td>
                          <td style={{ textAlign:'center', padding:'11px 13px' }}>
                            <span style={{ fontFamily:'DM Mono', fontSize:12, fontWeight:500, color: change >= 0 ? '#059669' : '#dc2626' }}>
                              {price > 0 ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : '—'}
                            </span>
                          </td>
                          <td style={{ textAlign:'center', padding:'11px 13px' }}>
                            <div style={{ fontFamily:'DM Mono', fontSize:12, fontWeight:600, color:'#059669' }}>{asset.p10 ? asset.p10+'%/an' : '—'}</div>
                            <div style={{ width:44, height:4, background:'#f0f2f8', borderRadius:2, overflow:'hidden', margin:'3px auto 0' }}>
                              <div style={{ height:'100%', borderRadius:2, background:catColor, width:`${asset.p10 ? Math.min(100,(asset.p10/60)*100) : 0}%` }}></div>
                            </div>
                          </td>
                          <td style={{ textAlign:'center', padding:'11px 13px' }}>
                            <div style={{ fontFamily:'DM Mono', fontSize:12, fontWeight:600, color:'#059669' }}>{asset.p15 ? asset.p15+'%/an' : '—'}</div>
                          </td>
                          <td style={{ textAlign:'center', padding:'11px 13px' }}>
                            <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, fontFamily:'DM Mono', padding:'3px 9px', borderRadius:20, textTransform:'uppercase',
                              background: signal==='buy' ? '#d1fae5' : signal==='sell' ? '#fee2e2' : '#fef3c7',
                              color: signal==='buy' ? '#059669' : signal==='sell' ? '#dc2626' : '#d97706' }}>
                              <span style={{ width:4, height:4, borderRadius:'50%', background:'currentColor' }}></span>
                              {signal==='buy'?'Acheter':signal==='sell'?'Vendre':'Conserver'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB: PORTFOLIO ══ */}
        {activeTab === 'portfolio' && (
          <div>
            {/* Summary cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
              {[
                { label:'Valeur totale', value: totalValue > 0 ? totalValue.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' €' : '—', color:'#6366f1' },
                { label:'Investi total', value: totalInvested > 0 ? totalInvested.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' €' : '—', color:'#111827' },
                { label:'Gain / Perte', value: totalGain !== 0 ? `${totalGain >= 0 ? '+' : ''}${totalGain.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})} €` : '—', color: totalGain >= 0 ? '#059669' : '#dc2626' },
                { label:'Positions', value: portRows.length.toString(), color:'#7c3aed' },
              ].map(c => (
                <div key={c.label} style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:13, padding:'14px 16px', boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'.08em', color:'#6b7280', marginBottom:4, fontFamily:'DM Mono' }}>{c.label}</div>
                  <div style={{ fontFamily:'Syne', fontSize:20, fontWeight:700, color:c.color }}>{c.value}</div>
                  {c.label === 'Gain / Perte' && totalGain !== 0 && (
                    <div style={{ fontSize:11, color: totalGain >= 0 ? '#059669' : '#dc2626', fontFamily:'DM Mono' }}>
                      {totalGain >= 0 ? '+' : ''}{totalGainPct.toFixed(2)}% depuis achat
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add position form */}
            <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:15, padding:18, marginBottom:18, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
              <div style={{ fontFamily:'Syne', fontSize:14, fontWeight:700, marginBottom:14 }}>➕ Ajouter une position</div>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr auto', gap:10, alignItems:'end' }}>
                <div>
                  <div style={{ fontSize:11, color:'#6b7280', fontWeight:500, marginBottom:4 }}>Actif</div>
                  <select value={posAsset} onChange={e => setPosAsset(e.target.value)} style={{ width:'100%', border:'1px solid rgba(0,0,0,0.13)', borderRadius:8, padding:'8px 10px', fontSize:12, fontFamily:'DM Sans', color:'#111827', background:'#fff' }}>
                    {ASSETS.map(a => <option key={a.id} value={a.id}>{a.id} — {a.name}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize:11, color:'#6b7280', fontWeight:500, marginBottom:4 }}>Quantité</div>
                  <input type="number" value={posQty} onChange={e => setPosQty(e.target.value)} placeholder="ex: 10" style={{ width:'100%', border:'1px solid rgba(0,0,0,0.13)', borderRadius:8, padding:'8px 10px', fontSize:12, fontFamily:'DM Sans', color:'#111827' }} />
                </div>
                <div>
                  <div style={{ fontSize:11, color:'#6b7280', fontWeight:500, marginBottom:4 }}>Prix achat (€)</div>
                  <input type="number" value={posBuyPrice} onChange={e => setPosBuyPrice(e.target.value)} placeholder="ex: 85.00" style={{ width:'100%', border:'1px solid rgba(0,0,0,0.13)', borderRadius:8, padding:'8px 10px', fontSize:12, fontFamily:'DM Sans', color:'#111827' }} />
                </div>
                <div>
                  <div style={{ fontSize:11, color:'#6b7280', fontWeight:500, marginBottom:4 }}>Date achat</div>
                  <input type="date" value={posDate} onChange={e => setPosDate(e.target.value)} style={{ width:'100%', border:'1px solid rgba(0,0,0,0.13)', borderRadius:8, padding:'8px 10px', fontSize:12, fontFamily:'DM Sans', color:'#111827' }} />
                </div>
                <button onClick={addPosition} style={{ background:'#6366f1', color:'#fff', border:'none', borderRadius:8, padding:'8px 16px', fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'DM Sans' }}>
                  Ajouter
                </button>
              </div>
            </div>

            {/* Portfolio table */}
            <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:15, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
              <div style={{ padding:'13px 18px', borderBottom:'1px solid rgba(0,0,0,0.07)', background:'#f8f9fc' }}>
                <span style={{ fontFamily:'Syne', fontSize:14, fontWeight:700 }}>Mes positions</span>
              </div>
              {portRows.length === 0 ? (
                <div style={{ padding:40, textAlign:'center', color:'#6b7280', fontSize:13 }}>
                  🗂️ Ton portfolio est vide. Ajoute tes positions ci-dessus.
                </div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ background:'#f8f9fc' }}>
                        {['Actif','Quantité','Prix achat','Prix actuel','Valeur','Gain/Perte','Signal'].map(h => (
                          <th key={h} style={{ padding:'9px 13px', fontSize:10, textTransform:'uppercase', letterSpacing:'.07em', color:'#6b7280', fontFamily:'DM Mono', textAlign:'left', borderBottom:'1px solid rgba(0,0,0,0.07)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {portRows.map((row, i) => {
                        const signal = getSignal(row.asset.id)
                        return (
                          <tr key={i} style={{ borderBottom:'1px solid rgba(0,0,0,0.07)' }}>
                            <td style={{ padding:'11px 13px' }}>
                              <div style={{ fontWeight:600, fontSize:13 }}>{row.asset.name}</div>
                              <span style={{ fontFamily:'DM Mono', fontSize:10, color:'#6366f1', background:'#ede9fe', padding:'2px 6px', borderRadius:4 }}>{row.asset.id}</span>
                            </td>
                            <td style={{ padding:'11px 13px', fontFamily:'DM Mono', fontSize:12 }}>{row.totalQty.toFixed(4)}</td>
                            <td style={{ padding:'11px 13px', fontFamily:'DM Mono', fontSize:12 }}>{row.avgBuy.toFixed(2)} €</td>
                            <td style={{ padding:'11px 13px', fontFamily:'DM Mono', fontSize:12 }}>{row.currentPrice.toFixed(2)} €</td>
                            <td style={{ padding:'11px 13px', fontFamily:'DM Mono', fontSize:12, fontWeight:600 }}>{row.value.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})} €</td>
                            <td style={{ padding:'11px 13px' }}>
                              <span style={{ fontFamily:'DM Mono', fontSize:12, fontWeight:600, color: row.gain >= 0 ? '#059669' : '#dc2626' }}>
                                {row.gain >= 0 ? '+' : ''}{row.gain.toFixed(2)} €<br/>
                                <span style={{ fontSize:11 }}>{row.gain >= 0 ? '+' : ''}{row.gainPct.toFixed(2)}%</span>
                              </span>
                            </td>
                            <td style={{ padding:'11px 13px' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, fontFamily:'DM Mono', padding:'3px 9px', borderRadius:20, textTransform:'uppercase',
                                  background: signal==='buy' ? '#d1fae5' : signal==='sell' ? '#fee2e2' : '#fef3c7',
                                  color: signal==='buy' ? '#059669' : signal==='sell' ? '#dc2626' : '#d97706' }}>
                                  {signal==='buy'?'Acheter':signal==='sell'?'Vendre':'Conserver'}
                                </span>
                                <button onClick={() => removePosition(i)} style={{ background:'none', border:'1px solid rgba(0,0,0,0.13)', borderRadius:6, width:26, height:26, cursor:'pointer', color:'#dc2626', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Portfolio AI Analysis */}
            {portRows.length > 0 && (
              <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:15, padding:18, marginTop:18, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <span style={{ fontFamily:'Syne', fontSize:14, fontWeight:700 }}>🤖 Analyse de mon portfolio</span>
                  <button onClick={fetchAnalysis} disabled={analysisLoading} style={{ background:'#6366f1', color:'#fff', border:'none', borderRadius:8, padding:'6px 14px', fontSize:11, cursor:'pointer', fontFamily:'DM Sans' }}>
                    {analysisLoading ? '⏳...' : '↺ Analyser'}
                  </button>
                </div>
                {analysis?.portfolioAnalysis ? (
                  <div>
                    <p style={{ fontSize:13, lineHeight:1.7, color:'#374151', marginBottom:14 }}>{analysis.portfolioAnalysis}</p>
                    {analysis.recommendations?.length > 0 && (
                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        {analysis.recommendations.map((r: any, i: number) => (
                          <div key={i} style={{ border:`1px solid ${r.type==='buy'?'rgba(5,150,105,0.25)':r.type==='sell'?'rgba(220,38,38,0.25)':'rgba(99,102,241,0.25)'}`, borderRadius:10, padding:'10px 12px', background: r.type==='buy'?'#f0fdf8':r.type==='sell'?'#fff5f5':'#f5f3ff', fontSize:12, lineHeight:1.6 }}>
                            <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10, marginBottom:5, display:'inline-block', textTransform:'uppercase', background: r.type==='buy'?'#d1fae5':r.type==='sell'?'#fee2e2':'#ede9fe', color: r.type==='buy'?'#059669':r.type==='sell'?'#dc2626':'#7c3aed' }}>
                              {r.type==='buy'?'📥 Acheter':r.type==='sell'?'📤 Vendre':'🔄 Swap'}
                            </span>
                            <strong> {r.asset}</strong><br/>{r.reason}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize:13, color:'#6b7280' }}>Clique sur "Analyser" pour obtenir une analyse personnalisée de ton portfolio basée sur les données du jour.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: SIMULATEUR ══ */}
        {activeTab === 'simulator' && (
          <div style={{ display:'grid', gridTemplateColumns:'380px 1fr', gap:24, alignItems:'start' }}>
            <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:15, padding:22, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
              <div style={{ fontFamily:'Syne', fontSize:15, fontWeight:700, marginBottom:18 }}>🧮 Simulateur DCA</div>
              {[
                { label:'Investissement initial', val:simInit, set:setSimInit, min:0, max:100000, step:500, fmt:(v:number)=>v.toLocaleString('fr-FR')+' €' },
                { label:'Versement mensuel', val:simMonthly, set:setSimMonthly, min:0, max:5000, step:50, fmt:(v:number)=>v.toLocaleString('fr-FR')+' €' },
                { label:'Durée', val:simYears, set:setSimYears, min:1, max:40, step:1, fmt:(v:number)=>v+' ans' },
                { label:'Taux annuel estimé', val:simRate, set:setSimRate, min:1, max:30, step:0.5, fmt:(v:number)=>v+'%/an' },
              ].map(s => (
                <div key={s.label} style={{ marginBottom:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:600, color:'#6b7280', marginBottom:6 }}>
                    <span>{s.label}</span>
                    <span style={{ color:'#6366f1', fontFamily:'DM Mono', fontWeight:700 }}>{s.fmt(s.val)}</span>
                  </div>
                  <input type="range" min={s.min} max={s.max} step={s.step} value={s.val} onChange={e => s.set(parseFloat(e.target.value))} style={{ width:'100%', accentColor:'#6366f1' }} />
                </div>
              ))}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:20 }}>
                {[
                  { label:'Valeur finale', val: calcDCA(simRate,simInit,simMonthly,simYears).toLocaleString('fr-FR')+' €', color:'#d1fae5', textColor:'#059669' },
                  { label:'Total investi', val: (simInit+simMonthly*simYears*12).toLocaleString('fr-FR')+' €', color:'#dbeafe', textColor:'#2563eb' },
                  { label:'Gains', val: (calcDCA(simRate,simInit,simMonthly,simYears)-(simInit+simMonthly*simYears*12)).toLocaleString('fr-FR')+' €', color:'#ede9fe', textColor:'#7c3aed' },
                  { label:'Multiplication', val: `×${(calcDCA(simRate,simInit,simMonthly,simYears)/Math.max(simInit+simMonthly*simYears*12,1)).toFixed(1)}`, color:'#fef3c7', textColor:'#d97706' },
                ].map(c => (
                  <div key={c.label} style={{ borderRadius:12, padding:14, textAlign:'center', background:c.color }}>
                    <div style={{ fontSize:11, color:c.textColor, marginBottom:4, opacity:.8 }}>{c.label}</div>
                    <div style={{ fontFamily:'Syne', fontSize:18, fontWeight:700, color:c.textColor }}>{c.val}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:15, padding:22, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
              <div style={{ fontFamily:'Syne', fontSize:14, fontWeight:700, marginBottom:4 }}>Évolution de ton investissement</div>
              <div style={{ fontSize:11, color:'#6b7280', marginBottom:16 }}>Comparaison des 3 scénarios de risque</div>
              <div style={{ height:300 }}>
                <Line
                  data={{
                    labels: Array.from({length:simYears+1},(_,i)=>i===0?'Maintenant':i+'ans'),
                    datasets: [
                      { label:'Faible (6.2%)', data:Array.from({length:simYears+1},(_,i)=>calcDCA(6.2,simInit,simMonthly,i)), borderColor:'#059669', backgroundColor:'rgba(5,150,105,0.05)', borderWidth:2.5, pointRadius:0, fill:true, tension:0.4 },
                      { label:'Modéré (11.5%)', data:Array.from({length:simYears+1},(_,i)=>calcDCA(11.5,simInit,simMonthly,i)), borderColor:'#d97706', backgroundColor:'rgba(217,119,6,0.05)', borderWidth:2.5, pointRadius:0, fill:true, tension:0.4, borderDash:[6,3] },
                      { label:'Élevé (18.4%)', data:Array.from({length:simYears+1},(_,i)=>calcDCA(18.4,simInit,simMonthly,i)), borderColor:'#dc2626', backgroundColor:'rgba(220,38,38,0.05)', borderWidth:2.5, pointRadius:0, fill:true, tension:0.4, borderDash:[3,3] },
                      { label:'Versements', data:Array.from({length:simYears+1},(_,i)=>simInit+simMonthly*i*12), borderColor:'#9ca3af', borderWidth:1.5, pointRadius:0, fill:false, tension:0, borderDash:[4,4] },
                    ]
                  }}
                  options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'top', labels:{ font:{ size:11 }, boxWidth:20 } } }, scales:{ y:{ ticks:{ callback:(v:any)=>v>=1000000?(v/1000000).toFixed(1)+'M €':v>=1000?(v/1000).toFixed(0)+'k €':v+'€' } } } }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB: NEWS ══ */}
        {activeTab === 'news' && (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div style={{ fontFamily:'Syne', fontSize:16, fontWeight:700 }}>📰 Actualités financières du jour</div>
              <div style={{ fontSize:12, color:'#6b7280' }}>Source : NewsAPI — mis à jour toutes les heures</div>
            </div>
            {news.length === 0 ? (
              <div style={{ padding:40, textAlign:'center', color:'#6b7280' }}>Chargement des actualités...</div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:16 }}>
                {news.map((article, i) => (
                  <a key={i} href={article.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none', color:'inherit' }}>
                    <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:14, padding:18, boxShadow:'0 1px 3px rgba(0,0,0,0.08)', height:'100%', transition:'box-shadow .15s', cursor:'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)')}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,0.08)')}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                        <span style={{ fontSize:10, fontWeight:600, color:'#6366f1', background:'#ede9fe', padding:'2px 8px', borderRadius:10, fontFamily:'DM Mono' }}>{article.source}</span>
                        <span style={{ fontSize:10, color:'#9ca3af', fontFamily:'DM Mono' }}>{new Date(article.publishedAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div style={{ fontWeight:600, fontSize:13, lineHeight:1.5, marginBottom:8, color:'#111827' }}>{article.title}</div>
                      <div style={{ fontSize:12, color:'#6b7280', lineHeight:1.6 }}>{article.description?.substring(0,150)}…</div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}