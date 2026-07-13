"use client";

import React from "react";
import { HubProvider, useHub } from "@/lib/hub/store";
import { css } from "@/lib/hub/theme";
import { TopBar } from "@/components/hub/TopBar";
import { Sidebar } from "@/components/hub/Sidebar";
import { Storefront } from "@/components/hub/views/Storefront";
import { Product } from "@/components/hub/views/Product";
import { Cart } from "@/components/hub/views/Cart";
import { Checkout } from "@/components/hub/views/Checkout";
import { Wizard } from "@/components/hub/views/Wizard";
import { Library } from "@/components/hub/views/Library";
import { License } from "@/components/hub/views/License";
import { AdminDashboard } from "@/components/hub/views/AdminDashboard";
import { AdminIngest } from "@/components/hub/views/AdminIngest";
import { AdminEditor } from "@/components/hub/views/AdminEditor";
import { AdminCatalog } from "@/components/hub/views/AdminCatalog";
import { AdminOrders } from "@/components/hub/views/AdminOrders";
import { AdminVersioning } from "@/components/hub/views/AdminVersioning";

const VIEWS: Record<string, React.ComponentType> = {
  storefront: Storefront,
  product: Product,
  cart: Cart,
  checkout: Checkout,
  wizard: Wizard,
  library: Library,
  license: License,
  "admin-dashboard": AdminDashboard,
  "admin-ingest": AdminIngest,
  "admin-editor": AdminEditor,
  "admin-catalog": AdminCatalog,
  "admin-orders": AdminOrders,
  "admin-versioning": AdminVersioning,
};

function Shell() {
  const { s } = useHub();
  const View = VIEWS[s.view] || Storefront;
  return (
    <div style={css("min-height:100vh;display:flex;flex-direction:column;background:#F7F7F5;")}>
      <TopBar />
      <div style={css("flex:1;display:flex;min-height:0;")}>
        <Sidebar />
        <main style={css("flex:1;min-width:0;overflow-y:auto;height:calc(100vh - 62px);")}>
          <div key={s.view} style={css("animation:hh-fade .28s ease;")}>
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
