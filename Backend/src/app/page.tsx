export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Magdalena Smart Farming - API</h1>
      <p>Backend con arquitectura de capas para Magdalena Smart Farming</p>
      
      <div style={{ margin: '1rem 0', padding: '1rem', background: '#f0f0f0', borderRadius: '8px' }}>
        <a 
          href="/swagger" 
          style={{ 
            display: 'inline-block',
            padding: '0.75rem 1.5rem', 
            background: '#2E7D32', 
            color: 'white', 
            textDecoration: 'none',
            borderRadius: '4px',
            fontWeight: 'bold'
          }}
        >
          📖 Ver Documentación Swagger
        </a>
      </div>

      <h2>Endpoints disponibles:</h2>
      <ul>
        <li><strong>POST /api/auth/login</strong> - Login de técnico</li>
        <li><strong>POST /api/auth/login/farmer</strong> - Login de campesino con PIN</li>
        <li><strong>POST /api/auth/register</strong> - Registro de técnico</li>
        <li><strong>GET/POST /api/farmers</strong> - Gestión de campesinos</li>
        <li><strong>POST /api/farmers/:id/regenerate-pin</strong> - Regenerar PIN</li>
        <li><strong>GET /api/farmers/:id/dashboard</strong> - Dashboard del campesino</li>
        <li><strong>GET/POST /api/parcels</strong> - Parcelas</li>
        <li><strong>GET/POST /api/climate</strong> - Registros climáticos</li>
        <li><strong>GET/POST /api/observations</strong> - Observaciones del cultivo</li>
        <li><strong>GET/POST /api/inputs</strong> - Insumos</li>
        <li><strong>GET/POST /api/alerts</strong> - Alertas</li>
        <li><strong>GET/POST /api/recommendations</strong> - Recomendaciones</li>
        <li><strong>GET/POST /api/rules</strong> - Reglas agronómicas</li>
        <li><strong>GET/POST /api/reports</strong> - Reportes</li>
        <li><strong>POST /api/reports/farmer-assessment</strong> - Generar resumen de asesoría</li>
        <li><strong>POST /api/sync</strong> - Sincronización de datos</li>
        <li><strong>GET /api/sync/:farmerId</strong> - Estado de sincronización</li>
        <li><strong>GET /api/dashboard/technician</strong> - Dashboard del técnico</li>
        <li><strong>GET /api/dashboard/farmer</strong> - Dashboard del campesino</li>
        <li><strong>GET /api/activities</strong> - Logs de actividades</li>
      </ul>
    </main>
  )
}
