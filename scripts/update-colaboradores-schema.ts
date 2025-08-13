import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function updateColaboradoresSchema() {
  try {
    console.log("Updating colaboradores table schema...")

    // Add new columns to colaboradores table
    await sql`
      ALTER TABLE colaboradores 
      ADD COLUMN IF NOT EXISTS data_nascimento DATE,
      ADD COLUMN IF NOT EXISTS cargo VARCHAR(100),
      ADD COLUMN IF NOT EXISTS supervisor VARCHAR(100),
      ADD COLUMN IF NOT EXISTS turno VARCHAR(20),
      ADD COLUMN IF NOT EXISTS telefone VARCHAR(20)
    `

    console.log("New columns added successfully!")

    // Update existing records with default values
    await sql`
      UPDATE colaboradores 
      SET 
        data_nascimento = '1990-01-01',
        cargo = 'Auxiliar',
        supervisor = 'Welton Andrade',
        turno = 'Manhã',
        telefone = '+55 (11) 99999-9999'
      WHERE data_nascimento IS NULL
    `

    console.log("Existing records updated with default values!")

    // Verify the schema update
    const result = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'colaboradores'
      ORDER BY ordinal_position
    `

    console.log("Updated table schema:")
    result.forEach((col) => {
      console.log(`- ${col.column_name}: ${col.data_type}`)
    })

    console.log("Schema update completed successfully!")
  } catch (error) {
    console.error("Error updating schema:", error)
    throw error
  }
}

updateColaboradoresSchema()
