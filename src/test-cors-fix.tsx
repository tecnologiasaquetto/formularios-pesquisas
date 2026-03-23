import React, { useState, useEffect } from 'react';

export default function TestCorsFix() {
  const [status, setStatus] = useState<'testing' | 'connected' | 'error'>('testing');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const testSupabaseAPI = async () => {
      try {
        setStatus('testing');
        
        // Teste direto da API REST do Supabase
        const response = await fetch('https://ftxzpvrdyqnofxjmyeqd.supabase.co/rest/v1/formularios?select=count', {
          method: 'GET',
          headers: {
            'apikey': 'yeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0eHpwdnJkeXFub2Z4am15ZXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNTA0NzksImV4cCI6MjA4OTgyNjQ3OX0.udCLET5BX1_LGnYxeh3D1pEchfA6J-grxelz6ABBfMQ',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer yeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0eHpwdnJkeXFub2Z4am15ZXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNTA0NzksImV4cCI6MjA4OTgyNjQ3OX0.udCLET5BX1_LGnYxeh3D1pEchfA6J-grxelz6ABBfMQ'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        
        console.log('✅ API REST funcionando!');
        console.log('📊 Resultado:', result);
        
        setStatus('connected');
        setData({ 
          success: true,
          message: 'API REST do Supabase acessível!',
          result
        });

      } catch (error) {
        console.error('❌ Erro na API:', error);
        setStatus('error');
        setData({ 
          error: error.message,
          type: 'API_REST_ERROR'
        });
      }
    };

    testSupabaseAPI();
  }, []);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔧 Teste CORS + API REST</h1>
      
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="font-medium">Status:</span>
          <span className={`px-3 py-1 rounded-full text-sm ${
            status === 'testing' ? 'bg-yellow-100 text-yellow-800' :
            status === 'connected' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {status === 'testing' ? '🔍 Testando API...' :
             status === 'connected' ? '✅ API OK' :
             '❌ Erro API'}
          </span>
        </div>

        {data && (
          <div className="space-y-3">
            {data.success ? (
              <div className="p-4 bg-green-50 rounded text-green-700">
                <p className="font-medium">✅ Sucesso!</p>
                <p className="text-sm mt-1">{data.message}</p>
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium">Ver resposta completa</summary>
                  <pre className="mt-2 text-xs bg-white p-2 rounded border">
                    {JSON.stringify(data.result, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="p-4 bg-red-50 rounded text-red-700">
                <p className="font-medium">❌ Erro na API:</p>
                <p className="text-sm mt-1 font-mono">{data.error}</p>
                <p className="text-xs mt-2">Tipo: {data.type}</p>
              </div>
            )}
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p><strong>Se funcionar:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>✅ API REST está acessível</li>
            <li>✅ Chaves estão corretas</li>
            <li>✅ Pode usar Supabase diretamente</li>
          </ul>
          
          <p className="mt-3"><strong>Se der erro:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>❌ Verifique as chaves no Supabase Dashboard</li>
            <li>❌ Configure CORS no Supabase</li>
            <li>❌ Verifique se o projeto está ativo</li>
          </ul>
        </div>

        <div className="pt-4">
          <a 
            href="https://ftxzpvrdyqnofxjmyeqd.supabase.co/rest/v1/formularios?select=count" 
            target="_blank"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            🔗 Testar API Diretamente
          </a>
          
          <a 
            href="/admin/formularios" 
            className="inline-flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 ml-2"
          >
            🏠 Voltar para Admin
          </a>
        </div>
      </div>
    </div>
  );
}
