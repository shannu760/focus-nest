"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";

type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; kind: ToastKind; title: string; description?: string };

const ToastContext = createContext<{
  toast: (t: { title: string; description?: string; kind?: ToastKind }) => void;
} | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const toast = useCallback(
    ({ title, description, kind = "success" }: { title: string; description?: string; kind?: ToastKind }) => {
      const id = ++idRef.current;
      setItems((prev) => [...prev.slice(-3), { id, title, description, kind }]);
      setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const value = useMemo(() => ({ toast }), [toast]);

  const icons = {
    success: <CheckCircle2 className="size-5 text-emerald-500" />,
    error: <XCircle className="size-5 text-rose-500" />,
    info: <Info className="size-5 text-sky-500" />,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg shadow-slate-900/10 backdrop-blur animate-[slideIn_0.25s_cubic-bezier(0.16,1,0.3,1)]"
          >
            <span className="mt-0.5">{icons[t.kind]}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{t.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
