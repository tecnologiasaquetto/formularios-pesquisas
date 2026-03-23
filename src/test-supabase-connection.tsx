import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestSupabaseConnection() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        setStatus('loading');
        
        // Teste simples: contar formulários
        const { count, error } = await supabase
          .from('formularios')
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.error('❌ Erro Supabase:', error);
          setStatus('error');
          setData({ 
            error: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
        } else {
          console.log('✅ Supabase conectado!');
          console.log('📊 Total formulários:', count);
          setStatus('connected');
          setData({ count, source: 'supabase' });
        }
      } catch (err) {
        console.error('❌ Erro geral:', err);
        setStatus('error');
        setData({ error: err.message });
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔍 Teste de Conexão Supabase</h1>
      
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="font-medium">Status:</span>
          <span className={`px-3 py-1 rounded-full text-sm ${
            status === 'loading' ? 'bg-yellow-100 text-yellow-800' :
            status === 'connected' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {status === 'loading' ? '⏳ Testando...' :
             status === 'connected' ? '✅ Conectado' :
             '❌ Erro'}
          </span>
        </div>

        {data && (
          <div className="space-y-2">
            <div className="p-3 bg-gray-50 rounded">
              <p className="font-mono text-sm">
                <strong>Fonte:</strong> {data.source}<br/>
                <strong>Total formulários:</strong> {data.count || 0}
              </p>
            </div>
            
            {data.error && (
              <div className="p-3 bg-red-50 rounded text-red-700">
                <p className="font-mono text-sm">
                  <strong>Erro:</strong> {data.error}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p><strong>Como verificar:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Se aparecer "✅ Conectado" → Está usando Supabase</li>
            <li>Se aparecer "❌ Erro" → Verifique suas credenciais</li>
            <li>Abra o DevTools (F12) para mais detalhes</li>
          </ul>
        </div>

        <div className="pt-4">
          <a 
            href="/admin/formularios" 
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Ir para Formulários Admin
          </a>
        </div>
      </div>
    </div>
  );
}
