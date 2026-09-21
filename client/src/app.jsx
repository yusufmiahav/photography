// Bundled entry point — built by esbuild (see client/package.json), not shipped as-is.
// React used to come from a runtime <script> tag; now it's a real import, bundled below.
import React from "react";
import ReactDOM from "react-dom/client";

// ==================== tweaks-panel.jsx ====================
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

/* BEGIN USAGE */
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
// Exports (to window): useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider,
//   TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// TweakRadio is the segmented control for 2–3 short options (auto-falls-back to
// TweakSelect past ~16/~10 chars per label); reach for TweakSelect directly when
// options are many or long. For color tweaks always curate 3-4 options rather than
// a free picker; an option can also be a whole 2–5 color palette (the stored value
// is the array). The Tweak* controls are a floor, not a ceiling — build custom
// controls inside the panel if a tweak calls for UI they don't cover.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null
      ? keyOrEdits : { [keyOrEdits]: val };
    setValues((prev) => ({ ...prev, ...edits }));
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', { detail: edits }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({ title = 'Tweaks', children }) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({ x: 16, y: 16 });
  const PAD = 16;

  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth, h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y)),
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);

  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);

  React.useEffect(() => {
    const onMsg = (e) => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);
      else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*');
  };

  const onDragStart = (e) => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = (ev) => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy),
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  if (!open) return null;
  return (
    <>
      <style>{__TWEAKS_STYLE}</style>
      <div ref={dragRef} className="twk-panel" data-omelette-chrome=""
           style={{ right: offsetRef.current.x, bottom: offsetRef.current.y }}>
        <div className="twk-hd" onMouseDown={onDragStart}>
          <b>{title}</b>
          <button className="twk-x" aria-label="Close tweaks"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={dismiss}>✕</button>
        </div>
        <div className="twk-body">
          {children}
        </div>
      </div>
    </>
  );
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({ label, children }) {
  return (
    <>
      <div className="twk-sect">{label}</div>
      {children}
    </>
  );
}

function TweakRow({ label, value, children, inline = false }) {
  return (
    <div className={inline ? 'twk-row twk-row-h' : 'twk-row'}>
      <div className="twk-lbl">
        <span>{label}</span>
        {value != null && <span className="twk-val">{value}</span>}
      </div>
      {children}
    </div>
  );
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({ label, value, min = 0, max = 100, step = 1, unit = '', onChange }) {
  return (
    <TweakRow label={label} value={`${value}${unit}`}>
      <input type="range" className="twk-slider" min={min} max={max} step={step}
             value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </TweakRow>
  );
}

function TweakToggle({ label, value, onChange }) {
  return (
    <div className="twk-row twk-row-h">
      <div className="twk-lbl"><span>{label}</span></div>
      <button type="button" className="twk-toggle" data-on={value ? '1' : '0'}
              role="switch" aria-checked={!!value}
              onClick={() => onChange(!value)}><i /></button>
    </div>
  );
}

function TweakRadio({ label, value, options, onChange }) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = (o) => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({ 2: 16, 3: 10 }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = (s) => {
      const m = options.find((o) => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return <TweakSelect label={label} value={value} options={options}
                        onChange={(s) => onChange(resolve(s))} />;
  }
  const opts = options.map((o) => (typeof o === 'object' ? o : { value: o, label: o }));
  const idx = Math.max(0, opts.findIndex((o) => o.value === value));
  const n = opts.length;

  const segAt = (clientX) => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor(((clientX - r.left - 2) / inner) * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };

  const onPointerDown = (e) => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = (ev) => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <TweakRow label={label}>
      <div ref={trackRef} role="radiogroup" onPointerDown={onPointerDown}
           className={dragging ? 'twk-seg dragging' : 'twk-seg'}>
        <div className="twk-seg-thumb"
             style={{ left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
                      width: `calc((100% - 4px) / ${n})` }} />
        {opts.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={o.value === value}>
            {o.label}
          </button>
        ))}
      </div>
    </TweakRow>
  );
}

function TweakSelect({ label, value, options, onChange }) {
  return (
    <TweakRow label={label}>
      <select className="twk-field" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => {
          const v = typeof o === 'object' ? o.value : o;
          const l = typeof o === 'object' ? o.label : o;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    </TweakRow>
  );
}

function TweakText({ label, value, placeholder, onChange }) {
  return (
    <TweakRow label={label}>
      <input className="twk-field" type="text" value={value} placeholder={placeholder}
             onChange={(e) => onChange(e.target.value)} />
    </TweakRow>
  );
}

function TweakNumber({ label, value, min, max, step = 1, unit = '', onChange }) {
  const clamp = (n) => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({ x: 0, val: 0 });
  const onScrubStart = (e) => {
    e.preventDefault();
    startRef.current = { x: e.clientX, val: value };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = (ev) => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return (
    <div className="twk-num">
      <span className="twk-num-lbl" onPointerDown={onScrubStart}>{label}</span>
      <input type="number" value={value} min={min} max={max} step={step}
             onChange={(e) => onChange(clamp(Number(e.target.value)))} />
      {unit && <span className="twk-num-unit">{unit}</span>}
    </div>
  );
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, (c) => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}

const __TwkCheck = ({ light }) => (
  <svg viewBox="0 0 14 14" aria-hidden="true">
    <path d="M3 7.2 5.8 10 11 4.2" fill="none" strokeWidth="2.2"
          strokeLinecap="round" strokeLinejoin="round"
          stroke={light ? 'rgba(0,0,0,.78)' : '#fff'} />
  </svg>
);

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({ label, value, options, onChange }) {
  if (!options || !options.length) {
    return (
      <div className="twk-row twk-row-h">
        <div className="twk-lbl"><span>{label}</span></div>
        <input type="color" className="twk-swatch" value={value}
               onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = (o) => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return (
    <TweakRow label={label}>
      <div className="twk-chips" role="radiogroup">
        {options.map((o, i) => {
          const colors = Array.isArray(o) ? o : [o];
          const [hero, ...rest] = colors;
          const sup = rest.slice(0, 4);
          const on = key(o) === cur;
          return (
            <button key={i} type="button" className="twk-chip" role="radio"
                    aria-checked={on} data-on={on ? '1' : '0'}
                    aria-label={colors.join(', ')} title={colors.join(' · ')}
                    style={{ background: hero }}
                    onClick={() => onChange(o)}>
              {sup.length > 0 && (
                <span>
                  {sup.map((c, j) => <i key={j} style={{ background: c }} />)}
                </span>
              )}
              {on && <__TwkCheck light={__twkIsLight(hero)} />}
            </button>
          );
        })}
      </div>
    </TweakRow>
  );
}

function TweakButton({ label, onClick, secondary = false }) {
  return (
    <button type="button" className={secondary ? 'twk-btn secondary' : 'twk-btn'}
            onClick={onClick}>{label}</button>
  );
}

Object.assign(window, {
  useTweaks, TweaksPanel, TweakSection, TweakRow,
  TweakSlider, TweakToggle, TweakRadio, TweakSelect,
  TweakText, TweakNumber, TweakColor, TweakButton,
});

// ==================== data.jsx ====================
// data.jsx — content, pricing & imagery for Yusuf's wedding films & photography site.
// Copy is general (examples are specific). Pricing is coverage-driven.
// Stock images are placeholders; the Studio admin lets Yusuf upload his own.

const U = (id, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${w}`;

// One real photo pulled from yusufshoots.com (portrait). Falls back gracefully.
const REAL_HERO = "https://cdn.myportfolio.com/b785e00f-afc3-4a6b-9014-8d913373f4e0/5e0fbe8b-2ac9-42bd-9a51-52c2117d32e7_rwc_0x0x3855x6853x3855.jpg?h=6c12872659984e3373bd413a36e2d564";

// Portfolio / hero imagery
const PHOTOS = [
  { id: "1519741497674-611481863552", label: "Ceremony rings",   ratio: "4/5" },
  { id: "1606216794074-735e91aa2c92", label: "Mehndi detail",    ratio: "3/4" },
  { id: "1537633552985-df8429e8048b", label: "Golden hour",      ratio: "4/3" },
  { id: "1519225421980-715cb0215aed", label: "First dance",      ratio: "3/4" },
  { id: "1583939003579-730e3918a45a", label: "Bridal portrait",  ratio: "4/5" },
  { id: "1522673607200-164d1b6ce486", label: "The couple",       ratio: "3/2" },
  { id: "1465495976277-4387d4b0b4c6", label: "Reception toast",  ratio: "4/3" },
  { id: "1511285560929-80b456fea0bc", label: "Stage & decor",    ratio: "3/2" },
  { id: "1532712938310-34cb3982ef74", label: "Florals",          ratio: "4/5" },
  { id: "1469371670807-013ccf25f16a", label: "Baraat, dusk",      ratio: "3/2" },
  { id: "1525258946800-98cfd641d0de", label: "Dupatta detail",   ratio: "3/4" },
  { id: "1511795409834-ef04bbd61622", label: "Celebration",      ratio: "3/2" },
];

const photoURL = (p, w) => U(p.id, w);

// ---- Coverage types (drive which package list shows) ----
const COVERAGE = [
  { id: "photo", name: "Photography",   desc: "Stills only" },
  { id: "film",  name: "Cinematography", desc: "Film only" },
  { id: "both",  name: "Photography & Cinematography",  desc: "Most booked", featured: true },
];
const coverageName = (id) => (COVERAGE.find((c) => c.id === id) || {}).name || "";

// ---- Packages, per coverage type ----
// price: number | null (null = custom quote). prefix: optional e.g. "From ".
const PACKAGES_BY_COVERAGE = {
  photo: [
    { id: "p1", name: "Essential", events: "One function — e.g. Mehndi, Nikah, civil ceremony or reception",
      price: 350, points: ["One function, up to 6 hours", "One photographer", "Unlimited edited photos", "Private online gallery", "Transport included (London)"] },
    { id: "p2", name: "Signature", events: "Two functions — e.g. Mehndi + reception", featured: true,
      price: 600, points: ["Two functions covered", "Two photographers across the day", "Unlimited edited photos", "Private online gallery", "Printed photo album"] },
    { id: "p3", name: "Bespoke", events: "Multi-day celebrations & beyond",
      price: null, custom: true, points: ["Multi-day & full celebrations", "Longer hours, multiple functions", "Couples / pre-wedding shoot included", "Unlimited edited photos", "Tailored to your requests"] },
  ],
  both: [
    { id: "b1", name: "Essential", events: "One function, photo + film",
      price: 800, points: ["One function, photo + film duo", "Unlimited edited photos", "Highlight film (3–5 min)", "Private online gallery", "Transport included (London)"] },
    { id: "b2", name: "Signature", events: "Two functions, full team", featured: true,
      price: 1400, points: ["Two functions covered", "Full photo + film team", "Unlimited edited photos", "Cinematic film (5–8 min) + teaser", "Printed photo album"] },
    { id: "b3", name: "Premier", events: "Multi-day, the full story",
      price: 2000, points: ["Multi-day coverage", "Full photo + film team", "Unlimited edited photos", "Feature film + highlights", "Drone coverage", "Heirloom album"] },
  ],
  film: [
    { id: "f1", name: "Essential", events: "One function, highlight film",
      price: 550, prefix: "From ", points: ["One function coverage", "One cinematographer", "Highlight film (3–5 min)", "Private online gallery", "Transport included (UK mainland)"] },
    { id: "f2", name: "Signature", events: "Full-day cinematic film", featured: true,
      price: 1100, points: ["Coverage across the day", "Lead + one additional shooter", "Full-length film (30–60 min)", "Drone coverage", "Cinematic highlights", "Teaser reel for socials"] },
    { id: "f3", name: "Bespoke", events: "Multi-day & custom productions",
      price: null, custom: true, points: ["Multi-day & full celebrations", "Drone & extra shooters", "Same-day edit option", "Tailored to your requests"] },
  ],
};

// ---- Videography examples (films). Add `videoSrc` to make a card play a real film. ----
const FILMS = [
  { id: "1537633552985-df8429e8048b", title: "Ayesha & Bilal", events: "Mehndi · Baraat · Reception",  len: "6:42", place: "London" },
  { id: "1606216794074-735e91aa2c92", title: "Tasnia & Rahul", events: "Holud · Ceremony · Reception", len: "5:18", place: "Birmingham" },
  { id: "1469371670807-013ccf25f16a", title: "Sana & Imran",   events: "Mehndi · Nikah · Walima",       len: "7:05", place: "Manchester" },
  { id: "1522673607200-164d1b6ce486", title: "Nadia & Arif",   events: "Holud · Civil ceremony",        len: "4:30", place: "London" },
];

// ---------- Client gallery storage (shared by Admin + Gallery) ----------
const GAL_KEY = "yusuf_galleries_v1";

const SEED_GALLERY = {
  id: "sample-ayesha-bilal",
  couple: "Ayesha & Bilal",
  date: "23 May 2026",
  venue: "Reception · The Royal Nawaab, London",
  password: "ayesha2026",
  cover: "1537633552985-df8429e8048b",
  sample: true,
  photos: [
    "1519741497674-611481863552","1606216794074-735e91aa2c92","1583939003579-730e3918a45a",
    "1519225421980-715cb0215aed","1522673607200-164d1b6ce486","1465495976277-4387d4b0b4c6",
    "1532712938310-34cb3982ef74","1469371670807-013ccf25f16a","1525258946800-98cfd641d0de",
    "1511285560929-80b456fea0bc","1511795409834-ef04bbd61622","1537633552985-df8429e8048b",
  ],
  createdAt: 0,
};

// ---------- API layer (server-backed data; replaces browser storage) ----------
const DB = { site: null, galleries: [], bookings: [], enquiries: [], admin: false };
let ADMIN_TOKEN = "";
try { ADMIN_TOKEN = sessionStorage.getItem("yusuf_admin_token") || ""; } catch (e) {}

async function api(path, opts = {}) {
  const headers = { "Content-Type": "application/json" };
  if (ADMIN_TOKEN) headers.Authorization = "Bearer " + ADMIN_TOKEN;
  const r = await fetch(path, { method: opts.method || "GET", headers, body: opts.body != null ? JSON.stringify(opts.body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.error || "Request failed (" + r.status + ")"); e.status = r.status; throw e; }
  return j;
}
async function bootData() {
  const j = await api("/api/public");
  DB.site = j.site;
  DB.galleries = j.galleries;
}
async function adminLogin(password) {
  const j = await api("/api/admin/login", { method: "POST", body: { password } });
  ADMIN_TOKEN = j.token;
  try { sessionStorage.setItem("yusuf_admin_token", ADMIN_TOKEN); } catch (e) {}
  await adminLoad();
}
async function adminLoad() {
  const j = await api("/api/admin/all");
  DB.site = j.site; DB.galleries = j.galleries; DB.bookings = j.bookings; DB.enquiries = j.enquiries;
  DB.admin = true;
}

function loadGalleries() { return DB.galleries; }
function saveGalleries(list) {
  DB.galleries = list;
  api("/api/admin/galleries", { method: "PUT", body: { galleries: list } })
    .then((j) => { DB.galleries = j.galleries; })
    .catch((e) => alert("Saving galleries failed: " + e.message));
  return true;
}
const makeId = () => "g" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// A gallery photo can be a data URL, an http URL, or an Unsplash id.
function galImg(photo, w = 1200) {
  const s = typeof photo === "string" ? photo : (photo && photo.id) || "";
  if (s.startsWith("data:") || s.startsWith("http") || s.startsWith("/u/")) return s;
  return U(s, w);
}

// Downscale an uploaded file to a storable JPEG data URL.
function fileToDataURL(file, max = 1600, q = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let w = img.width, h = img.height;
      const scale = Math.min(1, max / Math.max(w, h));
      w = Math.round(w * scale); h = Math.round(h * scale);
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", q));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("bad image")); };
    img.src = url;
  });
}

const SEED_COMMENTS = [
  { name: "Ammu (Shirin)", photo: 2, text: "Ya Allah, this one. Framing it for the whole family!", when: "2 days ago" },
  { name: "Best man — Hamza", photo: 5, text: "The reception shots are unreal. Send full res please 🙏", when: "yesterday" },
];

// ---------- Editable site content (hero, photo grid, films) ----------
const SITE_KEY = "yusuf_site_v1";

// Minimum lead time — no bookings within this many days of today.
const MIN_LEAD_DAYS = 7;

function defaultSite() {
  return {
    hero: REAL_HERO,
    photos: PHOTOS.map((p) => ({ src: p.id, ratio: p.ratio, label: p.label })),
    films: FILMS.map((f) => ({ id: f.id, title: f.title, events: f.events, len: f.len, place: f.place, poster: f.id, videoSrc: f.videoSrc || "" })),
    // Dates marked unavailable by Yusuf (already booked / blocked out). Keys: "Y-M-D" (month 0-indexed).
    blocked: ["2026-7-19","2026-7-26","2026-8-15","2026-9-12","2026-9-26","2026-10-10"],
    // Discount codes. type: "percent" (value = %) or "fixed" (value = £ off). maxUses 0 = unlimited.
    discounts: [
      { code: "EARLYBIRD", type: "percent", value: 10, maxUses: 5, used: 0 },
    ],
  };
}
function loadSite() {
  const s = DB.site || defaultSite();
  return { ...s, blocked: s.blocked || [], discounts: s.discounts || [] };
}
function saveSite(s) {
  DB.site = s;
  api("/api/admin/site", { method: "PUT", body: { site: s } })
    .then((j) => { DB.site = j.site; })
    .catch((e) => alert("Saving failed: " + e.message));
  return true;
}

// First date a client is allowed to book (today + MIN_LEAD_DAYS, midnight).
function earliestBookable() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + MIN_LEAD_DAYS);
  return d;
}

// ---- Discount codes ----
function findDiscount(code) {
  if (!code) return null;
  const list = (loadSite().discounts) || [];
  return list.find((d) => (d.code || "").trim().toLowerCase() === code.trim().toLowerCase()) || null;
}
function discountUsable(c) { return !!c && (!c.maxUses || (c.used || 0) < c.maxUses); }
function discountAmount(price, c) {
  if (!c || !price) return 0;
  if (c.type === "percent") return Math.round(price * (c.value / 100));
  return Math.min(price, c.value);
}
function redeemDiscount(code) { /* handled server-side by the Stripe webhook */ }

// ---- Bookings ----
const BK_KEY = "yusuf_bookings_v1";
function loadBookings() { return DB.bookings; }
function saveBookings(list) { DB.bookings = list; return true; }
async function addBooking(rec) {
  const j = await api("/api/admin/bookings", { method: "POST", body: { booking: rec } });
  DB.bookings = [j.booking, ...DB.bookings.filter((x) => x.id !== j.booking.id)];
  if (j.booking.dateKey) { const s = new Set(DB.site.blocked || []); s.add(j.booking.dateKey); DB.site.blocked = [...s]; }
  return j.booking;
}
async function refundBooking(id) {
  const j = await api("/api/admin/bookings/" + id + "/refund", { method: "POST", body: {} });
  DB.bookings = DB.bookings.map((x) => (x.id === id ? j.booking : x));
  if (j.booking.dateKey) DB.site.blocked = (DB.site.blocked || []).filter((k) => k !== j.booking.dateKey);
  return j.booking;
}
async function updateBooking(id, patch) {
  try {
    const j = await api("/api/admin/bookings/" + id, { method: "PUT", body: { patch } });
    DB.bookings = DB.bookings.map((x) => (x.id === id ? j.booking : x));
    return true;
  } catch (e) { return false; }
}
function readFileDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res({ name: file.name, type: file.type, size: file.size, dataURL: r.result });
    r.onerror = () => rej(new Error("read failed"));
    r.readAsDataURL(file);
  });
}

// ---- Enquiries (contact form messages, sent through the site) ----
const ENQ_KEY = "yusuf_enquiries_v1";
function loadEnquiries() { return DB.enquiries; }
function saveEnquiries(list) { DB.enquiries = list; return true; }
function addEnquiry(rec) { return api("/api/enquiries", { method: "POST", body: rec }); }
async function deleteEnquiry(id) {
  await api("/api/admin/enquiries/" + id, { method: "DELETE" });
  DB.enquiries = DB.enquiries.filter((x) => x.id !== id);
}

Object.assign(window, {
  U, REAL_HERO, PHOTOS, photoURL, COVERAGE, coverageName, PACKAGES_BY_COVERAGE, FILMS,
  GAL_KEY, SEED_GALLERY, loadGalleries, saveGalleries, makeId, galImg, fileToDataURL, SEED_COMMENTS,
  SITE_KEY, MIN_LEAD_DAYS, defaultSite, loadSite, saveSite, earliestBookable,
  findDiscount, discountUsable, discountAmount, redeemDiscount,
  BK_KEY, loadBookings, saveBookings, addBooking, refundBooking, updateBooking, readFileDataURL,
  ENQ_KEY, loadEnquiries, saveEnquiries, addEnquiry, deleteEnquiry,
  api, DB, bootData, adminLogin, adminLoad,
});

// ==================== ui.jsx ====================
// ui.jsx — shared primitives: Img (with graceful fallback), Nav, Footer, Reveal.
const { useState, useEffect, useRef } = React;

// Image with a labelled, on-brand placeholder fallback if the stock URL fails.
function Img({ src, alt, label, ratio, className, style, eager }) {
  const [failed, setFailed] = useState(false);
  const wrap = {
    position: "relative", overflow: "hidden", background: "var(--paper-2)",
    aspectRatio: ratio || undefined, width: "100%", height: ratio ? undefined : "100%",
    ...style,
  };
  return (
    <div className={"img " + (className || "")} style={wrap}>
      {!failed ? (
        <img
          src={src} alt={alt || label || ""} loading={eager ? "eager" : "lazy"}
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <div className="ph">
          <span>{label || "photograph"}</span>
        </div>
      )}
    </div>
  );
}

const NAV_LINKS = [
  { key: "portfolio", label: "Portfolio" },
  { key: "films", label: "Films" },
  { key: "booking", label: "Book a date" },
  { key: "gallery", label: "Client gallery" },
];

function Nav({ route, navigate, light }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const el = document.querySelector(".scroll-root");
    const onScroll = () => setScrolled((el ? el.scrollTop : window.scrollY) > 24);
    const target = el || window;
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => target.removeEventListener("scroll", onScroll);
  }, [route]);

  return (
    <header className={"nav" + (scrolled ? " nav--solid" : "") + (light ? " nav--light" : "")}>
      <button className="wordmark" onClick={() => navigate("home")} aria-label="Home">
        YUSUF<span className="wordmark__dot">.</span>
      </button>
      <nav className="nav__links">
        {NAV_LINKS.map((l) => (
          <button
            key={l.key}
            className={"nav__link" + (route === l.key ? " is-active" : "")}
            onClick={() => navigate(l.key)}
          >
            {l.label}
          </button>
        ))}
        <a className="nav__ig" href="https://instagram.com/yusufshoot.s" target="_blank" rel="noreferrer">@yusufshoot.s</a>
      </nav>
      <button className="nav__burger" onClick={() => setOpen((v) => !v)} aria-label="Menu">
        <span /><span /><span />
      </button>
      {open && (
        <div className="nav__sheet" onClick={() => setOpen(false)}>
          {NAV_LINKS.map((l) => (
            <button key={l.key} onClick={() => { navigate(l.key); setOpen(false); }}>{l.label}</button>
          ))}
          <a href="https://instagram.com/yusufshoot.s" target="_blank" rel="noreferrer">@yusufshoot.s</a>
        </div>
      )}
    </header>
  );
}

function Footer({ navigate }) {
  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__brand">
          <div className="wordmark wordmark--lg">YUSUF<span className="wordmark__dot">.</span></div>
          <p className="footer__tag">Wedding films &amp; photography — quietly observed, honestly made.</p>
        </div>
        <div className="footer__cols">
          <div>
            <h4>Explore</h4>
            <button onClick={() => navigate("portfolio")}>Portfolio</button>
            <button onClick={() => navigate("films")}>Films</button>
            <button onClick={() => navigate("booking")}>Book a date</button>
            <button onClick={() => navigate("gallery")}>Client gallery</button>
          </div>
          <div>
            <h4>Connect</h4>
            <a href="https://instagram.com/yusufshoot.s" target="_blank" rel="noreferrer">Instagram</a>
            <a href="mailto:hello@yusufshoot.com">hello@yusufshoot.com</a>
            <span className="muted">London &amp; travelling worldwide</span>
          </div>
        </div>
      </div>
      <div className="footer__base">
        <span>© {new Date().getFullYear()} Yusuf Photography</span>
        <span>Site by Yusuf — built with care</span>
        <button className="footer__hot" onClick={() => navigate("admin")} aria-label="Studio" title="Studio"></button>
      </div>
    </footer>
  );
}

// Scroll-triggered reveal
function Reveal({ children, delay = 0, as: Tag = "div", className, style }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); io.disconnect(); } },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={"reveal " + (vis ? "is-in " : "") + (className || "")}
         style={{ transitionDelay: vis ? delay + "ms" : "0ms", ...style }}>
      {children}
    </Tag>
  );
}

Object.assign(window, { Img, Nav, Footer, Reveal, NAV_LINKS });

// ==================== home.jsx ====================
// home.jsx — landing page with 3 selectable hero directions.
const { useState: useStateH, useEffect: useEffectH } = React;

// ---- Direction A: full-bleed cinematic hero ----
function HeroFullBleed({ navigate, site }) {
  return (
    <section className="hero hero--bleed">
      <Img src={galImg(site.hero, 2000)} label="Couple" eager
           className="hero__bg" style={{ position: "absolute", inset: 0 }} />
      <div className="hero__scrim" />
      <div className="hero__bleed-inner">
        <p className="eyebrow eyebrow--light">Wedding Films &amp; Photography · London</p>
        <h1 className="display display--bleed">
          Every moment,<br />kept forever.
        </h1>
        <div className="hero__cta">
          <button className="btn btn--light" onClick={() => navigate("booking")}>Check your date</button>
          <button className="btn btn--ghost-light" onClick={() => navigate("films")}>Watch the films</button>
        </div>
      </div>
      <div className="hero__scroll">Scroll</div>
    </section>
  );
}

// ---- Direction B: editorial split ----
function HeroEditorial({ navigate, site }) {
  const detail = site.photos[1] || site.photos[0];
  return (
    <section className="hero hero--editorial">
      <div className="hero__edcol">
        <p className="eyebrow">Wedding Films &amp; Photography</p>
        <h1 className="display">
          From the first celebration to the last dance — every moment, beautifully kept.
        </h1>
        <p className="lede">
          I photograph and film weddings the way they actually feel — the colour, the
          entrances, the quiet of the ceremony, the dance floor at the reception. Every
          tradition, every celebration. Based in London, available worldwide.
        </p>
        <div className="hero__cta">
          <button className="btn btn--dark" onClick={() => navigate("booking")}>Check your date</button>
          <button className="btn btn--ghost" onClick={() => navigate("films")}>Watch the films</button>
        </div>
      </div>
      <div className="hero__edimg">
        <Img src={galImg(site.hero, 1400)} label="Couple" ratio="4/5" eager />
        <Img src={galImg(detail.src, 1000)} label={detail.label} ratio="3/2" className="hero__edimg-2" />
      </div>
    </section>
  );
}

// ---- Direction C: centered minimal ----
function HeroCentered({ navigate, site }) {
  const strip = [2, 1, 9, 6].map((i) => site.photos[i] || site.photos[i % site.photos.length]).filter(Boolean);
  return (
    <section className="hero hero--centered">
      <p className="eyebrow">Est. 2018 · London &amp; worldwide</p>
      <h1 className="display display--center">Yusuf</h1>
      <p className="hero__sub">Wedding films &amp; photography, quietly observed.</p>
      <div className="hero__cta hero__cta--center">
        <button className="btn btn--dark" onClick={() => navigate("booking")}>Check your date</button>
        <button className="btn btn--ghost" onClick={() => navigate("films")}>Watch the films</button>
      </div>
      <div className="hero__strip">
        {strip.map((p, i) => (
          <Img key={i} src={galImg(p.src, 800)} label={p.label} ratio="3/4" />
        ))}
      </div>
    </section>
  );
}

function HomeHero({ direction, navigate, site }) {
  if (direction === "editorial") return <HeroEditorial navigate={navigate} site={site} />;
  if (direction === "centered") return <HeroCentered navigate={navigate} site={site} />;
  return <HeroFullBleed navigate={navigate} site={site} />;
}

// ---- Shared lower sections ----
function Intro() {
  return (
    <section className="section intro">
      <Reveal><p className="eyebrow">The approach</p></Reveal>
      <Reveal delay={80}>
        <p className="intro__statement">
          My approach is calm and unobtrusive. I'm always working the room — anticipating
          the look between you during the vows, your mother's tears, the whole room on its
          feet at the reception — capturing it all without ever making you feel posed.
          <em> Real photographs and films of a real celebration.</em>
        </p>
      </Reveal>
    </section>
  );
}

function FeaturedWork({ navigate, site }) {
  const picks = [0, 1, 3, 6, 8, 9].map((i) => site.photos[i] || site.photos[i % site.photos.length]).filter(Boolean);
  return (
    <section className="section featured">
      <div className="section__head">
        <Reveal><h2 className="section__title">Selected weddings</h2></Reveal>
        <Reveal delay={60}>
          <button className="link-arrow" onClick={() => navigate("portfolio")}>
            See the full portfolio <span>→</span>
          </button>
        </Reveal>
      </div>
      <div className="featured__grid">
        {picks.map((p, i) => (
          <Reveal key={i} delay={(i % 3) * 70} className={"featured__cell featured__cell--" + (i % 3)}>
            <button className="photo-btn" onClick={() => navigate("portfolio")}>
              <Img src={galImg(p.src, 1100)} label={p.label} ratio={p.ratio} />
            </button>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Services() {
  const rows = [
    { n: "01", t: "Every function covered", d: "From pre-wedding events to the ceremony and reception — e.g. Mehndi, Gaye Holud, Nikah, Baraat or civil ceremony — multi-day coverage, one trusted team." },
    { n: "02", t: "Cinematic wedding films", d: "Highlight reels and feature films that replay the day with sound, motion and emotion — plus teasers for socials." },
    { n: "03", t: "A private online gallery", d: "High-resolution images and your films delivered together — downloadable, shareable and ready to print." },
  ];
  return (
    <section className="section services">
      <Reveal><p className="eyebrow">What you get</p></Reveal>
      <div className="services__list">
        {rows.map((r, i) => (
          <Reveal key={r.n} delay={i * 60} className="services__row">
            <span className="services__n">{r.n}</span>
            <h3 dangerouslySetInnerHTML={{ __html: r.t }} />
            <p dangerouslySetInnerHTML={{ __html: r.d }} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Quote() {
  return (
    <section className="section quote">
      <Reveal>
        <blockquote>
          "They captured everything without us ever feeling posed or interrupted — then the
          film arrived and our whole families relived the day all over again. It's the
          best thing we own."
        </blockquote>
      </Reveal>
      <Reveal delay={80}><cite>— Ayesha &amp; Bilal, The Royal Nawaab</cite></Reveal>
    </section>
  );
}

function Contact() {
  const [name, setName] = useStateH("");
  const [email, setEmail] = useStateH("");
  const [msg, setMsg] = useStateH("");
  const [sending, setSending] = useStateH(false);
  const [sent, setSent] = useStateH(false);
  const [err, setErr] = useStateH("");
  const send = (e) => {
    e.preventDefault();
    if (!name.trim()) { setErr("Add your name so I know who to reply to."); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setErr("Add a valid email so I can get back to you."); return; }
    setErr(""); setSending(true);
    addEnquiry({ name: name.trim(), email: email.trim(), message: msg.trim() })
      .then(() => { setSending(false); setSent(true); })
      .catch(() => { setSending(false); setErr("Couldn't send just now — try again, or call instead."); });
  };
  return (
    <section className="section contact">
      <div className="contact__grid">
        <div className="contact__intro">
          <Reveal><p className="eyebrow">Get in touch</p></Reveal>
          <Reveal delay={60}><h2 className="section__title">Questions first? Just ask.</h2></Reveal>
          <Reveal delay={120}>
            <p className="contact__sub">Not ready to book, or planning something that doesn't fit a package? Send a note or call — I reply within a day.</p>
          </Reveal>
          <Reveal delay={180}>
            <div className="contact__ways">
              <a className="contact__phone" href="tel:+447305574530">
                <span className="contact__phlbl">Call or WhatsApp</span>
                <span className="contact__phnum">07305 574530</span>
              </a>
              <a className="contact__mail" href="mailto:hello@yusufshoots.com">hello@yusufshoots.com</a>
            </div>
          </Reveal>
        </div>
        <Reveal delay={100} className="contact__formwrap">
          {sent ? (
            <div className="contact__form contact__done">
              <div className="bk-done__seal">✓</div>
              <h3>Message sent</h3>
              <p>Thanks {name.split(" ")[0]} — your message is on its way. I'll reply to <b>{email}</b> within a day.</p>
              <button type="button" className="btn btn--ghost" onClick={() => { setSent(false); setMsg(""); }}>Send another message</button>
            </div>
          ) : (
          <form className="contact__form" onSubmit={send}>
            <div className="fld-row">
              <label className="fld"><span>Your name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="First & last" /></label>
              <label className="fld"><span>Your email</span>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" /></label>
            </div>
            <label className="fld"><span>Your message</span>
              <textarea className="contact__msg" value={msg} onChange={(e) => setMsg(e.target.value)}
                        placeholder="Tell me about your day — dates, functions, anything you're wondering about…" /></label>
            {err && <p className="promo-err">{err}</p>}
            <button className={"btn btn--dark btn--full" + (sending ? " is-busy" : "")} disabled={!msg.trim() || sending}>
              {sending ? <span className="spin" /> : "Send message"}
            </button>
            <p className="contact__fine">Sent straight to me through the site — no email app needed.</p>
          </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}

function CTA({ navigate }) {
  return (
    <section className="section cta">
      <div className="cta__inner">
        <Reveal><h2 className="cta__title">A limited number of weddings each season.</h2></Reveal>
        <Reveal delay={60}><p className="cta__sub">Multi-day celebrations book 12–18 months out. Check your date and reserve with a 25% deposit.</p></Reveal>
        <Reveal delay={120}>
          <button className="btn btn--dark btn--lg" onClick={() => navigate("booking")}>Check your date</button>
        </Reveal>
      </div>
    </section>
  );
}

function Home({ direction, navigate, site }) {
  return (
    <div className="home">
      <HomeHero direction={direction} navigate={navigate} site={site} />
      <Intro />
      <FeaturedWork navigate={navigate} site={site} />
      <FilmsTeaser navigate={navigate} films={site.films} />
      <Services />
      <Quote />
      <Contact />
      <CTA navigate={navigate} />
    </div>
  );
}

Object.assign(window, { Home });

// ==================== portfolio.jsx ====================
// portfolio.jsx — full weddings portfolio with masonry-ish grid + lightbox.
const { useState: useStateP, useEffect: useEffectP } = React;

function Lightbox({ items, index, onClose, onNav }) {
  useEffectP(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNav(1);
      if (e.key === "ArrowLeft") onNav(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index]);
  if (index == null) return null;
  const p = items[index];
  return (
    <div className="lb" onClick={onClose}>
      <button className="lb__close" onClick={onClose} aria-label="Close">×</button>
      <button className="lb__nav lb__prev" onClick={(e) => { e.stopPropagation(); onNav(-1); }} aria-label="Previous">‹</button>
      <figure className="lb__fig" onClick={(e) => e.stopPropagation()}>
        <Img src={galImg(p.src, 1800)} label={p.label} eager
             style={{ maxHeight: "82vh", width: "auto", maxWidth: "88vw" }} />
        <figcaption>{p.label} · {index + 1}/{items.length}</figcaption>
      </figure>
      <button className="lb__nav lb__next" onClick={(e) => { e.stopPropagation(); onNav(1); }} aria-label="Next">›</button>
    </div>
  );
}

function Portfolio({ navigate, site }) {
  const photos = site.photos;
  const [lb, setLb] = useStateP(null);
  const nav = (d) => setLb((i) => (i + d + photos.length) % photos.length);
  return (
    <div className="page portfolio">
      <header className="page__head">
        <p className="eyebrow">Portfolio</p>
        <h1 className="page__title">Weddings</h1>
        <p className="page__intro">
          A few complete stories and favourite frames. Every wedding gets a private,
          high-resolution gallery — these are the moments I keep coming back to.
        </p>
      </header>

      <div className="masonry">
        {photos.map((p, i) => (
          <Reveal key={i} delay={(i % 4) * 50} className="masonry__item">
            <button className="photo-btn" onClick={() => setLb(i)}>
              <Img src={galImg(p.src, 1100)} label={p.label} ratio={p.ratio} />
              <span className="masonry__cap">{p.label}</span>
            </button>
          </Reveal>
        ))}
      </div>

      <section className="section cta cta--tight">
        <div className="cta__inner">
          <h2 className="cta__title">Like what you see?</h2>
          <p className="cta__sub">Tell me about your day and let's check if your date is free.</p>
          <button className="btn btn--dark btn--lg" onClick={() => navigate("booking")}>Check your date</button>
        </div>
      </section>

      <Lightbox items={photos} index={lb} onClose={() => setLb(null)} onNav={nav} />
    </div>
  );
}

Object.assign(window, { Portfolio });

// ==================== films.jsx ====================
// films.jsx — videography examples: Films page + homepage teaser + film lightbox.
const { useState: useStateF, useEffect: useEffectF } = React;

// Resolve a pasted link into a playable embed.
// YouTube/Vimeo → iframe; direct .mp4/.webm → <video>.
function videoEmbed(url) {
  if (!url) return null;
  const u = url.trim();
  let m;
  if ((m = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)))
    return { type: "iframe", src: `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&rel=0&playsinline=1`, page: `https://youtu.be/${m[1]}` };
  if ((m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/)))
    return { type: "iframe", src: `https://player.vimeo.com/video/${m[1]}?autoplay=1`, page: `https://vimeo.com/${m[1]}` };
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(u) || u.startsWith("data:video"))
    return { type: "video", src: u };
  // Fallback: assume it's an embeddable URL
  return { type: "iframe", src: u, page: u };
}

function FilmLightbox({ film, onClose }) {
  useEffectF(() => {
    if (!film) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [film]);
  if (!film) return null;
  const embed = videoEmbed(film.videoSrc);
  return (
    <div className="film-lb" onClick={onClose}>
      <button className="lb__close" onClick={onClose} aria-label="Close">×</button>
      <div className="film-lb__frame" onClick={(e) => e.stopPropagation()}>
        <div className="film-lb__video">
          {embed && embed.type === "iframe" ? (
            <iframe src={embed.src} title={film.title} frameBorder="0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen
                    style={{ width: "100%", height: "100%", border: 0 }} />
          ) : embed && embed.type === "video" ? (
            <video src={embed.src} poster={galImg(film.poster || film.id, 1800)} controls autoPlay
                   style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <>
              <Img src={galImg(film.poster || film.id, 1800)} label={film.title + " — film"} eager
                   className="film-lb__poster" style={{ position: "absolute", inset: 0 }} />
              <div className="film-lb__scrim" />
              <div className="film-lb__play"><span>▶</span></div>
              <p className="film-lb__note">Showreel preview · your film embeds here</p>
            </>
          )}
        </div>
        <div className="film-lb__meta">
          <div>
            <h3>{film.title}</h3>
            <p className="muted">{film.events}</p>
          </div>
          <div className="film-lb__tags">
            {embed && embed.page && <a className="film-lb__yt" href={embed.page} target="_blank" rel="noreferrer">Watch on source ↗</a>}
            <span>{film.place}</span><span>{film.len}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilmCard({ film, onOpen, large }) {
  return (
    <button className={"film-card" + (large ? " film-card--lg" : "")} onClick={() => onOpen(film)}>
      <div className="film-card__media">
        <Img src={galImg(film.poster || film.id, 1300)} label={film.title + " — film"} ratio="16/9" />
        <div className="film-card__scrim" />
        <div className="film-card__play"><span>▶</span></div>
        <span className="film-card__len">{film.len}</span>
      </div>
      <div className="film-card__cap">
        <h3>{film.title}</h3>
        <p>{film.events}</p>
        <span className="film-card__place">{film.place}</span>
      </div>
    </button>
  );
}

// Homepage teaser
function FilmsTeaser({ navigate, films = FILMS }) {
  const [active, setActive] = useStateF(null);
  return (
    <section className="section films-teaser">
      <div className="section__head">
        <div>
          <Reveal><p className="eyebrow">Cinematography</p></Reveal>
          <Reveal delay={60}><h2 className="section__title">Wedding films</h2></Reveal>
        </div>
        <Reveal delay={100}>
          <button className="link-arrow" onClick={() => navigate("films")}>
            Watch the films <span>→</span>
          </button>
        </Reveal>
      </div>
      <div className="films-teaser__grid">
        <Reveal className="films-teaser__feat"><FilmCard film={films[0]} onOpen={setActive} large /></Reveal>
        <div className="films-teaser__col">
          {films.slice(1, 3).map((f, i) => (
            <Reveal key={i} delay={60 + i * 60}><FilmCard film={f} onOpen={setActive} /></Reveal>
          ))}
        </div>
      </div>
      <FilmLightbox film={active} onClose={() => setActive(null)} />
    </section>
  );
}

// Full Films page
function Films({ navigate, films = FILMS }) {
  const [active, setActive] = useStateF(null);
  return (
    <div className="page films">
      <header className="page__head">
        <p className="eyebrow">Films</p>
        <h1 className="page__title">Wedding films</h1>
        <p className="page__intro">
          Cinematic wedding films — the entrances, the tears at the ceremony, the dance
          floor at the reception. Played back exactly as the day felt, with sound and motion.
        </p>
      </header>

      <div className="films__grid">
        {films.map((f, i) => (
          <Reveal key={i} delay={(i % 2) * 70}>
            <FilmCard film={f} onOpen={setActive} large />
          </Reveal>
        ))}
      </div>

      <section className="section cta cta--tight">
        <div className="cta__inner">
          <h2 className="cta__title">Want your day filmed like this?</h2>
          <p className="cta__sub">Add cinematography to any package — or go photography only. Check your date to begin.</p>
          <button className="btn btn--dark btn--lg" onClick={() => navigate("booking")}>Check your date</button>
        </div>
      </section>

      <FilmLightbox film={active} onClose={() => setActive(null)} />
    </div>
  );
}

Object.assign(window, { Films, FilmsTeaser });

// ==================== booking.jsx ====================
// booking.jsx — multi-step booking + Stripe-style checkout.
// 1 Coverage + Package → 2 Date → 3 Details → 4 Payment / Request → 5 Confirmation.
const { useState: useStateB, useEffect: useEffectB, useMemo } = React;

const money = (n) => "£" + n.toLocaleString("en-GB");
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function Calendar({ value, onPick }) {
  const blocked = useMemo(() => new Set((loadSite().blocked) || []), []);
  const minDate = useMemo(() => earliestBookable(), []);
  const [view, setView] = useStateB({ y: 2026, m: 6 });
  const first = new Date(view.y, view.m, 1);
  const startDay = (first.getDay() + 6) % 7;
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  const key = (d) => `${view.y}-${view.m}-${d}`;
  const move = (dir) => setView((v) => {
    let m = v.m + dir, y = v.y;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    return { y, m };
  });
  return (
    <div className="cal">
      <div className="cal__head">
        <button onClick={() => move(-1)} aria-label="Previous month">‹</button>
        <span>{MONTHS[view.m]} {view.y}</span>
        <button onClick={() => move(1)} aria-label="Next month">›</button>
      </div>
      <div className="cal__dow">{["Mo","Tu","We","Th","Fr","Sa","Su"].map((d) => <span key={d}>{d}</span>)}</div>
      <div className="cal__grid">
        {cells.map((d, i) => {
          if (!d) return <span key={i} className="cal__cell cal__cell--empty" />;
          const k = key(d);
          const date = new Date(view.y, view.m, d);
          const tooSoon = date < minDate;
          const booked = blocked.has(k);
          const sat = date.getDay() === 6;
          const disabled = tooSoon || booked;
          const selected = value === k;
          return (
            <button key={i}
              className={"cal__cell" + (selected ? " is-selected" : "") + (sat && !disabled ? " is-pref" : "") + (booked ? " is-booked" : "")}
              disabled={disabled}
              onClick={() => onPick(k, `${d} ${MONTHS[view.m]} ${view.y}`)}
              title={booked ? "Already booked" : tooSoon ? "Too soon — book at least " + MIN_LEAD_DAYS + " days ahead" : sat ? "Saturday — prime date" : ""}>
              {d}
            </button>
          );
        })}
      </div>
      <div className="cal__legend">
        <span><i className="dot dot--pref" /> Saturday</span>
        <span><i className="dot dot--booked" /> Booked</span>
        <span className="cal__legnote">Min. {MIN_LEAD_DAYS} days' notice</span>
      </div>
    </div>
  );
}

const fmtCard = (v) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
const fmtExp = (v) => { const d = v.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? d.slice(0, 2) + " / " + d.slice(2) : d; };
const brandOf = (num) => {
  const n = num.replace(/\D/g, "");
  if (/^4/.test(n)) return "Visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  return "";
};

function priceLabel(pkg) {
  if (pkg.custom) return "Custom quote";
  return (pkg.prefix || "") + money(pkg.price);
}

function Payment({ pkg, covName, fullPrice, discount, discAmount, discInput, setDiscInput, onApplyDiscount, onClearDiscount, discErr, dateLabel, deposit, balance, balanceDue, payMode, setPayMode, payToday, onPay }) {
  const [err, setErr] = useStateB("");
  const [processing, setProcessing] = useStateB(false);
  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setProcessing(true);
    try { await onPay(); }
    catch (ex) { setErr(ex.message || "Could not start checkout — try again."); setProcessing(false); }
  };
  return (
    <div className="pay">
      <form className="pay__form" onSubmit={submit}>
        <div className="pay__lock"><span className="lockico">🔒</span> Secure checkout · powered by <b>Stripe</b></div>
        <p className="pay__redirect">You'll be taken to Stripe's secure checkout to pay by card, Apple Pay or Google Pay — and brought straight back here once it's done.</p>
        {err && <p className="pay__err">{err}</p>}
        <button className={"btn btn--dark btn--lg btn--full" + (processing ? " is-busy" : "")} disabled={processing}>
          {processing ? <span className="spin" /> : payMode === "full" ? `Pay ${money(payToday)} with Stripe` : `Pay ${money(payToday)} deposit with Stripe`}
        </button>
        <p className="pay__fine">By paying you reserve {dateLabel}. {payMode === "full" ? "25% of the total is a non-refundable deposit." : "The 25% deposit is non-refundable."}</p>
      </form>
      <aside className="pay__summary">
        <h4>Order summary</h4>
        <div className="sumrow"><span>{pkg.name} · {covName}</span><b>{money(fullPrice)}</b></div>
        {discount && <div className="sumrow sumrow--disc"><span>Discount · {discount.code}</span><b>−{money(discAmount)}</b></div>}
        <div className="sumrow sumrow--muted"><span>Wedding date</span><span>{dateLabel}</span></div>
        <div className="pay__promo">
          {discount ? (
            <div className="promo-applied">
              <span>Code <b>{discount.code}</b> applied</span>
              <button type="button" onClick={onClearDiscount}>Remove</button>
            </div>
          ) : (
            <div className="promo-row">
              <input placeholder="Discount code" value={discInput} onChange={(e) => setDiscInput(e.target.value.toUpperCase())} />
              <button type="button" className="btn btn--ghost btn--sm" onClick={onApplyDiscount}>Apply</button>
            </div>
          )}
          {discErr && <p className="promo-err">{discErr}</p>}
        </div>
        <hr />
        <div className="paymode">
          <span className="paymode__lbl">How would you like to pay?</span>
          <label className={"paymode__opt" + (payMode === "deposit" ? " is-on" : "")}>
            <input type="radio" name="paymode" checked={payMode === "deposit"} onChange={() => setPayMode("deposit")} />
            <span className="paymode__box" />
            <span className="paymode__txt"><b>Deposit only — {money(deposit)}</b><em>Balance of {money(balance)} due {balanceDue}</em></span>
          </label>
          <label className={"paymode__opt" + (payMode === "full" ? " is-on" : "")}>
            <input type="radio" name="paymode" checked={payMode === "full"} onChange={() => setPayMode("full")} />
            <span className="paymode__box" />
            <span className="paymode__txt"><b>Pay in full — {money(fullPrice - discAmount)}</b><em>Nothing left to pay later</em></span>
          </label>
        </div>
        <div className="sumrow sumrow--lg"><span>{payMode === "full" ? "Total due today" : "Deposit due today (25%)"}</span><b>{money(payToday)}</b></div>
        {payMode === "deposit" && <div className="sumrow sumrow--muted"><span>Balance — due {balanceDue}</span><span>{money(balance)}</span></div>}
        <div className="pay__schedule">
          <p><b>What happens next</b></p>
          {payMode === "full" ? (
            <ol>
              <li>Card charged {money(payToday)} — your date is locked.</li>
              <li>A paid-in-full Stripe receipt is emailed to you instantly.</li>
              <li>Nothing more to pay — see you on the day.</li>
            </ol>
          ) : (
            <ol>
              <li>Card charged {money(payToday)} — your date is locked.</li>
              <li>A Stripe invoice for the {money(balance)} balance is emailed automatically.</li>
              <li>Balance auto-charges (or pay early) two weeks before the wedding.</li>
            </ol>
          )}
        </div>
      </aside>
    </div>
  );
}

function RequestQuote({ pkg, covName, dateLabel, form, onSubmit }) {
  return (
    <div className="pay">
      <div className="quote-req">
        <h3>Request your bespoke quote</h3>
        <p className="muted">Bespoke coverage is priced around your day — number of functions, hours, locations and any extras. Send your details and you'll have a tailored quote within 48 hours. No payment is taken now.</p>
        <ul className="quote-req__list">
          <li><span>Coverage</span><b>{covName} · {pkg.name}</b></li>
          <li><span>Preferred date</span><b>{dateLabel || "To confirm"}</b></li>
          <li><span>Contact</span><b>{form.email || "—"}</b></li>
        </ul>
        <button className="btn btn--dark btn--lg btn--full" onClick={onSubmit}>Send quote request</button>
        <p className="pay__fine">You can also book a smaller fixed package now and adjust later.</p>
      </div>
      <aside className="pay__summary">
        <h4>What's included</h4>
        <ul className="pkg-incl">{pkg.points.map((p) => <li key={p}>{p}</li>)}</ul>
      </aside>
    </div>
  );
}

function Booking({ navigate }) {
  const [step, setStep] = useStateB(0);
  const [coverage, setCoverage] = useStateB("both");
  const list = PACKAGES_BY_COVERAGE[coverage];
  const featuredId = (list.find((p) => p.featured) || list[0]).id;
  const [pkgId, setPkgId] = useStateB(featuredId);
  const [dateKey, setDateKey] = useStateB(null);
  const [dateLabel, setDateLabel] = useStateB("");
  const [form, setForm] = useStateB({ a: "", b: "", email: "", phone: "", venue: "", guests: "", functions: "" });
  const [discInput, setDiscInput] = useStateB("");
  const [discount, setDiscount] = useStateB(null);
  const [discErr, setDiscErr] = useStateB("");
  const [payMode, setPayMode] = useStateB("deposit");
  const [receipt, setReceipt] = useStateB(null);

  // Returning from Stripe Checkout: fetch the booking and show the receipt. Stripe's webhook
  // confirms payment slightly after this redirect lands, so if we're still "pending" we poll
  // briefly rather than telling the couple their date is reserved before it actually is.
  useEffectB(() => {
    const q = new URLSearchParams(window.location.search);
    const bid = q.get("booking");
    if (bid && q.get("paid")) {
      window.history.replaceState({}, "", window.location.pathname);
      let cancelled = false;
      const poll = (attempt) => {
        api("/api/bookings/" + bid + "/receipt")
          .then((j) => {
            if (cancelled) return;
            setReceipt(j.booking);
            setStep(4);
            if (j.booking.status === "pending" && attempt < 6) setTimeout(() => poll(attempt + 1), 1500);
          })
          .catch(() => {});
      };
      poll(0);
      return () => { cancelled = true; };
    } else if (q.get("canceled")) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Keep a valid package selected when coverage changes.
  useEffectB(() => {
    if (!list.some((p) => p.id === pkgId)) setPkgId((list.find((p) => p.featured) || list[0]).id);
  }, [coverage]);

  const pkg = list.find((p) => p.id === pkgId) || list[0];
  const custom = !!pkg.custom;
  const price = pkg.price;
  const covName = coverageName(coverage);
  const discAmount = custom ? 0 : discountAmount(price, discount);
  const effPrice = custom ? price : price - discAmount;
  const deposit = custom ? 0 : Math.round(effPrice * 0.25);
  const balance = custom ? 0 : effPrice - deposit;
  const payToday = payMode === "full" ? effPrice : deposit;
  const remBalance = payMode === "full" ? 0 : balance;
  const balanceDue = useMemo(() => {
    if (!dateKey) return "2 weeks before";
    const [y, m, d] = dateKey.split("-").map(Number);
    const due = new Date(y, m, d - 14);
    return `${due.getDate()} ${MONTHS[due.getMonth()]} ${due.getFullYear()}`;
  }, [dateKey]);

  const STEPS = ["Package", "Date", "Details", custom ? "Request" : "Payment", "Done"];
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const detailsValid = form.a && form.b && /\S+@\S+\.\S+/.test(form.email) && form.phone.replace(/\D/g, "").length >= 7 && String(form.guests).trim() !== "";
  const applyDiscount = async () => {
    try {
      const j = await api("/api/discounts/validate", { method: "POST", body: { code: discInput } });
      setDiscount(j); setDiscErr("");
    } catch (e) {
      setDiscount(null);
      setDiscErr(e.status === 410 ? "This code has reached its usage limit." : "That code isn't valid.");
    }
  };
  const clearDiscount = () => { setDiscount(null); setDiscInput(""); setDiscErr(""); };
  const go = (n) => { setStep(n); document.querySelector(".scroll-root")?.scrollTo({ top: 0 }); };

  // Confirmation data — from the server receipt after a real payment, or local state for quote requests.
  const done = receipt || {
    coupleA: form.a, coupleB: form.b, email: form.email, venue: form.venue,
    covName, packageName: pkg.name, dateLabel, id: "",
    price, discountCode: discount ? discount.code : "", discountAmount: discAmount, total: effPrice,
    deposit: payToday, balance: remBalance, balanceDue: payMode === "full" ? "—" : balanceDue, payMode,
  };

  return (
    <div className="page booking">
      <header className="page__head page__head--tight">
        <p className="eyebrow">Booking</p>
        <h1 className="page__title">Reserve your date</h1>
      </header>

      <ol className="stepper">
        {STEPS.map((s, i) => (
          <li key={s} className={"stepper__i" + (i === step ? " is-now" : "") + (i < step ? " is-done" : "")}>
            <span className="stepper__n">{i < step ? "✓" : i + 1}</span>{s}
          </li>
        ))}
      </ol>

      {/* STEP 1 — coverage + package */}
      {step === 0 && (
        <section className="bk-step">
          <div className="covsel">
            <p className="covsel__lbl">Choose your coverage</p>
            <div className="covsel__row">
              {COVERAGE.map((c) => (
                <button key={c.id} className={"covsel__b" + (c.id === coverage ? " is-on" : "")} onClick={() => setCoverage(c.id)}>
                  <b>{c.name}</b><span>{c.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div className={"pkgs pkgs--" + list.length}>
            {list.map((p) => (
              <button key={p.id} className={"pkg" + (p.id === pkgId ? " is-sel" : "") + (p.featured ? " pkg--feat" : "")} onClick={() => setPkgId(p.id)}>
                {p.featured && <span className="pkg__badge">Most booked</span>}
                <h3>{p.name}</h3>
                <p className="pkg__hours">{p.events}</p>
                <div className="pkg__price">{priceLabel(p)}{!p.custom && <em>{covName}</em>}</div>
                <ul>{p.points.map((pt) => <li key={pt}>{pt}</li>)}</ul>
                <span className="pkg__pick">{p.id === pkgId ? "Selected" : "Select"}</span>
              </button>
            ))}
          </div>
          <div className="bk-actions bk-actions--end">
            <button className="btn btn--dark btn--lg" onClick={() => go(1)}>{custom ? "Tell me about your day →" : "Choose a date →"}</button>
          </div>
        </section>
      )}

      {/* STEP 2 — date */}
      {step === 1 && (
        <section className="bk-step bk-step--date">
          <div className="bk-date__cal"><Calendar value={dateKey} onPick={(k, l) => { setDateKey(k); setDateLabel(l); }} /></div>
          <div className="bk-date__side">
            <h3>{custom ? "Your preferred date" : "Pick your main date"}</h3>
            <p className="muted">Pick your headline function. Saturdays are in highest demand; greyed dates are taken. Multi-day dates are confirmed together after booking.</p>
            <div className="bk-date__chosen">
              {dateKey ? <><span>Selected</span><b>{dateLabel}</b></> : <span className="muted">No date selected yet</span>}
            </div>
            <div className="bk-actions">
              <button className="btn btn--ghost" onClick={() => go(0)}>← Back</button>
              <button className="btn btn--dark" disabled={!dateKey && !custom} onClick={() => go(2)}>Continue →</button>
            </div>
          </div>
        </section>
      )}

      {/* STEP 3 — details */}
      {step === 2 && (
        <section className="bk-step bk-step--form">
          <div className="bk-form">
            <div className="fld-row">
              <label className="fld"><span>Your name</span>
                <input value={form.a} onChange={(e) => set("a", e.target.value)} placeholder="First & last" /></label>
              <label className="fld"><span>Partner's name</span>
                <input value={form.b} onChange={(e) => set("b", e.target.value)} placeholder="First & last" /></label>
            </div>
            <div className="fld-row">
              <label className="fld"><span>Email</span>
                <input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@email.com" /></label>
              <label className="fld"><span>Phone</span>
                <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="07… — main point of contact" /></label>
            </div>
            <div className="fld-row">
              <label className="fld"><span>Approx. number of guests</span>
                <input inputMode="numeric" value={form.guests} onChange={(e) => set("guests", e.target.value)} placeholder="e.g. 250" /></label>
              <label className="fld"><span>Venue / location <em className="opt">optional</em></span>
                <input value={form.venue} onChange={(e) => set("venue", e.target.value)} placeholder="Where's the celebration?" /></label>
            </div>
            <label className="fld"><span>Functions &amp; details <em className="opt">optional</em></span>
              <input value={form.functions} onChange={(e) => set("functions", e.target.value)} placeholder="e.g. Mehndi + reception, timings, anything I should know" /></label>
          </div>
          <aside className="bk-recap">
            <h4>Your booking</h4>
            <div className="sumrow"><span>{pkg.name}</span><b>{priceLabel(pkg)}</b></div>
            <div className="sumrow sumrow--muted"><span>Coverage</span><span>{covName}</span></div>
            <div className="sumrow sumrow--muted"><span>Date</span><span>{dateLabel || "—"}</span></div>
            {!custom && <div className="sumrow sumrow--muted"><span>Deposit (25%)</span><span>{money(deposit)}</span></div>}
            <div className="bk-actions bk-actions--stack">
              <button className="btn btn--dark" disabled={!detailsValid} onClick={() => go(3)}>{custom ? "Review request →" : "Continue to payment →"}</button>
              <button className="btn btn--ghost" onClick={() => go(1)}>← Back</button>
            </div>
            {!detailsValid && <p className="muted tiny">Add both names and a valid email to continue.</p>}
          </aside>
        </section>
      )}

      {/* STEP 4 — payment OR quote request */}
      {step === 3 && (
        <section className="bk-step">
          {custom
            ? <RequestQuote pkg={pkg} covName={covName} dateLabel={dateLabel} form={form} onSubmit={async () => {
                try {
                  await addEnquiry({ name: form.a || "Quote request", email: form.email, type: "quote",
                    message: `Quote request — ${pkg.name} (${covName})\nDate: ${dateLabel || "TBC"}\nPhone: ${form.phone || "—"}\nVenue: ${form.venue || "—"}\nGuests: ${form.guests || "—"}\nFunctions: ${form.functions || "—"}` });
                } catch (e) {}
                go(4);
              }} />
            : <Payment pkg={pkg} covName={covName} fullPrice={price}
                       discount={discount} discAmount={discAmount} discInput={discInput} setDiscInput={setDiscInput}
                       onApplyDiscount={applyDiscount} onClearDiscount={clearDiscount} discErr={discErr}
                       dateLabel={dateLabel} deposit={deposit} balance={balance} balanceDue={balanceDue}
                       payMode={payMode} setPayMode={setPayMode} payToday={payToday}
                       onPay={async () => {
                         const j = await api("/api/checkout", { method: "POST", body: { coverage, pkgId, dateKey, dateLabel, form, payMode, discountCode: discount ? discount.code : "" } });
                         window.location.href = j.url;
                       }} />}
          <div className="bk-actions"><button className="btn btn--ghost" onClick={() => go(2)}>← Back to details</button></div>
        </section>
      )}

      {/* STEP 5 — confirmation */}
      {step === 4 && (
        <section className="bk-step bk-done">
          <div className="bk-done__seal">✓</div>
          {custom ? (
            <>
              <h2>Your quote request is in.</h2>
              <p className="bk-done__lead">
                Thanks {form.a || "there"} — I'll send {form.b ? `you & ${form.b}` : "you"} a tailored quote within 48 hours
                to {form.email || "your email"}{dateLabel ? `, for ${dateLabel}` : ""}.
              </p>
              <div className="invoice">
                <div className="invoice__top">
                  <div><div className="wordmark">YUSUF<span className="wordmark__dot">.</span></div><span className="muted tiny">Quote request QR-2026-0418</span></div>
                  <div className="invoice__status invoice__status--pending">Pending quote</div>
                </div>
                <div className="invoice__rows">
                  <div className="sumrow"><span>{pkg.name} — {covName}</span><b>Custom</b></div>
                  <div className="sumrow sumrow--muted"><span>{dateLabel || "Date TBC"}{form.venue ? " · " + form.venue : ""}</span><span /></div>
                  <div className="sumrow sumrow--muted"><span>{form.guests || "Details to follow"}</span><span /></div>
                </div>
                <p className="invoice__note">No payment taken. Once you approve the quote, a 25% deposit reserves your date and the balance follows two weeks before the wedding.</p>
              </div>
            </>
          ) : done.status === "pending" ? (
            <>
              <h2>Confirming your payment…</h2>
              <p className="bk-done__lead">
                Stripe is finalising your payment for {done.dateLabel} — this usually takes just a few seconds.
                This page will update on its own; no need to pay again or refresh.
              </p>
              <div className="invoice">
                <div className="invoice__top">
                  <div><div className="wordmark">YUSUF<span className="wordmark__dot">.</span></div><span className="muted tiny">Invoice {done.id ? "INV-" + done.id.slice(-6).toUpperCase() : ""}</span></div>
                  <div className="invoice__status invoice__status--pending">Processing</div>
                </div>
                <div className="invoice__rows">
                  <div className="sumrow"><span>{done.packageName} — {done.covName}</span><b>{money(done.price)}</b></div>
                  <div className="sumrow sumrow--muted"><span>{done.dateLabel}{done.venue ? " · " + done.venue : ""}</span><span /></div>
                </div>
                <p className="invoice__note">If this doesn't update within a minute, don't worry — your card has either been charged (in which case your date is held) or not charged at all. Get in touch and I'll check the booking for you.</p>
              </div>
            </>
          ) : (
            <>
              <h2>Your date is reserved.</h2>
              <p className="bk-done__lead">
                {done.coupleA || "You"} &amp; {done.coupleB || "your partner"}, {done.dateLabel} is locked in.
                A confirmation and your Stripe {done.payMode === "full" ? "receipt" : "invoice"} are on the way to {done.email || "your email"}.
              </p>
              <div className="invoice">
                <div className="invoice__top">
                  <div><div className="wordmark">YUSUF<span className="wordmark__dot">.</span></div><span className="muted tiny">Invoice {done.id ? "INV-" + done.id.slice(-6).toUpperCase() : ""}</span></div>
                  <div className="invoice__status">{done.payMode === "full" ? "Paid in full" : "Deposit paid"}</div>
                </div>
                <div className="invoice__rows">
                  <div className="sumrow"><span>{done.packageName} — {done.covName}</span><b>{money(done.price)}</b></div>
                  {done.discountAmount > 0 && <div className="sumrow sumrow--disc"><span>Discount · {done.discountCode}</span><b>−{money(done.discountAmount)}</b></div>}
                  <div className="sumrow sumrow--muted"><span>{done.dateLabel}{done.venue ? " · " + done.venue : ""}</span><span /></div>
                  <hr />
                  <div className="sumrow"><span>{done.payMode === "full" ? "Paid today" : "Deposit paid today"}</span><b>{money(done.deposit)}</b></div>
                  {done.payMode !== "full" && <div className="sumrow sumrow--lg"><span>Balance — due {done.balanceDue}</span><b>{money(done.balance)}</b></div>}
                </div>
                <p className="invoice__note">{done.payMode === "full"
                  ? "Paid in full — nothing left to pay. 25% of the total is a non-refundable deposit."
                  : `The ${money(done.balance)} balance will be invoiced automatically and is due two weeks before the wedding. The deposit is non-refundable.`}</p>
              </div>
            </>
          )}
          <div className="bk-actions bk-actions--center">
            <button className="btn btn--dark" onClick={() => navigate("films")}>Watch the films</button>
            <button className="btn btn--ghost" onClick={() => { setStep(0); setDateKey(null); }}>Start again</button>
          </div>
        </section>
      )}
    </div>
  );
}

Object.assign(window, { Booking });

// ==================== gallery.jsx ====================
// gallery.jsx — password-protected client gallery: view, favourite, comment, download.
// Passwords are matched against galleries created in the Studio admin (+ the sample).
const { useState: useStateG, useEffect: useEffectG, useRef: useRefG } = React;

const favKey = (id) => "yusuf_fav_" + id;
const comKey = (id) => "yusuf_com_" + id;
const loadLS = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

function Locked({ target, onUnlock, onBack, navigate }) {
  const [pw, setPw] = useStateG("");
  const [err, setErr] = useStateG("");
  const submit = async (e) => {
    e.preventDefault();
    if (!pw.trim()) { setErr("Enter your gallery password."); return; }
    try {
      const j = await api("/api/galleries/unlock", { method: "POST", body: { id: target.id, password: pw } });
      onUnlock({ ...j.gallery, password: pw.trim() });
    } catch (ex) { setErr(ex.status === 429 ? (ex.message || "Too many attempts — try again later.") : "That password doesn't match this gallery. Try again."); }
  };
  return (
    <div className="lock">
      <button className="lock__home" onClick={() => navigate("home")}>YUSUF<span className="wordmark__dot">.</span></button>
      <Img src={galImg(target.cover, 2000)} label="Gallery cover"
           className="lock__bg" style={{ position: "absolute", inset: 0 }} />
      <div className="lock__scrim" />
      <form className="lock__card" onSubmit={submit}>
        <p className="eyebrow">Private gallery</p>
        <h1 className="lock__title">{target.couple}</h1>
        <p className="lock__meta">{target.date}{target.venue ? " · " + target.venue : ""}</p>
        <label className="fld fld--lock">
          <span>Enter your gallery password</span>
          <input autoFocus value={pw} className={err ? "is-err" : ""}
                 onChange={(e) => { setPw(e.target.value); setErr(""); }}
                 placeholder="Password from your link" />
        </label>
        {err && <p className="lock__err">{err}</p>}
        <button className="btn btn--dark btn--full">Open gallery</button>
        <button type="button" className="lock__back" onClick={onBack}>← All galleries</button>
        {target.sample && <p className="lock__hint">Sample gallery · password <code>{SEED_GALLERY.password}</code></p>}
      </form>
    </div>
  );
}

function GalleryIndex({ onPick, navigate }) {
  const galleries = loadGalleries();
  return (
    <div className="page gx">
      <header className="gx__head">
        <button className="gx__home" onClick={() => navigate("home")}>← Back to main site</button>
        <p className="eyebrow">Client galleries</p>
        <h1 className="page__title">Find your gallery</h1>
        <p className="page__intro">Find your names below and enter the password from your private link to view and download your photographs.</p>
      </header>
      <div className="gx__grid">
        {galleries.length === 0 && <p className="cg__empty">No galleries are live yet — yours will appear here when it's ready.</p>}
        {galleries.map((g) => (
          <button key={g.id} className="gx-card" onClick={() => onPick(g)}>
            <div className="gx-card__cover">
              <Img src={galImg(g.cover, 900)} label="Gallery" ratio="4/5" className="gx-card__img" />
              <div className="gx-card__scrim" />
              <div className="gx-card__lock">🔒</div>
            </div>
            <div className="gx-card__meta">
              <h3>{g.couple}</h3>
              <span>{g.date}</span>
              <em>Enter password →</em>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function CommentForm({ photoIndex, onAdd }) {
  const [name, setName] = useStateG("");
  const [text, setText] = useStateG("");
  const submit = (e) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    onAdd({ name: name.trim(), text: text.trim(), photo: photoIndex, when: "just now" });
    setText("");
  };
  return (
    <form className="cf" onSubmit={submit}>
      <input className="cf__name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="cf__row">
        <input className="cf__text" placeholder="Leave a note for the couple…" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn btn--dark cf__send" disabled={!name.trim() || !text.trim()}>Post</button>
      </div>
    </form>
  );
}

function GalleryLightbox({ gallery, index, onClose, onNav, favs, toggleFav, comments, addComment }) {
  useEffectG(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNav(1);
      if (e.key === "ArrowLeft") onNav(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index]);
  if (index == null) return null;
  const photo = gallery.photos[index];
  const photoComments = comments.filter((c) => c.photo === index);
  const isFav = favs.includes(index);
  return (
    <div className="glb">
      <button className="lb__close" onClick={onClose} aria-label="Close">×</button>
      <button className="lb__nav lb__prev" onClick={() => onNav(-1)} aria-label="Previous">‹</button>
      <div className="glb__stage">
        <Img src={galImg(photo, 1800)} label="Photograph" eager
             style={{ maxHeight: "78vh", width: "auto", maxWidth: "100%" }} />
      </div>
      <aside className="glb__side">
        <div className="glb__sidehead">
          <span className="muted tiny">Photo {index + 1} of {gallery.photos.length}</span>
          <div className="glb__acts">
            <button className={"iconbtn" + (isFav ? " is-fav" : "")} onClick={() => toggleFav(index)}>
              {isFav ? "♥" : "♡"} {isFav ? "Favourited" : "Favourite"}
            </button>
            <a className="iconbtn" href={galImg(photo, 2400)} target="_blank" rel="noreferrer" download>↓ Download</a>
          </div>
        </div>
        <div className="glb__comments">
          <h4>Notes for the couple</h4>
          {photoComments.length === 0 && <p className="muted tiny">Be the first to leave a note on this photo.</p>}
          {photoComments.map((c, i) => (
            <div key={i} className="cmt">
              <div className="cmt__head"><b>{c.name}</b><span>{c.when}</span></div>
              <p>{c.text}</p>
            </div>
          ))}
          <CommentForm photoIndex={index} onAdd={addComment} />
        </div>
      </aside>
      <button className="lb__nav lb__next" onClick={() => onNav(1)} aria-label="Next">›</button>
    </div>
  );
}

function Unlocked({ gallery, onExit, navigate }) {
  const isSample = gallery.sample;
  const [favs, setFavs] = useStateG(() => loadLS(favKey(gallery.id), []));
  const [comments, setComments] = useStateG(() => gallery.comments || []);
  const [favOnly, setFavOnly] = useStateG(false);
  const [lb, setLb] = useStateG(null);
  const [toast, setToast] = useStateG("");

  useEffectG(() => saveLS(favKey(gallery.id), favs), [favs]);

  const toggleFav = (i) => setFavs((f) => f.includes(i) ? f.filter((x) => x !== i) : [...f, i]);
  const addComment = async (c) => {
    try {
      const j = await api("/api/galleries/" + gallery.id + "/comments", { method: "POST", body: { password: gallery.password, name: c.name, text: c.text, photo: c.photo } });
      setComments(j.comments);
      flash("Note posted — the couple will see it.");
    } catch (e) { flash("Couldn't post just now — try again."); }
  };
  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2600); };

  const indices = gallery.photos.map((_, i) => i).filter((i) => !favOnly || favs.includes(i));
  const nav = (d) => setLb((i) => {
    const pos = indices.indexOf(i);
    return indices[(pos + d + indices.length) % indices.length];
  });

  return (
    <div className="page cg">
      <header className="cg__head">
        <div>
          <button className="cg__exit" onClick={onExit}>← all galleries</button>
          <button className="cg__exit cg__exit--site" onClick={() => navigate("home")}>↗ main site</button>
          <p className="eyebrow">Your wedding gallery</p>
          <h1 className="page__title">{gallery.couple}</h1>
          <p className="cg__meta">{gallery.date}{gallery.venue ? " · " + gallery.venue : ""} · {gallery.photos.length} photographs</p>
        </div>
        <div className="cg__tools">
          <button className={"chip" + (favOnly ? " is-on" : "")} onClick={() => setFavOnly((v) => !v)}>
            ♥ Favourites {favs.length ? `(${favs.length})` : ""}
          </button>
          <button className="btn btn--dark" onClick={() => flash("Preparing your high-res download… check your email link.")}>↓ Download all</button>
        </div>
      </header>

      {favOnly && favs.length === 0 && (
        <p className="cg__empty">No favourites yet — tap the heart on the photos you love.</p>
      )}
      {gallery.photos.length === 0 && (
        <p className="cg__empty">No photos in this gallery yet — they'll appear here once uploaded.</p>
      )}

      <div className="cg__grid">
        {indices.map((i) => {
          const photo = gallery.photos[i];
          const isFav = favs.includes(i);
          const cCount = comments.filter((c) => c.photo === i).length;
          return (
            <div key={i} className="cg__cell">
              <button className="photo-btn" onClick={() => setLb(i)}>
                <Img src={galImg(photo, 900)} label="Photograph" ratio="3/4" />
              </button>
              <button className={"cg__heart" + (isFav ? " is-on" : "")} onClick={() => toggleFav(i)} aria-label="Favourite">
                {isFav ? "♥" : "♡"}
              </button>
              <div className="cg__cellbar">
                <a className="cg__dl" href={galImg(photo, 2400)} target="_blank" rel="noreferrer" download aria-label="Download">↓</a>
                {cCount > 0 && <span className="cg__cc" onClick={() => setLb(i)}>💬 {cCount}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {toast && <div className="toast">{toast}</div>}

      <GalleryLightbox gallery={gallery} index={lb} onClose={() => setLb(null)} onNav={nav}
        favs={favs} toggleFav={toggleFav} comments={comments} addComment={addComment} />
    </div>
  );
}

function Gallery({ navigate }) {
  const [unlocked, setUnlocked] = useStateG(null);
  const [target, setTarget] = useStateG(null);
  if (unlocked) return <Unlocked gallery={unlocked} onExit={() => { setUnlocked(null); setTarget(null); }} navigate={navigate} />;
  if (target) return <Locked target={target} onUnlock={setUnlocked} onBack={() => setTarget(null)} navigate={navigate} />;
  return <GalleryIndex onPick={setTarget} navigate={navigate} />;
}

Object.assign(window, { Gallery });

// ==================== admin.jsx ====================
// admin.jsx — hidden Studio area: create client galleries & upload images.
// Reached via an invisible hotspot in the footer. Server-backed; requires login.
const { useState: useStateA, useRef: useRefA, useEffect: useEffectA } = React;

function AdminLogin({ navigate, onDone }) {
  const [pw, setPw] = useStateA("");
  const [err, setErr] = useStateA("");
  const [busy, setBusy] = useStateA(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!pw) return;
    setBusy(true); setErr("");
    try { await adminLogin(pw); onDone(); }
    catch (ex) { setErr(ex.status === 403 ? "Wrong password — try again." : (ex.message || "Login failed.")); setBusy(false); }
  };
  return (
    <div className="admin admin--login">
      <header className="admin__bar">
        <div className="admin__brand"><span className="wordmark">YUSUF<span className="wordmark__dot">.</span></span><span className="admin__tag">Studio</span></div>
        <div className="admin__baracts"><button className="btn btn--ghost-light btn--sm" onClick={() => navigate("home")}>Exit to site</button></div>
      </header>
      <div className="admin__loginwrap">
        <form className="admin__login" onSubmit={submit}>
          <p className="eyebrow">Owner access</p>
          <h2>Studio login</h2>
          <label className="fld"><span>Password</span>
            <input type="password" autoFocus value={pw} onChange={(e) => { setPw(e.target.value); setErr(""); }} placeholder="Your admin password" /></label>
          {err && <p className="promo-err">{err}</p>}
          <button className={"btn btn--dark btn--full" + (busy ? " is-busy" : "")} disabled={busy || !pw}>{busy ? <span className="spin" /> : "Enter Studio"}</button>
        </form>
      </div>
    </div>
  );
}

const blankForm = () => ({ id: null, couple: "", date: "", venue: "", password: "", cover: null, photos: [] });

const BK_MONEY = (n) => "£" + (n || 0).toLocaleString("en-GB");
const fmtFileSize = (b) => b > 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB";
const fileIcon = (t) => (t || "").includes("pdf") ? "📄" : (t || "").startsWith("image") ? "🖼️" : "📎";

// Studio: edit a booking — contact details, notes, file attachments.
function BookingEditor({ rec, onSaved, onCancel }) {
  const [d, setD] = useStateA(() => ({ ...rec, assets: rec.assets ? [...rec.assets] : [] }));
  const [busy, setBusy] = useStateA(false);
  const [err, setErr] = useStateA("");
  const fileRef = useRefA(null);
  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));
  const onFiles = async (files) => {
    if (!files || !files.length) return;
    setBusy(true); setErr("");
    const added = [];
    for (const f of Array.from(files)) {
      if (f.size > 4 * 1024 * 1024) { setErr("“" + f.name + "” is over 4MB — too large for this prototype's local storage."); continue; }
      try { added.push(await readFileDataURL(f)); } catch (e) {}
    }
    setD((p) => ({ ...p, assets: [...p.assets, ...added] }));
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };
  const removeAsset = (i) => setD((p) => ({ ...p, assets: p.assets.filter((_, idx) => idx !== i) }));
  const save = async () => {
    const ok = await updateBooking(rec.id, {
      coupleA: d.coupleA, coupleB: d.coupleB, email: d.email, phone: d.phone,
      venue: d.venue, guests: d.guests, functions: d.functions, notes: d.notes, assets: d.assets,
    });
    if (!ok) { setErr("Couldn't save — check the connection and try again."); return; }
    onSaved();
  };
  return (
    <div className="bkrec bkrec--edit">
      <div className="bkrec__head"><h3>Edit · {d.coupleA || "booking"}</h3></div>
      <div className="bkedit__grid">
        <label className="fld"><span>Client</span><input value={d.coupleA || ""} onChange={(e) => set("coupleA", e.target.value)} /></label>
        <label className="fld"><span>Partner</span><input value={d.coupleB || ""} onChange={(e) => set("coupleB", e.target.value)} /></label>
        <label className="fld"><span>Email</span><input value={d.email || ""} onChange={(e) => set("email", e.target.value)} /></label>
        <label className="fld"><span>Phone</span><input value={d.phone || ""} onChange={(e) => set("phone", e.target.value)} /></label>
        <label className="fld"><span>Guests</span><input value={d.guests || ""} onChange={(e) => set("guests", e.target.value)} /></label>
        <label className="fld"><span>Venue</span><input value={d.venue || ""} onChange={(e) => set("venue", e.target.value)} /></label>
      </div>
      <label className="fld"><span>Functions &amp; details</span><input value={d.functions || ""} onChange={(e) => set("functions", e.target.value)} /></label>
      <label className="fld"><span>Notes <em className="opt">music, timeline, dietary, special requests…</em></span>
        <textarea className="bkedit__notes" value={d.notes || ""} onChange={(e) => set("notes", e.target.value)} placeholder="Write anything you need to remember for this wedding…" /></label>
      <div className="bkedit__assets">
        <div className="bkedit__assetshead">
          <span>Attachments <em className="opt">contract, invoice, mood board…</em></span>
          <button className="btn btn--dark btn--sm" disabled={busy} onClick={() => fileRef.current?.click()}>{busy ? <span className="spin" /> : "+ Upload file"}</button>
          <input ref={fileRef} type="file" multiple hidden onChange={(e) => onFiles(e.target.files)} />
        </div>
        {d.assets.length === 0 ? <p className="muted tiny">No files attached yet.</p> : (
          <div className="bkedit__files">
            {d.assets.map((a, i) => (
              <div key={i} className="bkfile">
                <span className="bkfile__ic">{fileIcon(a.type)}</span>
                <a className="bkfile__name" href={a.dataURL} download={a.name} title={a.name}>{a.name}</a>
                <span className="bkfile__size">{fmtFileSize(a.size)}</span>
                <button className="bkfile__x" onClick={() => removeAsset(i)} aria-label="Remove">×</button>
              </div>
            ))}
          </div>
        )}
      </div>
      {err && <p className="promo-err">{err}</p>}
      <div className="bk-actions"><button className="btn btn--dark" onClick={save}>Save booking</button><button className="btn btn--ghost" onClick={onCancel}>Cancel</button></div>
    </div>
  );
}

// Studio: enquiries from the contact form.
function EnquiriesManager() {
  const [list, setList] = useStateA(() => loadEnquiries());
  const del = async (id) => {
    if (!window.confirm("Delete this enquiry?")) return;
    try { await deleteEnquiry(id); setList(loadEnquiries()); }
    catch (e) { alert("Delete failed: " + e.message); }
  };
  const fmtWhen = (t) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) + " · " + new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="admin__wrap">
      <div className="admin__head">
        <h1>Enquiries</h1>
        <p className="muted">Messages sent through the contact form on your homepage. Reply opens an email to the client.</p>
      </div>
      {list.length === 0 && <p className="muted">No enquiries yet — messages from the “Get in touch” form will appear here.</p>}
      <div className="bk-list">
        {list.map((q) => (
          <div key={q.id} className="bkrec">
            <div className="bkrec__head">
              <div>
                <h3>{q.name}</h3>
                <p className="muted tiny">{q.email} · {fmtWhen(q.createdAt)}</p>
              </div>
            </div>
            <p className="enq__msg">{q.message}</p>
            <div className="bkrec__acts">
              <a className="btn btn--dark btn--sm" href={`mailto:${q.email}?subject=${encodeURIComponent("Re: your wedding enquiry")}`}>Reply by email</a>
              <button className="iconbtn iconbtn--sm bkrec__refund" onClick={() => del(q.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Studio: manually add a booking (phone/Instagram enquiries) — blocks the date too.
function ManualBooking({ onAdded, onCancel }) {
  const [d, setD] = useStateA({ coupleA: "", coupleB: "", email: "", phone: "", guests: "", venue: "", covName: "Photography & Cinematography", packageName: "", total: "", deposit: "", balanceDue: "", functions: "", notes: "" });
  const [dateKey, setDateKey] = useStateA(null);
  const [dateLabel, setDateLabel] = useStateA("");
  const [err, setErr] = useStateA("");
  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));
  const num = (v) => Number(String(v).replace(/[^0-9.]/g, "")) || 0;
  const save = async () => {
    if (!d.coupleA.trim()) { setErr("Add at least the client's name."); return; }
    if (!dateKey) { setErr("Pick a date on the calendar."); return; }
    const total = num(d.total);
    const deposit = d.deposit !== "" ? num(d.deposit) : Math.round(total * 0.25);
    try {
      await addBooking({
        id: makeId(), createdAt: Date.now(), status: "confirmed", manual: true,
        coupleA: d.coupleA, coupleB: d.coupleB, email: d.email, phone: d.phone, venue: d.venue, guests: d.guests,
        coverage: "", covName: d.covName, packageName: d.packageName || "Custom",
        dateKey, dateLabel,
        price: total, discountCode: "", discountAmount: 0, total,
        deposit, balance: Math.max(0, total - deposit), balanceDue: d.balanceDue || "2 weeks before",
        functions: d.functions, notes: d.notes, assets: [],
      });
      onAdded();
    } catch (e) { setErr("Couldn't save: " + e.message); }
  };
  return (
    <div className="bkrec bkrec--edit">
      <div className="bkrec__head"><h3>Add a booking</h3><span className="bkrec__status bkrec__status--confirmed">Blocks the date</span></div>
      <div className="bkman">
        <div className="bkman__cal">
          <AdminCalendar blocked={[]} onToggle={(k) => {
            const [y, m, dd] = k.split("-").map(Number);
            setDateKey(k); setDateLabel(`${dd} ${ADMIN_MONTHS[m]} ${y}`);
          }} selected={dateKey} pickMode />
          <p className="bkman__chosen">{dateKey ? <>Selected <b>{dateLabel}</b></> : <span className="muted">Click a date above</span>}</p>
        </div>
        <div className="bkman__form">
          <div className="bkedit__grid">
            <label className="fld"><span>Client</span><input value={d.coupleA} onChange={(e) => set("coupleA", e.target.value)} placeholder="First & last" /></label>
            <label className="fld"><span>Partner</span><input value={d.coupleB} onChange={(e) => set("coupleB", e.target.value)} placeholder="First & last" /></label>
            <label className="fld"><span>Phone</span><input value={d.phone} onChange={(e) => set("phone", e.target.value)} placeholder="07…" /></label>
            <label className="fld"><span>Email</span><input value={d.email} onChange={(e) => set("email", e.target.value)} placeholder="you@email.com" /></label>
            <label className="fld"><span>Guests</span><input value={d.guests} onChange={(e) => set("guests", e.target.value)} placeholder="e.g. 250" /></label>
            <label className="fld"><span>Venue</span><input value={d.venue} onChange={(e) => set("venue", e.target.value)} placeholder="Location" /></label>
            <label className="fld"><span>Coverage</span>
              <select value={d.covName} onChange={(e) => set("covName", e.target.value)}>
                {COVERAGE.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select></label>
            <label className="fld"><span>Package</span><input value={d.packageName} onChange={(e) => set("packageName", e.target.value)} placeholder="e.g. Signature" /></label>
            <label className="fld"><span>Total £</span><input inputMode="numeric" value={d.total} onChange={(e) => set("total", e.target.value)} placeholder="e.g. 1400" /></label>
            <label className="fld"><span>Deposit £ <em className="opt">blank = 25%</em></span><input inputMode="numeric" value={d.deposit} onChange={(e) => set("deposit", e.target.value)} placeholder="auto" /></label>
            <label className="fld"><span>Balance due</span><input value={d.balanceDue} onChange={(e) => set("balanceDue", e.target.value)} placeholder="e.g. 2 weeks before" /></label>
            <label className="fld"><span>Functions</span><input value={d.functions} onChange={(e) => set("functions", e.target.value)} placeholder="e.g. Mehndi + reception" /></label>
          </div>
          <label className="fld"><span>Notes</span><textarea className="bkedit__notes" value={d.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Anything to remember…" /></label>
        </div>
      </div>
      {err && <p className="promo-err">{err}</p>}
      <div className="bk-actions"><button className="btn btn--dark" onClick={save}>Add booking &amp; block date</button><button className="btn btn--ghost" onClick={onCancel}>Cancel</button></div>
    </div>
  );
}

// Studio: view upcoming bookings + issue refunds.
function BookingsManager() {
  const [bookings, setBookings] = useStateA(() => loadBookings());
  const [editingId, setEditingId] = useStateA(null);
  const [adding, setAdding] = useStateA(false);
  const [toast, setToast] = useStateA("");
  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2800); };
  const dateOf = (k) => { if (!k) return new Date(8640000000000000); const [y, m, d] = k.split("-").map(Number); return new Date(y, m, d); };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const refund = async (rec) => {
    if (!window.confirm(`Refund the ${BK_MONEY(rec.deposit)} deposit and cancel ${rec.coupleA || "this booking"}? The date will reopen for others. (Deposits are normally non-refundable — this is a manual override.)`)) return;
    try {
      await refundBooking(rec.id);
      setBookings(loadBookings());
      flash(rec.paymentIntent ? "Stripe refund issued · date reopened." : "Booking cancelled · date reopened.");
    } catch (e) { flash("Refund failed: " + e.message); }
  };
  const sorted = [...bookings].sort((a, b) => dateOf(a.dateKey) - dateOf(b.dateKey));
  const upcoming = sorted.filter((r) => r.status === "confirmed" && dateOf(r.dateKey) >= today);
  const past = sorted.filter((r) => !(r.status === "confirmed" && dateOf(r.dateKey) >= today));

  const card = (rec) => {
    if (editingId === rec.id) return (
      <BookingEditor key={rec.id} rec={rec}
        onSaved={() => { setEditingId(null); setBookings(loadBookings()); flash("Booking updated."); }}
        onCancel={() => setEditingId(null)} />
    );
    return (
      <div key={rec.id} className="bkrec">
        <div className="bkrec__head">
          <div>
            <h3>{rec.coupleA || "—"}{rec.coupleB ? " & " + rec.coupleB : ""}</h3>
            <p className="muted tiny">{rec.dateLabel || "Date TBC"} · {rec.covName} · {rec.packageName}</p>
          </div>
          <span className={"bkrec__status bkrec__status--" + rec.status}>{rec.status === "refunded" ? "Refunded" : "Confirmed"}</span>
        </div>
        <div className="bkrec__grid">
          <div><span>Phone</span><b>{rec.phone || "—"}</b></div>
          <div><span>Email</span><b>{rec.email || "—"}</b></div>
          <div><span>Guests</span><b>{rec.guests || "—"}</b></div>
          <div><span>Venue</span><b>{rec.venue || "—"}</b></div>
          <div><span>Package total</span><b>{BK_MONEY(rec.total)}</b></div>
          <div><span>Deposit paid</span><b>{BK_MONEY(rec.deposit)}</b></div>
          <div><span>Balance · due {rec.balanceDue}</span><b>{BK_MONEY(rec.balance)}</b></div>
          {rec.discountCode ? <div><span>Discount</span><b>{rec.discountCode} (−{BK_MONEY(rec.discountAmount)})</b></div> : null}
          {rec.functions ? <div className="bkrec__wide"><span>Functions &amp; details</span><b>{rec.functions}</b></div> : null}
        </div>
        {rec.notes ? <div className="bkrec__notes"><span>Notes</span><p>{rec.notes}</p></div> : null}
        {rec.assets && rec.assets.length > 0 ? (
          <div className="bkrec__files">
            {rec.assets.map((a, i) => (
              <a key={i} className="bkfile bkfile--ro" href={a.dataURL} download={a.name} title={a.name}>
                <span className="bkfile__ic">{fileIcon(a.type)}</span><span className="bkfile__name">{a.name}</span>
              </a>
            ))}
          </div>
        ) : null}
        <div className="bkrec__acts">
          <button className="iconbtn iconbtn--sm" onClick={() => setEditingId(rec.id)}>Edit &amp; notes</button>
          {rec.status === "confirmed" ? <button className="iconbtn iconbtn--sm bkrec__refund" onClick={() => refund(rec)}>Issue refund</button> : null}
        </div>
      </div>
    );
  };

  return (
    <div className="admin__wrap">
      <div className="admin__head">
        <div className="admin__headrow">
          <h1>Bookings</h1>
          {!adding && <button className="btn btn--dark btn--sm" onClick={() => setAdding(true)}>+ Add booking</button>}
        </div>
        <p className="muted">Every confirmed deposit appears here. Add your own bookings (phone/Instagram enquiries) — they block the date too. Edit details, add notes and attach files like contracts or invoices. Issuing a refund cancels the booking and reopens the date.</p>
      </div>
      {adding && <div className="bk-list" style={{ marginBottom: 20 }}><ManualBooking
        onAdded={() => { setAdding(false); setBookings(loadBookings()); flash("Booking added · date blocked."); }}
        onCancel={() => setAdding(false)} /></div>}
      {bookings.length === 0 && !adding && <p className="muted">No bookings yet. They'll show up here as soon as a client pays a deposit — or add one yourself.</p>}
      {upcoming.length > 0 && <><p className="bk-subhead">Upcoming — {upcoming.length}</p><div className="bk-list">{upcoming.map(card)}</div></>}
      {past.length > 0 && <><p className="bk-subhead">Past &amp; refunded — {past.length}</p><div className="bk-list">{past.map(card)}</div></>}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

const ADMIN_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// Calendar for the Studio — click a date to block/unblock it.
function AdminCalendar({ blocked, onToggle, selected, pickMode }) {
  const minDate = earliestBookable();
  const start = new Date(); start.setDate(1);
  const [view, setView] = useStateA({ y: start.getFullYear(), m: start.getMonth() });
  const set = new Set(blocked);
  const first = new Date(view.y, view.m, 1);
  const startDay = (first.getDay() + 6) % 7;
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  const move = (dir) => setView((v) => {
    let m = v.m + dir, y = v.y;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    return { y, m };
  });
  return (
    <div className="cal cal--admin">
      <div className="cal__head">
        <button onClick={() => move(-1)} aria-label="Previous month">‹</button>
        <span>{ADMIN_MONTHS[view.m]} {view.y}</span>
        <button onClick={() => move(1)} aria-label="Next month">›</button>
      </div>
      <div className="cal__dow">{["Mo","Tu","We","Th","Fr","Sa","Su"].map((d) => <span key={d}>{d}</span>)}</div>
      <div className="cal__grid">
        {cells.map((d, i) => {
          if (!d) return <span key={i} className="cal__cell cal__cell--empty" />;
          const k = `${view.y}-${view.m}-${d}`;
          const date = new Date(view.y, view.m, d);
          const tooSoon = date < minDate;
          const isBlocked = set.has(k);
          const isSel = selected === k;
          const sat = date.getDay() === 6;
          return (
            <button key={i}
              className={"cal__cell" + (isSel ? " is-selected" : "") + (isBlocked ? " is-booked" : "") + (sat && !isBlocked && !tooSoon ? " is-pref" : "") + (tooSoon ? " is-soon" : "")}
              disabled={tooSoon}
              onClick={() => onToggle(k)}
              title={tooSoon ? "Auto-blocked (within notice period)" : pickMode ? "Pick this date" : isBlocked ? "Click to open this date" : "Click to block this date"}>
              {d}
            </button>
          );
        })}
      </div>
      <div className="cal__legend">
        <span><i className="dot dot--pref" /> Saturday</span>
        <span><i className="dot dot--booked" /> Blocked</span>
        <span className="cal__legnote">Greyed = auto-blocked (&lt; {MIN_LEAD_DAYS} days)</span>
      </div>
    </div>
  );
}

// ---- Website content editor (hero, photo grid, films) ----
function SiteEditor({ onChange }) {
  const [site, setSite] = useStateA(() => loadSite());
  const [busy, setBusy] = useStateA("");
  const [toast, setToast] = useStateA("");
  const heroRef = useRefA(null);
  const gridRef = useRefA(null);
  const posterRefs = useRefA({});
  const videoRefs = useRefA({});

  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2600); };
  const commit = (next) => {
    setSite(next);
    if (saveSite(next)) onChange && onChange(); else flash("Storage full — remove some images. (Production uses cloud storage.)");
  };

  const setHero = async (files) => {
    const f = files && files[0]; if (!f || !f.type.startsWith("image/")) return;
    setBusy("hero");
    try { commit({ ...site, hero: await fileToDataURL(f, 2000) }); } catch (e) {}
    setBusy(""); if (heroRef.current) heroRef.current.value = "";
  };
  const addPhotos = async (files) => {
    if (!files || !files.length) return;
    setBusy("grid");
    const added = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      try { added.push({ src: await fileToDataURL(f, 1600), ratio: "3/4", label: "Photograph" }); } catch (e) {}
    }
    commit({ ...site, photos: [...site.photos, ...added] });
    setBusy(""); if (gridRef.current) gridRef.current.value = "";
  };
  const removePhoto = (i) => commit({ ...site, photos: site.photos.filter((_, idx) => idx !== i) });
  const setPhotoLabel = (i, v) => commit({ ...site, photos: site.photos.map((p, idx) => idx === i ? { ...p, label: v } : p) });

  const setFilm = (i, k, v) => commit({ ...site, films: site.films.map((f, idx) => idx === i ? { ...f, [k]: v } : f) });
  const setFilmPoster = async (i, files) => {
    const f = files && files[0]; if (!f || !f.type.startsWith("image/")) return;
    setBusy("film" + i);
    try { setFilm(i, "poster", await fileToDataURL(f, 1600)); } catch (e) {}
    setBusy("");
  };
  const setFilmVideo = async (i, files) => {
    const f = files && files[0]; if (!f || !f.type.startsWith("video/")) return;
    if (f.size > 8 * 1024 * 1024) { flash("That video is over 8MB — too large for the browser prototype. Use a YouTube/Vimeo link, or a short clip."); return; }
    setBusy("filmv" + i);
    try {
      const dataURL = await readFileDataURL(f).then((r) => r.dataURL);
      commit({ ...site, films: site.films.map((fl, idx) => idx === i ? { ...fl, videoSrc: dataURL, videoName: f.name } : fl) });
    } catch (e) { flash("Couldn't read that video."); }
    setBusy("");
  };
  const addFilm = () => commit({ ...site, films: [...site.films, { id: "1537633552985-df8429e8048b", title: "New film", events: "", len: "", place: "", poster: "1537633552985-df8429e8048b", videoSrc: "" }] });
  const removeFilm = (i) => commit({ ...site, films: site.films.filter((_, idx) => idx !== i) });

  const blocked = site.blocked || [];
  const toggleBlocked = (k) => {
    const set = new Set(blocked);
    if (set.has(k)) set.delete(k); else set.add(k);
    commit({ ...site, blocked: [...set] });
  };

  const discounts = site.discounts || [];
  const addDiscount = () => commit({ ...site, discounts: [...discounts, { code: "", type: "percent", value: 10, maxUses: 10, used: 0 }] });
  const editDiscount = (i, k, v) => commit({ ...site, discounts: discounts.map((d, idx) => idx === i ? { ...d, [k]: v } : d) });
  const removeDiscount = (i) => commit({ ...site, discounts: discounts.filter((_, idx) => idx !== i) });

  const resetAll = () => { if (window.confirm("Reset the homepage hero, photo grid and films to the original demo content?")) commit(defaultSite()); };

  return (
    <div className="admin__wrap">
      <div className="admin__head">
        <h1>Website content</h1>
        <p className="muted">Update the photographs and films shown on your public site. Changes go live instantly.</p>
      </div>

      <section className="site-sec">
        <div className="site-sechead">
          <div><h2>Availability</h2><p className="muted tiny">Click any date to block it (already booked / unavailable). Bookings within {MIN_LEAD_DAYS} days of today are blocked automatically.</p></div>
          <span className="site-blockcount">{blocked.length} date{blocked.length === 1 ? "" : "s"} blocked</span>
        </div>
        <AdminCalendar blocked={blocked} onToggle={toggleBlocked} />
      </section>

      <section className="site-sec">
        <div className="site-sechead">
          <div><h2>Discount codes</h2><p className="muted tiny">Codes clients enter at checkout. Set a usage limit — 0 means unlimited.</p></div>
          <button className="btn btn--dark btn--sm" onClick={addDiscount}>+ Add code</button>
        </div>
        {discounts.length === 0 && <p className="muted">No discount codes yet.</p>}
        <div className="disc-list">
          {discounts.map((d, i) => (
            <div key={i} className="disc-row">
              <label className="fld"><span>Code</span>
                <input value={d.code} onChange={(e) => editDiscount(i, "code", e.target.value.toUpperCase())} placeholder="EARLYBIRD" /></label>
              <label className="fld"><span>Type</span>
                <select value={d.type} onChange={(e) => editDiscount(i, "type", e.target.value)}>
                  <option value="percent">% off</option>
                  <option value="fixed">£ off</option>
                </select></label>
              <label className="fld"><span>{d.type === "percent" ? "Percent %" : "Amount £"}</span>
                <input type="number" min="0" value={d.value} onChange={(e) => editDiscount(i, "value", Number(e.target.value) || 0)} /></label>
              <label className="fld"><span>Max uses</span>
                <input type="number" min="0" value={d.maxUses} onChange={(e) => editDiscount(i, "maxUses", Number(e.target.value) || 0)} /></label>
              <div className="disc-uses"><span>Used</span><b>{d.used || 0}{d.maxUses ? " / " + d.maxUses : ""}</b></div>
              <button className="iconbtn iconbtn--sm disc-del" onClick={() => removeDiscount(i)} aria-label="Remove">Remove</button>
            </div>
          ))}
        </div>
      </section>

      <section className="site-sec">
        <h2>Hero image</h2>
        <p className="muted tiny">The main image at the top of the homepage.</p>
        <div className="site-hero">
          <img src={galImg(site.hero, 700)} alt="" />
          <button className="btn btn--dark btn--sm" disabled={busy === "hero"} onClick={() => heroRef.current?.click()}>
            {busy === "hero" ? <span className="spin" /> : "Replace hero image"}
          </button>
          <input ref={heroRef} type="file" accept="image/*" hidden onChange={(e) => setHero(e.target.files)} />
        </div>
      </section>

      <section className="site-sec">
        <div className="site-sechead">
          <div><h2>Photo grid</h2><p className="muted tiny">Shown on the homepage &amp; portfolio. {site.photos.length} photos.</p></div>
          <button className="btn btn--dark btn--sm" disabled={busy === "grid"} onClick={() => gridRef.current?.click()}>
            {busy === "grid" ? <span className="spin" /> : "+ Add photos"}
          </button>
          <input ref={gridRef} type="file" accept="image/*" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
        </div>
        <div className="admin__thumbs admin__thumbs--cap">
          {site.photos.map((p, i) => (
            <div key={i} className="athumb athumb--cap">
              <img src={galImg(p.src, 300)} alt="" />
              <button className="athumb__x" onClick={() => removePhoto(i)} aria-label="Remove">×</button>
              <input className="athumb__cap" value={p.label || ""} placeholder="Hover caption…"
                     onChange={(e) => setPhotoLabel(i, e.target.value)} />
            </div>
          ))}
        </div>
      </section>

      <section className="site-sec">
        <div className="site-sechead">
          <div><h2>Films</h2><p className="muted tiny">Upload a video file or paste a YouTube/Vimeo link to make a card play your real film.</p></div>
          <button className="btn btn--dark btn--sm" onClick={addFilm}>+ Add film</button>
        </div>
        <div className="site-films">
          {site.films.map((f, i) => (
            <div key={i} className="site-film">
              <div className="site-film__poster">
                <img src={galImg(f.poster || f.id, 400)} alt="" />
                <button className="btn btn--light btn--sm" disabled={busy === "film" + i} onClick={() => posterRefs.current[i]?.click()}>
                  {busy === "film" + i ? "…" : "Poster"}
                </button>
                <input ref={(el) => (posterRefs.current[i] = el)} type="file" accept="image/*" hidden onChange={(e) => setFilmPoster(i, e.target.files)} />
                <button className="btn btn--dark btn--sm" disabled={busy === "filmv" + i} onClick={() => videoRefs.current[i]?.click()}>
                  {busy === "filmv" + i ? <span className="spin" /> : "Upload video"}
                </button>
                <input ref={(el) => (videoRefs.current[i] = el)} type="file" accept="video/*" hidden onChange={(e) => setFilmVideo(i, e.target.files)} />
                {f.videoSrc ? (
                  <span className={"site-film__vtag" + (String(f.videoSrc).startsWith("data:") ? " is-file" : "")}>
                    {String(f.videoSrc).startsWith("data:") ? "▶ " + (f.videoName || "uploaded video") : "🔗 linked video"}
                    <button onClick={() => setFilm(i, "videoSrc", "")} aria-label="Clear video">×</button>
                  </span>
                ) : null}
              </div>
              <div className="site-film__fields">
                <label className="fld"><span>Title</span>
                  <input value={f.title} onChange={(e) => setFilm(i, "title", e.target.value)} placeholder="e.g. Ayesha & Bilal" /></label>
                <div className="fld-row">
                  <label className="fld"><span>Functions</span>
                    <input value={f.events} onChange={(e) => setFilm(i, "events", e.target.value)} placeholder="e.g. Mehndi · Reception" /></label>
                  <label className="fld"><span>Length</span>
                    <input value={f.len} onChange={(e) => setFilm(i, "len", e.target.value)} placeholder="e.g. 6:42" /></label>
                </div>
                <div className="fld-row">
                  <label className="fld"><span>Location</span>
                    <input value={f.place} onChange={(e) => setFilm(i, "place", e.target.value)} placeholder="e.g. London" /></label>
                  <label className="fld"><span>Video link <em className="opt">or paste YouTube/Vimeo</em></span>
                    <input value={String(f.videoSrc).startsWith("data:") ? "" : f.videoSrc} disabled={String(f.videoSrc).startsWith("data:")}
                           onChange={(e) => setFilm(i, "videoSrc", e.target.value)}
                           placeholder={String(f.videoSrc).startsWith("data:") ? "Using uploaded file" : "https://…"} /></label>
                </div>
                <button className="iconbtn iconbtn--sm site-film__del" onClick={() => removeFilm(i)}>Remove film</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="bk-actions"><button className="btn btn--ghost" onClick={resetAll}>Reset to demo content</button></div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function Admin({ navigate, refreshSite }) {
  const [authed, setAuthed] = useStateA(() => !!DB.admin);
  const [section, setSection] = useStateA("galleries");
  const [galleries, setGalleries] = useStateA(() => loadGalleries());
  useEffectA(() => {
    if (!authed && ADMIN_TOKEN) {
      adminLoad().then(() => { setAuthed(true); setGalleries(loadGalleries()); refreshSite && refreshSite(); }).catch(() => {});
    }
  }, []);
  const [view, setView] = useStateA("list"); // list | edit
  const [form, setForm] = useStateA(blankForm);
  const [busy, setBusy] = useStateA(false);
  const [toast, setToast] = useStateA("");
  const fileRef = useRefA(null);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2600); };
  const persist = (list) => { setGalleries(list); if (!saveGalleries(list)) flash("Storage full — remove some photos. (Production uses cloud storage.)"); };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const startNew = () => { setForm(blankForm()); setView("edit"); };
  const startEdit = (g) => { setForm({ ...g, photos: [...g.photos] }); setView("edit"); };

  const onFiles = async (files) => {
    if (!files || !files.length) return;
    setBusy(true);
    const added = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      try { added.push(await fileToDataURL(f)); } catch (e) {}
    }
    setForm((f) => ({ ...f, photos: [...f.photos, ...added], cover: f.cover || added[0] || null }));
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removePhoto = (i) => setForm((f) => {
    const photos = f.photos.filter((_, idx) => idx !== i);
    const removed = f.photos[i];
    return { ...f, photos, cover: f.cover === removed ? (photos[0] || null) : f.cover };
  });

  const save = () => {
    if (!form.couple.trim() || !form.password.trim()) return flash("Couple name and password are required.");
    const id = form.id || makeId();
    const rec = { ...form, id, cover: form.cover || form.photos[0] || form.cover, createdAt: form.createdAt || Date.now() };
    const exists = galleries.some((g) => g.id === id);
    const list = exists ? galleries.map((g) => (g.id === id ? rec : g)) : [rec, ...galleries];
    persist(list);
    setView("list");
    flash(exists ? "Gallery updated." : "Gallery created & live.");
  };

  const del = (g) => {
    if (g.sample) return flash("The sample gallery can't be deleted.");
    if (!window.confirm(`Delete the gallery for ${g.couple}? This can't be undone.`)) return;
    persist(galleries.filter((x) => x.id !== g.id));
  };

  const link = (g) => `yusufshoots.com/gallery  ·  password: ${g.password}`;
  const copyLink = (g) => {
    const text = `Your wedding gallery is ready 💛\n${g.couple} — ${g.date}\nyusufshoots.com (Client gallery)\nPassword: ${g.password}`;
    navigator.clipboard?.writeText(text).then(() => flash("Client link & password copied."), () => flash("Copy failed — select manually."));
  };

  if (!authed) return <AdminLogin navigate={navigate} onDone={() => { setAuthed(true); setGalleries(loadGalleries()); refreshSite && refreshSite(); }} />;

  return (
    <div className="admin">
      <header className="admin__bar">
        <div className="admin__brand">
          <span className="wordmark">YUSUF<span className="wordmark__dot">.</span></span>
          <span className="admin__tag">Studio</span>
        </div>
        <div className="admin__tabs">
          <button className={"admin__tab" + (section === "galleries" ? " is-on" : "")} onClick={() => setSection("galleries")}>Client galleries</button>
          <button className={"admin__tab" + (section === "bookings" ? " is-on" : "")} onClick={() => setSection("bookings")}>Bookings</button>
          <button className={"admin__tab" + (section === "enquiries" ? " is-on" : "")} onClick={() => setSection("enquiries")}>Enquiries</button>
          <button className={"admin__tab" + (section === "website" ? " is-on" : "")} onClick={() => setSection("website")}>Website content</button>
        </div>
        <div className="admin__baracts">
          {section === "galleries" && view === "edit"
            ? <button className="btn btn--ghost-light btn--sm" onClick={() => setView("list")}>← All galleries</button>
            : section === "galleries"
              ? <button className="btn btn--light btn--sm" onClick={startNew}>+ New gallery</button>
              : null}
          <button className="btn btn--ghost-light btn--sm" onClick={() => navigate("home")}>Exit to site</button>
        </div>
      </header>

      {section === "website" && <SiteEditor onChange={refreshSite} />}
      {section === "bookings" && <BookingsManager />}
      {section === "enquiries" && <EnquiriesManager />}

      {section === "galleries" && view === "list" && (
        <div className="admin__wrap">
          <div className="admin__head">
            <h1>Client galleries</h1>
            <p className="muted">Create a private gallery, upload the edited images, and share the link &amp; password with your couple.</p>
          </div>
          {galleries.length === 0 && <p className="muted">No galleries yet — create your first.</p>}
          <div className="admin__grid">
            {galleries.map((g) => (
              <div key={g.id} className="agcard">
                <div className="agcard__cover">
                  {g.cover
                    ? <img src={galImg(g.cover, 600)} alt="" />
                    : <div className="ph"><span>no cover</span></div>}
                  <span className="agcard__count">{g.photos.length} photos</span>
                  {g.sample && <span className="agcard__sample">Sample</span>}
                </div>
                <div className="agcard__body">
                  <h3>{g.couple || "Untitled"}</h3>
                  <p className="muted tiny">{g.date} {g.venue ? "· " + g.venue : ""}</p>
                  <div className="agcard__pw">Password <code>{g.password}</code></div>
                  <div className="agcard__acts">
                    <button className="btn btn--dark btn--sm" onClick={() => startEdit(g)}>Edit &amp; upload</button>
                    <button className="iconbtn iconbtn--sm" onClick={() => copyLink(g)}>Copy link</button>
                    <button className="iconbtn iconbtn--sm" onClick={() => del(g)} disabled={g.sample}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {section === "galleries" && view === "edit" && (
        <div className="admin__wrap admin__edit">
          <div className="admin__form">
            <h2>{form.id ? "Edit gallery" : "New gallery"}</h2>
            <div className="fld-row">
              <label className="fld"><span>Couple</span>
                <input value={form.couple} onChange={(e) => set("couple", e.target.value)} placeholder="e.g. Ayesha & Bilal" /></label>
              <label className="fld"><span>Date</span>
                <input value={form.date} onChange={(e) => set("date", e.target.value)} placeholder="e.g. 23 May 2026" /></label>
            </div>
            <label className="fld"><span>Venue / function <em className="opt">optional</em></span>
              <input value={form.venue} onChange={(e) => set("venue", e.target.value)} placeholder="e.g. Reception · The Royal Nawaab" /></label>
            <label className="fld"><span>Gallery password</span>
              <input value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Share this with the couple" /></label>

            <div className="admin__upload">
              <div className="admin__uploadhead">
                <span>Photos <em className="opt">{form.photos.length} added</em></span>
                <button className="btn btn--dark btn--sm" disabled={busy} onClick={() => fileRef.current?.click()}>
                  {busy ? <span className="spin" /> : "+ Upload images"}
                </button>
                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
              </div>
              <div className="admin__drop"
                   onDragOver={(e) => e.preventDefault()}
                   onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}>
                {form.photos.length === 0
                  ? <p className="muted">Click “Upload images” or drag &amp; drop here. Images are resized for the web automatically.</p>
                  : (
                    <div className="admin__thumbs">
                      {form.photos.map((p, i) => (
                        <div key={i} className={"athumb" + (form.cover === p ? " is-cover" : "")}>
                          <img src={galImg(p, 300)} alt="" />
                          <button className="athumb__x" onClick={() => removePhoto(i)} aria-label="Remove">×</button>
                          <button className="athumb__cover" onClick={() => set("cover", p)}>
                            {form.cover === p ? "Cover" : "Set cover"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>

            <div className="bk-actions">
              <button className="btn btn--dark btn--lg" onClick={save}>{form.id ? "Save changes" : "Create gallery"}</button>
              <button className="btn btn--ghost" onClick={() => setView("list")}>Cancel</button>
            </div>
            <p className="muted tiny">Note: this prototype stores galleries in your browser. Wired to cloud storage in production, the same screen uploads originals and emails the couple automatically.</p>
          </div>

          <aside className="admin__preview">
            <h4>Client sees</h4>
            <div className="admin__pvcard">
              {form.cover ? <img src={galImg(form.cover, 700)} alt="" /> : <div className="ph"><span>cover</span></div>}
              <div className="admin__pvmeta">
                <b>{form.couple || "Couple"}</b>
                <span>{form.date || "Date"}</span>
              </div>
            </div>
            <div className="admin__pvlink">
              <span className="muted tiny">Share</span>
              <code>{link(form)}</code>
            </div>
          </aside>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

Object.assign(window, { Admin });

// ==================== app.jsx (entry) ====================
const { useState: useStateApp, useEffect: useEffectApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "homeDirection": "editorial",
  "accent": "#9B7C5C",
  "headlineFont": "Cormorant Garamond"
}/*EDITMODE-END*/;

function App(){
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = useStateApp("home");
  const [site, setSite] = useStateApp(() => loadSite());
  const refreshSite = () => setSite(loadSite());

  // Returning from Stripe Checkout lands on "/?booking=…&paid=1" — open the booking page to show the receipt.
  useEffectApp(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("booking") || q.get("canceled")) setRoute("booking");
  }, []);

  useEffectApp(() => {
    document.documentElement.style.setProperty("--accent", t.accent);
    document.documentElement.style.setProperty("--serif", `"${t.headlineFont}", Georgia, serif`);
  }, [t.accent, t.headlineFont]);

  const navigate = (r) => {
    setRoute(r);
    document.querySelector(".scroll-root")?.scrollTo({ top: 0, behavior: "auto" });
  };

  // nav is light-on-dark only over the full-bleed hero on home
  const lightNav = !(route === "home" && t.homeDirection === "full-bleed");

  const chromeless = route === "gallery" || route === "admin";

  return (
    <div className="scroll-root">
      {!chromeless && <Nav route={route} navigate={navigate} light={lightNav} />}
      {route === "home" && <Home direction={t.homeDirection} navigate={navigate} site={site} />}
      {route === "portfolio" && <Portfolio navigate={navigate} site={site} />}
      {route === "films" && <Films navigate={navigate} films={site.films} />}
      {route === "booking" && <Booking navigate={navigate} />}
      {route === "gallery" && <Gallery navigate={navigate} />}
      {route === "admin" && <Admin navigate={navigate} refreshSite={refreshSite} />}
      {!chromeless && <Footer navigate={navigate} />}

      <TweaksPanel>
        <TweakSection label="Homepage" />
        <TweakRadio label="Direction" value={t.homeDirection}
          options={["full-bleed","editorial","centered"]}
          onChange={(v)=>{ setTweak("homeDirection", v); navigate("home"); }} />
        <TweakSection label="Brand" />
        <TweakColor label="Accent" value={t.accent}
          options={["#9B7C5C","#7C8267","#A6705B","#8C8273","#6E6A63"]}
          onChange={(v)=>setTweak("accent", v)} />
        <TweakSelect label="Headline font" value={t.headlineFont}
          options={["Cormorant Garamond","Marcellus","EB Garamond"]}
          onChange={(v)=>setTweak("headlineFont", v)} />
      </TweaksPanel>
    </div>
  );
}

bootData().then(() => {
  ReactDOM.createRoot(document.getElementById("root")).render(<App />);
}).catch((err) => {
  console.error("boot failed", err);
  document.getElementById("root").innerHTML =
    '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:Mulish,sans-serif;color:#534B40;background:#F4EEE5;padding:24px;text-align:center;line-height:1.6;">' +
    "The site couldn't reach its server just now. Please refresh in a moment.<br/>(Owner: check the Docker container is running.)</div>";
});

