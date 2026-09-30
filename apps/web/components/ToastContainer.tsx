"use client";

import React from "react";
import { useVyomStore } from "../lib/store";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export function ToastContainer() {
  const { toasts, removeToast } = useVyomStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 p-4 rounded-2xl bg-paper border border-line shadow-elevated transition-all animate-in slide-in-from-top-3 fade-in duration-200"
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === "success" && (
              <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
            {toast.type === "error" && (
              <div className="w-6 h-6 rounded-full bg-red-50 text-error flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
            )}
            {toast.type === "info" && (
              <div className="w-6 h-6 rounded-full bg-sky text-blue flex items-center justify-center">
                <Info className="w-4 h-4" />
              </div>
            )}
          </div>

          <div className="flex-1 text-xs">
            <h5 className="font-bold text-obsidian">{toast.title}</h5>
            {toast.description && (
              <p className="text-charcoal mt-0.5 leading-relaxed">{toast.description}</p>
            )}
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate hover:text-obsidian p-1 -mr-1"
            aria-label="Dismiss toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
