-- Adicionar novos campos à tabela colaboradores
ALTER TABLE colaboradores 
ADD COLUMN IF NOT EXISTS data_nascimento DATE,
ADD COLUMN IF NOT EXISTS cargo VARCHAR(100),
ADD COLUMN IF NOT EXISTS supervisor VARCHAR(100),
ADD COLUMN IF NOT EXISTS turno VARCHAR(20),
ADD COLUMN IF NOT EXISTS telefone VARCHAR(20);

-- Atualizar colaboradores existentes com dados padrão
UPDATE colaboradores 
SET 
  data_nascimento = '1990-01-01',
  cargo = 'Auxiliar',
  supervisor = 'Welton Andrade',
  turno = 'Manhã',
  telefone = '+55 (11) 99999-9999'
WHERE data_nascimento IS NULL;
