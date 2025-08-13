import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

const sql = neon(process.env.DATABASE_URL)

async function setupDatabase() {
  try {
    console.log("Creating colaboradores table...")

    // Create the colaboradores (employees) table
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

    console.log("Creating hora_lancamentos table...")

    // Create the hora_lancamentos (time entries) table
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

    console.log("Creating indexes...")

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_colaboradores_cracha ON colaboradores(cracha)`
    await sql`CREATE INDEX IF NOT EXISTS idx_colaboradores_bloqueado ON colaboradores(bloqueado)`
    await sql`CREATE INDEX IF NOT EXISTS idx_hora_lancamentos_colaborador ON hora_lancamentos(colaborador_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_hora_lancamentos_data ON hora_lancamentos(data_lancamento)`

    console.log("Inserting sample data...")

    // Insert some sample data for testing
    await sql`
      INSERT INTO colaboradores (nome, cracha, codigo_acesso) VALUES 
      ('João Silva', '001', '1234'),
      ('Maria Santos', '002', '5678'),
      ('Pedro Oliveira', '003', '9012')
      ON CONFLICT (cracha) DO NOTHING
    `

    console.log("Database setup completed successfully!")

    // Test the setup by querying the tables
    const colaboradores = await sql`SELECT COUNT(*) as count FROM colaboradores`
    const horaLancamentos = await sql`SELECT COUNT(*) as count FROM hora_lancamentos`

    console.log(`Colaboradores table: ${colaboradores[0].count} records`)
    console.log(`Hora_lancamentos table: ${horaLancamentos[0].count} records`)
  } catch (error) {
    console.error("Error setting up database:", error)
    throw error
  }
}

setupDatabase()
