// Shared inline styles for Gestión module
// Maps to existing EF Hub / Tailwind CSS variables

export const colors = {
  bg: 'var(--color-background)',
  surface: 'var(--color-card)',
  border: 'var(--color-border)',
  text: 'var(--color-foreground)',
  textSecondary: 'var(--color-muted-foreground)',
  primary: 'var(--color-primary)',
  primaryText: 'var(--color-primary-foreground)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-destructive)',
  muted: 'var(--color-muted)',
}

export const card = {
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: 12,
  overflow: 'hidden',
}

export const cardHeader = {
  padding: '20px 24px 12px',
}

export const cardTitle = {
  fontSize: 14,
  fontWeight: 600,
  color: colors.textSecondary,
  margin: 0,
}

export const cardTitleLarge = {
  fontSize: 16,
  fontWeight: 600,
  color: colors.text,
  margin: 0,
}

export const cardDescription = {
  fontSize: 13,
  color: colors.textSecondary,
  marginTop: 4,
}

export const cardContent = {
  padding: '12px 24px 24px',
}

export const button = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '8px 16px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  border: 'none',
  transition: 'opacity 0.15s',
}

export const buttonPrimary = {
  ...button,
  background: colors.primary,
  color: colors.primaryText,
}

export const buttonOutline = {
  ...button,
  background: 'transparent',
  border: `1px solid ${colors.border}`,
  color: colors.text,
}

export const buttonGhost = {
  ...button,
  background: 'transparent',
  color: colors.textSecondary,
  padding: '6px 10px',
}

export const buttonIcon = {
  ...button,
  padding: 8,
  width: 36,
  height: 36,
}

export const input = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 8,
  border: `1px solid ${colors.border}`,
  background: colors.bg,
  color: colors.text,
  fontSize: 14,
  outline: 'none',
}

export const select = {
  ...input,
  cursor: 'pointer',
}

export const textarea = {
  ...input,
  resize: 'none',
  minHeight: 40,
  fontFamily: 'inherit',
}

export const badge = (variant = 'default') => {
  const variants = {
    default: { background: colors.primary, color: colors.primaryText },
    secondary: { background: colors.muted, color: colors.textSecondary },
    success: { background: colors.success, color: '#fff' },
    warning: { background: colors.warning, color: '#000' },
    destructive: { background: colors.error, color: '#fff' },
    outline: { background: 'transparent', border: `1px solid ${colors.border}`, color: colors.textSecondary },
  }
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: 9999,
    fontSize: 11,
    fontWeight: 500,
    lineHeight: '16px',
    ...(variants[variant] || variants.default),
  }
}

export const progressBar = {
  width: '100%',
  height: 8,
  borderRadius: 9999,
  background: colors.muted,
  overflow: 'hidden',
}

export const progressIndicator = (percent, color = colors.primary) => ({
  height: '100%',
  width: `${Math.min(percent, 100)}%`,
  background: color,
  borderRadius: 9999,
  transition: 'width 0.3s ease',
})

export const pageTitle = {
  fontSize: 24,
  fontWeight: 700,
  color: colors.text,
  letterSpacing: '-0.025em',
}

export const grid = (cols = 3, gap = 16) => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${cols}, 1fr)`,
  gap,
})

export const flexBetween = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}

export const flexCenter = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

export const flexGap = (gap = 8) => ({
  display: 'flex',
  alignItems: 'center',
  gap,
})

export const listItem = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: 12,
  borderRadius: 8,
  border: `1px solid ${colors.border}`,
}

export const spacingStack = (gap = 16) => ({
  display: 'flex',
  flexDirection: 'column',
  gap,
})
