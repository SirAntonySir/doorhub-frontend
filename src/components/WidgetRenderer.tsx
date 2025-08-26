import { useEffect, useMemo, useState } from "react";
import type { GridSize, LayoutNode, WidgetPackage } from "../lib/types";
import { substitute } from "../widgets/runtime";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

function Node({ node }: { node: LayoutNode }) {
  const { component, props, children } = node;
  const style = props?.style ?? {};
  const text = props?.text ? substitute(String(props.text)) : undefined;

  if (component === "Card") {
    return <div className="card" style={{ padding: '16px', ...style }}>{children?.map((c, i) => <Node key={i} node={c} />)}</div>;
  }
  if (component === "Row") {
    return <div style={{ display: "flex", gap: props?.space ?? 16, alignItems: props?.align ?? "center" }}>{children?.map((c, i) => <Node key={i} node={c} />)}</div>;
  }
  if (component === "Col" || component === "Column") {
    return <div style={{ display: "flex", flexDirection: "column", gap: props?.space ?? 16 }}>{children?.map((c, i) => <Node key={i} node={c} />)}</div>;
  }
  if (component === "Text") {
    const sz = props?.style === "largeTitle" ? 28 : props?.style === "title1" ? 20 : props?.style === "caption" ? 12 : 14;
    const wt = props?.style?.includes("title") ? 600 : 400;
    return <div style={{ fontSize: sz, fontWeight: wt, opacity: props?.muted ? .75 : 1 }}>{text}</div>;
  }
  if (component === "Spacer") return <div style={{ flex: 1 }} />;

  // Fallback debug
  return <div style={{ border: "1px dashed rgba(255,255,255,.2)", borderRadius: 8, padding: 6 }}>{component}</div>;
}

export function WidgetRenderer({ pkg, size }: { pkg: WidgetPackage, size: GridSize }) {
  const layout = pkg.ui[size] as LayoutNode | undefined;
  if (!layout) return <div className="card">No layout for {size}</div>;
  return <Node node={layout} />;
}
