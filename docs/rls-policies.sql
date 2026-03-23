-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE formularios ENABLE ROW LEVEL SECURITY;
ALTER TABLE perguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE matriz_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE resposta_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE departamentos ENABLE ROW LEVEL SECURITY;

-- Policies para tabela users
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'administrador'
    )
  );

CREATE POLICY "Admins can insert users" ON users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'administrador'
    )
  );

CREATE POLICY "Admins can update users" ON users
  FOR UPDATE USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'administrador'
    )
  );

CREATE POLICY "Admins can delete users" ON users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'administrador'
    )
  );

-- Policies para tabela formularios
CREATE POLICY "Authenticated users can view active forms" ON formularios
  FOR SELECT USING (
    auth.role() = 'authenticated' AND ativo = true
  );

CREATE POLICY "Admins can view all forms" ON formularios
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'administrador'
    )
  );

CREATE POLICY "Admins can manage forms" ON formularios
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'administrador'
    )
  );

-- Policies para tabela perguntas
CREATE POLICY "Users can view questions from active forms" ON perguntas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM formularios 
      WHERE formularios.id = perguntas.formulario_id 
      AND formularios.ativo = true
    )
  );

CREATE POLICY "Admins can manage questions" ON perguntas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'administrador'
    )
  );

-- Policies para tabela matriz_itens
CREATE POLICY "Users can view matrix items from active forms" ON matriz_itens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM perguntas 
      JOIN formularios ON formularios.id = perguntas.formulario_id
      WHERE perguntas.id = matriz_itens.pergunta_id 
      AND formularios.ativo = true
    )
  );

CREATE POLICY "Admins can manage matrix items" ON matriz_itens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'administrador'
    )
  );

-- Policies para tabela respostas
CREATE POLICY "Anyone can insert responses" ON respostas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all responses" ON respostas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'administrador'
    )
  );

CREATE POLICY "Viewers can view responses" ON respostas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'visualizador'
    ) AND
    EXISTS (
      SELECT 1 FROM formularios 
      WHERE formularios.id = respostas.formulario_id 
      AND formularios.ativo = true
    )
  );

-- Policies para tabela resposta_itens
CREATE POLICY "Anyone can insert response items" ON resposta_itens
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view response items from active forms" ON resposta_itens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM respostas 
      JOIN formularios ON formularios.id = respostas.formulario_id
      WHERE respostas.id = resposta_itens.resposta_id 
      AND formularios.ativo = true
    )
  );

CREATE POLICY "Admins can view all response items" ON resposta_itens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'administrador'
    )
  );

-- Policies para tabela departamentos
CREATE POLICY "Authenticated users can view active departments" ON departamentos
  FOR SELECT USING (
    auth.role() = 'authenticated' AND ativo = true
  );

CREATE POLICY "Admins can manage departments" ON departamentos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'administrador'
    )
  );

-- Habilitar realtime para as tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE formularios;
ALTER PUBLICATION supabase_realtime ADD TABLE respostas;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
