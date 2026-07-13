"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { PRODUCTS, WIZ_CONTROLS } from "./data";

export type Scope = {
  legal: string;
  trade: string;
  sector: string;
  owner: string;
  docv: string;
  classification: string;
  color: string;
  env: string;
  profile: string;
  confidentiality: string;
};

export type GenArtifact = { format: string; url: string; hash: string; bytes: number };

export type HubState = {
  view: string;
  family: string;
  aiUrl: string;
  aiStatus: "idle" | "analyzing" | "done";
  aiStage: number;
  filter: string;
  selectedId: string;
  variant: string;
  profile: string;
  cart: string[];
  wizardStep: number;
  scope: Scope;
  excluded: Record<string, string>;
  odp: Record<string, string>;
  genStatus: "idle" | "processing" | "done" | "failed";
  genArtifacts: GenArtifact[];
  genError: string | null;
  coupon: string;
  pay: "card" | "po";
  justOrdered: boolean;
};

const initialState: HubState = {
  view: "storefront",
  family: "hardening",
  aiUrl: "https://www.cisecurity.org/benchmark/microsoft_windows_server",
  aiStatus: "idle",
  aiStage: 0,
  filter: "All",
  selectedId: "cis-win2022",
  variant: "Windows Server 2022",
  profile: "Level 1",
  cart: ["cis-ubuntu2204"],
  wizardStep: 1,
  scope: {
    legal: "Northwind Financial Group",
    trade: "Northwind",
    sector: "Financial services",
    owner: "M. Torres, CISO",
    docv: "1.0",
    classification: "Internal Use",
    color: "#0f4c9c",
    env: "On-premises",
    profile: "Level 1",
    confidentiality: "Confidential — for internal use by Northwind Financial Group only. Do not distribute.",
  },
  excluded: {},
  odp: { pwlen: "14", lockout: "5", logret: "365", sessions: "15" },
  genStatus: "idle",
  genArtifacts: [],
  genError: null,
  coupon: "",
  pay: "card",
  justOrdered: false,
};

type HubContextValue = {
  s: HubState;
  set: (patch: Partial<HubState> | ((s: HubState) => Partial<HubState>)) => void;
  go: (view: string) => void;
  open: (id: string) => void;
  addToCart: (id: string) => void;
  removeFromCart: (id: string) => void;
  toggleExclude: (id: string) => void;
  setReason: (id: string, reason: string) => void;
  setScope: (k: keyof Scope, v: string) => void;
  setOdp: (k: string, v: string) => void;
  generate: () => Promise<void>;
  runAI: () => void;
  resetAI: () => void;
};

const HubContext = createContext<HubContextValue | null>(null);

export function HubProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<HubState>(initialState);
  const sRef = useRef(s);
  useEffect(() => {
    sRef.current = s;
  }, [s]);

  const set = useCallback<HubContextValue["set"]>((patch) => {
    setS((prev) => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }));
  }, []);

  const go = useCallback((view: string) => setS((p) => ({ ...p, view, genStatus: p.view === "wizard" ? p.genStatus : "idle" })), []);
  const open = useCallback((id: string) => {
    const p = PRODUCTS.find((x) => x.id === id);
    setS((prev) => ({ ...prev, view: "product", selectedId: id, variant: p?.platform ?? prev.variant }));
  }, []);
  const addToCart = useCallback((id: string) => setS((p) => (p.cart.includes(id) ? p : { ...p, cart: [...p.cart, id] })), []);
  const removeFromCart = useCallback((id: string) => setS((p) => ({ ...p, cart: p.cart.filter((x) => x !== id) })), []);

  const toggleExclude = useCallback((id: string) => {
    setS((p) => {
      const ex = { ...p.excluded };
      if (ex[id]) delete ex[id];
      else ex[id] = "Not applicable to environment";
      return { ...p, excluded: ex };
    });
  }, []);
  const setReason = useCallback((id: string, reason: string) => setS((p) => ({ ...p, excluded: { ...p.excluded, [id]: reason } })), []);
  const setScope = useCallback((k: keyof Scope, v: string) => setS((p) => ({ ...p, scope: { ...p.scope, [k]: v } })), []);
  const setOdp = useCallback((k: string, v: string) => setS((p) => ({ ...p, odp: { ...p.odp, [k]: v } })), []);

  // Real generation: POST scope to the engine, receive downloadable artifacts.
  const generate = useCallback(async () => {
    setS((p) => ({ ...p, genStatus: "processing", genError: null }));
    try {
      const state = sRef.current;
      const excludedList = WIZ_CONTROLS.filter((c) => state.excluded[c.id]).map((c) => ({ controlId: c.id, reason: state.excluded[c.id] }));
      const includedIds = WIZ_CONTROLS.filter((c) => !state.excluded[c.id]).map((c) => c.id);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productId: "cis-win2022",
          scope: state.scope,
          odp: state.odp,
          excluded: excludedList,
          included: includedIds,
          formats: ["DOCX", "PDF", "XLSX"],
        }),
      });
      if (!res.ok) throw new Error(`Generation failed (${res.status})`);
      const data = await res.json();
      setS((p) => ({ ...p, genStatus: "done", genArtifacts: data.artifacts || [] }));
    } catch (e) {
      setS((p) => ({ ...p, genStatus: "failed", genError: e instanceof Error ? e.message : "Generation failed" }));
    }
  }, []);

  const runAI = useCallback(() => {
    setS((p) => ({ ...p, aiStatus: "analyzing", aiStage: 0 }));
    const total = 5;
    const tick = () => {
      setS((p) => {
        const next = p.aiStage + 1;
        if (next >= total) return { ...p, aiStatus: "done" };
        setTimeout(tick, 750);
        return { ...p, aiStage: next };
      });
    };
    setTimeout(tick, 750);
  }, []);
  const resetAI = useCallback(() => setS((p) => ({ ...p, aiStatus: "idle", aiStage: 0 })), []);

  const value: HubContextValue = { s, set, go, open, addToCart, removeFromCart, toggleExclude, setReason, setScope, setOdp, generate, runAI, resetAI };
  return <HubContext.Provider value={value}>{children}</HubContext.Provider>;
}

export function useHub(): HubContextValue {
  const ctx = useContext(HubContext);
  if (!ctx) throw new Error("useHub must be used within HubProvider");
  return ctx;
}
