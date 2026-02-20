import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const nodeId = req.nextUrl.searchParams.get("nodeId")

  if (!nodeId) {
    return NextResponse.json({ error: "Missing node id" }, { status: 400 })
  }

  const geminiResponse = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY!
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `
Teach the concept for node ID ${nodeId}.
Explain only the missing dependencies clearly.
Use structured step-by-step explanation.
Keep it concise and focused.
`
              }
            ]
          }
        ]
      })
    }
  )

  const geminiData = await geminiResponse.json()

  const rawText =
    geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ""

  return NextResponse.json({
    content: rawText
  })
}