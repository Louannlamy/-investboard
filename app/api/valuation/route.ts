import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const currentPrice = formData.get('currentPrice') as string
    const currency = formData.get('currency') as string || 'USD'

    if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    const prompt = `Tu es un analyste financier senior spécialisé en valorisation d'entreprises. 
Tu as reçu un document financier (rapport annuel, 10-K, document de référence AMF ou similaire).
Le prix actuel de l'action est : ${currentPrice} ${currency}

Analyse ce document en profondeur et génère une valorisation complète en JSON uniquement (pas de texte avant ou après) :

{
  "company": {
    "name": "Nom de l'entreprise",
    "ticker": "Ticker boursier",
    "sector": "Secteur d'activité",
    "country": "Pays",
    "currency": "Devise des états financiers",
    "fiscalYear": "Année fiscale analysée"
  },
  "financials": {
    "revenue": "Chiffre d'affaires en millions",
    "revenueGrowth": "Croissance CA en %",
    "ebitda": "EBITDA en millions",
    "ebitdaMargin": "Marge EBITDA en %",
    "ebit": "EBIT en millions",
    "netIncome": "Résultat net en millions",
    "freeCashFlow": "Free Cash Flow en millions",
    "totalDebt": "Dette totale en millions",
    "cash": "Trésorerie en millions",
    "netDebt": "Dette nette en millions",
    "sharesOutstanding": "Nombre d'actions en millions"
  },
  "dcfValuation": {
    "wacc": "Coût moyen pondéré du capital en %",
    "terminalGrowthRate": "Taux de croissance terminal en %",
    "projectedFCF": [
      {"year": "An 1", "fcf": 0, "growthRate": "% de croissance"},
      {"year": "An 2", "fcf": 0, "growthRate": "% de croissance"},
      {"year": "An 3", "fcf": 0, "growthRate": "% de croissance"},
      {"year": "An 4", "fcf": 0, "growthRate": "% de croissance"},
      {"year": "An 5", "fcf": 0, "growthRate": "% de croissance"}
    ],
    "terminalValue": 0,
    "enterpriseValue": 0,
    "equityValue": 0,
    "intrinsicValuePerShare": 0,
    "scenarios": {
      "pessimistic": {"intrinsicValue": 0, "upside": "% par rapport au prix actuel"},
      "base": {"intrinsicValue": 0, "upside": "% par rapport au prix actuel"},
      "optimistic": {"intrinsicValue": 0, "upside": "% par rapport au prix actuel"}
    }
  },
  "multiplesValuation": {
    "currentPE": 0,
    "sectorAveragePE": 0,
    "currentEVEBITDA": 0,
    "sectorAverageEVEBITDA": 0,
    "currentPB": 0,
    "currentPS": 0,
    "impliedValueFromPE": 0,
    "impliedValueFromEVEBITDA": 0,
    "averageImpliedValue": 0
  },
  "synthesis": {
    "dcfWeight": "60%",
    "multiplesWeight": "40%",
    "weightedFairValue": 0,
    "currentPrice": ${currentPrice || 0},
    "upside": "% de hausse/baisse potentielle",
    "margin": "Marge de sécurité en %",
    "signal": "ACHETER ou CONSERVER ou VENDRE",
    "conviction": "FORTE ou MODÉRÉE ou FAIBLE"
  },
  "executiveSummary": {
    "strengths": ["Force 1", "Force 2", "Force 3"],
    "weaknesses": ["Faiblesse 1", "Faiblesse 2"],
    "opportunities": ["Opportunité 1", "Opportunité 2"],
    "risks": ["Risque 1", "Risque 2", "Risque 3"],
    "investmentThesis": "Thèse d'investissement complète en 4-5 phrases",
    "keyMetrics": "Les 3 métriques clés à surveiller",
    "targetPrice": 0,
    "targetHorizon": "12 mois"
  }
}`

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64,
            },
          },
          {
            type: 'text',
            text: prompt,
          }
        ],
      }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = text.replace(/```json|```/g, '').trim()
    const valuation = JSON.parse(clean)

    return NextResponse.json({ valuation, analyzedAt: new Date().toISOString() })
  } catch (e) {
    console.error('Valuation error:', e)
    return NextResponse.json({ error: 'Erreur lors de la valorisation' }, { status: 500 })
  }
}