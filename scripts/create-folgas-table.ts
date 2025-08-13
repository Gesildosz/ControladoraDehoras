import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function createFolgasTable() {
  try {
    console.log("Creating solicitacoes_folga table...")

    await sql`
      CREATE TABLE IF NOT EXISTS solicitacoes_folga (
        id SERIAL PRIMARY KEY,
        colaborador_id INTEGER NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
        data_solicitacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        data_folga DATE NOT NULL,
        dia_semana VARCHAR(20) NOT NULL,
        horas_debitadas INTEGER NOT NULL,
        motivo TEXT,
        status VARCHAR(20) DEFAULT 'pendente',
        aprovado_por VARCHAR(255),
        data_aprovacao TIMESTAMP WITH TIME ZONE,
        observacoes_admin TEXT,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    console.log("Creating indexes...")
    await sql`CREATE INDEX IF NOT EXISTS idx_solicitacoes_folga_colaborador ON solicitacoes_folga(colaborador_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_solicitacoes_folga_status ON solicitacoes_folga(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_solicitacoes_folga_data ON solicitacoes_folga(data_folga)`

    console.log("Folgas table created successfully!")

    // Verificar se a tabela foi criada
    const result = await sql`SELECT COUNT(*) as count FROM solicitacoes_folga`
    console.log(`Table verification: ${result[0].count} records found`)
  } catch (error) {
    console.error("Error creating folgas table:", error)
  }
}

createFolgasTable()
