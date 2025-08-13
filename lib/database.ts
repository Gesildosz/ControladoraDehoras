import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

export const sql = neon(process.env.DATABASE_URL)

// Database types
export interface Colaborador {
  id: number
  nome: string
  cracha: string
  codigo_acesso: string
  tentativas_codigo: number
  bloqueado: boolean
  ultimo_token_bloqueio: string | null
  criado_em: string
  atualizado_em: string
  data_nascimento: string
  cargo: string
  supervisor: string
  turno: string
  telefone: string
}

export interface HoraLancamento {
  id: number
  colaborador_id: number
  data_lancamento: string
  horas: number
  motivo: string | null
  criado_por: string
  criado_em: string
}

export interface SolicitacaoFolga {
  id: number
  colaborador_id: number
  data_folga: string
  dia_semana: string
  horas_debitadas: number
  motivo: string | null
  status: "pendente" | "aprovada" | "recusada"
  aprovado_por: string | null
  observacoes_admin: string | null
  data_solicitacao: string
  data_resposta: string | null
}

// Database operations
export const db = {
  // Find colaborador by cracha
  async findColaboradorByCracha(cracha: string): Promise<Colaborador | null> {
    try {
      const result = await sql`
        SELECT * FROM colaboradores WHERE cracha = ${cracha} LIMIT 1
      `
      return (result[0] as Colaborador) || null
    } catch (error) {
      console.error("Error finding colaborador by cracha:", error)
      return null
    }
  },

  // Find colaborador by id
  async findColaboradorById(id: number): Promise<Colaborador | null> {
    try {
      const result = await sql`
        SELECT * FROM colaboradores WHERE id = ${id} LIMIT 1
      `
      return (result[0] as Colaborador) || null
    } catch (error) {
      console.error("Error finding colaborador by id:", error)
      return null
    }
  },

  // Update colaborador tentativas
  async updateTentativas(id: number, tentativas: number) {
    try {
      await sql`
        UPDATE colaboradores 
        SET tentativas_codigo = ${tentativas}, atualizado_em = NOW()
        WHERE id = ${id}
      `
    } catch (error) {
      console.error("Error updating tentativas:", error)
      throw error
    }
  },

  // Block colaborador
  async blockColaborador(id: number, token: string) {
    try {
      await sql`
        UPDATE colaboradores 
        SET bloqueado = TRUE, 
            ultimo_token_bloqueio = ${token},
            atualizado_em = NOW()
        WHERE id = ${id}
      `
    } catch (error) {
      console.error("Error blocking colaborador:", error)
      throw error
    }
  },

  // Unblock colaborador
  async unblockColaborador(id: number, newCode: string) {
    try {
      await sql`
        UPDATE colaboradores 
        SET codigo_acesso = ${newCode}, 
            tentativas_codigo = 0,
            bloqueado = FALSE,
            ultimo_token_bloqueio = NULL,
            atualizado_em = NOW()
        WHERE id = ${id}
      `
    } catch (error) {
      console.error("Error unblocking colaborador:", error)
      throw error
    }
  },

  // Find colaborador by token
  async findColaboradorByToken(token: string): Promise<Colaborador | null> {
    try {
      const result = await sql`
        SELECT * FROM colaboradores WHERE ultimo_token_bloqueio = ${token} LIMIT 1
      `
      return (result[0] as Colaborador) || null
    } catch (error) {
      console.error("Error finding colaborador by token:", error)
      return null
    }
  },

  // Create time entry
  async createHoraLancamento(data: Omit<HoraLancamento, "id" | "data_lancamento" | "criado_em">) {
    try {
      const result = await sql`
        INSERT INTO hora_lancamentos (colaborador_id, horas, motivo, criado_por)
        VALUES (${data.colaborador_id}, ${data.horas}, ${data.motivo}, ${data.criado_por})
        RETURNING *
      `
      return result[0] as HoraLancamento
    } catch (error) {
      console.error("Error creating hora lancamento:", error)
      throw error
    }
  },

  // Get time entries for colaborador
  async getHorasLancamentos(colaboradorId: number): Promise<HoraLancamento[]> {
    try {
      const result = await sql`
        SELECT * FROM hora_lancamentos 
        WHERE colaborador_id = ${colaboradorId}
        ORDER BY data_lancamento DESC
      `
      return result as HoraLancamento[]
    } catch (error) {
      console.error("Error getting horas lancamentos:", error)
      return []
    }
  },

  // Calculate balance for colaborador
  async calculateBalance(colaboradorId: number): Promise<number> {
    try {
      const result = await sql`
        SELECT COALESCE(SUM(horas), 0) as saldo
        FROM hora_lancamentos 
        WHERE colaborador_id = ${colaboradorId}
      `
      return Number(result[0]?.saldo || 0)
    } catch (error) {
      console.error("Error calculating balance:", error)
      return 0
    }
  },

  // Get all colaboradores
  async getAllColaboradores(): Promise<Colaborador[]> {
    try {
      const result = await sql`
        SELECT * FROM colaboradores 
        ORDER BY nome ASC
      `
      return result as Colaborador[]
    } catch (error) {
      console.error("Error getting all colaboradores:", error)
      return []
    }
  },

  // Create new colaborador
  async createColaborador(data: {
    nome: string
    cracha: string
    codigoAcesso: string
    dataNascimento: string
    cargo: string
    supervisor: string
    turno: string
    telefone: string
  }): Promise<Colaborador> {
    try {
      const result = await sql`
        INSERT INTO colaboradores (nome, cracha, codigo_acesso, data_nascimento, cargo, supervisor, turno, telefone)
        VALUES (${data.nome}, ${data.cracha}, ${data.codigoAcesso}, ${data.dataNascimento}, ${data.cargo}, ${data.supervisor}, ${data.turno}, ${data.telefone})
        RETURNING *
      `
      return result[0] as Colaborador
    } catch (error) {
      console.error("Error creating colaborador:", error)
      throw error
    }
  },

  // Get all time entries with colaborador names
  async getAllHorasLancamentos(): Promise<(HoraLancamento & { colaborador_nome: string })[]> {
    try {
      const result = await sql`
        SELECT hl.*, c.nome as colaborador_nome
        FROM hora_lancamentos hl
        JOIN colaboradores c ON hl.colaborador_id = c.id
        ORDER BY hl.data_lancamento DESC
      `
      return result as (HoraLancamento & { colaborador_nome: string })[]
    } catch (error) {
      console.error("Error getting all horas lancamentos:", error)
      return []
    }
  },

  async createSolicitacaoFolga(colaboradorId: number, dataFolga: string, motivo?: string): Promise<SolicitacaoFolga> {
    try {
      const dataFolgaDate = new Date(dataFolga)
      const diasSemana = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"]
      const diaSemana = diasSemana[dataFolgaDate.getDay()]

      // Calcular horas a debitar baseado no dia da semana
      const horasDebitadas = diaSemana === "sábado" ? 4 : 8

      const result = await sql`
        INSERT INTO solicitacoes_folga (colaborador_id, data_folga, dia_semana, horas_debitadas, motivo)
        VALUES (${colaboradorId}, ${dataFolga}, ${diaSemana}, ${horasDebitadas}, ${motivo || null})
        RETURNING *
      `
      return result[0] as SolicitacaoFolga
    } catch (error) {
      console.error("Error creating solicitacao folga:", error)
      throw error
    }
  },

  async getSolicitacoesFolgaByColaborador(colaboradorId: number): Promise<SolicitacaoFolga[]> {
    try {
      const result = await sql`
        SELECT * FROM solicitacoes_folga 
        WHERE colaborador_id = ${colaboradorId}
        ORDER BY data_solicitacao DESC
      `
      return result as SolicitacaoFolga[]
    } catch (error) {
      console.error("Error getting solicitacoes folga:", error)
      return []
    }
  },

  async getAllSolicitacoesFolga(): Promise<
    (SolicitacaoFolga & { colaborador_nome: string; colaborador_cracha: string })[]
  > {
    try {
      const result = await sql`
        SELECT sf.*, c.nome as colaborador_nome, c.cracha as colaborador_cracha
        FROM solicitacoes_folga sf
        JOIN colaboradores c ON sf.colaborador_id = c.id
        ORDER BY 
          CASE WHEN sf.status = 'pendente' THEN 0 ELSE 1 END,
          sf.data_solicitacao DESC
      `
      return result as (SolicitacaoFolga & { colaborador_nome: string; colaborador_cracha: string })[]
    } catch (error) {
      console.error("Error getting all solicitacoes folga:", error)
      return []
    }
  },

  async processarSolicitacaoFolga(id: number, status: "aprovada" | "recusada"): Promise<void> {
    try {
      if (status === "aprovada") {
        // Get the leave request details
        const solicitacao = await sql`
          SELECT * FROM solicitacoes_folga WHERE id = ${id}
        `

        if (solicitacao[0]) {
          const folga = solicitacao[0] as SolicitacaoFolga

          // Debit hours from employee's balance
          await sql`
            INSERT INTO hora_lancamentos (colaborador_id, horas, motivo, criado_por)
            VALUES (${folga.colaborador_id}, ${-folga.horas_debitadas}, ${"Folga aprovada - " + new Date(folga.data_folga).toLocaleDateString("pt-BR")}, 'Sistema - Administrador')
          `
        }
      }

      // Update the leave request status
      await sql`
        UPDATE solicitacoes_folga 
        SET status = ${status}, 
            data_resposta = NOW()
        WHERE id = ${id}
      `
    } catch (error) {
      console.error("Error processing solicitacao folga:", error)
      throw error
    }
  },
}

// Export individual functions for API routes
export const createSolicitacaoFolga = db.createSolicitacaoFolga
export const getSolicitacoesFolgaByColaborador = db.getSolicitacoesFolgaByColaborador
export const getAllSolicitacoesFolga = db.getAllSolicitacoesFolga
export const processarSolicitacaoFolga = db.processarSolicitacaoFolga
