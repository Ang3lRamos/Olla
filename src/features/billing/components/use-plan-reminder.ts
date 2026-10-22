"use client";

import { useCallback, useSyncExternalStore } from "react";

/** "No recordar más" dura hasta que cambie el vencimiento (al renovar, vuelve a avisar). */
const DISMISSED_PREFIX = "olla-aviso-plan-no-recordar:";
/** La alerta sale una vez por visita, no en cada cambio de pantalla. */
const SHOWN_PREFIX = "olla-aviso-plan-mostrado:";
const CHANGE_EVENT = "olla:aviso-plan";

function read(storage: () => Storage, key: string): boolean {
  try {
    return storage().getItem(key) === "1";
  } catch {
    return false;
  }
}

function write(storage: () => Storage, key: string) {
  try {
    storage().setItem(key, "1");
  } catch {
    // Sin almacenamiento la alerta volvería a salir; es lo menos grave.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

const subscribe = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
};

const local = () => window.localStorage;
const session = () => window.sessionStorage;

/**
 * Qué mostrar del aviso del plan en este navegador: la alerta (una vez por visita, hasta que
 * pida no recordar más) o la etiqueta roja de la barra. En el servidor no se muestra nada.
 */
export function usePlanReminder(noticeKey: string) {
  const snapshot = useSyncExternalStore(
    subscribe,
    () =>
      `${read(local, DISMISSED_PREFIX + noticeKey) ? 1 : 0}${read(session, SHOWN_PREFIX + noticeKey) ? 1 : 0}`,
    () => "server",
  );
  const ready = snapshot !== "server";
  const dismissed = snapshot.startsWith("1");
  const shownThisVisit = snapshot.endsWith("1");

  return {
    showAlert: ready && !dismissed && !shownThisVisit,
    showBadge: ready && dismissed,
    later: useCallback(() => write(session, SHOWN_PREFIX + noticeKey), [noticeKey]),
    dismiss: useCallback(() => write(local, DISMISSED_PREFIX + noticeKey), [noticeKey]),
  };
}
