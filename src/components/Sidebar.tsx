import { useRef, useEffect } from "react";
import type { GridSize } from "../lib/types";

interface SidebarProps {
    selectedWidget: string;
    setSelectedWidget: (widget: string) => void;
    theme: string;
    setTheme: (theme: string) => void;
    onAddWidget: () => void;
    packages: Record<string, any>;
    testWidgets: Array<{ id: string; label: string }>;
    language: string;
    setLanguage: (language: string) => void;
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
}

const LANGUAGES = [
    { code: 'en', label: '🇺🇸 English', name: 'English' },
    { code: 'de', label: '🇩🇪 Deutsch', name: 'German' }
];

export function Sidebar({
    selectedWidget,
    setSelectedWidget,
    theme,
    setTheme,
    onAddWidget,
    packages,
    testWidgets,
    language,
    setLanguage,
    isCollapsed,
    setIsCollapsed
}: SidebarProps) {
    const closeTimeoutRef = useRef<number | null>(null);

    const handleMouseEnter = () => {
        // Clear any pending close timeout
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        setIsCollapsed(false);
    };

    const handleMouseLeave = () => {
        // Set a 2-second delay before closing
        closeTimeoutRef.current = setTimeout(() => {
            setIsCollapsed(true);
        }, 2000);
    };

    const handleTouchToggle = () => {
        // Toggle sidebar on touch devices
        setIsCollapsed(!isCollapsed);
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, []);

    return (
        <>
            {/* Backdrop overlay */}
            <div
                className={`sidebar-backdrop ${!isCollapsed ? 'visible' : ''}`}
                onClick={() => setIsCollapsed(true)}
            />

            {/* Hover trigger area for opening sidebar */}
            <div
                className="sidebar-hover-trigger"
                onMouseEnter={handleMouseEnter}
                onTouchStart={handleTouchToggle}
            />

            <div
                className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}`}
                onMouseLeave={handleMouseLeave}
            >
                <div className="sidebar-header">
                    <div className="sidebar-brand sidebar-visible">
                        <strong>DoorHub</strong>
                        {!isCollapsed && <span className="sidebar-version">v1.0</span>}
                    </div>
                </div>

                <div className="sidebar-content">
                    {!isCollapsed && (
                        <>
                            <div className="sidebar-section sidebar-visible">
                                <h3 className="sidebar-section-title">Add Widget</h3>
                                <div className="sidebar-field">
                                    <label htmlFor="widget-select">Widget Type</label>
                                    <select
                                        id="widget-select"
                                        value={selectedWidget}
                                        onChange={(e) => setSelectedWidget(e.target.value)}
                                        className="sidebar-select"
                                    >
                                        {testWidgets.map(w => {
                                            const pkg = packages[w.id];
                                            const sizesText = pkg?.manifest?.sizes ? ` (${pkg.manifest.sizes.join('/')})` : '';
                                            return (
                                                <option key={w.id} value={w.id}>{w.label}{sizesText}</option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <button onClick={onAddWidget} className="sidebar-button primary">
                                    Add Widget
                                </button>
                            </div>

                            <div className="sidebar-section sidebar-visible">
                                <h3 className="sidebar-section-title">Appearance</h3>
                                <div className="sidebar-field">
                                    <label htmlFor="theme-select">Theme</label>
                                    <select
                                        id="theme-select"
                                        value={theme}
                                        onChange={(e) => setTheme(e.target.value)}
                                        className="sidebar-select"
                                    >
                                        <option value="dark">🌙 Dark</option>
                                        <option value="light">☀️ Light</option>
                                    </select>
                                </div>
                            </div>

                            <div className="sidebar-section sidebar-visible">
                                <h3 className="sidebar-section-title">Language</h3>
                                <div className="sidebar-field">
                                    <label htmlFor="language-select">Display Language</label>
                                    <select
                                        id="language-select"
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        className="sidebar-select"
                                    >
                                        {LANGUAGES.map(lang => (
                                            <option key={lang.code} value={lang.code}>
                                                {lang.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="sidebar-section sidebar-visible">
                                <h3 className="sidebar-section-title">Widget Info</h3>
                                {selectedWidget && packages[selectedWidget] && (
                                    <div className="widget-info">
                                        <div className="widget-info-item">
                                            <span className="widget-info-label">Name:</span>
                                            <span className="widget-info-value">{packages[selectedWidget].manifest?.name}</span>
                                        </div>
                                        <div className="widget-info-item">
                                            <span className="widget-info-label">Version:</span>
                                            <span className="widget-info-value">{packages[selectedWidget].manifest?.version}</span>
                                        </div>
                                        <div className="widget-info-item">
                                            <span className="widget-info-label">Sizes:</span>
                                            <span className="widget-info-value">
                                                {packages[selectedWidget].manifest?.sizes?.join(', ')}
                                            </span>
                                        </div>
                                        <div className="widget-info-item">
                                            <span className="widget-info-label">Default:</span>
                                            <span className="widget-info-value">
                                                {packages[selectedWidget].manifest?.defaultSize ||
                                                    packages[selectedWidget].manifest?.sizes?.[0]}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
