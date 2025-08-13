import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

// POST - Create time entry
export async function POST(request: NextRequest) {
  try {
    const { colaboradorId, horas, motivo, criadoPor } = await request.json()

    if (!colaboradorId || horas === undefined || horas === null) {
      return NextResponse.json({ error: "Colaborador ID e horas são obrigatórios" }, { status: 400 })
    }

    // Verify colaborador exists
    const colaborador = await db.findColaboradorById(colaboradorId)
    if (!colaborador) {
      return NextResponse.json({ error: "Colaborador não encontrado" }, { status: 404 })
    }

    const lancamento = await db.createHoraLancamento({
      colaborador_id: colaboradorId,
      horas: Number(horas),
      motivo: motivo || null,
      criado_por: criadoPor || "Administrador",
    })

    return NextResponse.json(lancamento, { status: 201 })
  } catch (error) {
    console.error("Error creating hora lancamento:", error)
    return NextResponse.json({ error: "Erro ao lançar horas" }, { status: 500 })
  }
}
