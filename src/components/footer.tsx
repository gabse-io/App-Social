'use client'

import Link from 'next/link'

export function Footer() {
  return (
    <footer style={{ textAlign: 'center' }}>
      <Link 
        href="https://gabse.netlify.app/" 
        target="_blank" 
        rel="noopener noreferrer"
        style={{ display: 'inline-block', textDecoration: 'none' }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 560 130" 
          width="280" 
          height="65"
          style={{ display: 'block', margin: '0 auto' }}
        >
          <defs>
            <linearGradient id="techGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a73e8"/>
              <stop offset="50%" stopColor="#06B6D4"/>
              <stop offset="100%" stopColor="#10B981"/>
            </linearGradient>
            <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F97316"/>
              <stop offset="100%" stopColor="#F59E0B"/>
            </linearGradient>
            <filter id="glowSoft">
              <feGaussianBlur stdDeviation="2" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Fondo transparente para integrarse con el diseño */}
          <rect width="560" height="130" fill="transparent" rx="16"/>

          {/* Símbolo: nodo activo con pulso - centrado */}
          <g transform="translate(100, 30)">
            <circle cx="28" cy="35" r="22" fill="none" stroke="#1a73e8" strokeWidth="1.5" opacity="0.3"/>
            <circle cx="28" cy="35" r="30" fill="none" stroke="#06B6D4" strokeWidth="1" opacity="0.2"/>
            <circle cx="28" cy="35" r="14" fill="none" stroke="url(#techGrad)" strokeWidth="2" opacity="0.6"/>
            <circle cx="28" cy="35" r="6" fill="url(#accentGrad)" filter="url(#glowSoft)"/>
            <line x1="34" y1="35" x2="48" y2="35" stroke="url(#techGrad)" strokeWidth="2" strokeDasharray="4 2"/>
            <circle cx="50" cy="35" r="2" fill="#10B981"/>
          </g>

          {/* Nombre GABSE - alineado a la izquierda */}
          <text x="160" y="68" fontFamily="'Inter', 'Segoe UI', sans-serif" fontSize="44" fontWeight="800" fill="url(#techGrad)" letterSpacing="3">GABSE</text>

          {/* Subtítulo - referencia de alineación */}
          <text x="160" y="92" fontFamily="'Inter', sans-serif" fontSize="12" fontWeight="600" fill="#5f7f9e" letterSpacing="2">DIGITAL COMMERCE ANALYST</text>

          {/* Texto VTEX SPECIALIST - alineado a la izquierda */}
          <text x="160" y="110" fontFamily="'Fira Code', monospace" fontSize="11" fontWeight="400" fill="#F97316" letterSpacing="1">VTEX SPECIALIST</text>

          {/* Cursor subrayado alineado */}
          <rect x="285" y="111" width="10" height="2" fill="#06B6D4">
            <animate attributeName="opacity" values="1;0;1" dur="0.8s" repeatCount="indefinite"/>
          </rect>
        </svg>
      </Link>
    </footer>
  )
}
