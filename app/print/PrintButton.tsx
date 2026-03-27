'use client'
import { useEffect } from 'react'

export default function PrintButton() {
  useEffect(() => {
    setTimeout(() => window.print(), 500)
  }, [])

  return (
    <button
      onClick={() => window.print()}
      style={{
        position: 'fixed', top: 16, right: 16, zIndex: 999,
        background: '#534AB7', color: '#FFFFFF', border: 'none',
        borderRadius: 8, padding: '8px 18px', fontSize: 13,
        fontWeight: 500, cursor: 'pointer'
      }}
    >
      Печать / PDF
    </button>
  )
}
