-- ══════════════════════════════════════════════════════════════════════════
-- Miss Bô — Row Level Security
-- Execute este script no Supabase SQL Editor (Dashboard → SQL Editor)
-- Garante que apenas usuários autenticados acessam os dados
-- ══════════════════════════════════════════════════════════════════════════

-- ── Habilitar RLS em todas as tabelas ─────────────────────────────────────
ALTER TABLE clientes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE medidas_noiva     ENABLE ROW LEVEL SECURITY;
ALTER TABLE fichas_tecnicas   ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamento_itens   ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcelas_prova    ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspiracoes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_sistema    ENABLE ROW LEVEL SECURITY;

-- ── Políticas: apenas usuários autenticados têm acesso total ──────────────

-- clientes
CREATE POLICY "auth_all" ON clientes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- medidas_noiva
CREATE POLICY "auth_all" ON medidas_noiva
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- fichas_tecnicas
CREATE POLICY "auth_all" ON fichas_tecnicas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- contratos
CREATE POLICY "auth_all" ON contratos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- orcamentos
CREATE POLICY "auth_all" ON orcamentos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- orcamento_itens
CREATE POLICY "auth_all" ON orcamento_itens
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- agendamentos
CREATE POLICY "auth_all" ON agendamentos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- pagamentos
CREATE POLICY "auth_all" ON pagamentos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- parcelas_prova
CREATE POLICY "auth_all" ON parcelas_prova
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- inspiracoes
CREATE POLICY "auth_all" ON inspiracoes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- config_sistema
CREATE POLICY "auth_all" ON config_sistema
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════════════
-- PRÓXIMOS PASSOS:
-- 1. Vá ao Supabase Dashboard → Authentication → Users
-- 2. Clique em "Add User" e crie o usuário com e-mail e senha
-- 3. Copie o e-mail cadastrado e use na tela de login do app
-- ══════════════════════════════════════════════════════════════════════════
