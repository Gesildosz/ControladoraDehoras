import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

// POST - Unblock colaborador using token
export async function POST(request: NextRequest) {
  try {
    const { token, novoCodigoAcesso } = await request.json()

    if (!token || !novoCodigoAcesso) {
      return NextResponse.json({ error: "Token e novo código de acesso são obrigatórios" }, { status: 400 })
    }

    // Find colaborador by token
    const colaborador = await db.findColaboradorByToken(token.trim().toUpperCase())
    if (!colaborador) {
      return NextResponse.json({ error: "Token não encontrado ou inválido" }, { status: 404 })
    }

    if (!colaborador.bloqueado) {
      return NextResponse.json({ error: "Este colaborador não está bloqueado" }, { status: 400 })
    }

    // Unblock colaborador and set new code
    await db.unblockColaborador(colaborador.id, novoCodigoAcesso.trim())

    return NextResponse.json({
      ok: true,
      message: `Colaborador ${colaborador.nome} foi desbloqueado com sucesso`,
      colaborador: {
        id: colaborador.id,
        nome: colaborador.nome,
        cracha: colaborador.cracha,
      },
    })
  } catch (error) {
    console.error("Error unblocking colaborador:", error)
    return NextResponse.json({ error: "Erro ao desbloquear colaborador" }, { status: 500 })
  }
}
