import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const colaboradorId = Number.parseInt(params.id, 10)

    if (isNaN(colaboradorId)) {
      return NextResponse.json({ error: "ID do colaborador inválido" }, { status: 400 })
    }

    // Verify colaborador exists
    const colaborador = await db.findColaboradorById(colaboradorId)
    if (!colaborador) {
      return NextResponse.json({ error: "Colaborador não encontrado" }, { status: 404 })
    }

    // Get balance and history
    const [saldo, historico] = await Promise.all([
      db.calculateBalance(colaboradorId),
      db.getHorasLancamentos(colaboradorId),
    ])

    return NextResponse.json({
      colaborador: {
        nome: colaborador.nome,
        cracha: colaborador.cracha,
        cargo: colaborador.cargo,
        supervisor: colaborador.supervisor,
        turno: colaborador.turno,
        telefone: colaborador.telefone,
        dataNascimento: colaborador.data_nascimento,
      },
      saldo,
      historico: historico.map((h) => ({
        id: h.id,
        data: h.data_lancamento,
        horas: h.horas,
        motivo: h.motivo,
        criadoPor: h.criado_por,
      })),
    })
  } catch (error) {
    console.error("Erro ao buscar banco de horas:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
