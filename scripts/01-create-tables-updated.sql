-- Script atualizado para criar tabelas com todos os campos necessários
-- Use este script para novas instalações

-- Criar tabela de colaboradores com todos os campos
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
);

-- Criar tabela de lançamentos de horas
CREATE TABLE IF NOT EXISTS hora_lancamentos (
  id SERIAL PRIMARY KEY,
  colaborador_id INTEGER NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  data_lancamento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  horas INTEGER NOT NULL,
  motivo TEXT,
  criado_por VARCHAR(255) NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_colaboradores_cracha ON colaboradores(cracha);
CREATE INDEX IF NOT EXISTS idx_colaboradores_bloqueado ON colaboradores(bloqueado);
CREATE INDEX IF NOT EXISTS idx_colaboradores_cargo ON colaboradores(cargo);
CREATE INDEX IF NOT EXISTS idx_colaboradores_supervisor ON colaboradores(supervisor);
CREATE INDEX IF NOT EXISTS idx_colaboradores_turno ON colaboradores(turno);
CREATE INDEX IF NOT EXISTS idx_hora_lancamentos_colaborador ON hora_lancamentos(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_hora_lancamentos_data ON hora_lancamentos(data_lancamento);

-- Inserir dados de exemplo para teste (com novos campos)
INSERT INTO colaboradores (nome, cracha, codigo_acesso, data_nascimento, cargo, supervisor, turno, telefone) VALUES 
('João Silva', '001', '1234', '1990-05-15', 'Operador Empilhadeira', 'Welton Andrade', 'Manhã', '+5511999999001'),
('Maria Santos', '002', '5678', '1985-08-22', 'Conferente I', 'Arlem Brito', 'Tarde', '+5511999999002'),
('Pedro Oliveira', '003', '9012', '1992-12-10', 'Auxiliar', 'Welton Andrade', 'Noite', '+5511999999003')
ON CONFLICT (cracha) DO NOTHING;

-- Verificar se as tabelas foram criadas corretamente
SELECT 'colaboradores' as tabela, COUNT(*) as registros FROM colaboradores
UNION ALL
SELECT 'hora_lancamentos' as tabela, COUNT(*) as registros FROM hora_lancamentos;
