import React, { useState, useEffect } from 'react';

export default function TestSimpleConnection() {
  const [status, setStatus] = useState<'testing' | 'connected' | 'error'>('testing');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const testBasicConnection = async () => {
      try {
        // Teste básico de conectividade
        const response = await fetch('https://httpbin.org/get');
        
        if (response.ok) {
          setStatus('connected');
          setMessage('✅ Conexão com internet funcionando!');
        } else {
          setStatus('error');
          setMessage('❌ Sem conexão com internet');
        }
      } catch (error) {
        setStatus('error');
        setMessage(`❌ Erro: ${error.message}`);
      }
    };

    // Teste de resolução DNS
    const testDNS = async () => {
      try {
        const response = await fetch('https://ftxzpvrdyqnofxjmyeqd.supabase.co');
        
        if (response.ok) {
          setMessage('✅ URL Supabase acessível!');
        } else {
          setMessage('❌ URL Supabase inacessível!');
        }
      } catch (error) {
        setMessage(`❌ Erro DNS: ${error.message}`);
      }
    };

    const runTests = async () => {
      setStatus('testing');
      setMessage('🔍 Testando conectividade...');
      
      await testBasicConnection();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await testDNS();
    };

    runTests();
  }, []);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔍 Teste de Conectividade</h1>
      
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="font-medium">Status:</span>
          <span className={`px-3 py-1 rounded-full text-sm ${
            status === 'testing' ? 'bg-yellow-100 text-yellow-800' :
            status === 'connected' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {status === 'testing' ? '🔍 Testando...' :
             status === 'connected' ? '✅ Online' :
             '❌ Offline'}
          </span>
        </div>

        {message && (
          <div className="p-4 bg-blue-50 rounded text-blue-700">
            <p className="text-sm">{message}</p>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="font-medium mb-2">🔧 Diagnóstico:</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded">
              <h4 className="font-medium mb-2">✅ Se funcionar:</h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Internet conectada</li>
                <li>URL Supabase acessível</li>
                <li>Pode prosseguir com migração</li>
              </ul>
            </div>
            
            <div className="p-3 bg-gray-50 rounded">
              <h4 className="font-medium mb-2">❌ Se der erro:</h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Verifique a URL no Supabase Dashboard</li>
                <li>Confirme se o projeto existe</li>
                <li>Verifique firewall/proxy</li>
                <li>Tente usar outra rede</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-4 space-y-2">
          <a 
            href="https://ftxzpvrdyqnofxjmyeqd.supabase.co" 
            target="_blank"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            🔗 Acessar Supabase Diretamente
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
