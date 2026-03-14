"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { href: "/gestion", label: "Dashboard", icon: "📊" },
  { href: "/gestion/plan", label: "Plan Semanal", icon: "📋" },
  { href: "/gestion/operativo", label: "Operativo", icon: "✅" },
  { href: "/gestion/financiero", label: "Financiero", icon: "💰" },
  { href: "/gestion/centro", label: "Centro", icon: "🎯" },
]

export default function GestionLayout({ children }) {
  const pathname = usePathname()

  return (
    <div>
      {/* Sub-navigation bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '12px 0',
        marginBottom: 24,
        borderBottom: '1px solid var(--color-border)',
        overflowX: 'auto',
      }}>
        <span style={{
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--color-text)',
          marginRight: 16,
          whiteSpace: 'nowrap',
        }}>
          Control Hub
        </span>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--color-primary-text, #fff)' : 'var(--color-text-secondary)',
                background: isActive ? 'var(--color-primary)' : 'transparent',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </div>

      {children}
    </div>
  )
}
