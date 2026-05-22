'use client'

import { useEffect, useState } from 'react'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export default function SwaggerPage() {
  const [spec, setSpec] = useState(null)

  useEffect(() => {
    fetch('/api/swagger')
      .then((res) => res.json())
      .then((data) => setSpec(data))
  }, [])

  if (!spec) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Cargando documentación...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '1rem' }}>
      <SwaggerUI spec={spec} />
    </div>
  )
}
