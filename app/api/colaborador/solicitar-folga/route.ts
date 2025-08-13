import { type NextRequest, NextResponse } from "next/server"
import { createSolicitacaoFolga } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { colaboradorId, dataFolga, motivo } = await request.json()

    if (!colaboradorId || !dataFolga) {
      return NextResponse.json({ error: "Colaborador ID e data da folga são obrigatórios" }, { status: 400 })
    }

    // Verificar se a data não é no passado
    const hoje = new Date()
    const dataFolgaDate = new Date(dataFolga)

    if (dataFolgaDate <= hoje) {
      return NextResponse.json({ error: "A data da folga deve ser futura" }, { status: 400 })
    }

    const solicitacao = await createSolicitacaoFolga(colaboradorId, dataFolga, motivo)

    return NextResponse.json({
      success: true,
      solicitacao,
    })
  } catch (error) {
    console.error("Erro ao criar solicitação de folga:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
