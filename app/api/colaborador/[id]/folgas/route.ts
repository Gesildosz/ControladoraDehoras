import { type NextRequest, NextResponse } from "next/server"
import { getSolicitacoesFolgaByColaborador } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const colaboradorId = Number.parseInt(params.id, 10)

    if (isNaN(colaboradorId)) {
      return NextResponse.json({ error: "ID do colaborador inválido" }, { status: 400 })
    }

    const solicitacoes = await getSolicitacoesFolgaByColaborador(colaboradorId)

    return NextResponse.json({
      solicitacoes,
    })
  } catch (error) {
    console.error("Erro ao buscar solicitações de folga:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
