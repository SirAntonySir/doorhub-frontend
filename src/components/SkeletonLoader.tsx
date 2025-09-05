import { useMemo } from "react";
import type { LayoutNode, GridSize } from "../lib/types";

interface SkeletonLoaderProps {
    dataSchema?: any;
    size: GridSize;
    i18nData?: Record<string, string>;
    logoUrl?: string;
}

function generateSkeletonFromSchema(schema: any, i18nData: Record<string, string>, size: GridSize, logoUrl?: string): LayoutNode {
    if (!schema || !schema.properties) {
        // Fallback skeleton
        return {
            component: "Card",
            props: { style: "glass" },
            children: [
                {
                    component: "Row",
                    props: { align: "center", space: 8 },
                    children: [
                        logoUrl
                            ? { component: "Image", props: { src: logoUrl, className: "brand-logo" } }
                            : { component: "SkeletonBox", props: { width: 24, height: 24, style: "rounded" } },
                        { component: "SkeletonText", props: { width: 80, height: 12 } },
                        { component: "Spacer" },
                        { component: "SkeletonText", props: { width: 60, height: 12 } }
                    ]
                },
                { component: "SkeletonText", props: { width: "100%", height: 24, style: "title" } },
                { component: "SkeletonBox", props: { width: 8, height: 8, style: "circle" } }
            ]
        };
    }

    const children: LayoutNode[] = [];

    // Generate skeleton based on schema properties
    const isCompact = size === "2x2";

    // Header row
    const headerChildren: LayoutNode[] = [];

    if (schema.properties.logo || logoUrl) {
        if (logoUrl) {
            // Show actual logo when available
            headerChildren.push({ component: "Image", props: { src: logoUrl, className: "brand-logo" } });
        } else {
            // Show skeleton placeholder when no logo available
            headerChildren.push({ component: "SkeletonBox", props: { width: 24, height: 24, style: "rounded" } });
        }
    }

    // Widget title
    headerChildren.push({ component: "SkeletonText", props: { width: isCompact ? 60 : 80, height: 12 } });
    headerChildren.push({ component: "Spacer" });

    // Primary field (like order number, tracking number)
    if (schema.properties.primaryField || schema.properties.orderNo || schema.properties.trackingNumber) {
        headerChildren.push({ component: "SkeletonText", props: { width: isCompact ? 40 : 60, height: 12 } });
    }

    if (headerChildren.length > 0) {
        children.push({
            component: "Row",
            props: { align: "center", space: 8 },
            children: headerChildren
        });
    }

    // Main content
    if (schema.properties.stateText || schema.properties.secondaryField) {
        children.push({
            component: "SkeletonText",
            props: {
                width: isCompact ? "80%" : "60%",
                height: isCompact ? 18 : 24,
                style: "title"
            }
        });
    }

    // Status indicator
    if (schema.properties.status) {
        children.push({ component: "SkeletonBox", props: { width: 8, height: 8, style: "circle" } });
    }

    // Additional fields for larger sizes
    if (!isCompact) {
        if (schema.properties.orderDate || schema.properties.summaryDate) {
            children.push({ component: "SkeletonText", props: { width: "40%", height: 14 } });
        }

        if (schema.properties.priceText || schema.properties.deliveryText) {
            children.push({ component: "SkeletonText", props: { width: "35%", height: 14 } });
        }
    }

    return {
        component: "Card",
        props: { style: "glass" },
        children
    };
}

function SkeletonNode({ node }: { node: LayoutNode }) {
    const { component, props, children } = node;

    if (component === "Card") {
        const cardStyle = typeof props?.style === 'object' ? props.style : {};
        const cardClass = typeof props?.style === 'string' ? `card ${props.style}` : 'card';
        const mergedStyle = { height: '100%', ...cardStyle } as React.CSSProperties;

        return (
            <div className={`${cardClass} skeleton-card`} style={mergedStyle}>
                {children?.map((c, i) => <SkeletonNode key={i} node={c} />)}
            </div>
        );
    }

    if (component === "Row") {
        return (
            <div className="widget-row" style={{ gap: props?.space ?? 8, alignItems: props?.align ?? "center" }}>
                {children?.map((c, i) => <SkeletonNode key={i} node={c} />)}
            </div>
        );
    }

    if (component === "Col" || component === "Column") {
        return (
            <div className="widget-column" style={{ gap: props?.space ?? 8 }}>
                {children?.map((c, i) => <SkeletonNode key={i} node={c} />)}
            </div>
        );
    }

    if (component === "SkeletonText") {
        const { width = 100, height = 14, style } = props || {};
        const className = `skeleton skeleton-text ${style === 'title' ? 'skeleton-title' : ''}`;
        return (
            <div
                className={className}
                style={{
                    width: typeof width === 'string' ? width : `${width}px`,
                    height: `${height}px`
                }}
            />
        );
    }

    if (component === "SkeletonBox") {
        const { width = 24, height = 24, style } = props || {};
        const className = `skeleton skeleton-box ${style === 'circle' ? 'skeleton-circle' : style === 'rounded' ? 'skeleton-rounded' : ''}`;
        return (
            <div
                className={className}
                style={{
                    width: `${width}px`,
                    height: `${height}px`
                }}
            />
        );
    }

    if (component === "Spacer") {
        return <div className="widget-spacer" />;
    }

    if (component === "Image") {
        let src = props?.src || '';
        return <img src={src} className={props?.className || ''} alt="" />;
    }

    // Fallback
    return <div className="skeleton skeleton-text" style={{ width: '100px', height: '14px' }} />;
}

export function SkeletonLoader({ dataSchema, size, i18nData = {}, logoUrl }: SkeletonLoaderProps) {
    const skeletonLayout = useMemo(() => {
        return generateSkeletonFromSchema(dataSchema, i18nData, size, logoUrl);
    }, [dataSchema, i18nData, size, logoUrl]);

    return (
        <div className={`widget-${size}`} style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="widget-content">
                <SkeletonNode node={skeletonLayout} />
            </div>
        </div>
    );
}
