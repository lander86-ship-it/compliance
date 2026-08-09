"use client";

import React from "react";
import { HubProvider, useHub } from "@/lib/hub/store";
import { css } from "@/lib/hub/theme";
import { TopBar } from "@/components/hub/TopBar";
import { Sidebar } from "@/components/hub/Sidebar";
import { Storefront } from "@/components/hub/views/Storefront";
import { Bundles } from "@/components/hub/views/Bundles";
import { Frameworks } from "@/components/hub/views/Frameworks";
import { FreeGuides } from "@/components/hub/views/FreeGuides";
import { Product } from "@/components/hub/views/Product";
import { Cart } from "@/components/hub/views/Cart";
import { Checkout } from "@/components/hub/views/Checkout";
import { Wizard } from "@/components/hub/views/Wizard";
import { Generator } from "@/components/hub/views/Generator";
import { Auth } from "@/components/hub/views/Auth";
import { Library } from "@/components/hub/views/Library";
import { License } from "@/components/hub/views/License";
import { Subscriptions } from "@/components/hub/views/Subscriptions";
import { Invoices } from "@/components/hub/views/Invoices";
import { Account } from "@/components/hub/views/Account";
import { AdminDashboard } from "@/components/hub/views/AdminDashboard";
import { AdminUsage } from "@/components/hub/views/AdminUsage";
import { AdminIngest } from "@/components/hub/views/AdminIngest";
import { AdminEditor } from "@/components/hub/views/AdminEditor";
import { AdminCatalog } from "@/components/hub/views/AdminCatalog";
import { AdminOrders } from "@/components/hub/views/AdminOrders";
import { AdminVersioning } from "@/components/hub/views/AdminVersioning";

const VIEWS: Record<string, React.ComponentType> = {
  storefront: Storefront,
  bundles: Bundles,
  frameworks: Frameworks,
  freeguides: FreeGuides,
  product: Product,
  cart: Cart,
  checkout: Checkout,
  wizard: Wizard,
  generator: Generator,
  auth: Auth,
  library: Library,
  license: License,
  subscriptions: Subscriptions,
  invoices: Invoices,
  account: Account,
  "admin-dashboard": AdminDashboard,
  "admin-usage": AdminUsage,
  "admin-ingest": AdminIngest,
  "admin-editor": AdminEditor,
  "admin-catalog": AdminCatalog,
  "admin-orders": AdminOrders,
  "admin-versioning": AdminVersioning,
};

const AUTH_REQUIRED = new Set(["generator", "library", "license", "subscriptions", "invoices", "account"]);
const ADMIN_PREFIX = "admin";

function Shell() {
  const { s } = useHub();
  const isAdmin = s.user?.role === "admin" || s.user?.role === "owner";
  // Gate protected areas: buyers must sign in; back office is admin-only.
  let view = s.view;
  if (s.authStatus !== "loading") {
    const needsAuth = AUTH_REQUIRED.has(view) || view.startsWith(ADMIN_PREFIX);
    if (needsAuth && s.authStatus === "anon") view = "auth";
    else if (view.startsWith(ADMIN_PREFIX) && !isAdmin) view = "auth";
  }
  const View = VIEWS[view] || Storefront;
  const m = s.isMobile;
  return (
    <div style={css("min-height:100vh;display:flex;flex-direction:column;background:#F7F7F5;")}>
      <TopBar />
      <div style={css(`flex:1;display:flex;min-height:0;${m ? "flex-direction:column;" : ""}`)}>
        <Sidebar />
        <main style={css(`flex:1;min-width:0;${m ? "" : "overflow-y:auto;height:calc(100vh - 62px);"}`)}>
          <div key={view} style={css("animation:hh-fade .28s ease;")}>
            <View />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <HubProvider>
      <Shell />
    </HubProvider>
  );
}
