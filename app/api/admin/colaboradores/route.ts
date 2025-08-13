import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

// GET - List all colaboradores
export async function GET() {
  try {
    const colaboradores = await db.getAllColaboradores()
    return NextResponse.json(colaboradores)
  } catch (error) {
    console.error("Error fetching colaboradores:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST - Create new colaborador
export async function POST(request: NextRequest) {
  try {
    const { nome, cracha, codigoAcesso, dataNascimento, cargo, supervisor, turno, telefone } = await request.json()

    if (!nome || !cracha || !codigoAcesso || !dataNascimento || !cargo || !supervisor || !turno || !telefone) {
      return NextResponse.json(
        {
          error:
            "Todos os campos são obrigatórios: nome, crachá, código de acesso, data de nascimento, cargo, supervisor, turno e telefone",
        },
        { status: 400 },
      )
    }

    // Check if cracha already exists
    const existingColaborador = await db.findColaboradorByCracha(cracha)
    if (existingColaborador) {
      return NextResponse.json({ error: "Já existe um colaborador com este crachá" }, { status: 400 })
    }

    const colaborador = await db.createColaborador({
      nome: nome.trim(),
      cracha: cracha.trim(),
      codigoAcesso: codigoAcesso.trim(),
      dataNascimento: dataNascimento,
      cargo: cargo.trim(),
      supervisor: supervisor.trim(),
      turno: turno.trim(),
      telefone: telefone.trim(),
    })

    return NextResponse.json(colaborador, { status: 201 })
  } catch (error) {
    console.error("Error creating colaborador:", error)
    return NextResponse.json({ error: "Erro ao cadastrar colaborador" }, { status: 500 })
  }
}
