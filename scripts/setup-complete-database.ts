import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function setupCompleteDatabase() {
  try {
    console.log("🚀 Iniciando configuração completa do banco de dados...")

    // 1. Criar tabela de colaboradores
    console.log("📋 Criando tabela de colaboradores...")
    await sql`
      CREATE TABLE IF NOT EXISTS colaboradores (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        cracha VARCHAR(50) UNIQUE NOT NULL,
        codigo_acesso VARCHAR(255) NOT NULL,
        data_nascimento DATE,
        cargo VARCHAR(100),
        supervisor VARCHAR(100),
        turno VARCHAR(20),
        telefone VARCHAR(20),
        tentativas_codigo INTEGER DEFAULT 0,
        bloqueado BOOLEAN DEFAULT FALSE,
        ultimo_token_bloqueio VARCHAR(20),
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // 2. Criar tabela de lançamentos de horas
    console.log("⏰ Criando tabela de lançamentos de horas...")
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

    // 3. Criar tabela de solicitações de folga
    console.log("📅 Criando tabela de solicitações de folga...")
    await sql`
      CREATE TABLE IF NOT EXISTS solicitacoes_folga (
        id SERIAL PRIMARY KEY,
        colaborador_id INTEGER NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
        data_folga DATE NOT NULL,
        dia_semana VARCHAR(20) NOT NULL,
        horas_debitadas INTEGER NOT NULL,
        motivo TEXT,
        status VARCHAR(20) DEFAULT 'pendente',
        aprovado_por VARCHAR(255),
        observacoes_admin TEXT,
        data_solicitacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        data_resposta TIMESTAMP WITH TIME ZONE
      )
    `

    // 4. Criar índices para melhor performance
    console.log("🔍 Criando índices...")
    await sql`CREATE INDEX IF NOT EXISTS idx_colaboradores_cracha ON colaboradores(cracha)`
    await sql`CREATE INDEX IF NOT EXISTS idx_colaboradores_bloqueado ON colaboradores(bloqueado)`
    await sql`CREATE INDEX IF NOT EXISTS idx_colaboradores_cargo ON colaboradores(cargo)`
    await sql`CREATE INDEX IF NOT EXISTS idx_colaboradores_supervisor ON colaboradores(supervisor)`
    await sql`CREATE INDEX IF NOT EXISTS idx_colaboradores_turno ON colaboradores(turno)`
    await sql`CREATE INDEX IF NOT EXISTS idx_hora_lancamentos_colaborador ON hora_lancamentos(colaborador_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_hora_lancamentos_data ON hora_lancamentos(data_lancamento)`
    await sql`CREATE INDEX IF NOT EXISTS idx_solicitacoes_folga_colaborador ON solicitacoes_folga(colaborador_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_solicitacoes_folga_status ON solicitacoes_folga(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_solicitacoes_folga_data ON solicitacoes_folga(data_folga)`

    // 5. Inserir dados de teste
    console.log("👥 Inserindo colaboradores de teste...")
    await sql`
      INSERT INTO colaboradores (nome, cracha, codigo_acesso, data_nascimento, cargo, supervisor, turno, telefone) VALUES 
      ('João Silva', '001', '1234', '1990-05-15', 'Operador Empilhadeira', 'Welton Andrade', 'Manhã', '+5511999999001'),
      ('Maria Santos', '002', '5678', '1985-08-22', 'Conferente I', 'Arlem Brito', 'Tarde', '+5511999999002'),
      ('Pedro Oliveira', '003', '9012', '1992-12-10', 'Auxiliar', 'Welton Andrade', 'Noite', '+5511999999003')
      ON CONFLICT (cracha) DO NOTHING
    `

    // 6. Inserir algumas horas de exemplo para teste
    console.log("⏱️ Inserindo horas de exemplo...")
    await sql`
      INSERT INTO hora_lancamentos (colaborador_id, horas, motivo, criado_por) VALUES 
      (1, 8, 'Horas extras aprovadas', 'Admin'),
      (1, -2, 'Saída antecipada', 'Admin'),
      (2, 4, 'Trabalho no sábado', 'Admin'),
      (3, 6, 'Horas extras', 'Admin')
      ON CONFLICT DO NOTHING
    `

    // 7. Verificar se tudo foi criado corretamente
    console.log("✅ Verificando dados criados...")
    const colaboradores = await sql`SELECT COUNT(*) as count FROM colaboradores`
    const horas = await sql`SELECT COUNT(*) as count FROM hora_lancamentos`
    const folgas = await sql`SELECT COUNT(*) as count FROM solicitacoes_folga`

    console.log(`📊 Colaboradores cadastrados: ${colaboradores[0].count}`)
    console.log(`📊 Lançamentos de horas: ${horas[0].count}`)
    console.log(`📊 Solicitações de folga: ${folgas[0].count}`)

    console.log("🎉 Configuração do banco de dados concluída com sucesso!")
    console.log("")
    console.log("🔑 Dados para teste:")
    console.log("   • João Silva - Crachá: 001, Código: 1234")
    console.log("   • Maria Santos - Crachá: 002, Código: 5678")
    console.log("   • Pedro Oliveira - Crachá: 003, Código: 9012")
    console.log("")
    console.log("📝 Próximos passos:")
    console.log("   1. Faça login como colaborador para testar o sistema")
    console.log("   2. Solicite uma folga através do painel do colaborador")
    console.log("   3. Acesse /admin para aprovar/recusar solicitações")
  } catch (error) {
    console.error("❌ Erro na configuração do banco:", error)
    throw error
  }
}

setupCompleteDatabase()
