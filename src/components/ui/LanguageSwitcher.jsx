import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { LANGUAGES } from "@/i18n/languages";

const MENU_GAP = 8; // gap between button and menu (px)
const MENU_MAX_HEIGHT = 288; // matches max-h-72 (px)
const VIEWPORT_MARGIN = 8; // keep the menu at least this far from window edges

/**
 * LanguageSwitcher — dropdown that lists every supported language.
 *
 * Behavior:
 *  - Opens/closes via the trigger button (aria-haspopup="menu").
 *  - Closes on outside click or Escape.
 *  - Rendered with `position: fixed` so ancestor `overflow` clipping (e.g.
 *    the sticky header) can never crop it, with coordinates recalculated
 *    while open so scroll/resize don't leave the menu in a stale location.
 *  - The menu is clamped to the viewport: it flips above the button when
 *    there is not enough room below and never extends past the top/bottom
 *    window border.
 *  - Selecting a language calls `i18n.changeLanguage`, which the configured
 *    i18next-browser-languagedetector persists to localStorage automatically,
 *    so the choice survives reloads and overrides browser defaults.
 *  - The currently active language is marked with a Check icon.
 */
export default function LanguageSwitcher() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const [menuPosition, setMenuPosition] = useState(null);

  const currentLang = i18n.language;

  // Compute fixed-position coordinates for the dropdown relative to the
  // trigger button, clamped so the menu always stays fully inside the
  // viewport (never cropped by the top/bottom window border). Measured in
  // a layout effect (not during render) and re-measured on scroll/resize
  // while open so the menu never ends up in a stale location.
  // Stable across renders: only reads refs (stable identity) and calls the
  // useState setter (also stable), so [] deps are correct and the identity
  // captured by the layout-effect listeners never goes stale.
  const measureMenuPosition = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const estimatedHeight = Math.min(
      MENU_MAX_HEIGHT,
      LANGUAGES.length * 36, // approx. per-item height
    );

    // Prefer opening below; flip above only when there's no room below
    // and flipping gives more space.
    const spaceBelow = vh - rect.bottom - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - VIEWPORT_MARGIN;
    let top = rect.bottom + MENU_GAP;
    if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
      top = Math.max(VIEWPORT_MARGIN, rect.top - MENU_GAP - estimatedHeight);
    }
    // Hard clamp: never above the top border or below the bottom border.
    top = Math.min(
      Math.max(VIEWPORT_MARGIN, top),
      Math.max(VIEWPORT_MARGIN, vh - estimatedHeight - VIEWPORT_MARGIN),
    );

    // Clamp horizontally so the menu doesn't overflow the window edge.
    const menuWidth = 176; // matches w-44 (11 rem at 16 px base)
    const right = Math.min(
      Math.max(VIEWPORT_MARGIN, vw - rect.right),
      Math.max(VIEWPORT_MARGIN, vw - menuWidth - VIEWPORT_MARGIN),
    );

    setMenuPosition({ top, right });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    measureMenuPosition();
    window.addEventListener("resize", measureMenuPosition);
    window.addEventListener("scroll", measureMenuPosition, true);
    return () => {
      window.removeEventListener("resize", measureMenuPosition);
      window.removeEventListener("scroll", measureMenuPosition, true);
    };
  }, [open, measureMenuPosition]);


  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    // Focus-trap: keep Tab cycling within the menu while open.
    if (!open) return;
    const menu = menuRef.current;
    if (!menu) return;
    const focusables = menu.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const onKey = (e) => {
      if (e.key !== "Tab" || !document.activeElement) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    menu.addEventListener("keydown", onKey);
    return () => menu.removeEventListener("keydown", onKey);
  }, [open]);

  const switchLanguage = (code) => {
    void i18n.changeLanguage(code);
    setOpen(false);
  };

  const currentLabel =
    LANGUAGES.find((l) => l.code === currentLang)?.label ?? currentLang;

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("langSwitcher.toggleAria")}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-medium text-slate-300 hover:text-white transition-all group"
      >
        <Globe className="w-3.5 h-3.5 text-cyan-400 group-hover:text-white transition-colors" />
        <span className="hidden sm:inline">{currentLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && menuPosition && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          aria-label={t("langSwitcher.label")}
          className="fixed w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-9999 overflow-y-auto max-h-72"
          style={{
            top: menuPosition.top,
            right: menuPosition.right,
          }}
        >
          {LANGUAGES.map((lang) => {
            const active = lang.code === currentLang;
            return (
              <button
                key={lang.code}
                role="menuitemradio"
                aria-checked={active}
                onClick={() => switchLanguage(lang.code)}
                className={`flex items-center justify-between w-full px-3 py-2 text-left text-xs font-medium transition-colors ${
                  active
                    ? "bg-cyan-950/50 text-cyan-300"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <span>{lang.label}</span>
                {active && (
                  <Check className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

