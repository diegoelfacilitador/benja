"use client"

import { useState, useRef } from "react"

// ── Design Tokens EF ──────────────────────────────────────────────
const T = {
  bg: "#ffffff",
  surface: "#f9fafb",
  surfaceAlt: "#f3f4f6",
  border: "#e5e7eb",
  borderLight: "#f0f0f0",
  ink: "#111111",
  inkSoft: "#374151",
  inkMid: "#6b7280",
  inkLight: "#9ca3af",
  inkFaint: "#d1d5db",
  blue: "#1e40af",   blueBg: "#dbeafe",
  gold: "#854d0e",   goldBg: "#fef9c3",
  green: "#166534",  greenBg: "#dcfce7",
  red: "#991b1b",    redBg: "#fee2e2",
  font: "'Ubuntu', 'SF Pro Display', system-ui, sans-serif",
  mono: "'SF Mono', 'JetBrains Mono', ui-monospace, monospace",
}

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${T.bg}; }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }
  ::selection { background: rgba(17,17,17,0.10); }
`

// ── Data ──────────────────────────────────────────────────────────
const SPRINTS = [
  {
    id: "s1", code: "S1", label: "Semanas 1–2",
    dates: "10–22 Mar", status: "activo" as const,
    norte: "Motor encendido",
    descripcion: "Publicar sin perfeccionar. Primeros contactos B2B. Definir precio del recurrente.",
    acciones: [
      { id: "a1", texto: "Publicar 6 posts LU–MI–VI en LinkedIn", hecho: false },
      { id: "a2", texto: "3 outreach B2B a contactos que te conocen", hecho: false },
      { id: "a3", texto: "Definir precio y estructura del recurrente ($97–$197/mes)", hecho: false },
      { id: "a4", texto: "Completar auditoría del sábado", hecho: false },
    ],
    kpis: [
      { label: "Posts publicados", meta: "6", actual: null as string | null, unit: "" },
      { label: "Outreach B2B", meta: "3", actual: null as string | null, unit: "" },
      { label: "Leads capturados", meta: "10", actual: null as string | null, unit: "" },
    ],
  },
  {
    id: "s2", code: "S2", label: "Semanas 3–4",
    dates: "24 Mar–5 Abr", status: "proximo" as const,
    norte: "Primer dinero recurrente",
    descripcion: "Cerrar el primer proyecto B2B y lanzar la lista de espera del programa mensual.",
    acciones: [
      { id: "b1", texto: "Cerrar 1 proyecto B2B ($2.000+)", hecho: false },
      { id: "b2", texto: "Lanzar lista de espera para programa mensual", hecho: false },
      { id: "b3", texto: "Grabar 1 pieza de autoridad larga (artículo o video)", hecho: false },
      { id: "b4", texto: "Auditoría S2: ¿qué contenido tuvo más tracción?", hecho: false },
    ],
    kpis: [
      { label: "Proyecto B2B cerrado", meta: "1", actual: null as string | null, unit: "" },
      { label: "Lista de espera", meta: "20", actual: null as string | null, unit: "leads" },
      { label: "MRR", meta: "$0→$", actual: null as string | null, unit: "" },
    ],
  },
  {
    id: "s3", code: "S3", label: "Semanas 5–6",
    dates: "7–19 Abr", status: "futuro" as const,
    norte: "Lanzamiento cohorte",
    descripcion: "Webinar de cierre para la lista de espera. Meta: 5 suscriptores recurrentes.",
    acciones: [
      { id: "c1", texto: "Webinar de cierre — pitch directo al final", hecho: false },
      { id: "c2", texto: "5 suscriptores al programa mensual", hecho: false },
      { id: "c3", texto: "Si vende fácil: sube precio. Si no: simplifica oferta.", hecho: false },
      { id: "c4", texto: "Auditoría S3: ¿cuánto MRR? ¿viene de quién?", hecho: false },
    ],
    kpis: [
      { label: "Asistentes webinar", meta: "30", actual: null as string | null, unit: "" },
      { label: "Suscriptores nuevos", meta: "5", actual: null as string | null, unit: "" },
      { label: "MRR acumulado", meta: "$500", actual: null as string | null, unit: "" },
    ],
  },
  {
    id: "s46", code: "S4–6", label: "Meses 2–3",
    dates: "21 Abr–31 May", status: "futuro" as const,
    norte: "Masa crítica",
    descripcion: "Segunda cohorte, referidos activos, y primera alianza corporativa.",
    acciones: [
      { id: "d1", texto: "Segunda cohorte del programa recurrente", hecho: false },
      { id: "d2", texto: "Activar referidos: cliente trae 1 cliente = beneficio", hecho: false },
      { id: "d3", texto: "1 alianza con HR de empresa mediana (20+ personas)", hecho: false },
      { id: "d4", texto: "Evaluar si Hub Escuela es vendible aquí", hecho: false },
    ],
    kpis: [
      { label: "MRR al cierre mes 3", meta: "$3.000–$5.000", actual: null as string | null, unit: "" },
      { label: "Suscriptores activos", meta: "20–30", actual: null as string | null, unit: "" },
      { label: "Retención", meta: ">80%", actual: null as string | null, unit: "%" },
    ],
  },
]

const NORTHSTAR_ROWS = [
  { mes: "Mar", meta: "Motor encendido", mrr: "$0", activo: true },
  { mes: "Abr", meta: "Primer cohort", mrr: "$500–1k", activo: false },
  { mes: "May", meta: "Masa crítica", mrr: "$2k–3k", activo: false },
  { mes: "Jun", meta: "Checkpoint mid-year", mrr: "$5k", activo: false },
  { mes: "Ago", meta: "Escalado", mrr: "$10k", activo: false },
  { mes: "Dic", meta: "100 recurrentes", mrr: "$10k+", activo: false },
]

const FUENTES = [
  { tipo: "B2C Suscripción", ticket: "$97–$197/mes", volumen: "80 suscriptores", resultado: "$8k–15k MRR" },
  { tipo: "B2C Certificación", ticket: "$600–$2.000", volumen: "2 cohortes/año", resultado: "$12k–30k/año" },
  { tipo: "B2B Workshops", ticket: "$2.000–$4.000", volumen: "4–6 proyectos/año", resultado: "$10k–24k/año" },
]

const AGENDA_SABADO = [
  { hora: "09:00–09:20", titulo: "KPIs del sprint cerrado", desc: "¿Se cumplió? ¿Por qué sí o no? Solo datos." },
  { hora: "09:20–09:40", titulo: "Contenido publicado", desc: "¿Qué funcionó? ¿Qué tracción tuvo?" },
  { hora: "09:40–10:00", titulo: "Pipeline B2B/B2C", desc: "¿Hay propuestas abiertas? ¿Hay seguimientos pendientes?" },
  { hora: "10:00–10:20", titulo: "Prioridades sprint siguiente", desc: "Solo 3 acciones críticas. Nada más." },
  { hora: "10:20–10:40", titulo: "Bloquear calendario", desc: "Los lunes y los días de publicación bloqueados." },
  { hora: "10:40–11:00", titulo: "Reporte a Jorge", desc: "Foto del tablero. Mensaje corto. Enviado." },
]

const REGLAS = [
  {
    titulo: "No negocia",
    desc: "El indicador se cumplió o no se cumplió. No hay 'casi lo logré' ni 'estaba por hacerlo'. No hay grises.",
    badge: "CRÍTICO", badgeColor: T.red, badgeBg: T.redBg,
  },
  {
    titulo: "No se emociona",
    desc: "El entusiasmo de Diego no es un dato. Una idea nueva no cambia el plan. El plan cambia solo cuando los datos lo exigen.",
    badge: "CRÍTICO", badgeColor: T.red, badgeBg: T.redBg,
  },
  {
    titulo: "Un sprint a la vez",
    desc: "El Centro evalúa el sprint activo. El Hub, el SaaS, el próximo lanzamiento no existen hasta que este sprint cierre.",
    badge: "PROTOCOLO", badgeColor: T.gold, badgeBg: T.goldBg,
  },
  {
    titulo: "Solo invierte lo que entiende",
    desc: "Si una acción no tiene relación directa con MRR, no está en el plan. No hay excepciones por 'aprendizaje'.",
    badge: "PROTOCOLO", badgeColor: T.gold, badgeBg: T.goldBg,
  },
  {
    titulo: "El sábado es sagrado",
    desc: "Si Diego no aparece, El Centro marca el sprint en rojo y notifica a Jorge. No hay recuperación retroactiva.",
    badge: "PROTOCOLO", badgeColor: T.gold, badgeBg: T.goldBg,
  },
  {
    titulo: "Recuerda por qué",
    desc: "Diego tiene casi 40 años. Tiene familia. Tiene un hijo. Esto no es entretenido — es trabajo. El cerebro obedece cuando el propósito es más grande que el humor.",
    badge: "PROPÓSITO", badgeColor: T.green, badgeBg: T.greenBg,
  },
]

// ── Components ────────────────────────────────────────────────────
function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "3px",
      color: T.inkLight, textTransform: "uppercase",
      marginBottom: 8, ...style,
    }}>
      {children}
    </p>
  )
}

function BadgeLabel({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: "0.5px",
      color, background: bg,
      padding: "3px 8px", borderRadius: 20,
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  )
}

function StatusDot({ status }: { status: "activo" | "proximo" | "futuro" }) {
  const cfg = {
    activo:  { color: T.green, label: "ACTIVO" },
    proximo: { color: T.gold, label: "PRÓXIMO" },
    futuro:  { color: T.inkFaint, label: "FUTURO" },
  }[status]
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.color, display: "inline-block" }} />
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", color: cfg.color, textTransform: "uppercase" }}>
        {cfg.label}
      </span>
    </div>
  )
}

// ── NAV ──────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "gtm", label: "Plan GTM" },
  { id: "north", label: "North Star" },
  { id: "sabado", label: "Protocolo Sábado" },
  { id: "reglas", label: "Reglas" },
]

function Nav({ active, onNavigate }: { active: string; onNavigate: (id: string) => void }) {
  return (
    <nav style={{
      borderBottom: `1px solid ${T.border}`,
      background: T.bg,
      position: "sticky", top: 0, zIndex: 50,
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        {/* Logo / Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.inkLight, letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1 }}>Sistema de Control</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: T.ink, lineHeight: 1.2 }}>El Centro</div>
          </div>
        </div>

        {/* Nav tabs */}
        <div style={{ display: "flex", gap: 4 }}>
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => onNavigate(item.id)} style={{
              border: "none", cursor: "pointer",
              padding: "8px 14px",
              borderRadius: 6,
              background: active === item.id ? T.surfaceAlt : "transparent",
              color: active === item.id ? T.ink : T.inkMid,
              fontSize: 13, fontWeight: active === item.id ? 700 : 400,
              fontFamily: T.font,
              transition: "all .15s",
            }}>
              {item.label}
            </button>
          ))}
        </div>

        {/* Sprint indicator */}
        <div style={{ textAlign: "right" }}>
          <StatusDot status="activo" />
          <div style={{ fontSize: 10, color: T.inkLight, marginTop: 2 }}>S1 · Mar 10–22</div>
        </div>
      </div>
    </nav>
  )
}

// ── PAGE WRAPPER ─────────────────────────────────────────────────
function Page({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      animation: "fadeUp .4s ease-out",
      maxWidth: 740, margin: "0 auto",
      padding: "40px 24px 80px",
    }}>
      {children}
    </div>
  )
}

// ── GTM PAGE ──────────────────────────────────────────────────────
function PageGTM() {
  const [activeSprint, setActiveSprint] = useState(0)
  const [checks, setChecks] = useState<Record<string, boolean>>({})

  const sprint = SPRINTS[activeSprint]
  const done = (sprint.acciones.filter(a => checks[a.id]).length / sprint.acciones.length) * 100

  const toggle = (id: string) => setChecks(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <Page>
      <SectionLabel>Plan Go-to-Market · 3 meses · sprints de 2 semanas</SectionLabel>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: T.ink, marginBottom: 6 }}>
        Sprints de ejecución
      </h2>
      <p style={{ fontSize: 13, color: T.inkMid, lineHeight: 1.6, marginBottom: 32 }}>
        Cada sprint dura 2 semanas. El sábado se audita. El domingo no existe.
      </p>

      {/* Sprint selector tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, overflowX: "auto" }}>
        {SPRINTS.map((s, i) => (
          <button key={s.id} onClick={() => setActiveSprint(i)} style={{
            border: `1.5px solid ${activeSprint === i ? T.ink : T.border}`,
            borderRadius: 8, padding: "10px 16px", cursor: "pointer",
            background: activeSprint === i ? T.ink : T.bg,
            color: activeSprint === i ? "#fff" : T.inkMid,
            fontFamily: T.font, whiteSpace: "nowrap",
            transition: "all .15s",
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1px", opacity: .7 }}>{s.code}</div>
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>{s.label}</div>
            <div style={{ fontSize: 10, marginTop: 1, opacity: .6 }}>{s.dates}</div>
          </button>
        ))}
      </div>

      {/* Sprint card */}
      <div style={{ border: `1.5px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
        {/* Sprint header */}
        <div style={{ padding: "24px 24px 20px", borderBottom: `1px solid ${T.borderLight}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <StatusDot status={sprint.status} />
              <h3 style={{ fontSize: 20, fontWeight: 900, color: T.ink, marginTop: 8 }}>
                {sprint.norte}
              </h3>
              <p style={{ fontSize: 13, color: T.inkMid, lineHeight: 1.6, marginTop: 4 }}>
                {sprint.descripcion}
              </p>
            </div>
            {/* Progress circle */}
            <div style={{ textAlign: "center", flexShrink: 0, marginLeft: 24 }}>
              <div style={{ fontFamily: T.mono, fontSize: 28, fontWeight: 900, color: T.ink }}>
                {Math.round(done)}%
              </div>
              <div style={{ fontSize: 10, color: T.inkLight, letterSpacing: "1px" }}>COMPLETADO</div>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ height: 3, background: T.surfaceAlt, borderRadius: 2, marginTop: 16 }}>
            <div style={{
              height: 3, borderRadius: 2,
              background: done === 100 ? T.green : T.ink,
              width: `${done}%`,
              transition: "width .4s ease-out",
            }} />
          </div>
        </div>

        {/* Acciones */}
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.borderLight}` }}>
          <SectionLabel>Acciones obligatorias</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sprint.acciones.map(a => (
              <div key={a.id}
                onClick={() => toggle(a.id)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  padding: "12px 14px", borderRadius: 8,
                  background: checks[a.id] ? T.greenBg : T.surface,
                  border: `1px solid ${checks[a.id] ? "#bbf7d0" : T.borderLight}`,
                  cursor: "pointer", transition: "all .15s",
                }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                  border: `1.5px solid ${checks[a.id] ? T.green : T.inkFaint}`,
                  background: checks[a.id] ? T.green : T.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {checks[a.id] && <span style={{ color: "#fff", fontSize: 11, fontWeight: 900 }}>✓</span>}
                </div>
                <span style={{
                  fontSize: 13, color: checks[a.id] ? T.green : T.inkSoft,
                  lineHeight: 1.5,
                  textDecoration: checks[a.id] ? "line-through" : "none",
                  opacity: checks[a.id] ? 0.7 : 1,
                }}>
                  {a.texto}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div style={{ padding: "20px 24px" }}>
          <SectionLabel>KPIs del sprint</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {sprint.kpis.map((k, i) => (
              <div key={i} style={{
                border: `1.5px solid ${T.border}`, borderRadius: 10,
                padding: "14px 16px",
              }}>
                <div style={{ fontSize: 10, color: T.inkLight, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 8 }}>
                  {k.label}
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 900, color: T.ink }}>
                  {k.meta}
                </div>
                <div style={{ fontSize: 10, color: T.inkFaint, marginTop: 6, fontFamily: T.mono }}>
                  actual: {k.actual ?? "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Page>
  )
}

// ── NORTH STAR PAGE ───────────────────────────────────────────────
function PageNorth() {
  return (
    <Page>
      <SectionLabel>Trayectoria MRR · Mar → Dic 2026</SectionLabel>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: T.ink, marginBottom: 6 }}>
        North Star
      </h2>
      <p style={{ fontSize: 13, color: T.inkMid, lineHeight: 1.6, marginBottom: 32 }}>
        El único número que importa: 100 recurrentes en diciembre.
        Todo lo demás sirve a esto o no sirve.
      </p>

      {/* Banner negro — el objetivo final */}
      <div style={{
        background: T.ink, color: "#fff",
        borderRadius: 14, padding: "32px 36px",
        marginBottom: 32,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)", letterSpacing: "3px", textTransform: "uppercase", marginBottom: 8 }}>
            Objetivo · Dic 2026
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.7)", marginBottom: 4 }}>
            100 suscriptores recurrentes
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>
            Esto no es una aspiración. Es el indicador que mide El Centro.
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: T.mono, fontSize: 48, fontWeight: 900, letterSpacing: "-2px" }}>
            $10k+
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", letterSpacing: "2px" }}>MRR OBJETIVO</div>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ border: `1.5px solid ${T.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 32 }}>
        {NORTHSTAR_ROWS.map((r, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "60px 1fr 1fr",
            padding: "14px 20px",
            borderBottom: i < NORTHSTAR_ROWS.length - 1 ? `1px solid ${T.borderLight}` : "none",
            background: r.activo ? T.surface : T.bg,
            alignItems: "center",
          }}>
            <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: r.activo ? T.ink : T.inkFaint }}>
              {r.mes}
            </div>
            <div style={{ fontSize: 13, color: r.activo ? T.inkSoft : T.inkLight }}>
              {r.meta}
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 900, color: r.activo ? T.ink : T.inkFaint, textAlign: "right" }}>
              {r.mrr}
            </div>
          </div>
        ))}
      </div>

      {/* Fuentes de ingreso */}
      <SectionLabel>Estructura de ingresos objetivo</SectionLabel>
      <div style={{ border: `1.5px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
        {FUENTES.map((f, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "2fr 1fr 1.5fr 1.5fr",
            padding: "16px 20px", gap: 16, alignItems: "center",
            borderBottom: i < FUENTES.length - 1 ? `1px solid ${T.borderLight}` : "none",
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{f.tipo}</div>
            <div style={{ fontFamily: T.mono, fontSize: 12, color: T.inkMid }}>{f.ticket}</div>
            <div style={{ fontSize: 12, color: T.inkLight }}>{f.volumen}</div>
            <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 900, color: T.ink, textAlign: "right" }}>{f.resultado}</div>
          </div>
        ))}
      </div>
    </Page>
  )
}

// ── SÁBADO PAGE ───────────────────────────────────────────────────
function PageSabado() {
  const [alarmaDismissed, setAlarmaDismissed] = useState(false)

  return (
    <Page>
      <SectionLabel>Protocolo sábado · inamovible · cada 2 semanas</SectionLabel>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: T.ink, marginBottom: 6 }}>
        Las 2 horas del sábado
      </h2>
      <p style={{ fontSize: 13, color: T.inkMid, lineHeight: 1.6, marginBottom: 32 }}>
        Si no apareces, El Centro lo marca en rojo y Jorge recibe aviso.
        Si apareces, el sistema avanza. Es así de simple.
      </p>

      {/* Alarmas */}
      {!alarmaDismissed && (
        <div style={{
          border: "1.5px solid #fca5a5", borderRadius: 10,
          background: T.redBg, padding: "16px 18px",
          marginBottom: 24, cursor: "pointer",
          animation: "fadeUp .4s ease-out",
        }} onClick={() => setAlarmaDismissed(true)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <SectionLabel style={{ color: T.red, marginBottom: 0 }}>Alarmas obligatorias · 08:00–08:30</SectionLabel>
            <span style={{ fontSize: 10, color: T.inkLight }}>Entendido ×</span>
          </div>
          <p style={{ fontSize: 12, color: T.red, lineHeight: 1.6 }}>
            Alarma cada 15 minutos desde las 8am. Después de la 3.ª sin respuesta,
            el sprint se marca como rojo automáticamente.
          </p>
        </div>
      )}

      {/* Agenda */}
      <div style={{ border: `1.5px solid ${T.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.borderLight}`, background: T.surface }}>
          <SectionLabel style={{ marginBottom: 4 }}>Agenda 2 horas</SectionLabel>
          <p style={{ fontSize: 12, color: T.inkMid }}>09:00 – 11:00 · Solo datos. Sin improvisación.</p>
        </div>
        {AGENDA_SABADO.map((a, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "120px 1fr",
            padding: "16px 20px", gap: 20, alignItems: "start",
            borderBottom: i < AGENDA_SABADO.length - 1 ? `1px solid ${T.borderLight}` : "none",
          }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.inkLight, paddingTop: 1 }}>{a.hora}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 2 }}>{a.titulo}</div>
              <div style={{ fontSize: 12, color: T.inkMid, lineHeight: 1.5 }}>{a.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Accountability stack */}
      <SectionLabel>Jerarquía de accountability</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          { nombre: "El Centro", rol: "Control automático. Siempre presente. No falla.", badge: "PRIMARIO", color: T.ink, bg: T.surface },
          { nombre: "Jorge", rol: "Revisión quincenal. Perspectiva externa. Recibe reporte.", badge: "SECUNDARIO", color: T.blue, bg: T.blueBg },
          { nombre: "Bárbara", rol: "Red de soporte. Recordatorio humano del propósito.", badge: "SOPORTE", color: T.green, bg: T.greenBg },
        ].map((p, i) => (
          <div key={i} style={{ border: `1.5px solid ${T.border}`, borderRadius: 12, padding: "18px 16px" }}>
            <BadgeLabel color={p.color} bg={p.bg}>{p.badge}</BadgeLabel>
            <div style={{ fontSize: 14, fontWeight: 900, color: T.ink, marginTop: 10, marginBottom: 6 }}>{p.nombre}</div>
            <div style={{ fontSize: 12, color: T.inkMid, lineHeight: 1.6 }}>{p.rol}</div>
          </div>
        ))}
      </div>
    </Page>
  )
}

// ── REGLAS PAGE ───────────────────────────────────────────────────
function PageReglas() {
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <Page>
      <SectionLabel>Constitución de El Centro · inmutable</SectionLabel>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: T.ink, marginBottom: 6 }}>
        Reglas que no se negocian
      </h2>
      <p style={{ fontSize: 13, color: T.inkMid, lineHeight: 1.6, marginBottom: 32 }}>
        El Centro no tiene estado de ánimo. Solo tiene estas reglas.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {REGLAS.map((r, i) => {
          const open = expanded === i
          return (
            <div key={i}
              onClick={() => setExpanded(open ? null : i)}
              style={{
                border: `1.5px solid ${open ? T.ink : T.border}`,
                borderRadius: 12, overflow: "hidden", cursor: "pointer",
                transition: "border-color .15s",
              }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "16px 20px",
                background: open ? T.surface : T.bg,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <BadgeLabel color={r.badgeColor} bg={r.badgeBg}>{r.badge}</BadgeLabel>
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{r.titulo}</span>
                </div>
                <span style={{ fontSize: 14, color: T.inkLight, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", display: "inline-block" }}>
                  ▾
                </span>
              </div>
              {open && (
                <div style={{ padding: "0 20px 18px", animation: "fadeUp .2s ease-out" }}>
                  <p style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.7 }}>{r.desc}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Propósito — banner negro */}
      <div style={{
        background: T.ink, color: "#fff",
        borderRadius: 14, padding: "28px 32px",
        marginTop: 32,
      }}>
        <SectionLabel style={{ color: "rgba(255,255,255,.4)", marginBottom: 12 }}>
          Por qué todo esto importa
        </SectionLabel>
        <p style={{ fontSize: 16, lineHeight: 1.7, color: "rgba(255,255,255,.85)", fontWeight: 400 }}>
          Tienes casi 40 años. Tienes familia. Tienes un hijo. Este negocio
          no es un proyecto de exploración — es la estructura que los sostiene.
          El cerebro obedece cuando el propósito es más grande que el humor del día.
        </p>
      </div>
    </Page>
  )
}

// ── ROOT ──────────────────────────────────────────────────────────
export default function ElCentro() {
  const [page, setPage] = useState("gtm")
  const scrollRef = useRef<HTMLDivElement>(null)

  const goTo = (p: string) => {
    setPage(p)
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })
  }

  const renderPage = () => {
    if (page === "gtm")    return <PageGTM />
    if (page === "north")  return <PageNorth />
    if (page === "sabado") return <PageSabado />
    if (page === "reglas") return <PageReglas />
    return null
  }

  return (
    <div style={{ minHeight: "100vh", fontFamily: T.font, color: T.ink, background: T.bg, display: "flex", flexDirection: "column" }}>
      <style>{GLOBAL_CSS}</style>
      <Nav active={page} onNavigate={goTo} />
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto" }}>
        {renderPage()}
      </div>
    </div>
  )
}
