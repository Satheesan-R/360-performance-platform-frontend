"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import PersonalSettings from "./personal-settings";
import { usePersonalPreferences } from "./personal-preferences-provider";
import styles from "./settings-overlay.module.css";

const Context = createContext<(() => void) | null>(null);
export function useSettingsOverlay() {
  const open = useContext(Context);
  if (!open) throw new Error("Settings overlay provider is missing");
  return open;
}

export default function SettingsOverlayProvider({ children }: { children: ReactNode }) {
  const { user } = usePersonalPreferences();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return <Context.Provider value={() => { if (user) setOpen(true); }}>
    {children}
    {user && open && <SettingsDialog onClose={close} />}
  </Context.Provider>;
}

function SettingsDialog({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeHandler = useRef<(() => void) | null>(null);
  const registerCloseHandler = useCallback((handler: (() => void) | null) => { closeHandler.current = handler; }, []);
  const requestClose = () => { if (closeHandler.current) closeHandler.current(); else onClose(); };
  useEffect(() => {
    const element = dialog.current!;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    // Cancel the native close synchronously so Escape uses the unsaved/save guard.
    const cancel = (event: Event) => {
      event.preventDefault();
      if (closeHandler.current) closeHandler.current(); else onClose();
    };
    // Some browsers issue a non-cancelable dialog close request. Handle the
    // keyboard event first so Escape always respects the same close guard.
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.isComposing) return;
      event.preventDefault(); event.stopPropagation();
      if (closeHandler.current) closeHandler.current(); else onClose();
    };
    element.addEventListener("cancel", cancel);
    document.addEventListener("keydown", escape, true);
    element.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      element.removeEventListener("cancel", cancel);
      document.removeEventListener("keydown", escape, true);
      document.body.style.overflow = previousOverflow;
      // Mobile sidebar launchers may be offscreen after the menu closes.
      const rect = previousFocus?.getBoundingClientRect();
      if (previousFocus?.isConnected && rect && rect.right > 0 && rect.left < innerWidth) previousFocus.focus({ preventScroll: true });
      else document.querySelector<HTMLButtonElement>('button[aria-label="Open menu"]')?.focus({ preventScroll: true });
    };
  }, [onClose]);
  return <dialog ref={dialog} aria-label="Personal Settings" aria-modal="true" className={`${styles.dialog} border border-slate-200 bg-white text-slate-900 shadow-2xl`}
    onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) requestClose();
    }}>
    <PersonalSettings onClose={onClose} registerCloseHandler={registerCloseHandler} />
  </dialog>;
}
