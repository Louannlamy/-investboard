import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(request: Request) {
  try {
    const { assetId, assetName, price, changePercent, p10, p15, cat, pea } = await request.json()

    const today = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })

    const prompt = `Tu es un analyste financier personnel. Nous sommes le ${today}.

Actif analysé : ${assetName} (${assetId})
Prix aujourd'hui : ${price}€
Variation du jour : ${changePercent > 0 ? '+' : ''}${changePercent?.toFixed(2)}%
Performance historique : ${p10 ? p10 + '%/an sur 10 ans' : 'N/A'}, ${p15 ? p15 + '%/an sur 15 ans' : 'N/A'}
Catégorie de risque : ${cat === 'low' ? 'Faible' : cat === 'mid' ? 'Modéré' : 'Élevé'}
Éligible PEA : ${pea ? 'Oui' : 'Non'}

Génère une explication courte (3-4 phrases maximum) et personnalisée qui explique POURQUOI le signal est "Acheter", "Conserver" ou "Vendre" pour cet actif AUJOURD'HUI, en te basant sur :
- Son prix actuel (est-il haut ou bas par rapport à sa norme historique ?)
- Sa variation du jour
- Ses fondamentaux spécifiques
- Le contexte de marché actuel (BCE à 3.25%, marché haussier modéré, tailwind IA)

Sois très concret et spécifique à CET actif. Ne parle pas d'autres actifs. Commence directement par l'explication sans formule d'introduction.`

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })

    const reason = message.content[0].type === 'text' ? message.content[0].text : ''

    return NextResponse.json({ reason })
  } catch (e) {
    console.error('Signal analysis error:', e)
    return NextResponse.json({ error: 'Failed to generate signal reason' }, { status: 500 })
  }
}