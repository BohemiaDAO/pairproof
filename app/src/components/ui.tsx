import * as React from "react";
import { QRCodeSVG } from "qrcode.react";

type Node = React.ReactNode;
type Style = React.CSSProperties;
type Opt = string | { value: string; label: string };

interface PpSpinnerProps { size?: number; color?: string; label?: string }
interface PpButtonProps { variant?: "primary" | "secondary" | "ghost" | "destructive" | "quiet"; size?: "sm" | "md" | "lg"; full?: boolean; loading?: boolean; disabled?: boolean; leading?: Node; trailing?: Node; children?: Node; onClick?: () => void; type?: "button" | "submit"; href?: string; style?: Style }
interface PpFieldProps { label?: Node; optional?: Node; hint?: Node; error?: Node; htmlFor?: string; children?: Node }
interface PpTextInputProps { id?: string; label?: Node; optional?: Node; hint?: Node; error?: Node; value?: string; defaultValue?: string; onChange?: (v: string) => void; placeholder?: string; mono?: boolean; disabled?: boolean; trailing?: Node; leading?: Node; autoFocus?: boolean; style?: Style }
interface MiniActionProps { children?: Node; onClick?: () => void; label?: string }
interface PpAddressInputProps { id?: string; label?: Node; hint?: Node; value?: string; onChange?: (v: string) => void; onPaste?: () => void; onScan?: () => void; error?: Node; placeholder?: string; showValid?: boolean; disabled?: boolean }
interface PpSelectProps { id?: string; label?: Node; hint?: Node; error?: Node; value: string; onChange?: (v: string) => void; options?: Opt[]; disabled?: boolean }
interface PpToggleProps { checked?: boolean; onChange?: (v: boolean) => void; label?: Node; description?: Node; disabled?: boolean; size?: "sm" | "md" }
interface PpSegmentedProps { options?: (string | { value: string; label: string; count?: number; hint?: string })[]; value: string; onChange?: (v: string) => void; full?: boolean; size?: "sm" | "md" | "lg"; label?: string }
interface PpBadgeProps { tone?: keyof typeof BADGE_TONES; mono?: boolean; dot?: boolean; pulse?: boolean; size?: "sm" | "md"; children?: Node }
interface PpStatusPillProps { status?: "pending" | "connected" | "expired" | "revoked"; label?: string; size?: "sm" | "md" }
interface PpAddressChipProps { address?: string; label?: string; copy?: boolean; size?: "sm" | "md"; tone?: "default" | "accent" }
interface PpCardProps { tone?: keyof typeof CARD_TONES; padding?: number; radius?: number; title?: Node; eyebrow?: Node; action?: Node; children?: Node; style?: Style }
interface PpListRowProps { leading?: Node; title?: Node; subtitle?: Node; meta?: Node; trailing?: Node; actions?: Node; onClick?: () => void; divider?: boolean; stack?: boolean }
interface PpQRCardProps { address?: string; title?: Node; caption?: Node; size?: number; onCopy?: () => void }
interface PpEmptyStateProps { title?: Node; body?: Node; action?: Node; secondaryAction?: Node; visual?: Node; compact?: boolean }
interface PpBannerProps { tone?: "warning" | "error" | "success" | "info" | "burner"; title?: Node; children?: Node; action?: Node; onDismiss?: () => void }
interface PpMarkProps { size?: number | string; fg?: string; accent?: string; mono?: boolean; title?: string; stemStyle?: Style; ringStyle?: Style }
interface PpLogoProps { size?: number; wordmark?: boolean; mono?: boolean; color?: string }
interface PpHeaderProps { network?: string; wallet?: string | null; burner?: boolean; burnerDisabled?: boolean; onBurnerChange?: (v: boolean) => void; onNewBurner?: () => void; onConnect?: () => void; onDisconnect?: () => void; compact?: boolean; connecting?: boolean }
interface PpFooterProps { githubHref?: string; programId?: string; compact?: boolean; note?: string }
interface PpToastProps { status?: "pending" | "success" | "error"; title?: Node; children?: Node; link?: { href: string; label: string }; onClose?: () => void; floating?: boolean }
interface PpDialogProps { open?: boolean; title: string; children?: Node; confirmLabel?: string; cancelLabel?: string; destructive?: boolean; loading?: boolean; onConfirm?: () => void; onCancel?: () => void; layout?: "center" | "sheet"; contained?: boolean }
interface PpJoinMomentProps { size?: number; playKey?: number | string; fg?: string; accent?: string; title?: Node; children?: Node; action?: Node }

export function PpSpinner({ size = 18, color = 'currentColor', label = 'Loading' }: PpSpinnerProps) {
  return (
    <span role="status" aria-label={label} style={{
      display: 'inline-block', width: size, height: size, borderRadius: '50%', boxSizing: 'border-box', flex: 'none',
      border: Math.max(2, Math.round(size / 9)) + 'px solid currentColor', borderRightColor: 'transparent', color,
      animation: 'pp-spin 800ms linear infinite'
    }} />
  );
}

const BUTTON_SIZES = { sm: { h: 40, px: 16, r: 12, f: 'var(--pp-type-label)' }, md: { h: 48, px: 20, r: 14, f: '600 15px/1 var(--pp-font-body)' }, lg: { h: 56, px: 24, r: 16, f: '600 16px/1 var(--pp-font-body)' } };
const BUTTON_V: Record<string, { bg: string; hover: string; press: string; fg: string; ring?: string }> = {
  primary: { bg: 'var(--pp-accent)', hover: 'var(--pp-accent-hover)', press: 'var(--pp-accent-pressed)', fg: 'var(--pp-text-on-accent)' },
  secondary: { bg: 'var(--pp-surface)', hover: 'var(--pp-surface-hover)', press: 'var(--pp-surface-sunken)', fg: 'var(--pp-text)', ring: 'inset 0 0 0 1.5px var(--pp-border-strong)' },
  ghost: { bg: 'transparent', hover: 'var(--pp-accent-soft)', press: 'var(--pp-accent-soft-hover)', fg: 'var(--pp-link)' },
  destructive: { bg: 'var(--pp-danger)', hover: 'var(--pp-danger-hover)', press: 'var(--pp-danger-hover)', fg: 'var(--pp-text-on-danger)' },
  quiet: { bg: 'transparent', hover: 'var(--pp-surface-hover)', press: 'var(--pp-surface-sunken)', fg: 'var(--pp-text-2)' }
};

export function PpButton({ variant = 'primary', size = 'lg', full = false, loading = false, disabled = false, leading, trailing, children, onClick, type = 'button', href, style }: PpButtonProps) {
  const [st, setSt] = React.useState({ h: false, p: false, f: false });
  const s = BUTTON_SIZES[size] || BUTTON_SIZES.lg, v = BUTTON_V[variant] || BUTTON_V.primary;
  const off = disabled || loading;
  const bg = disabled ? 'var(--pp-disabled-bg)' : st.p ? v.press : st.h && !loading ? v.hover : v.bg;
  const shadows = [!disabled && v.ring, st.f && 'var(--pp-ring)'].filter(Boolean).join(',') || 'none';
  const Tag = href && !off ? 'a' : 'button';
  return (
    <Tag type={Tag === 'button' ? type : undefined} href={Tag === 'a' ? href : undefined} target={Tag === 'a' ? '_blank' : undefined} rel={Tag === 'a' ? 'noreferrer' : undefined}
      disabled={Tag === 'button' ? off : undefined} aria-busy={loading || undefined} onClick={off ? undefined : onClick}
      onMouseEnter={() => setSt(x => ({ ...x, h: true }))} onMouseLeave={() => setSt(x => ({ ...x, h: false, p: false }))}
      onMouseDown={() => !off && setSt(x => ({ ...x, p: true }))} onMouseUp={() => setSt(x => ({ ...x, p: false }))}
      onFocus={e => setSt(x => ({ ...x, f: e.target.matches(':focus-visible') }))} onBlur={() => setSt(x => ({ ...x, f: false }))}
      style={{
        appearance: 'none', border: 0, outline: 'none', textDecoration: 'none', boxSizing: 'border-box', cursor: disabled ? 'not-allowed' : loading ? 'progress' : 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: s.h, padding: '0 ' + s.px + 'px', borderRadius: s.r,
        font: s.f, letterSpacing: '-.005em', whiteSpace: 'nowrap', width: full ? '100%' : undefined,
        background: bg, color: disabled ? 'var(--pp-text-disabled)' : v.fg, boxShadow: shadows,
        transform: st.p ? 'scale(.98)' : 'none', transition: 'background var(--pp-dur-1) var(--pp-ease), transform var(--pp-dur-1) var(--pp-ease)', ...style
      }}>
      {loading ? <PpSpinner size={size === 'sm' ? 16 : 18} /> : leading}
      <span>{children}</span>
      {!loading && trailing}
    </Tag>
  );
}

export function PpField({ label, optional, hint, error, htmlFor, children }: PpFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      {label && <label htmlFor={htmlFor} style={{ font: 'var(--pp-type-label)', color: 'var(--pp-text)', display: 'flex', gap: 6, alignItems: 'baseline' }}>
        {label}{optional && <span style={{ font: 'var(--pp-type-small)', color: 'var(--pp-text-3)' }}>{optional}</span>}
      </label>}
      {children}
      {(error || hint) && <div style={{ font: 'var(--pp-type-small)', color: error ? 'var(--pp-error-text)' : 'var(--pp-text-3)', textWrap: 'pretty' }}>{error || hint}</div>}
    </div>
  );
}

export function PpTextInput({ id, label, optional, hint, error, value, defaultValue, onChange, placeholder, mono = false, disabled = false, trailing, leading, autoFocus, style }: PpTextInputProps) {
  const [focus, setFocus] = React.useState(false);
  const border = error ? 'var(--pp-error)' : focus ? 'var(--pp-accent)' : 'var(--pp-border-input)';
  return (
    <PpField label={label} optional={optional} hint={hint} error={error} htmlFor={id}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, minHeight: 'var(--pp-input-h)', padding: '0 6px 0 16px', boxSizing: 'border-box',
        borderRadius: 14, background: disabled ? 'var(--pp-disabled-bg)' : 'var(--pp-surface)',
        boxShadow: 'inset 0 0 0 ' + (focus || error ? 2 : 1.5) + 'px ' + border + (focus ? ', 0 0 0 4px var(--pp-accent-soft)' : ''),
        transition: 'box-shadow var(--pp-dur-1) var(--pp-ease)', ...style
      }}>
        {leading}
        <input id={id} value={value} defaultValue={defaultValue} placeholder={placeholder} disabled={disabled} autoFocus={autoFocus} aria-invalid={!!error || undefined}
          onChange={e => onChange && onChange(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ flex: 1, minWidth: 0, border: 0, outline: 'none', background: 'transparent', padding: '14px 0', color: disabled ? 'var(--pp-text-disabled)' : 'var(--pp-text)',
            font: mono ? '500 15px/1.3 var(--pp-font-mono)' : '400 16px/1.3 var(--pp-font-body)', letterSpacing: mono ? '-.01em' : 0 }} />
        {trailing && <div style={{ display: 'flex', gap: 4, flex: 'none', paddingRight: 2 }}>{trailing}</div>}
      </div>
    </PpField>
  );
}

function MiniAction({ children, onClick, label }: MiniActionProps) {
  const [h, setH] = React.useState(false);
  return (
    <button type="button" aria-label={label} onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ appearance: 'none', border: 0, cursor: 'pointer', minHeight: 40, padding: '0 12px', borderRadius: 10, font: 'var(--pp-type-label)',
        color: 'var(--pp-link)', background: h ? 'var(--pp-accent-soft-hover)' : 'var(--pp-accent-soft)', transition: 'background var(--pp-dur-1) var(--pp-ease)' }}>{children}</button>
  );
}

export function isSolanaAddress(s?: string | null): boolean { return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test((s || '').trim()); }

export function PpAddressInput({ id, label = 'Their address', hint, value = '', onChange, onPaste, onScan, error, placeholder = 'e.g. 4hTz…1Qz', showValid = true, disabled }: PpAddressInputProps) {
  const hintText = hint ?? (onScan ? 'Solana address. Paste it or scan their QR code.' : 'Solana address. Paste it in.');
  const valid = isSolanaAddress(value);
  const err = error || (value && !valid ? 'That doesn’t look like a Solana address. Check for missing characters.' : null);
  const paste = async () => {
    if (onPaste) return onPaste();
    try { const t = await navigator.clipboard.readText(); onChange && onChange(t.trim()); } catch (e) {}
  };
  return (
    <PpTextInput id={id} label={label} value={value} onChange={onChange} placeholder={placeholder} mono disabled={disabled}
      error={err} hint={valid && showValid ? '✓ Valid Solana address' : hintText}
      trailing={<><MiniAction onClick={paste} label="Paste address">Paste</MiniAction>{onScan && <MiniAction onClick={onScan} label="Scan QR code">Scan QR</MiniAction>}</>} />
  );
}

export function PpSelect({ id, label, hint, error, value, onChange, options = [], disabled = false }: PpSelectProps) {
  const [focus, setFocus] = React.useState(false);
  const border = error ? 'var(--pp-error)' : focus ? 'var(--pp-accent)' : 'var(--pp-border-input)';
  return (
    <PpField label={label} hint={hint} error={error} htmlFor={id}>
      <div style={{ position: 'relative' }}>
        <select id={id} value={value} disabled={disabled} onChange={e => onChange && onChange(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ appearance: 'none', WebkitAppearance: 'none', width: '100%', minHeight: 'var(--pp-input-h)', padding: '0 44px 0 16px', border: 0, outline: 'none', cursor: 'pointer',
            borderRadius: 14, background: disabled ? 'var(--pp-disabled-bg)' : 'var(--pp-surface)', color: 'var(--pp-text)', font: '400 16px/1.3 var(--pp-font-body)',
            boxShadow: 'inset 0 0 0 ' + (focus || error ? 2 : 1.5) + 'px ' + border + (focus ? ', 0 0 0 4px var(--pp-accent-soft)' : '') }}>
          {options.map(o => { const op = typeof o === 'string' ? { value: o, label: o } : o; return <option key={op.value} value={op.value}>{op.label}</option>; })}
        </select>
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--pp-text-2)' }}><path d="M3 5.5 7 9.5 11 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
    </PpField>
  );
}

export function PpToggle({ checked = false, onChange, label, description, disabled = false, size = 'md' }: PpToggleProps) {
  const w = size === 'sm' ? 44 : 52, h = size === 'sm' ? 26 : 32, k = h - 6;
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 12, cursor: disabled ? 'not-allowed' : 'pointer', minHeight: 'var(--pp-hit-min)', opacity: disabled ? .5 : 1 }}>
      <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange && onChange(!checked)}
        style={{ appearance: 'none', border: 0, padding: 0, cursor: 'inherit', flex: 'none', width: w, height: h, borderRadius: 999, position: 'relative',
          background: checked ? 'var(--pp-accent)' : 'var(--pp-border-input)', transition: 'background var(--pp-dur-2) var(--pp-ease)' }}>
        <span style={{ position: 'absolute', top: 3, left: checked ? w - k - 3 : 3, width: k, height: k, borderRadius: '50%', background: 'var(--pp-white)',
          boxShadow: '0 1px 3px rgba(26,23,20,.25)', transition: 'left var(--pp-dur-2) var(--pp-ease)' }} />
      </button>
      {(label || description) && <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {label && <span style={{ font: 'var(--pp-type-label)', color: 'var(--pp-text)' }}>{label}</span>}
        {description && <span style={{ font: 'var(--pp-type-caption)', color: 'var(--pp-text-3)' }}>{description}</span>}
      </span>}
    </label>
  );
}

export function PpSegmented({ options = [], value, onChange, full = false, size = 'lg', label }: PpSegmentedProps) {
  const h = size === 'sm' ? 40 : size === 'md' ? 48 : 56;
  const opts = options.map(o => typeof o === 'string' ? { value: o, label: o } : o);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      {label && <span style={{ font: 'var(--pp-type-label)', color: 'var(--pp-text)' }}>{label}</span>}
      <div role="radiogroup" aria-label={label} style={{ display: full ? 'flex' : 'inline-flex', gap: 4, padding: 4, borderRadius: 16, background: 'var(--pp-surface-sunken)', boxShadow: 'inset 0 0 0 1px var(--pp-border)' }}>
        {opts.map(o => {
          const on = o.value === value;
          return (
            <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => onChange && onChange(o.value)}
              style={{ appearance: 'none', border: 0, cursor: 'pointer', flex: full ? 1 : 'none', minWidth: 0, minHeight: h - 8, padding: '6px 16px', borderRadius: 12,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                background: on ? 'var(--pp-surface)' : 'transparent', color: on ? 'var(--pp-text)' : 'var(--pp-text-2)',
                boxShadow: on ? 'inset 0 0 0 1.5px var(--pp-accent)' : 'none', transition: 'background var(--pp-dur-1) var(--pp-ease)' }}>
              <span style={{ font: 'var(--pp-type-label)', display: 'flex', gap: 6, alignItems: 'center', whiteSpace: 'nowrap' }}>{o.label}
                {o.count != null && <span style={{ font: '600 12px/1 var(--pp-font-body)', padding: '3px 7px', borderRadius: 999, background: on ? 'var(--pp-accent)' : 'var(--pp-border)', color: on ? 'var(--pp-text-on-accent)' : 'var(--pp-text-2)' }}>{o.count}</span>}
              </span>
              {o.hint && <span style={{ font: 'var(--pp-type-caption)', color: 'var(--pp-text-3)', whiteSpace: 'nowrap' }}>{o.hint}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const BADGE_TONES = {
  neutral: ['var(--pp-surface-sunken)', 'var(--pp-text-2)', 'inset 0 0 0 1px var(--pp-border)'],
  violet: ['var(--pp-accent-soft)', 'var(--pp-accent-soft-text)', 'none'],
  accent: ['var(--pp-accent)', 'var(--pp-text-on-accent)', 'none'],
  yellow: ['var(--pp-highlight)', 'var(--pp-text-on-yellow)', 'none'],
  ink: ['var(--pp-surface-inverse)', 'var(--pp-text-inverse)', 'none'],
  success: ['var(--pp-success-soft)', 'var(--pp-success-text)', 'none'],
  warning: ['var(--pp-warning-soft)', 'var(--pp-warning-text)', 'none'],
  error: ['var(--pp-error-soft)', 'var(--pp-error-text)', 'none'],
  outline: ['transparent', 'var(--pp-text)', 'inset 0 0 0 1.5px var(--pp-border-strong)']
};

export function PpBadge({ tone = 'neutral', mono = false, dot = false, pulse = false, size = 'md', children }: PpBadgeProps) {
  const [bg, fg, ring] = BADGE_TONES[tone] || BADGE_TONES.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', borderRadius: 999, background: bg, color: fg, boxShadow: ring,
      padding: size === 'sm' ? '3px 8px' : '5px 10px',
      font: mono ? '600 ' + (size === 'sm' ? 10 : 11) + 'px/1.2 var(--pp-font-mono)' : '600 ' + (size === 'sm' ? 11 : 12) + 'px/1.2 var(--pp-font-body)',
      letterSpacing: mono ? '.08em' : 0, textTransform: mono ? 'uppercase' : 'none'
    }}>
      {dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', flex: 'none', animation: pulse ? 'pp-pulse-dot 1.6s ease-in-out infinite' : 'none' }} />}
      {children}
    </span>
  );
}

const MAP: Record<string, { tone: keyof typeof BADGE_TONES; label: string; pulse?: boolean }> = {
  pending: { tone: 'yellow', label: 'Pending', pulse: true },
  connected: { tone: 'violet', label: 'Connected' },
  expired: { tone: 'neutral', label: 'Expired' },
  revoked: { tone: 'error', label: 'Revoked' }
};

export function PpStatusPill({ status = 'pending', label, size = 'md' }: PpStatusPillProps) {
  const m = MAP[status] || MAP.pending;
  return <PpBadge tone={m.tone} dot pulse={m.pulse} size={size}>{label || m.label}</PpBadge>;
}

export function shortAddress(a = ''): string { return a.length > 10 ? a.slice(0, 4) + '…' + a.slice(-4) : a; }

export function PpAddressChip({ address = '', label, copy = true, size = 'md', tone = 'default' }: PpAddressChipProps) {
  const [copied, setCopied] = React.useState(false);
  const [h, setH] = React.useState(false);
  const doCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try { await navigator.clipboard.writeText(address); } catch (err) {}
    setCopied(true); setTimeout(() => setCopied(false), 1400);
  };
  const sm = size === 'sm';
  const bg = tone === 'accent' ? 'var(--pp-accent-soft)' : 'var(--pp-surface-sunken)';
  return (
    <span title={address} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, borderRadius: 999, background: bg, boxShadow: 'inset 0 0 0 1px var(--pp-border)', padding: copy ? '2px 2px 2px ' + (sm ? 10 : 12) + 'px' : '0 ' + (sm ? 10 : 12) + 'px', minHeight: sm ? 30 : 36, boxSizing: 'border-box', maxWidth: '100%' }}>
      {label && <span style={{ font: 'var(--pp-type-caption)', color: 'var(--pp-text-2)', marginRight: 6 }}>{label}</span>}
      <span style={{ font: sm ? 'var(--pp-type-mono-sm)' : 'var(--pp-type-mono)', color: 'var(--pp-text)', whiteSpace: 'nowrap' }}>{shortAddress(address)}</span>
      {copy && <button type="button" onClick={doCopy} aria-label={copied ? 'Copied' : 'Copy address'} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
        style={{ appearance: 'none', border: 0, cursor: 'pointer', marginLeft: 6, minHeight: sm ? 26 : 32, padding: '0 10px', borderRadius: 999,
          font: '600 ' + (sm ? 11 : 12) + 'px/1 var(--pp-font-body)', color: copied ? 'var(--pp-success-text)' : 'var(--pp-link)',
          background: h ? 'var(--pp-surface-hover)' : 'var(--pp-surface)', boxShadow: 'inset 0 0 0 1px var(--pp-border)' }}>{copied ? '✓ Copied' : 'Copy'}</button>}
    </span>
  );
}

const CARD_TONES = {
  default: { background: 'var(--pp-surface)', boxShadow: 'inset 0 0 0 1px var(--pp-border)' },
  sunken: { background: 'var(--pp-surface-sunken)', boxShadow: 'inset 0 0 0 1px var(--pp-border-subtle)' },
  accent: { background: 'var(--pp-accent-soft)', boxShadow: 'inset 0 0 0 1px var(--pp-accent-border)' },
  highlight: { background: 'var(--pp-highlight)', color: 'var(--pp-text-on-yellow)' },
  outline: { background: 'transparent', boxShadow: 'inset 0 0 0 1.5px var(--pp-border-strong)' }
};

export function PpCard({ tone = 'default', padding = 24, radius = 20, title, eyebrow, action, children, style }: PpCardProps) {
  return (
    <section style={{ borderRadius: radius, padding, boxSizing: 'border-box', minWidth: 0, color: 'var(--pp-text)', display: 'flex', flexDirection: 'column', gap: 16, ...CARD_TONES[tone], ...style }}>
      {(title || eyebrow || action) && <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          {eyebrow && <span style={{ font: 'var(--pp-type-eyebrow)', letterSpacing: 'var(--pp-tracking-eyebrow)', textTransform: 'uppercase', color: 'var(--pp-text-2)' }}>{eyebrow}</span>}
          {title && <h3 style={{ margin: 0, font: 'var(--pp-type-h3)', color: 'inherit', textWrap: 'pretty' }}>{title}</h3>}
        </div>
        {action}
      </header>}
      {children}
    </section>
  );
}

export function PpListRow({ leading, title, subtitle, meta, trailing, actions, onClick, divider = true, stack = false }: PpListRowProps) {
  const [h, setH] = React.useState(false);
  const click = !!onClick;
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 20px', minHeight: 72, boxSizing: 'border-box', cursor: click ? 'pointer' : 'default',
        background: click && h ? 'var(--pp-surface-hover)' : 'transparent', borderTop: divider ? '1px solid var(--pp-border-subtle)' : 0, transition: 'background var(--pp-dur-1) var(--pp-ease)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
        {leading && <div style={{ flex: 'none', display: 'flex' }}>{leading}</div>}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ font: 'var(--pp-type-body-strong)', color: 'var(--pp-text)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, minWidth: 0 }}>{title}</div>
          {subtitle && <div style={{ font: 'var(--pp-type-small)', color: 'var(--pp-text-2)', textWrap: 'pretty' }}>{subtitle}</div>}
          {meta && <div style={{ font: 'var(--pp-type-caption)', color: 'var(--pp-text-3)', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>{meta}</div>}
        </div>
        {trailing && <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>{trailing}</div>}
        {actions && !stack && <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>{actions}</div>}
      </div>
      {actions && stack && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </div>
  );
}

export function PpQRCard({ address = '', title = 'Your code', caption = 'Ask them to scan this to fill in your address.', size = 240, onCopy }: PpQRCardProps) {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(address); } catch (e) {} setCopied(true); setTimeout(() => setCopied(false), 1400); onCopy && onCopy(); };
  return (
    <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 24, borderRadius: 20, background: 'var(--pp-surface)', boxShadow: 'inset 0 0 0 1px var(--pp-border)', boxSizing: 'border-box', minWidth: 0 }}>
      <div style={{ alignSelf: 'stretch', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ font: 'var(--pp-type-h3)', color: 'var(--pp-text)' }}>{title}</span>
        <span style={{ font: 'var(--pp-type-small)', color: 'var(--pp-text-2)', textWrap: 'pretty' }}>{caption}</span>
      </div>
      <div style={{ width: '100%', maxWidth: size, aspectRatio: '1', padding: 14, boxSizing: 'border-box', borderRadius: 16, background: 'var(--pp-white)', boxShadow: 'inset 0 0 0 1px var(--pp-grey-200)', position: 'relative' }}>
        <QRCodeSVG value={address || ' '} size={256} level="H" bgColor="#FFFFFF" fgColor="#1A1714" style={{ display: 'block', width: '100%', height: '100%' }} aria-label="QR code of your address" role="img" />
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: '20%', aspectRatio: '1', borderRadius: '24%', background: 'var(--pp-violet-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 4px var(--pp-white)' }}>
          <PpMark size="70%" fg="var(--pp-paper)" accent="var(--pp-yellow)" />
        </div>
      </div>
      <PpAddressChip address={address} label="You" copy={false} />
      <PpButton variant="secondary" size="md" full onClick={copy}>{copied ? '✓ Address copied' : 'Copy address'}</PpButton>
    </section>
  );
}

export function PpEmptyState({ title, body, action, secondaryAction, visual, compact = false }: PpEmptyStateProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14, padding: compact ? '32px 20px' : '48px 24px', borderRadius: 20, background: 'var(--pp-surface-sunken)', boxShadow: 'inset 0 0 0 1px var(--pp-border-subtle)' }}>
      <div style={{ width: 72, height: 72, borderRadius: 22, background: 'var(--pp-surface)', boxShadow: 'inset 0 0 0 1px var(--pp-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
        {visual || <PpMark size={40} fg="var(--pp-text-3)" accent="var(--pp-text-3)" />}
      </div>
      {title && <h3 style={{ margin: 0, font: 'var(--pp-type-h2)', color: 'var(--pp-text)', textWrap: 'balance' }}>{title}</h3>}
      {body && <p style={{ margin: 0, maxWidth: 400, font: 'var(--pp-type-body)', color: 'var(--pp-text-2)', textWrap: 'pretty' }}>{body}</p>}
      {(action || secondaryAction) && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 6 }}>{action}{secondaryAction}</div>}
    </div>
  );
}

const BANNER_T = {
  warning: ['var(--pp-warning-soft)', 'var(--pp-warning-text)', 'var(--pp-warning)', '!'],
  error: ['var(--pp-error-soft)', 'var(--pp-error-text)', 'var(--pp-error)', '!'],
  success: ['var(--pp-success-soft)', 'var(--pp-success-text)', 'var(--pp-success)', '✓'],
  info: ['var(--pp-accent-soft)', 'var(--pp-accent-soft-text)', 'var(--pp-accent)', 'i'],
  burner: ['var(--pp-highlight)', 'var(--pp-text-on-yellow)', 'var(--pp-ink)', '!']
};

export function PpBanner({ tone = 'warning', title, children, action, onDismiss }: PpBannerProps) {
  const [bg, fg, dot, glyph] = BANNER_T[tone] || BANNER_T.warning;
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 16, background: bg, color: fg, boxShadow: tone === 'burner' ? 'none' : 'inset 0 0 0 1px color-mix(in oklab, ' + dot + ' 28%, transparent)' }}>
      <span aria-hidden="true" style={{ flex: 'none', width: 22, height: 22, marginTop: 1, borderRadius: '50%', background: dot, color: tone === 'burner' ? 'var(--pp-yellow)' : 'var(--pp-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '800 12px/1 var(--pp-font-body)' }}>{glyph}</span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {title && <div style={{ font: 'var(--pp-type-label)', color: 'inherit' }}>{title}</div>}
        {children && <div style={{ font: 'var(--pp-type-small)', color: 'inherit', textWrap: 'pretty' }}>{children}</div>}
        {action && <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>{action}</div>}
      </div>
      {onDismiss && <button type="button" aria-label="Dismiss" onClick={onDismiss} style={{ appearance: 'none', border: 0, background: 'transparent', color: 'inherit', cursor: 'pointer', width: 32, height: 32, margin: '-6px -8px 0 0', borderRadius: 10, font: '500 18px/1 var(--pp-font-body)' }}>×</button>}
    </div>
  );
}

// Pairproof symbol (direction 1a "Interlock"): a stem and a ring, linked over-and-under.
// Masks keep the gaps transparent, so it works on any background.
export function PpMark({ size = 32, fg = 'currentColor', accent = 'var(--pp-mark-accent)', mono = false, title, stemStyle, ringStyle }: PpMarkProps) {
  const id = React.useId().replace(/:/g, '');
  const ac = mono ? fg : accent;
  const mu = { maskUnits: 'userSpaceOnUse', x: -20, y: -20, width: 140, height: 140 };
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} style={{ display: 'block', flex: 'none', overflow: 'visible' }}>
      <defs>
        <clipPath id={id + 'c'}><rect x="37" y="0" width="18" height="40" /></clipPath>
        <mask id={id + 's'} {...mu}><rect x="-20" y="-20" width="140" height="140" fill="#fff" /><circle cx="50" cy="44" r="20" fill="none" stroke="#000" strokeWidth="18" clipPath={`url(#${id}c)`} /></mask>
        <mask id={id + 'r'} {...mu}><rect x="-20" y="-20" width="140" height="140" fill="#fff" /><rect x="37" y="48" width="18" height="28" fill="#000" /></mask>
      </defs>
      <g style={stemStyle}><line x1="46" y1="10" x2="46" y2="88" stroke={fg} strokeWidth="12" strokeLinecap="round" mask={`url(#${id}s)`} /></g>
      <g style={ringStyle}><circle cx="50" cy="44" r="20" fill="none" stroke={ac} strokeWidth="12" mask={`url(#${id}r)`} /></g>
    </svg>
  );
}

export function PpLogo({ size = 32, wordmark = true, mono = false, color = 'var(--pp-text)' }: PpLogoProps) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(size * .3), color }}>
      <PpMark size={size} fg={color} mono={mono} title={wordmark ? undefined : 'Pairproof'} />
      {wordmark && <span style={{ font: '800 ' + Math.round(size * .62) + 'px/1 var(--pp-font-display)', letterSpacing: '-.02em', color }}>Pairproof</span>}
    </span>
  );
}

export function PpHeader({ network = 'Devnet', wallet, burner = false, burnerDisabled = false, onBurnerChange, onNewBurner, onConnect, onDisconnect, compact = false, connecting = false }: PpHeaderProps) {
  const walletEl = wallet
    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}><PpAddressChip address={wallet} label={burner && !compact ? 'Burner' : undefined} size={compact ? 'sm' : 'md'} copy={!compact} />{!burner && onDisconnect && <PpButton variant="quiet" size="sm" onClick={onDisconnect}>Disconnect</PpButton>}</span>
    : <PpButton size={compact ? 'sm' : 'md'} onClick={onConnect} loading={connecting} disabled={burner}>{connecting ? 'Connecting…' : 'Connect wallet'}</PpButton>;
  const toggle = <PpToggle size="sm" checked={burner} disabled={burnerDisabled} onChange={onBurnerChange} label="Try without a wallet" description={burnerDisabled ? 'Not available on mainnet' : compact ? undefined : 'Uses a temporary devnet key'} />;
  return (
    <header style={{ background: 'var(--pp-bg)', borderBottom: '1px solid var(--pp-border)', position: 'relative', zIndex: 2 }}>
      <div style={{ maxWidth: compact ? 'none' : 1040, margin: '0 auto', padding: compact ? '12px 16px' : '0 32px', minHeight: compact ? 0 : 'var(--pp-header-h)', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: compact ? 10 : 20 }}>
        <PpLogo size={compact ? 26 : 30} />
        <PpBadge tone="yellow" mono size={compact ? 'sm' : 'md'}>{network}</PpBadge>
        <div style={{ flex: 1 }} />
        {!compact && toggle}
        <div style={{ minWidth: 0, flexShrink: 1, display: 'flex', justifyContent: 'flex-end', overflow: 'hidden' }}>{walletEl}</div>
      </div>
      {compact && <div style={{ padding: '0 16px 6px', display: 'flex', alignItems: 'center' }}>{toggle}</div>}
      {burner && <div role="status" style={{ background: 'var(--pp-highlight)', color: 'var(--pp-text-on-yellow)', padding: '10px 16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, flexWrap: 'wrap', textAlign: 'center' }}>
        <span style={{ font: '700 12px/1.2 var(--pp-font-mono)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Devnet burner — not for real funds</span>
        {!compact && <span style={{ font: 'var(--pp-type-small)' }}>This key is stored in this browser. Clearing site data deletes it.</span>}
        {onNewBurner && <PpButton variant="secondary" size="sm" onClick={onNewBurner}>Use a new key</PpButton>}
      </div>}
    </header>
  );
}

export function PpFooter({ githubHref = 'https://github.com/BohemiaDAO/pairproof', programId = '', compact = false, note = 'Connections are public and pseudonymous. No personal data is stored on-chain.' }: PpFooterProps) {
  return (
    <footer style={{ borderTop: '1px solid var(--pp-border)', background: 'var(--pp-bg)' }}>
      <div style={{ maxWidth: 'var(--pp-max-w)', margin: '0 auto', padding: compact ? '28px 20px 32px' : '36px 20px 44px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <p style={{ margin: 0, font: 'var(--pp-type-body)', color: 'var(--pp-text)', textWrap: 'pretty', maxWidth: 520 }}>{note}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: compact ? 12 : 20 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ font: 'var(--pp-type-caption)', color: 'var(--pp-text-2)' }}>Program ID</span>
            <PpAddressChip address={programId} size="sm" />
          </span>
          <a href={githubHref} target="_blank" rel="noreferrer" style={{ font: 'var(--pp-type-label)', color: 'var(--pp-link)', minHeight: 40, display: 'inline-flex', alignItems: 'center' }}>GitHub ↗</a>
          <span style={{ flex: 1 }} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: 'var(--pp-type-caption)', color: 'var(--pp-text-3)' }}><PpLogo size={16} wordmark={false} color="var(--pp-text-3)" mono />Open source · MIT</span>
        </div>
      </div>
    </footer>
  );
}

const TOAST_S = {
  pending: { dot: 'var(--pp-accent)', glyph: null },
  success: { dot: 'var(--pp-success)', glyph: '✓' },
  error: { dot: 'var(--pp-error)', glyph: '!' }
};

export function PpToast({ status = 'success', title, children, link, onClose, floating = true }: PpToastProps) {
  const s = TOAST_S[status] || TOAST_S.success;
  return (
    <div role={status === 'error' ? 'alert' : 'status'} style={{
      display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%', maxWidth: 440, boxSizing: 'border-box', padding: '14px 14px 14px 16px', borderRadius: 18,
      background: 'var(--pp-surface)', color: 'var(--pp-text)', boxShadow: 'inset 0 0 0 1px var(--pp-border)' + (floating ? ', var(--pp-shadow-float)' : ''),
      animation: 'pp-fade-up var(--pp-dur-3) var(--pp-ease) both'
    }}>
      <span aria-hidden="true" style={{ flex: 'none', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: status === 'pending' ? 'var(--pp-accent-soft)' : s.dot, color: status === 'pending' ? 'var(--pp-accent-soft-text)' : 'var(--pp-bg)', font: '800 14px/1 var(--pp-font-body)' }}>
        {status === 'pending' ? <PpSpinner size={16} /> : s.glyph}
      </span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 3 }}>
        <div style={{ font: 'var(--pp-type-label)' }}>{title}</div>
        {children && <div style={{ font: 'var(--pp-type-small)', color: 'var(--pp-text-2)', textWrap: 'pretty' }}>{children}</div>}
        {link && <a href={link.href} target="_blank" rel="noreferrer" style={{ font: 'var(--pp-type-label)', color: 'var(--pp-link)', marginTop: 4, alignSelf: 'flex-start' }}>{link.label} ↗</a>}
      </div>
      {onClose && <button type="button" aria-label="Dismiss" onClick={onClose} style={{ appearance: 'none', border: 0, background: 'transparent', color: 'var(--pp-text-2)', cursor: 'pointer', width: 36, height: 36, margin: '-4px -4px 0 0', borderRadius: 10, font: '400 20px/1 var(--pp-font-body)' }}>×</button>}
    </div>
  );
}

export function PpDialog({ open = true, title, children, confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive = false, loading = false, onConfirm, onCancel, layout = 'center', contained = false }: PpDialogProps) {
  if (!open) return null;
  const sheet = layout === 'sheet';
  return (
    <div role="presentation" onClick={onCancel} style={{ position: contained ? 'absolute' : 'fixed', inset: 0, zIndex: 50, background: 'var(--pp-overlay)', display: 'flex', alignItems: sheet ? 'flex-end' : 'center', justifyContent: 'center', padding: sheet ? 0 : 24, animation: 'pp-fade var(--pp-dur-2) var(--pp-ease) both' }}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: sheet ? 'none' : 440, boxSizing: 'border-box', background: 'var(--pp-surface)', color: 'var(--pp-text)',
        borderRadius: sheet ? '28px 28px 0 0' : 24, padding: sheet ? '12px 20px 28px' : 28, boxShadow: 'inset 0 0 0 1px var(--pp-border), var(--pp-shadow-float)',
        display: 'flex', flexDirection: 'column', gap: 14, animation: 'pp-sheet-up var(--pp-dur-3) var(--pp-ease) both'
      }}>
        {sheet && <div style={{ width: 40, height: 5, borderRadius: 3, background: 'var(--pp-border)', alignSelf: 'center', marginBottom: 6 }} />}
        <h2 style={{ margin: 0, font: 'var(--pp-type-h2)', textWrap: 'balance' }}>{title}</h2>
        {children && <div style={{ font: 'var(--pp-type-body)', color: 'var(--pp-text-2)', textWrap: 'pretty', display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>}
        <div style={{ display: 'flex', flexDirection: sheet ? 'column-reverse' : 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
          <PpButton variant="quiet" size={sheet ? 'lg' : 'md'} full={sheet} onClick={onCancel} disabled={loading}>{cancelLabel}</PpButton>
          <PpButton variant={destructive ? 'destructive' : 'primary'} size={sheet ? 'lg' : 'md'} full={sheet} loading={loading} onClick={onConfirm}>{confirmLabel}</PpButton>
        </div>
      </div>
    </div>
  );
}

// The one special moment: the stem and the ring slide in from either side and lock together, then a soft yellow glow.
export function PpJoinMoment({ size = 160, playKey = 0, fg = 'var(--pp-text)', accent = 'var(--pp-accent)', title, children, action }: PpJoinMomentProps) {
  const anim = (n: string, d = 0) => `${n} var(--pp-dur-join) var(--pp-ease-join) ${d}ms both`;
  return (
    <div key={playKey} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 20 }}>
      <div style={{ position: 'relative', width: size * 1.5, height: size * 1.25, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div aria-hidden="true" style={{ position: 'absolute', width: size * 1.15, height: size * 1.15, borderRadius: '50%', background: 'var(--pp-highlight)', opacity: 0, animation: 'pp-join-glow 1400ms var(--pp-ease) 150ms both' }} />
        <div style={{ position: 'relative' }}>
          <PpMark size={size} fg={fg} accent={accent} title="Connected"
            stemStyle={{ animation: anim('pp-join-left'), transformBox: 'fill-box' }}
            ringStyle={{ animation: anim('pp-join-right'), transformBox: 'fill-box' }} />
        </div>
      </div>
      {title && <h2 style={{ margin: 0, font: 'var(--pp-type-display-mobile)', color: 'var(--pp-text)', animation: 'pp-fade-up var(--pp-dur-3) var(--pp-ease) 700ms both', textWrap: 'balance' }}>{title}</h2>}
      {children && <div style={{ font: 'var(--pp-type-body)', color: 'var(--pp-text-2)', maxWidth: 420, animation: 'pp-fade-up var(--pp-dur-3) var(--pp-ease) 820ms both', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>{children}</div>}
      {action && <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', width: '100%', animation: 'pp-fade-up var(--pp-dur-3) var(--pp-ease) 940ms both' }}>{action}</div>}
    </div>
  );
}
