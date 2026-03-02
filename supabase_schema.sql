-- ============================================================
-- SCHEMA DO ATELIÊ DE NOIVAS — Supabase
-- Execute este arquivo no SQL Editor do seu projeto Supabase
-- Idempotente: pode ser executado múltiplas vezes sem erro
-- ============================================================

-- ── Clientes ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
  id          TEXT PRIMARY KEY,
  nome        TEXT NOT NULL,
  telefone    TEXT NOT NULL,
  email       TEXT,
  cpf         TEXT,
  data_contato DATE NOT NULL,
  data_casamento DATE,
  local       TEXT,
  indicacao   TEXT,
  status      TEXT NOT NULL DEFAULT 'lead'
                CHECK (status IN ('lead','ativo','concluido','cancelado')),
  observacoes TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS endereco     TEXT,
  ADD COLUMN IF NOT EXISTS distancia_km NUMERIC(8,2);

-- ── Medidas da Noiva ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medidas_noiva (
  id                    TEXT PRIMARY KEY,
  cliente_id            TEXT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  data                  DATE NOT NULL,
  busto                 NUMERIC(5,1),
  cava_a_cavas_costas   NUMERIC(5,1),
  abaixo_do_busto       NUMERIC(5,1),
  cava_a_cavas_frente   NUMERIC(5,1),
  quadril               NUMERIC(5,1),
  colarinho             NUMERIC(5,1),
  ombro_a_ombro         NUMERIC(5,1),
  alt_centro_frente     NUMERIC(5,1),
  alt_ombro_frente      NUMERIC(5,1),
  alt_ombro_costas      NUMERIC(5,1),
  alt_centro_costas     NUMERIC(5,1),
  separacao_busto       NUMERIC(5,1),
  cintura               NUMERIC(5,1),
  alt_busto             NUMERIC(5,1),
  alt_gancho_frente     NUMERIC(5,1),
  alt_quadril           NUMERIC(5,1),
  alt_desejada_saia     NUMERIC(5,1),
  alt_cintura_ao_joelho NUMERIC(5,1),
  punho                 NUMERIC(5,1),
  larg_joelho           NUMERIC(5,1),
  altura_lateral        NUMERIC(5,1),
  larg_braco            NUMERIC(5,1),
  cumprimento_braco     NUMERIC(5,1),
  alt_manga_34          NUMERIC(5,1),
  altura_manga_curta    NUMERIC(5,1),
  ombro                 NUMERIC(5,1),
  observacoes           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Fichas Técnicas ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fichas_tecnicas (
  id            TEXT PRIMARY KEY,
  cliente_id    TEXT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  nome_peca     TEXT NOT NULL,
  categoria     TEXT NOT NULL DEFAULT 'vestido'
                  CHECK (categoria IN ('vestido','veu','acessorio','roupa_cerimonia','outro')),
  tecido        TEXT,
  cor           TEXT,
  modelagem     TEXT,
  detalhes      TEXT,
  status        TEXT NOT NULL DEFAULT 'aguardando'
                  CHECK (status IN ('aguardando','em_corte','costura','prova','ajuste','concluida')),
  data_entrega  DATE,
  valor_custo   NUMERIC(10,2),
  valor_venda   NUMERIC(10,2),
  observacoes   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Orçamentos ────────────────────────────────────────────────
-- (declarado antes de contratos para permitir a FK abaixo)
CREATE TABLE IF NOT EXISTS orcamentos (
  id          TEXT PRIMARY KEY,
  cliente_id  TEXT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  numero      TEXT NOT NULL UNIQUE,
  data        DATE NOT NULL,
  validade    DATE,
  desconto    NUMERIC(10,2) NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'pendente'
                CHECK (status IN ('pendente','aprovado','recusado','expirado')),
  observacoes TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orcamento_itens (
  id              TEXT PRIMARY KEY,
  orcamento_id    TEXT NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  descricao       TEXT NOT NULL,
  quantidade      INT NOT NULL DEFAULT 1,
  valor_unitario  NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- ── Contratos ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contratos (
  id                  TEXT PRIMARY KEY,
  cliente_id          TEXT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  numero              TEXT NOT NULL UNIQUE,
  data_assinatura     DATE NOT NULL,
  data_entrega        DATE,
  valor_total         NUMERIC(10,2) NOT NULL,
  valor_entrada       NUMERIC(10,2) NOT NULL DEFAULT 0,
  parcelas_restantes  INT,
  status              TEXT NOT NULL DEFAULT 'rascunho'
                        CHECK (status IN ('rascunho','assinado','em_andamento','concluido','cancelado')),
  descricao_pecas     TEXT,
  clausulas_especiais TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS orcamento_id     TEXT REFERENCES orcamentos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quantidade_provas INT,
  ADD COLUMN IF NOT EXISTS anexo_base64     TEXT,
  ADD COLUMN IF NOT EXISTS anexo_nome       TEXT,
  ADD COLUMN IF NOT EXISTS anexo_tipo       TEXT;

-- ── Agendamentos ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agendamentos (
  id          TEXT PRIMARY KEY,
  cliente_id  TEXT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL
                CHECK (tipo IN ('consulta','primeira_prova','segunda_prova','prova_final','ajuste','entrega','reuniao')),
  data        DATE NOT NULL,
  hora        TIME NOT NULL,
  duracao     INT NOT NULL DEFAULT 60,
  descricao   TEXT,
  status      TEXT NOT NULL DEFAULT 'agendado'
                CHECK (status IN ('agendado','confirmado','concluido','cancelado')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Pagamentos ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pagamentos (
  id              TEXT PRIMARY KEY,
  cliente_id      TEXT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  contrato_id     TEXT REFERENCES contratos(id) ON DELETE SET NULL,
  descricao       TEXT NOT NULL,
  valor           NUMERIC(10,2) NOT NULL,
  data            DATE NOT NULL,
  tipo            TEXT NOT NULL DEFAULT 'outro'
                    CHECK (tipo IN ('entrada','parcela','saldo','outro')),
  status          TEXT NOT NULL DEFAULT 'pendente'
                    CHECK (status IN ('pendente','pago','vencido')),
  forma_pagamento TEXT
                    CHECK (forma_pagamento IN ('dinheiro','pix','cartao_credito','cartao_debito','transferencia')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Parcelas de Prova ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parcelas_prova (
  id              TEXT PRIMARY KEY,
  contrato_id     TEXT NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  cliente_id      TEXT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  numero          INT NOT NULL,
  data_prova      DATE,
  hora_prova      TIME,
  status_prova    TEXT NOT NULL DEFAULT 'pendente'
                    CHECK (status_prova IN ('pendente','agendada','realizada','cancelada')),
  valor_parcela   NUMERIC(10,2) NOT NULL,
  valor_pago      NUMERIC(10,2),
  pago            BOOLEAN NOT NULL DEFAULT FALSE,
  data_pagamento  DATE,
  forma_pagamento TEXT
                    CHECK (forma_pagamento IN ('dinheiro','pix','cartao_credito','cartao_debito','transferencia')),
  observacoes     TEXT,
  pagamento_id    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Inspirações ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inspiracoes (
  id            TEXT PRIMARY KEY,
  cliente_id    TEXT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  titulo        TEXT NOT NULL,
  imagem_base64 TEXT,
  imagem_url    TEXT,
  categoria     TEXT NOT NULL DEFAULT 'outro'
                  CHECK (categoria IN ('vestido','acessorio','penteado','maquiagem','decoracao','bouquet','outro')),
  observacoes   TEXT,
  favorito      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Row Level Security (RLS) ───────────────────────────────────
-- As tabelas ficam acessíveis pela anon key sem RLS.
-- Para produção segura, habilite o RLS e configure políticas
-- baseadas em Supabase Auth (ex: auth.uid() por linha).
-- ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE medidas_noiva ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE fichas_tecnicas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orcamento_itens ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE parcelas_prova ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE inspiracoes ENABLE ROW LEVEL SECURITY;
