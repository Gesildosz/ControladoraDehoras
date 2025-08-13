import { NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function POST(request: Request) {
  try {
    const { id, status } = await request.json()

    if (!id || !status || !["aprovada", "recusada"].includes(status)) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    await db.processarSolicitacaoFolga(id, status)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing leave request:", error)
    return NextResponse.json({ error: "Erro ao processar solicitação" }, { status: 500 })
  }
}
