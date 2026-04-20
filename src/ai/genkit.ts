export async function callGemini(prompt: string, systemPrompt?: string) {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (!apiKey) throw new Error('NEXT_PUBLIC_GEMINI_API_KEY not set.')

  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
      body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] }),
    }
  )

  const data = await response.json()
  if (!response.ok || !data.candidates) throw new Error(`Gemini API Error: ${JSON.stringify(data)}`)
  return data.candidates[0].content.parts[0].text as string
}
