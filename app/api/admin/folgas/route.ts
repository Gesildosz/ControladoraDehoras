import { NextResponse } from "next/response"
import { db } from "@/lib/database"

export async function GET() {
  try {
    const solicitacoes = await db.getAllSolicitacoesFolga()
    return NextResponse.json(solicitacoes)
  } catch (error) {
    console.error("Error fetching leave requests:", error)
    return NextResponse.json({ error: "Erro ao buscar solicitações" }, { status: 500 })
  }
}
