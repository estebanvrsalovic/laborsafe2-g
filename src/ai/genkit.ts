const GEMINI_API_KEY = process.env.GEMINI_API_KEY as string | undefined

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable not set.')
}

export async function callGemini(prompt: string, systemPrompt?: string) {
  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': GEMINI_API_KEY! },
      body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] }),
    }
  )

  const data = await response.json()
  if (!response.ok || !data.candidates) {
    console.error('Gemini API Error:', data)
    throw new Error(`Gemini API Error: ${JSON.stringify(data)}`)
  }

  return data.candidates[0].content.parts[0].text as string
}
