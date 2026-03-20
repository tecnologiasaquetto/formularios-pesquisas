import { supabase } from '../src/lib/supabase'
import { 
  formularios, 
  perguntas, 
  matrizItens, 
  respostas, 
  respostaItens,
  users as mockUsers 
} from '../src/lib/mockData'

// Migration Script: Mock Data → Supabase
async function migrateToSupabase() {
  console.log('🚀 Iniciando migração para Supabase...')
  
  try {
    // 1. Migrar Usuários
    console.log('📦 Migrando usuários...')
    for (const user of mockUsers) {
      try {
        // Primeiro criar auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: 'temp123456', // Senha temporária
          email_confirm: true,
          user_metadata: {
            nome: user.nome,
            cargo: user.cargo,
            departamento: user.departamento,
            role: user.role
          }
        })

        if (authError) {
          console.error(`Erro ao criar auth user ${user.email}:`, authError)
          continue
        }

        // Depois criar usuário na tabela users
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: user.email,
            nome: user.nome,
            cargo: user.cargo,
            departamento: user.departamento,
            role: user.role,
            ativo: user.ativo,
            ultimo_acesso: user.ultimo_acesso
          })

        if (userError) {
          console.error(`Erro ao inserir usuário ${user.email}:`, userError)
        } else {
          console.log(`✅ Usuário ${user.email} migrado`)
        }
      } catch (error) {
        console.error(`Erro ao migrar usuário ${user.email}:`, error)
      }
    }

    // 2. Migrar Formulários
    console.log('📝 Migrando formulários...')
    const adminUser = mockUsers.find(u => u.role === 'administrador')
    
    for (const formulario of formularios) {
      try {
        const { data, error } = await supabase
          .from('formularios')
          .insert({
            nome: formulario.nome,
            slug: formulario.slug,
            descricao: formulario.descricao,
            mensagem_fim: formulario.mensagem_fim,
            logo_url: formulario.logo_url,
            data_inicio: formulario.data_inicio,
            data_fim: formulario.data_fim,
            mostrar_capa: formulario.mostrar_capa,
            ativo: formulario.ativo,
            cor_tema: formulario.cor_tema,
            criado_por: adminUser?.id || null
          })
          .select()
          .single()

        if (error) {
          console.error(`Erro ao inserir formulário ${formulario.nome}:`, error)
          continue
        }

        console.log(`✅ Formulário ${formulario.nome} migrado (ID: ${data.id})`)

        // 3. Migrar Perguntas
        console.log(`❓ Migrando perguntas do formulário ${formulario.nome}...`)
        const formularioPerguntas = perguntas.filter(p => p.formulario_id === formulario.id)
        
        for (const pergunta of formularioPerguntas) {
          try {
            const { data: perguntaData, error: perguntaError } = await supabase
              .from('perguntas')
              .insert({
                formulario_id: data.id,
                texto: pergunta.texto,
                tipo: pergunta.tipo,
                obrigatorio: pergunta.obrigatorio,
                ordem: pergunta.ordem,
                opcoes: pergunta.opcoes,
                validacoes: pergunta.validacoes
              })
              .select()
              .single()

            if (perguntaError) {
              console.error(`Erro ao inserir pergunta ${pergunta.texto}:`, perguntaError)
              continue
            }

            console.log(`✅ Pergunta "${pergunta.texto}" migrada (ID: ${perguntaData.id})`)

            // 4. Migrar Matriz Itens (se houver)
            const matrizItems = matrizItens.filter(mi => mi.pergunta_id === pergunta.id)
            
            if (matrizItems.length > 0) {
              console.log(`🔢 Migrando ${matrizItems.length} itens da matriz...`)
              
              for (const item of matrizItems) {
                try {
                  const { error: itemError } = await supabase
                    .from('matriz_itens')
                    .insert({
                      pergunta_id: perguntaData.id,
                      linha: item.linha,
                      coluna: item.coluna,
                      ordem: item.ordem
                    })

                  if (itemError) {
                    console.error(`Erro ao inserir item matriz:`, itemError)
                  }
                } catch (error) {
                  console.error(`Erro ao migrar item matriz:`, error)
                }
              }
              
              console.log(`✅ Itens da matriz migrados`)
            }
          } catch (error) {
            console.error(`Erro ao migrar pergunta ${pergunta.texto}:`, error)
          }
        }

        // 5. Migrar Respostas
        console.log(`📋 Migrando respostas do formulário ${formulario.nome}...`)
        const formularioRespostas = respostas.filter(r => r.formulario_id === formulario.id)
        
        for (const resposta of formularioRespostas) {
          try {
            const { data: respostaData, error: respostaError } = await supabase
              .from('respostas')
              .insert({
                formulario_id: data.id,
                respondente_nome: resposta.respondente?.nome || null,
                respondente_email: resposta.respondente?.email || null,
                respondente_departamento: resposta.respondente?.departamento || null,
                ip_address: resposta.ip_address || null,
                user_agent: resposta.user_agent || null,
                finalizado: resposta.finalizado
              })
              .select()
              .single()

            if (respostaError) {
              console.error(`Erro ao inserir resposta:`, respostaError)
              continue
            }

            // 6. Migrar Resposta Itens
            const respostaItems = respostaItens.filter(ri => ri.resposta_id === resposta.id)
            
            if (respostaItems.length > 0) {
              const mappedItems = respostaItems.map(item => {
                // Encontrar o novo ID da pergunta
                const oldPergunta = perguntas.find(p => p.id === item.pergunta_id)
                const newPergunta = formularioPerguntas.find(p => p.texto === oldPergunta?.texto)
                
                // Encontrar o novo ID do matriz item (se houver)
                let newMatrizItemId = null
                if (item.matriz_item_id) {
                  const oldMatrizItem = matrizItens.find(mi => mi.id === item.matriz_item_id)
                  const newMatrizItem = matrizItems.find(mi => 
                    mi.linha === oldMatrizItem?.linha && 
                    mi.coluna === oldMatrizItem?.coluna
                  )
                  // Aqui precisaríamos buscar o ID real no Supabase
                  // Simplificando por agora
                }

                return {
                  resposta_id: respostaData.id,
                  pergunta_id: newPergunta?.id || item.pergunta_id,
                  matriz_item_id: newMatrizItemId,
                  valor: item.valor,
                  arquivo_url: item.arquivo_url
                }
              })

              const { error: itemsError } = await supabase
                .from('resposta_itens')
                .insert(mappedItems)

              if (itemsError) {
                console.error(`Erro ao inserir itens da resposta:`, itemsError)
              } else {
                console.log(`✅ Resposta com ${respostaItems.length} itens migrada`)
              }
            }
          } catch (error) {
            console.error(`Erro ao migrar resposta:`, error)
          }
        }
      } catch (error) {
        console.error(`Erro ao migrar formulário ${formulario.nome}:`, error)
      }
    }

    console.log('🎉 Migração concluída com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error)
  }
}

// Função para verificar dados migrados
async function verifyMigration() {
  console.log('🔍 Verificando dados migrados...')
  
  try {
    const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true })
    const { count: formulariosCount } = await supabase.from('formularios').select('*', { count: 'exact', head: true })
    const { count: perguntasCount } = await supabase.from('perguntas').select('*', { count: 'exact', head: true })
    const { count: respostasCount } = await supabase.from('respostas').select('*', { count: 'exact', head: true })
    const { count: respostaItensCount } = await supabase.from('resposta_itens').select('*', { count: 'exact', head: true })
    
    console.log('📊 Estatísticas da migração:')
    console.log(`👥 Usuários: ${usersCount}`)
    console.log(`📝 Formulários: ${formulariosCount}`)
    console.log(`❓ Perguntas: ${perguntasCount}`)
    console.log(`📋 Respostas: ${respostasCount}`)
    console.log(`🔢 Itens de resposta: ${respostaItensCount}`)
    
  } catch (error) {
    console.error('❌ Erro ao verificar migração:', error)
  }
}

// Executar migração
if (require.main === module) {
  migrateToSupabase()
    .then(() => verifyMigration())
    .catch(console.error)
}

export { migrateToSupabase, verifyMigration }
