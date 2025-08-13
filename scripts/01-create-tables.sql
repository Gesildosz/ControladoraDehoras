-- Create the colaboradores (employees) table
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
);

-- Create the hora_lancamentos (time entries) table
CREATE TABLE IF NOT EXISTS hora_lancamentos (
  id SERIAL PRIMARY KEY,
  colaborador_id INTEGER NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  data_lancamento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  horas INTEGER NOT NULL, -- can be positive or negative
  motivo TEXT,
  criado_por VARCHAR(255) NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_colaboradores_cracha ON colaboradores(cracha);
CREATE INDEX IF NOT EXISTS idx_colaboradores_bloqueado ON colaboradores(bloqueado);
CREATE INDEX IF NOT EXISTS idx_hora_lancamentos_colaborador ON hora_lancamentos(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_hora_lancamentos_data ON hora_lancamentos(data_lancamento);

-- Insert some sample data for testing
INSERT INTO colaboradores (nome, cracha, codigo_acesso) VALUES 
('João Silva', '001', '1234'),
('Maria Santos', '002', '5678'),
('Pedro Oliveira', '003', '9012')
ON CONFLICT (cracha) DO NOTHING;
