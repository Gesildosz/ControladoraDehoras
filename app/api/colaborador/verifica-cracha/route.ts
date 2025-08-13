import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { cracha } = await request.json()

    if (!cracha) {
      return NextResponse.json({ ok: false, error: "Crachá é obrigatório" }, { status: 400 })
    }

    // Check if tables exist and create them if they don't
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS colaboradores (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          cracha VARCHAR(50) UNIQUE NOT NULL,
          codigo_acesso VARCHAR(255) NOT NULL,
          tentativas_codigo INTEGER DEFAULT 0,
          bloqueado BOOLEAN DEFAULT FALSE,
          ultimo_token_bloqueio VARCHAR(20),
          criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `

      await sql`
        CREATE TABLE IF NOT EXISTS hora_lancamentos (
          id SERIAL PRIMARY KEY,
          colaborador_id INTEGER NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
          data_lancamento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          horas INTEGER NOT NULL,
          motivo TEXT,
          criado_por VARCHAR(255) NOT NULL,
          criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `

      // Insert sample data if table is empty
      const existingUsers = await sql`SELECT COUNT(*) as count FROM colaboradores`
      if (Number(existingUsers[0]?.count) === 0) {
        await sql`
          INSERT INTO colaboradores (nome, cracha, codigo_acesso) VALUES 
          ('João Silva', '001', '1234'),
          ('Maria Santos', '002', '5678'),
          ('Pedro Oliveira', '003', '9012')
        `
      }
    } catch (setupError) {
      console.error("Erro ao configurar banco:", setupError)
      return NextResponse.json(
        {
          ok: false,
          error: "Erro na configuração do banco de dados",
        },
        { status: 500 },
      )
    }

    // Now try to find the colaborador
    const result = await sql`
      SELECT * FROM colaboradores WHERE cracha = ${cracha} LIMIT 1
    `

    const colaborador = result[0]

    if (colaborador) {
      return NextResponse.json({
        ok: true,
        colaboradorId: colaborador.id,
        nome: colaborador.nome,
      })
    } else {
      return NextResponse.json(
        {
          ok: false,
          error: "Crachá não encontrado",
        },
        { status: 404 },
      )
    }
  } catch (error) {
    console.error("Erro ao verificar crachá:", error)
    return NextResponse.json(
      {
        ok: false,
        error: "Erro interno do servidor: " + (error as Error).message,
      },
      { status: 500 },
    )
  }
}
