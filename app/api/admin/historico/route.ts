import { NextResponse } from "next/server"
import { db } from "@/lib/database"

// GET - Get all time entries with colaborador names
export async function GET() {
  try {
    const historico = await db.getAllHorasLancamentos()
    return NextResponse.json(historico)
  } catch (error) {
    console.error("Error fetching historico:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
