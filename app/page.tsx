'use client'

import { useState, useEffect, useCallback } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler)

const ASSETS = [
  { id:'IWDA', name:'iShares Core MSCI World UCITS', cat:'low', pea:true, peaAlt:null, what:'ETF UCITS répliquant 1 500 grandes entreprises dans 23 pays développés (USA 70%, Europe, Japon). BlackRock. Frais 0.20%/an.', p10:9.8, p15:10.2, pe:'19.8x', ytd:'+6.1%', maxDD:'-32%', vol:'Faible', sharpe:'0.72' },
  { id:'VWCE', name:'Vanguard FTSE All-World UCITS', cat:'low', pea:true, peaAlt:null, what:'~3 700 actions couvrant 90% de la capitalisation mondiale (développés + émergents). Vanguard. Frais 0.22%/an.', p10:10.1, p15:null, pe:'18.4x', ytd:'+6.4%', maxDD:'-33%', vol:'Faible', sharpe:'0.74' },
  { id:'ERNS', name:'Amundi ETF Overnight €STR', cat:'low', pea:true, peaAlt:null, what:'ETF monétaire euros répliquant les dépôts overnight zone euro. Équivalent institutionnel d\'un livret. Amundi. Frais 0.10%/an.', p10:1.8, p15:1.6, pe:'—', ytd:'+1.4%', maxDD:'-0.5%', vol:'Quasi-nulle', sharpe:'0.95' },
  { id:'AGG', name:'iShares Core US Agg Bond', cat:'low', pea:false, peaAlt:'IEAG', what:'ETF obligataire US diversifié. Stabilisateur de portefeuille. Non éligible PEA — équivalent: IEAG. BlackRock. Frais 0.03%/an.', p10:2.1, p15:2.8, pe:'—', ytd:'+1.2%', maxDD:'-18%', vol:'Très faible', sharpe:'0.45' },
  { id:'SPY', name:'SPDR S&P 500 ETF', cat:'mid', pea:false, peaAlt:'CSP1', what:'Le plus grand ETF au monde — les 500 plus grandes entreprises US. Non éligible PEA — équivalent: CSP1. State Street. Frais 0.09%/an.', p10:13.2, p15:14.1, pe:'22.4x', ytd:'+8.4%', maxDD:'-34%', vol:'Modérée', sharpe:'0.88' },
  { id:'QQQ', name:'Invesco NASDAQ-100 ETF', cat:'mid', pea:false, peaAlt:'EQQQ', what:'Top 100 entreprises non-financières du NASDAQ. Très concentré tech. Non éligible PEA — équivalent: EQQQ. Frais 0.20%/an.', p10:17.8, p15:18.3, pe:'28.1x', ytd:'+10.2%', maxDD:'-38%', vol:'Modérée', sharpe:'0.81' },
  { id:'VIG', name:'Vanguard Dividend Appreciation', cat:'mid', pea:false, peaAlt:'VGWD', what:'ETF concentré sur les entreprises qui augmentent leurs dividendes depuis 10+ ans. Non éligible PEA — équivalent: VGWD. Frais 0.06%/an.', p10:11.4, p15:12.1, pe:'21.3x', ytd:'+7.2%', maxDD:'-28%', vol:'Modérée', sharpe:'0.86' },
  { id:'HLTH', name:'iShares Healthcare Innovation UCITS', cat:'mid', pea:true, peaAlt:null, what:'ETF santé mondial UCITS. Eli Lilly, Novo Nordisk, biotech. Éligible PEA directement. BlackRock. Frais 0.25%/an.', p10:10.4, p15:11.2, pe:'17.8x', ytd:'+4.8%', maxDD:'-26%', vol:'Modérée', sharpe:'0.76' },
  { id:'MSCI', name:'MSCI Inc.', cat:'mid', pea:false, peaAlt:null, what:'Fournisseur d\'indices boursiers mondiaux. Quasi-monopole. Modèle abonnements ultra-récurrents. Siège USA — CTO uniquement.', p10:22.8, p15:null, pe:'37.2x', ytd:'+9.1%', maxDD:'-40%', vol:'Modérée', sharpe:'0.92' },
  { id:'NVDA', name:'NVIDIA Corporation', cat:'high', pea:false, peaAlt:'SEMI', what:'Leader mondial des puces GPU pour l\'IA. Ses puces équipent OpenAI, Google, Microsoft. Siège USA — non PEA. Équivalent PEA: SEMI.', p10:58.2, p15:44.1, pe:'52.3x', ytd:'+18.4%', maxDD:'-66%', vol:'Très élevée', sharpe:'1.12' },
  { id:'MSFT', name:'Microsoft Corporation', cat:'high', pea:false, peaAlt:'EQQQ', what:'Azure cloud, Office 365, IA via OpenAI (Copilot). Siège USA — non PEA. Via PEA: EQQQ donne ~8% expo Microsoft.', p10:29.1, p15:23.4, pe:'33.8x', ytd:'+7.8%', maxDD:'-38%', vol:'Élevée', sharpe:'0.98' },
  { id:'ASML', name:'ASML Holding', cat:'high', pea:true, peaAlt:null, what:'Monopole mondial machines lithographie EUV. Sans ASML, pas de puces NVIDIA ni Apple Silicon. Siège Pays-Bas — ÉLIGIBLE PEA.', p10:31.4, p15:28.7, pe:'38.2x', ytd:'+12.4%', maxDD:'-55%', vol:'Élevée', sharpe:'0.88' },
  { id:'NOVO', name:'Novo Nordisk', cat:'high', pea:true, peaAlt:null, what:'N°1 mondial insuline & obésité (Ozempic, Wegovy). A été la 1ère capitalisation d\'Europe. Siège Danemark — ÉLIGIBLE PEA.', p10:25.4, p15:22.8, pe:'24.8x', ytd:'-8.4%', maxDD:'-50%', vol:'Élevée', sharpe:'0.84' },
  { id:'SEMI', name:'iShares MSCI Global Semiconductors UCITS', cat:'high', pea:true, peaAlt:null, what:'ETF semis UCITS — NVIDIA, TSMC, Broadcom, AMD... 30 valeurs. Éligible PEA. BlackRock. Frais 0.35%/an.', p10:26.8, p15:23.1, pe:'28.4x', ytd:'+14.2%', maxDD:'-60%', vol:'Très élevée', sharpe:'0.79' },
  { id:'VWO', name:'iShares Core MSCI Emerging Markets UCITS', cat:'high', pea:true, peaAlt:null, what:'Marchés émergents UCITS — Inde (22%), Chine (25%), Taiwan... 2600+ actions. Éligible PEA. BlackRock. Frais 0.18%/an.', p10:4.2, p15:5.8, pe:'12.4x', ytd:'+7.1%', maxDD:'-52%', vol:'Élevée', sharpe:'0.41' },
  { id:'LVMH', name:'LVMH Moët Hennessy', cat:'high', pea:true, peaAlt:null, what:'N°1 mondial luxe. Louis Vuitton, Dior, Sephora, Bulgari... 75 maisons. Siège Paris — ÉLIGIBLE PEA directement.', p10:18.4, p15:19.2, pe:'21.4x', ytd:'+3.2%', maxDD:'-45%', vol:'Élevée', sharpe:'0.74' },
  { id:'IBIT', name:'iShares Bitcoin Trust ETF', cat:'high', pea:false, peaAlt:null, what:'ETF Bitcoin spot BlackRock. Détient directement du Bitcoin. Domicilié USA — non PEA. CTO uniquement. Frais 0.25%/an.', p10:null, p15:null, pe:'—', ytd:'+22.4%', maxDD:'-75%', vol:'Extrême', sharpe:'0.62' },
  { id:'ARKK', name:'ARK Innovation ETF', cat:'high', pea:false, peaAlt:null, what:'ETF actif Cathie Wood. Disruptif mais sous-performance chronique depuis 2021. Frais très élevés 0.75%/an. Non PEA.', p10:4.1, p15:null, pe:'—', ytd:'-8.2%', maxDD:'-80%', vol:'Extrême', sharpe:'0.24' },
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
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null)
  const [signalReasons, setSignalReasons] = useState<Record<string, string>>({})
  const [signalLoading, setSignalLoading] = useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [portfolio, setPortfolio] = useState<PortfolioPosition[]>([])
  const [posAsset, setPosAsset] = useState('IWDA')
  const [posQty, setPosQty] = useState('')
  const [posBuyPrice, setPosBuyPrice] = useState('')
  const [posDate, setPosDate] = useState('')
  const [simInit, setSimInit] = useState(1000)
  const [simMonthly, setSimMonthly] = useState(200)
  const [simYears, setSimYears] = useState(20)
  const [simRate, setSimRate] = useState(11.5)
  const [globalSearch, setGlobalSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedResult, setSelectedResult] = useState<any>(null)
  const [selectedPrice, setSelectedPrice] = useState<any>(null)
  const [selectedPriceLoading, setSelectedPriceLoading] = useState(false)
  const [assets, setAssets] = useState<any[]>([])
  const [assetsLoading, setAssetsLoading] = useState(true)
  const [addingAsset, setAddingAsset] = useState(false)
  const [valuationFile, setValuationFile] = useState(null)
  const [valuationPrice, setValuationPrice] = useState("")
  const [valuationCurrency, setValuationCurrency] = useState("USD")
  const [valuationLoading, setValuationLoading] = useState(false)
  const [valuation, setValuation] = useState<any>(null)
  const [valuationError, setValuationError] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem('ib_portfolio')
    if (saved) setPortfolio(JSON.parse(saved))
    fetchAssets()
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
    savePortfolio([...portfolio, { assetId: posAsset, qty: parseFloat(posQty), buyPrice: parseFloat(posBuyPrice), date: posDate || new Date().toISOString().split('T')[0] }])
    setPosQty(''); setPosBuyPrice(''); setPosDate('')
  }

  const removePosition = (idx: number) => savePortfolio(portfolio.filter((_, i) => i !== idx))

  const getSignal = (id: string): Signal => {
    if (analysis?.assetSignals?.[id]?.signal) return analysis.assetSignals[id].signal
    const defaults: Record<string, Signal> = { IWDA:'buy',VWCE:'buy',ERNS:'hold',AGG:'hold',SPY:'buy',QQQ:'buy',VIG:'buy',HLTH:'buy',MSCI:'buy',NVDA:'hold',MSFT:'buy',ASML:'buy',NOVO:'buy',SEMI:'buy',VWO:'hold',LVMH:'buy',IBIT:'hold',ARKK:'sell' }
    return defaults[id] || 'hold'
  }

  const getPrice = (id: string) => prices[id]?.price || 0
  const getChange = (id: string) => prices[id]?.changePercent || 0

  const calcDCA = (rate: number, init: number, monthly: number, years: number) => {
    let v = init
    const mr = rate / 100 / 12
    for (let m = 0; m < years * 12; m++) v = v * (1 + mr) + monthly
    return Math.round(v)
  }

  const fetchGlobalSearch = async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return }
    setSearchLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setSearchResults(data.results || [])
    } catch(e) { console.error(e) }
    setSearchLoading(false)
  }

  const fetchSelectedPrice = async (symbol: string, name: string) => {
    setSelectedResult({ symbol, name })
    setSelectedPrice(null)
    setSelectedPriceLoading(true)
    try {
      const res = await fetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symbol }) })
      const data = await res.json()
      setSelectedPrice(data)
    } catch(e) { console.error(e) }
    setSelectedPriceLoading(false)
  }

  const fetchAssets = async () => {
    setAssetsLoading(true)
    try {
      const res = await fetch("/api/assets")
      const data = await res.json()
      if (data.assets) setAssets(data.assets)
    } catch(e) { console.error(e) }
    setAssetsLoading(false)
  }

  const addAssetFromSearch = async (symbol: string, name: string, exchange: string, type: string) => {
    setAddingAsset(true)
    try {
      const res = await fetch("/api/assets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symbol, name, exchange, type }) })
      const data = await res.json()
      if (data.asset) {
        setAssets((prev: any) => [...prev.filter((a: any) => a.id !== data.asset.id), data.asset])
        setGlobalSearch(""); setSearchResults([]); setSelectedResult(null); setSelectedPrice(null)
        alert("✅ " + name + " ajouté!")
      }
    } catch(e) { console.error(e) }
    setAddingAsset(false)
  }

const analyzeValuation = async () => {
  if (!valuationFile) return
  setValuationLoading(true)
  setValuationError('')
  try {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const result = e.target?.result as string
        const base64 = result.includes(',') ? result.split(',')[1] : result
        const limited = base64.substring(0, 1000000)
        const res = await fetch('/api/valuation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64: limited, currentPrice: valuationPrice, currency: valuationCurrency })
        })
        const data = await res.json()
        if (data.valuation) setValuation(data.valuation)
        else setValuationError(data.error || 'Erreur inconnue')
      } catch(e: any) { setValuationError(e.message) }
      setValuationLoading(false)
    }
    reader.readAsDataURL(valuationFile)
  } catch(e: any) {
    setValuationError(e.message)
    setValuationLoading(false)
  }
}

  const fetchSignalReason = async (asset: typeof ASSETS[0]) => {
    if (signalReasons[asset.id] || signalLoading[asset.id]) return
    setSignalLoading(prev => ({ ...prev, [asset.id]: true }))
    try {
      const res = await fetch("/api/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: asset.id, assetName: asset.name, price: getPrice(asset.id), changePercent: getChange(asset.id), p10: asset.p10, p15: asset.p15, cat: asset.cat, pea: asset.pea }),
      })
      const data = await res.json()
      if (data.reason) setSignalReasons(prev => ({ ...prev, [asset.id]: data.reason }))
    } catch (e) { console.error(e) }
    setSignalLoading(prev => ({ ...prev, [asset.id]: false }))
  }

  const filteredAssets = assets
    .filter(a => curCat === 'all' || a.cat === curCat)
    .filter(a => !peaMode || a.pea)
    .filter(a => !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.id.toLowerCase().includes(searchQuery.toLowerCase()))

  const today = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })

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

  const SignalBadge = ({ signal }: { signal: Signal }) => (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, fontFamily:'DM Mono', padding:'3px 9px', borderRadius:20, textTransform:'uppercase',
      background: signal==='buy' ? '#d1fae5' : signal==='sell' ? '#fee2e2' : '#fef3c7',
      color: signal==='buy' ? '#059669' : signal==='sell' ? '#dc2626' : '#d97706' }}>
      <span style={{ width:4, height:4, borderRadius:'50%', background:'currentColor' }}></span>
      {signal==='buy' ? 'Acheter' : signal==='sell' ? 'Vendre' : 'Conserver'}
    </span>
  )

  return (
    <div style={{ fontFamily:"'DM Sans', sans-serif", background:'#fff', minHeight:'100vh', color:'#111827' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

      <div style={{ maxWidth:1400, margin:'0 auto', padding:'0 24px' }}>

        {/* HEADER */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 0 14px', borderBottom:'1px solid rgba(0,0,0,0.07)', marginBottom:20, flexWrap:'wrap', gap:12 }}>
          <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:20, display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#059669', boxShadow:'0 0 0 3px #d1fae5' }}></div>
            InvestBoard
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <div style={{ fontSize:11, color:'#6b7280', fontFamily:'DM Mono', background:'#f8f9fc', border:'1px solid rgba(0,0,0,0.07)', borderRadius:20, padding:'5px 12px' }}>
              {lastUpdated ? `✅ Mis à jour à ${lastUpdated}` : 'Chargement des cours...'}
            </div>
            <button onClick={fetchPrices} disabled={pricesLoading} style={{ background:'#6366f1', color:'#fff', border:'none', borderRadius:8, padding:'6px 14px', fontSize:11, cursor:'pointer', opacity:pricesLoading?0.6:1, fontFamily:'DM Sans' }}>
              {pricesLoading ? '⏳ Chargement...' : '↺ Actualiser'}
            </button>
          </div>
          <div style={{ fontSize:10, color:'#9ca3af', fontStyle:'italic', textAlign:'right', lineHeight:1.5 }}>
            À titre informatif uniquement.<br/>Pas un conseil certifié.
          </div>
        </div>

        {/* NAV TABS */}
        <div style={{ display:'flex', borderBottom:'2px solid rgba(0,0,0,0.07)', marginBottom:24, overflowX:'auto' }}>
          {[['market','📈 Marché'],['portfolio','💼 Mon Portfolio'],['simulator','🧮 Simulateur DCA'],['news','📰 Actualités'],['valuation','📊 Valorisation']].map(([id,label]) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{ padding:'12px 20px', fontSize:13, fontWeight:activeTab===id?600:500, cursor:'pointer', border:'none', background:'none', color:activeTab===id?'#6366f1':'#6b7280', borderBottom:activeTab===id?'2px solid #6366f1':'2px solid transparent', marginBottom:-2, whiteSpace:'nowrap', fontFamily:'DM Sans' }}>
              {label}
            </button>
          ))}
        </div>
        {/* ══ TAB: MARCHÉ ══ */}
        {activeTab === 'market' && (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
              <div style={{ fontSize:13, color:'#6b7280' }}>📅 {today}</div>
              <button onClick={fetchAnalysis} disabled={analysisLoading} style={{ background:analysisLoading?'#e5e7eb':'#6366f1', color:analysisLoading?'#6b7280':'#fff', border:'none', borderRadius:10, padding:'8px 18px', fontSize:12, cursor:'pointer', fontFamily:'DM Sans', fontWeight:600 }}>
                {analysisLoading ? '⏳ Analyse en cours...' : '🤖 Générer l\'analyse IA du jour'}
              </button>
            </div>

            {analysis && (
              <div style={{ background:analysis.sentiment==='haussier'?'#f0fdf8':analysis.sentiment==='baissier'?'#fff5f5':'#f8f9fc', border:`1px solid ${analysis.sentiment==='haussier'?'rgba(5,150,105,0.2)':analysis.sentiment==='baissier'?'rgba(220,38,38,0.2)':'rgba(0,0,0,0.07)'}`, borderRadius:14, padding:20, marginBottom:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <span style={{ fontFamily:'Syne', fontWeight:700, fontSize:15 }}>🤖 Analyse IA — {today}</span>
                  <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:analysis.sentiment==='haussier'?'#d1fae5':analysis.sentiment==='baissier'?'#fee2e2':'#f0f2f8', color:analysis.sentiment==='haussier'?'#059669':analysis.sentiment==='baissier'?'#dc2626':'#6b7280', fontFamily:'DM Mono', fontWeight:600 }}>
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

            {/* Filters + Search */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, flexWrap:'wrap' }}>
              <div style={{ display:'flex', gap:3, background:'#f8f9fc', border:'1px solid rgba(0,0,0,0.07)', borderRadius:11, padding:3 }}>
                {[['all','Tous'],['low','Faible'],['mid','Modéré'],['high','Élevé']].map(([id,label]) => (
                  <button key={id} onClick={() => setCurCat(id)} style={{ padding:'6px 13px', borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer', border:'none', background:curCat===id?'#fff':'none', color:curCat===id?'#111827':'#6b7280', boxShadow:curCat===id?'0 1px 3px rgba(0,0,0,0.08)':'none', fontFamily:'DM Sans' }}>
                    {label}
                  </button>
                ))}
              </div>
              <button onClick={() => setPeaMode(!peaMode)} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 13px', borderRadius:9, fontSize:12, fontWeight:600, cursor:'pointer', background:peaMode?'#0891b2':'#cffafe', color:peaMode?'#fff':'#0891b2', border:`1.5px solid ${peaMode?'#0891b2':'rgba(8,145,178,0.3)'}`, fontFamily:'DM Sans' }}>
                🏦 Filtre PEA {peaMode ? '✓' : ''}
              </button>
              <input
                type="text"
                placeholder="🔍 Rechercher un actif..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ flex:1, minWidth:180, border:'1px solid rgba(0,0,0,0.13)', borderRadius:9, padding:'7px 12px', fontSize:12, fontFamily:'DM Sans', color:'#111827', outline:'none' }}
              />
            </div>

            {/* Assets table */}
            <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:15, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.08)', marginBottom:20 }}>
              <div style={{ padding:'13px 18px', borderBottom:'1px solid rgba(0,0,0,0.07)', background:'#f8f9fc', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontFamily:'Syne', fontSize:14, fontWeight:700 }}>
                  {curCat==='all'?'Tous les actifs':curCat==='low'?'Faible risque':curCat==='mid'?'Modéré':'Élevé'}
                  {peaMode?' — PEA uniquement':''}
                </span>
                <span style={{ fontSize:11, color:'#6b7280' }}>↓ Cliquer sur une ligne pour les détails</span>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'#f8f9fc' }}>
                      {['Actif','PEA','Prix live','Auj.','10 ans','15 ans','Signal'].map(h => (
                        <th key={h} style={{ padding:'9px 13px', fontSize:10, textTransform:'uppercase', letterSpacing:'.07em', color:'#6b7280', fontFamily:'DM Mono', textAlign:h==='Actif'?'left':'center', borderBottom:'1px solid rgba(0,0,0,0.07)', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssets.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign:'center', padding:30, color:'#6b7280' }}>Aucun actif trouvé pour "{searchQuery}"</td></tr>
                    )}
                    {filteredAssets.map(asset => {
                      const price = getPrice(asset.id)
                      const change = getChange(asset.id)
                      const signal = getSignal(asset.id)
                      const isExpanded = expandedAsset === asset.id
                      const catColors = { low:'#059669', mid:'#d97706', high:'#dc2626' }
                      const catColor = catColors[asset.cat as keyof typeof catColors]
                      return (
                        <>
                          <tr key={asset.id}
                            style={{ borderBottom: isExpanded ? 'none' : '1px solid rgba(0,0,0,0.07)', transition:'background .1s', cursor:'pointer', background: isExpanded ? '#f5f3ff' : '#fff' }}
                            onClick={() => { const newExpanded = expandedAsset === asset.id ? null : asset.id; setExpandedAsset(newExpanded); if (newExpanded) fetchSignalReason(asset); }}
                            onMouseEnter={e => { if(!isExpanded) e.currentTarget.style.background='#f8f9fc' }}
                            onMouseLeave={e => { if(!isExpanded) e.currentTarget.style.background='#fff' }}>
                            <td style={{ padding:'11px 13px' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                <span style={{ fontSize:12, color: isExpanded ? '#6366f1' : '#9ca3af', transition:'transform .2s', display:'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                                <div>
                                  <div style={{ fontWeight:600, fontSize:13, marginBottom:2 }}>{asset.name}</div>
                                  <div style={{ fontSize:11, color:'#6b7280', maxWidth:240 }}>{asset.what.substring(0,70)}…</div>
                                  <div style={{ marginTop:3, display:'flex', alignItems:'center', gap:3, flexWrap:'wrap' }}>
                                    <span style={{ fontFamily:'DM Mono', fontSize:10, color:'#6366f1', background:'#ede9fe', padding:'2px 6px', borderRadius:4 }}>{asset.id}</span>
                                    <span style={{ fontSize:9, fontWeight:600, padding:'2px 6px', borderRadius:4, background:asset.cat==='low'?'#d1fae5':asset.cat==='mid'?'#fef3c7':'#fee2e2', color:catColor, textTransform:'uppercase' }}>
                                      {asset.cat==='low'?'Faible':asset.cat==='mid'?'Modéré':'Élevé'}
                                    </span>
                                    <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:4, background:asset.pea?'#cffafe':'#f3f4f6', color:asset.pea?'#0891b2':'#9ca3af' }}>
                                      {asset.pea?'PEA ✅':'Non PEA'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ textAlign:'center', padding:'11px 13px' }}>{asset.pea?'✅':'❌'}</td>
                            <td style={{ padding:'11px 13px', textAlign:'center' }}>
                              <span style={{ fontFamily:'DM Mono', fontSize:13, fontWeight:500 }}>
                                {price > 0 ? price.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' €' : '—'}
                              </span>
                            </td>
                            <td style={{ textAlign:'center', padding:'11px 13px' }}>
                              <span style={{ fontFamily:'DM Mono', fontSize:12, fontWeight:500, color:change>=0?'#059669':'#dc2626' }}>
                                {price > 0 ? `${change>=0?'+':''}${change.toFixed(2)}%` : '—'}
                              </span>
                            </td>
                            <td style={{ textAlign:'center', padding:'11px 13px' }}>
                              <div style={{ fontFamily:'DM Mono', fontSize:12, fontWeight:600, color:'#059669' }}>{asset.p10?asset.p10+'%/an':'—'}</div>
                              <div style={{ width:44, height:4, background:'#f0f2f8', borderRadius:2, overflow:'hidden', margin:'3px auto 0' }}>
                                <div style={{ height:'100%', borderRadius:2, background:catColor, width:`${asset.p10?Math.min(100,(asset.p10/60)*100):0}%` }}></div>
                              </div>
                            </td>
                            <td style={{ textAlign:'center', padding:'11px 13px' }}>
                              <div style={{ fontFamily:'DM Mono', fontSize:12, fontWeight:600, color:'#059669' }}>{asset.p15?asset.p15+'%/an':'—'}</div>
                            </td>
                            <td style={{ textAlign:'center', padding:'11px 13px' }}>
                              <SignalBadge signal={signal} />
                            </td>
                          </tr>

                          {/* DETAIL ROW */}
                          {isExpanded && (
                            <tr style={{ borderBottom:'1px solid rgba(0,0,0,0.07)' }}>
                              <td colSpan={7} style={{ padding:0, background:'#fafbff' }}>
                                <div style={{ padding:'16px 20px' }}>
                                  {/* Stats row */}
                                  <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:16, paddingBottom:16, borderBottom:'1px solid rgba(0,0,0,0.07)' }}>
                                    {[
                                      { label:'P/E Ratio', value: asset.pe },
                                      { label:'YTD 2026', value: asset.ytd, color: asset.ytd?.startsWith('+') ? '#059669' : '#dc2626' },
                                      { label:'Max Drawdown', value: asset.maxDD, color:'#dc2626' },
                                      { label:'Volatilité', value: asset.vol },
                                      { label:'Sharpe ratio', value: asset.sharpe },
                                    ].map(stat => (
                                      <div key={stat.label} style={{ textAlign:'center', background:'#fff', borderRadius:10, padding:'10px 8px', border:'1px solid rgba(0,0,0,0.07)' }}>
                                        <div style={{ fontSize:10, color:'#9ca3af', fontFamily:'DM Mono', textTransform:'uppercase', marginBottom:5, letterSpacing:'.06em' }}>{stat.label}</div>
                                        <div style={{ fontSize:14, fontWeight:600, fontFamily:'DM Mono', color: stat.color || '#111827' }}>{stat.value}</div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Description + PEA */}
                                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, fontSize:12, color:'#6b7280', lineHeight:1.7, marginBottom: analysis?.assetSignals?.[asset.id]?.reason ? 12 : 0 }}>
                                    <div style={{ padding:'12px 14px', borderRadius:10, border:'1px solid rgba(0,0,0,0.07)', background:'#fff' }}>
                                      <div style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'.07em', color:'#9ca3af', marginBottom:6, fontFamily:'DM Mono' }}>📋 Description complète</div>
                                      <div style={{ color:'#374151' }}>{asset.what}</div>
                                      {asset.peaAlt && (
                                        <div style={{ marginTop:8, padding:'6px 10px', background:'#e0f2fe', borderRadius:6, color:'#0891b2', fontSize:11, fontWeight:500 }}>
                                          ↳ Équivalent PEA recommandé : <strong>{asset.peaAlt}</strong>
                                        </div>
                                      )}
                                    </div>
                                    <div style={{ padding:'12px 14px', borderRadius:10, border:`1px solid ${asset.pea?'rgba(8,145,178,0.2)':'rgba(220,38,38,0.2)'}`, background:asset.pea?'#f0fdfe':'#fff5f5' }}>
                                      <div style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'.07em', color:'#9ca3af', marginBottom:6, fontFamily:'DM Mono' }}>🏦 Éligibilité PEA</div>
                                      {asset.pea ? (
                                        <>
                                          <div style={{ fontWeight:700, color:'#0891b2', fontSize:13, marginBottom:4 }}>✅ Éligible PEA</div>
                                          <div style={{ color:'#374151' }}>Disponible chez Trade Republic et Fortuneo. Domicilié UE/EEE ou siège dans l'UE.</div>
                                        </>
                                      ) : (
                                        <>
                                          <div style={{ fontWeight:700, color:'#dc2626', fontSize:13, marginBottom:4 }}>❌ Non éligible PEA</div>
                                          <div style={{ color:'#374151' }}>{asset.peaAlt ? `Utiliser <strong>${asset.peaAlt}</strong> à la place dans ton PEA.` : 'À détenir dans un CTO uniquement.'}</div>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {/* AI reason if available */}
                                  <div style={{ padding:"10px 14px", background:"rgba(99,102,241,0.06)", borderRadius:10, border:"1px solid rgba(99,102,241,0.15)", fontSize:12, color:"#6366f1", lineHeight:1.7, marginTop:12 }}><strong>💡 Pourquoi ce signal ?</strong><br/>{signalLoading[asset.id] ? (<span style={{ color:"#9ca3af", fontStyle:"italic" }}>⏳ Analyse en cours...</span>) : signalReasons[asset.id] ? (signalReasons[asset.id]) : (<span style={{ color:"#9ca3af", fontStyle:"italic" }}>Chargement...</span>)}</div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
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
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
              {[
                { label:'Valeur totale', value:totalValue>0?totalValue.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' €':'—', color:'#6366f1' },
                { label:'Investi total', value:totalInvested>0?totalInvested.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' €':'—', color:'#111827' },
                { label:'Gain / Perte', value:totalGain!==0?`${totalGain>=0?'+':''}${totalGain.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})} €`:'—', color:totalGain>=0?'#059669':'#dc2626' },
                { label:'Positions', value:portRows.length.toString(), color:'#7c3aed' },
              ].map(c => (
                <div key={c.label} style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:13, padding:'14px 16px', boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'.08em', color:'#6b7280', marginBottom:4, fontFamily:'DM Mono' }}>{c.label}</div>
                  <div style={{ fontFamily:'Syne', fontSize:20, fontWeight:700, color:c.color }}>{c.value}</div>
                  {c.label==='Gain / Perte' && totalGain!==0 && (
                    <div style={{ fontSize:11, color:totalGain>=0?'#059669':'#dc2626', fontFamily:'DM Mono' }}>{totalGain>=0?'+':''}{totalGainPct.toFixed(2)}% depuis achat</div>
                  )}
                </div>
              ))}
            </div>

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
                <button onClick={addPosition} style={{ background:'#6366f1', color:'#fff', border:'none', borderRadius:8, padding:'8px 16px', fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'DM Sans' }}>Ajouter</button>
              </div>
            </div>

            <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:15, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
              <div style={{ padding:'13px 18px', borderBottom:'1px solid rgba(0,0,0,0.07)', background:'#f8f9fc' }}>
                <span style={{ fontFamily:'Syne', fontSize:14, fontWeight:700 }}>Mes positions</span>
              </div>
              {portRows.length === 0 ? (
                <div style={{ padding:40, textAlign:'center', color:'#6b7280', fontSize:13 }}>🗂️ Ton portfolio est vide. Ajoute tes positions ci-dessus.</div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ background:'#f8f9fc' }}>
                        {['Actif','Quantité','Prix achat','Prix actuel','Valeur','Gain/Perte','Signal',''].map(h => (
                          <th key={h} style={{ padding:'9px 13px', fontSize:10, textTransform:'uppercase', letterSpacing:'.07em', color:'#6b7280', fontFamily:'DM Mono', textAlign:'left', borderBottom:'1px solid rgba(0,0,0,0.07)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {portRows.map((row, i) => (
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
                            <span style={{ fontFamily:'DM Mono', fontSize:12, fontWeight:600, color:row.gain>=0?'#059669':'#dc2626' }}>
                              {row.gain>=0?'+':''}{row.gain.toFixed(2)} €<br/>
                              <span style={{ fontSize:11 }}>{row.gain>=0?'+':''}{row.gainPct.toFixed(2)}%</span>
                            </span>
                          </td>
                          <td style={{ padding:'11px 13px' }}><SignalBadge signal={getSignal(row.asset.id)} /></td>
                          <td style={{ padding:'11px 13px' }}>
                            <button onClick={() => removePosition(i)} style={{ background:'none', border:'1px solid rgba(0,0,0,0.13)', borderRadius:6, width:26, height:26, cursor:'pointer', color:'#dc2626', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {portRows.length > 0 && (
              <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:15, padding:18, marginTop:18, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <span style={{ fontFamily:'Syne', fontSize:14, fontWeight:700 }}>🤖 Analyse de mon portfolio</span>
                  <button onClick={fetchAnalysis} disabled={analysisLoading} style={{ background:'#6366f1', color:'#fff', border:'none', borderRadius:8, padding:'6px 14px', fontSize:11, cursor:'pointer', fontFamily:'DM Sans' }}>
                    {analysisLoading?'⏳...':'↺ Analyser'}
                  </button>
                </div>
                {analysis?.portfolioAnalysis ? (
                  <div>
                    <p style={{ fontSize:13, lineHeight:1.7, color:'#374151', marginBottom:14 }}>{analysis.portfolioAnalysis}</p>
                    {analysis.recommendations?.length > 0 && (
                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        {analysis.recommendations.map((r: any, i: number) => (
                          <div key={i} style={{ border:`1px solid ${r.type==='buy'?'rgba(5,150,105,0.25)':r.type==='sell'?'rgba(220,38,38,0.25)':'rgba(99,102,241,0.25)'}`, borderRadius:10, padding:'10px 12px', background:r.type==='buy'?'#f0fdf8':r.type==='sell'?'#fff5f5':'#f5f3ff', fontSize:12, lineHeight:1.6 }}>
                            <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10, marginBottom:5, display:'inline-block', textTransform:'uppercase', background:r.type==='buy'?'#d1fae5':r.type==='sell'?'#fee2e2':'#ede9fe', color:r.type==='buy'?'#059669':r.type==='sell'?'#dc2626':'#7c3aed' }}>
                              {r.type==='buy'?'📥 Acheter':r.type==='sell'?'📤 Vendre':'🔄 Swap'}
                            </span>
                            <strong> {r.asset}</strong><br/>{r.reason}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize:13, color:'#6b7280' }}>Clique sur "Analyser" pour obtenir une analyse personnalisée basée sur les données du jour.</p>
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
                  { label:'Valeur finale', val:calcDCA(simRate,simInit,simMonthly,simYears).toLocaleString('fr-FR')+' €', color:'#d1fae5', textColor:'#059669' },
                  { label:'Total investi', val:(simInit+simMonthly*simYears*12).toLocaleString('fr-FR')+' €', color:'#dbeafe', textColor:'#2563eb' },
                  { label:'Gains', val:(calcDCA(simRate,simInit,simMonthly,simYears)-(simInit+simMonthly*simYears*12)).toLocaleString('fr-FR')+' €', color:'#ede9fe', textColor:'#7c3aed' },
                  { label:'Multiplication', val:`×${(calcDCA(simRate,simInit,simMonthly,simYears)/Math.max(simInit+simMonthly*simYears*12,1)).toFixed(1)}`, color:'#fef3c7', textColor:'#d97706' },
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
                      { label:'Versements seuls', data:Array.from({length:simYears+1},(_,i)=>simInit+simMonthly*i*12), borderColor:'#9ca3af', borderWidth:1.5, pointRadius:0, fill:false, tension:0, borderDash:[4,4] },
                    ]
                  }}
                  options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'top', labels:{ font:{ size:11 }, boxWidth:20 } } }, scales:{ y:{ ticks:{ callback:(v:any)=>v>=1000000?(v/1000000).toFixed(1)+'M €':v>=1000?(v/1000).toFixed(0)+'k €':v+'€' } } } }}
                />
              </div>
            </div>
          </div>
        )}
{/* ══ SEARCH BAR GLOBALE ══ */}
<div style={{ marginBottom:24, position:'relative' }}>
  <div style={{ display:'flex', alignItems:'center', gap:10, background:'#f8f9fc', border:'1px solid rgba(0,0,0,0.1)', borderRadius:14, padding:'10px 16px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
    <span style={{ fontSize:18 }}>🔍</span>
    <input
      type="text"
      placeholder="Rechercher une action, ETF... (ex: Apple, Airbus, Bitcoin)"
      value={globalSearch}
      onChange={e => { setGlobalSearch(e.target.value); fetchGlobalSearch(e.target.value); }}
      style={{ flex:1, border:'none', background:'transparent', fontSize:14, fontFamily:'DM Sans', color:'#111827', outline:'none' }}
    />
    {searchLoading && <span style={{ fontSize:12, color:'#6b7280' }}>⏳</span>}
    {globalSearch && (
      <button onClick={() => { setGlobalSearch(''); setSearchResults([]); setSelectedResult(null); setSelectedPrice(null); }} style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#9ca3af' }}>×</button>
    )}
  </div>

  {searchResults.length > 0 && (
    <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#fff', border:'1px solid rgba(0,0,0,0.1)', borderRadius:12, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', zIndex:100, marginTop:4, overflow:'hidden' }}>
      {searchResults.map((r: any) => (
        <div key={r.symbol}
          onClick={() => { fetchSelectedPrice(r.symbol, r.name); setSearchResults([]); setGlobalSearch(r.name); }}
          style={{ padding:'12px 16px', cursor:'pointer', borderBottom:'1px solid rgba(0,0,0,0.05)', display:'flex', alignItems:'center', justifyContent:'space-between' }}
          onMouseEnter={e => (e.currentTarget.style.background='#f8f9fc')}
          onMouseLeave={e => (e.currentTarget.style.background='#fff')}>
          <div>
            <div style={{ fontWeight:600, fontSize:13 }}>{r.name}</div>
            <div style={{ fontSize:11, color:'#6b7280', fontFamily:'DM Mono' }}>{r.symbol} · {r.exchange} · {r.type}</div>
          </div>
          <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:r.type==='ETF'?'#dbeafe':r.type==='EQUITY'?'#d1fae5':'#f3f4f6', color:r.type==='ETF'?'#2563eb':r.type==='EQUITY'?'#059669':'#6b7280', fontFamily:'DM Mono', fontWeight:600 }}>
            {r.type}
          </span>
        </div>
      ))}
    </div>
  )}

  {selectedResult && (
    <div style={{ marginTop:12, background:'#fff', border:'1px solid rgba(99,102,241,0.2)', borderRadius:14, padding:20, boxShadow:'0 2px 8px rgba(99,102,241,0.08)' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontFamily:'Syne', fontWeight:700, fontSize:18 }}>{selectedResult.name}</div>
          <div style={{ fontSize:12, color:'#6b7280', fontFamily:'DM Mono', marginTop:2 }}>{selectedResult.symbol}</div>
        </div>
        {selectedPriceLoading ? (
          <div style={{ fontSize:24, color:'#9ca3af' }}>⏳</div>
        ) : selectedPrice && (
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:'Syne', fontWeight:700, fontSize:28, color:'#111827' }}>
              {selectedPrice.price?.toLocaleString('fr-FR', { minimumFractionDigits:2, maximumFractionDigits:2 })} {selectedPrice.currency}
            </div>
            <div style={{ fontSize:13, fontWeight:600, fontFamily:'DM Mono', color:selectedPrice.changePercent>=0?'#059669':'#dc2626' }}>
              {selectedPrice.changePercent>=0?'+':''}{selectedPrice.changePercent?.toFixed(2)}% auj.
            </div>
            <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{selectedPrice.exchange}</div>
          </div>
        )}
      </div>
      {selectedPrice && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div style={{ background:'#f8f9fc', borderRadius:10, padding:'12px 14px' }}>
            <div style={{ fontSize:10, color:'#9ca3af', fontFamily:'DM Mono', textTransform:'uppercase', marginBottom:4 }}>Variation du jour</div>
            <div style={{ fontSize:15, fontWeight:600, fontFamily:'DM Mono', color:selectedPrice.change>=0?'#059669':'#dc2626' }}>
              {selectedPrice.change>=0?'+':''}{selectedPrice.change?.toFixed(2)} {selectedPrice.currency}
            </div>
          </div>
          <div style={{ background:'#f0fdf8', borderRadius:10, padding:'12px 14px' }}>
            <div style={{ fontSize:10, color:'#9ca3af', fontFamily:'DM Mono', textTransform:'uppercase', marginBottom:4 }}>Source</div>
            <div style={{ fontSize:12, color:'#059669', fontWeight:600 }}>✅ Yahoo Finance</div>
            <div style={{ fontSize:11, color:'#6b7280' }}>Prix vérifié temps réel</div>
          </div>
        </div>
      )}
      <button
  onClick={() => addAssetFromSearch(selectedResult.symbol, selectedResult.name, selectedPrice?.exchange || '', 'EQUITY')}
  disabled={addingAsset}
  style={{ marginTop:12, marginRight:8, background:'#6366f1', color:'#fff', border:'none', borderRadius:8, padding:'6px 14px', fontSize:12, cursor:'pointer', fontFamily:'DM Sans', fontWeight:600 }}>
  {addingAsset ? '⏳ Ajout en cours...' : '➕ Ajouter à ma liste'}
</button><button onClick={() => { setSelectedResult(null); setSelectedPrice(null); setGlobalSearch(''); }} style={{ marginTop:12, background:'none', border:'1px solid rgba(0,0,0,0.1)', borderRadius:8, padding:'6px 14px', fontSize:12, cursor:'pointer', color:'#6b7280', fontFamily:'DM Sans' }}>
        Fermer ×
      </button>
    </div>
  )}
</div>
{/* ══ TAB: VALORISATION ══ */}
{activeTab === 'valuation' && (
  <div>
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
      <div>
        <div style={{ fontFamily:'Syne', fontSize:18, fontWeight:700 }}>📊 Valorisation d'entreprise</div>
        <div style={{ fontSize:13, color:'#6b7280', marginTop:4 }}>Uploadez un rapport annuel (PDF) pour obtenir une valorisation DCF + multiples comparables générée par IA</div>
      </div>
    </div>

{/* Upload zone */}
<div style={{ background:'#fff', border:'2px dashed rgba(99,102,241,0.3)', borderRadius:16, padding:32, marginBottom:20, textAlign:'center' }}>
  <div style={{ fontSize:40, marginBottom:12 }}>📄</div>
  <div style={{ fontFamily:'Syne', fontSize:15, fontWeight:700, marginBottom:6 }}>Déposez votre rapport annuel ici</div>
  <div style={{ fontSize:12, color:'#6b7280', marginBottom:20 }}>Formats acceptés : PDF — Rapport annuel, 10-K, Document de référence AMF</div>
  <input
    type="file"
    accept=".pdf"
    onChange={e => { setValuationFile(e.target.files?.[0] || null); setValuation(null); setValuationError(''); }}
    style={{ display:'none' }}
    id="pdf-upload"
  />
  <label htmlFor="pdf-upload" style={{ display:'inline-block', background:'#6366f1', color:'#fff', borderRadius:10, padding:'10px 24px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans' }}>
    Choisir un fichier PDF
  </label>
  {valuationFile && (
    <div style={{ marginTop:16, padding:'10px 16px', background:'#f0fdf8', border:'1px solid rgba(5,150,105,0.2)', borderRadius:10, display:'inline-flex', alignItems:'center', gap:8 }}>
      <span style={{ fontSize:16 }}>✅</span>
      <span style={{ fontSize:13, fontWeight:600, color:'#059669' }}>{valuationFile.name}</span>
      <span style={{ fontSize:12, color:'#6b7280' }}>({Math.round(valuationFile.size / 1024)} Ko)</span>
    </div>
  )
  </div>
  <input
    type="text"
    
    onChange={e => { setValuationFile(e.target.files?.[0] || null); setValuationError(''); }}
    placeholder="https://drive.google.com/file/d/... ou lien direct PDF"
    style={{ width:'100%', border:'1px solid rgba(25, 25, 35, 0.3)', borderRadius:10, padding:'10px 14px', fontSize:13, fontFamily:'DM Sans', color:'#111827', outline:'none', boxSizing:'border-box' }}
  />
  {valuationFile && (
    <div style={{ marginTop:10, padding:'8px 12px', background:'#f0fdf8', border:'1px solid rgba(5,150,105,0.2)', borderRadius:8, fontSize:12, color:'#059669' }}>
      ✅ Lien détecté — prêt pour l'analyse
    </div>
  )}
</div>

    {/* Prix actuel */}
    {valuationFile && (
      <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:15, padding:20, marginBottom:20, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
        <div style={{ fontFamily:'Syne', fontSize:14, fontWeight:700, marginBottom:14 }}>📈 Prix actuel de l'action</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 120px auto', gap:10, alignItems:'end' }}>
          <div>
            <div style={{ fontSize:11, color:'#6b7280', fontWeight:500, marginBottom:4 }}>Prix actuel (optionnel mais recommandé)</div>
            <input
              type="number"
              value={valuationPrice}
              onChange={e => setValuationPrice(e.target.value)}
              placeholder="ex: 271.10"
              style={{ width:'100%', border:'1px solid rgba(0,0,0,0.13)', borderRadius:8, padding:'8px 12px', fontSize:13, fontFamily:'DM Sans', color:'#111827' }}
            />
          </div>
          <div>
            <div style={{ fontSize:11, color:'#6b7280', fontWeight:500, marginBottom:4 }}>Devise</div>
            <select value={valuationCurrency} onChange={e => setValuationCurrency(e.target.value)} style={{ width:'100%', border:'1px solid rgba(0,0,0,0.13)', borderRadius:8, padding:'8px 12px', fontSize:13, fontFamily:'DM Sans', color:'#111827', background:'#fff' }}>
              {['USD','EUR','GBP','CHF','DKK','SEK','JPY','CAD'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button
            onClick={analyzeValuation}
            disabled={valuationLoading}
            style={{ background: valuationLoading ? '#e5e7eb' : '#6366f1', color: valuationLoading ? '#6b7280' : '#fff', border:'none', borderRadius:10, padding:'9px 20px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans', whiteSpace:'nowrap' }}>
            {valuationLoading ? '⏳ Analyse en cours...' : '🤖 Lancer la valorisation'}
          </button>
        </div>
        {valuationLoading && (
          <div style={{ marginTop:12, fontSize:12, color:'#6b7280', fontStyle:'italic' }}>
            ⏳ Claude analyse le document et calcule la valorisation... Cette opération peut prendre 30-60 secondes.
          </div>
        )}
        {valuationError && (
          <div style={{ marginTop:12, padding:'10px 14px', background:'#fff5f5', border:'1px solid rgba(220,38,38,0.2)', borderRadius:8, fontSize:12, color:'#dc2626' }}>
            ❌ {valuationError}
          </div>
        )}
      </div>
    )}

    {/* Résultats */}
    {valuation && (
      <div>
        {/* Header entreprise */}
        <div style={{ background:'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)', borderRadius:16, padding:24, marginBottom:20, color:'#fff' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ fontFamily:'Syne', fontSize:22, fontWeight:800 }}>{valuation.company?.name}</div>
              <div style={{ fontSize:13, opacity:0.8, marginTop:4 }}>{valuation.company?.ticker} · {valuation.company?.sector} · {valuation.company?.country}</div>
              <div style={{ fontSize:12, opacity:0.7, marginTop:2 }}>Année fiscale {valuation.company?.fiscalYear}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:11, opacity:0.7, marginBottom:2 }}>SIGNAL</div>
              <div style={{ fontFamily:'Syne', fontSize:24, fontWeight:800, padding:'6px 16px', borderRadius:12, background: valuation.synthesis?.signal === 'ACHETER' ? 'rgba(5,150,105,0.3)' : valuation.synthesis?.signal === 'VENDRE' ? 'rgba(220,38,38,0.3)' : 'rgba(255,255,255,0.2)' }}>
                {valuation.synthesis?.signal === 'ACHETER' ? '📥 ACHETER' : valuation.synthesis?.signal === 'VENDRE' ? '📤 VENDRE' : '🔄 CONSERVER'}
              </div>
              <div style={{ fontSize:12, opacity:0.8, marginTop:4 }}>Conviction : {valuation.synthesis?.conviction}</div>
            </div>
          </div>
        </div>

        {/* Synthèse prix */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
          {[
            { label:'Prix actuel', value: valuationPrice ? `${parseFloat(valuationPrice).toFixed(2)} ${valuationCurrency}` : '—', color:'#6b7280' },
            { label:'Juste valeur pondérée', value: valuation.synthesis?.weightedFairValue ? `${valuation.synthesis.weightedFairValue} ${valuationCurrency}` : '—', color:'#6366f1' },
            { label:'Potentiel', value: valuation.synthesis?.upside || '—', color: valuation.synthesis?.upside?.startsWith('+') ? '#059669' : '#dc2626' },
            { label:'Marge de sécurité', value: valuation.synthesis?.margin || '—', color:'#7c3aed' },
          ].map(c => (
            <div key={c.label} style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:13, padding:'14px 16px', boxShadow:'0 1px 3px rgba(0,0,0,0.08)', textAlign:'center' }}>
              <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'.08em', color:'#6b7280', marginBottom:6, fontFamily:'DM Mono' }}>{c.label}</div>
              <div style={{ fontFamily:'Syne', fontSize:18, fontWeight:700, color:c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Données financières */}
        <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:15, padding:20, marginBottom:20, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ fontFamily:'Syne', fontSize:14, fontWeight:700, marginBottom:16 }}>📋 Données financières extraites</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
            {[
              { label:'Chiffre d\'affaires', value: valuation.financials?.revenue ? `${valuation.financials.revenue}M` : '—' },
              { label:'Croissance CA', value: valuation.financials?.revenueGrowth || '—' },
              { label:'EBITDA', value: valuation.financials?.ebitda ? `${valuation.financials.ebitda}M` : '—' },
              { label:'Marge EBITDA', value: valuation.financials?.ebitdaMargin || '—' },
              { label:'Free Cash Flow', value: valuation.financials?.freeCashFlow ? `${valuation.financials.freeCashFlow}M` : '—' },
              { label:'Dette nette', value: valuation.financials?.netDebt ? `${valuation.financials.netDebt}M` : '—' },
              { label:'Résultat net', value: valuation.financials?.netIncome ? `${valuation.financials.netIncome}M` : '—' },
              { label:'Actions en circulation', value: valuation.financials?.sharesOutstanding ? `${valuation.financials.sharesOutstanding}M` : '—' },
            ].map(s => (
              <div key={s.label} style={{ background:'#f8f9fc', borderRadius:10, padding:'10px 12px' }}>
                <div style={{ fontSize:10, color:'#9ca3af', fontFamily:'DM Mono', textTransform:'uppercase', marginBottom:4 }}>{s.label}</div>
                <div style={{ fontSize:14, fontWeight:600, fontFamily:'DM Mono', color:'#111827' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* DCF */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
          <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:15, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ fontFamily:'Syne', fontSize:14, fontWeight:700, marginBottom:16 }}>📈 Valorisation DCF</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
              <div style={{ background:'#f8f9fc', borderRadius:8, padding:'8px 10px' }}>
                <div style={{ fontSize:10, color:'#9ca3af', fontFamily:'DM Mono', textTransform:'uppercase', marginBottom:2 }}>WACC</div>
                <div style={{ fontSize:14, fontWeight:600, fontFamily:'DM Mono' }}>{valuation.dcfValuation?.wacc}</div>
              </div>
              <div style={{ background:'#f8f9fc', borderRadius:8, padding:'8px 10px' }}>
                <div style={{ fontSize:10, color:'#9ca3af', fontFamily:'DM Mono', textTransform:'uppercase', marginBottom:2 }}>Taux terminal</div>
                <div style={{ fontSize:14, fontWeight:600, fontFamily:'DM Mono' }}>{valuation.dcfValuation?.terminalGrowthRate}</div>
              </div>
            </div>
            <div style={{ marginBottom:12 }}>
              {valuation.dcfValuation?.projectedFCF?.map((fcf: any, i: number) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(0,0,0,0.05)', fontSize:12 }}>
                  <span style={{ color:'#6b7280' }}>{fcf.year}</span>
                  <span style={{ fontFamily:'DM Mono', fontWeight:600 }}>{fcf.fcf}M</span>
                  <span style={{ color:'#059669', fontFamily:'DM Mono' }}>{fcf.growthRate}</span>
                </div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              {[
                { label:'Pessimiste', val: valuation.dcfValuation?.scenarios?.pessimistic?.intrinsicValue, up: valuation.dcfValuation?.scenarios?.pessimistic?.upside, color:'#dc2626', bg:'#fff5f5' },
                { label:'Base', val: valuation.dcfValuation?.scenarios?.base?.intrinsicValue, up: valuation.dcfValuation?.scenarios?.base?.upside, color:'#6366f1', bg:'#f5f3ff' },
                { label:'Optimiste', val: valuation.dcfValuation?.scenarios?.optimistic?.intrinsicValue, up: valuation.dcfValuation?.scenarios?.optimistic?.upside, color:'#059669', bg:'#f0fdf8' },
              ].map(s => (
                <div key={s.label} style={{ background:s.bg, borderRadius:10, padding:'10px', textAlign:'center' }}>
                  <div style={{ fontSize:10, color:s.color, fontWeight:600, marginBottom:4 }}>{s.label}</div>
                  <div style={{ fontSize:15, fontWeight:700, fontFamily:'Syne', color:s.color }}>{s.val} {valuationCurrency}</div>
                  <div style={{ fontSize:11, color:s.color, fontFamily:'DM Mono' }}>{s.up}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Multiples */}
          <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:15, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ fontFamily:'Syne', fontSize:14, fontWeight:700, marginBottom:16 }}>📊 Valorisation par multiples</div>
            {[
              { label:'P/E actuel vs secteur', val1: valuation.multiplesValuation?.currentPE, val2: valuation.multiplesValuation?.sectorAveragePE },
              { label:'EV/EBITDA actuel vs secteur', val1: valuation.multiplesValuation?.currentEVEBITDA, val2: valuation.multiplesValuation?.sectorAverageEVEBITDA },
              { label:'P/B', val1: valuation.multiplesValuation?.currentPB, val2: null },
              { label:'P/S', val1: valuation.multiplesValuation?.currentPS, val2: null },
            ].map(m => (
              <div key={m.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize:12, color:'#6b7280' }}>{m.label}</span>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontFamily:'DM Mono', fontSize:13, fontWeight:600 }}>{m.val1}x</span>
                  {m.val2 && <span style={{ fontSize:11, color:'#9ca3af' }}>vs {m.val2}x moy.</span>}
                </div>
              </div>
            ))}
            <div style={{ marginTop:14, padding:'12px', background:'#f5f3ff', borderRadius:10, textAlign:'center' }}>
              <div style={{ fontSize:11, color:'#7c3aed', marginBottom:4 }}>Valeur implicite moyenne (multiples)</div>
              <div style={{ fontFamily:'Syne', fontSize:20, fontWeight:700, color:'#7c3aed' }}>{valuation.multiplesValuation?.averageImpliedValue} {valuationCurrency}</div>
            </div>
          </div>
        </div>

        {/* Résumé exécutif */}
        <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:15, padding:20, marginBottom:20, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ fontFamily:'Syne', fontSize:14, fontWeight:700, marginBottom:16 }}>📝 Résumé exécutif</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            {[
              { title:'✅ Forces', items: valuation.executiveSummary?.strengths, color:'#059669', bg:'#f0fdf8' },
              { title:'⚠️ Faiblesses', items: valuation.executiveSummary?.weaknesses, color:'#d97706', bg:'#fffbeb' },
              { title:'🚀 Opportunités', items: valuation.executiveSummary?.opportunities, color:'#6366f1', bg:'#f5f3ff' },
              { title:'⛔ Risques', items: valuation.executiveSummary?.risks, color:'#dc2626', bg:'#fff5f5' },
            ].map(section => (
              <div key={section.title} style={{ background:section.bg, borderRadius:12, padding:'14px 16px' }}>
                <div style={{ fontSize:12, fontWeight:700, color:section.color, marginBottom:8 }}>{section.title}</div>
                {section.items?.map((item: string, i: number) => (
                  <div key={i} style={{ fontSize:12, color:'#374151', lineHeight:1.6, marginBottom:4 }}>• {item}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ padding:'14px 16px', background:'rgba(99,102,241,0.05)', borderRadius:12, border:'1px solid rgba(99,102,241,0.15)', marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#6366f1', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:6 }}>Thèse d'investissement</div>
            <div style={{ fontSize:13, color:'#374151', lineHeight:1.8 }}>{valuation.executiveSummary?.investmentThesis}</div>
          </div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <div style={{ flex:1, padding:'10px 14px', background:'#f8f9fc', borderRadius:10 }}>
              <div style={{ fontSize:10, color:'#9ca3af', fontFamily:'DM Mono', textTransform:'uppercase', marginBottom:4 }}>Métriques clés à surveiller</div>
              <div style={{ fontSize:12, color:'#374151' }}>{valuation.executiveSummary?.keyMetrics}</div>
            </div>
            <div style={{ padding:'10px 14px', background:'#f8f9fc', borderRadius:10, textAlign:'center', minWidth:150 }}>
              <div style={{ fontSize:10, color:'#9ca3af', fontFamily:'DM Mono', textTransform:'uppercase', marginBottom:4 }}>Prix cible {valuation.executiveSummary?.targetHorizon}</div>
              <div style={{ fontFamily:'Syne', fontSize:18, fontWeight:700, color:'#6366f1' }}>{valuation.executiveSummary?.targetPrice} {valuationCurrency}</div>
            </div>
          </div>
        </div>

        {/* Bouton supprimer */}
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <button onClick={() => { setValuation(null); setValuationFile(null); setValuationPrice(''); }} style={{ background:'none', border:'1px solid rgba(220,38,38,0.3)', borderRadius:10, padding:'8px 20px', fontSize:12, color:'#dc2626', cursor:'pointer', fontFamily:'DM Sans' }}>
            🗑️ Supprimer cette analyse
          </button>
        </div>
      </div>
    )}
  </div>
)}
        {/* ══ TAB: NEWS ══ */}
        {activeTab === 'news' && (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div style={{ fontFamily:'Syne', fontSize:16, fontWeight:700 }}>📰 Actualités financières du jour</div>
              <div style={{ fontSize:12, color:'#6b7280' }}>Mis à jour toutes les 30 minutes</div>
            </div>
            {news.length === 0 ? (
              <div style={{ padding:40, textAlign:'center', color:'#6b7280' }}>Chargement des actualités...</div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:16 }}>
                {news.map((article, i) => (
                  <a key={i} href={article.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none', color:'inherit' }}>
                    <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:14, padding:18, boxShadow:'0 1px 3px rgba(0,0,0,0.08)', height:'100%', cursor:'pointer', transition:'box-shadow .15s' }}
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