"use client";

import React from "react";
import { LogOptions, Logger, ReactConsoleOptions, useReactConsoleContext } from "./ReactConsoleContext";

// Util

const storagePre = "__$ReactConsole$__";

function isReactNode(obj: any): boolean {
    return (
        typeof obj === "string" ||
        typeof obj === "number" ||
        typeof obj === "boolean" ||
        obj === null ||
        obj === undefined ||
        React.isValidElement(obj) ||
        (Array.isArray(obj) && obj.every(isReactNode))
    );
}

function parseArgs(argsStr: string) {
    const args: string[] = [];
    let currentArg = "";
    let insideQuotes = false;

    for (let i = 0; i < argsStr.length; i++) {
        const char = argsStr.charAt(i);

        if (char === '"') {
            insideQuotes = !insideQuotes;
        } else if (char === " " && !insideQuotes) {
            if (currentArg !== "") {
                args.push(currentArg);
                currentArg = "";
            }
        } else {
            currentArg += char;
        }
    }

    if (currentArg !== "") args.push(currentArg);

    return args;
}

// Styles

const height = 300;
const width = 300;
const border = "1px solid lightgray";

function getTypeColor(type: string | undefined, options?: ReactConsoleOptions): string | undefined {
    switch (type) {
        case "warn":
            return options?.colors?.warn ?? "orange";
        case "error":
            return options?.colors?.error ?? "red";
        case "info":
            return options?.colors?.info ?? "blue";
        default:
            return undefined;
    }
}

const getPositionStyle = (position: ReactConsoleProps["defaultPosition"]) => {
    switch (position) {
        case "top":
            return {
                top: 0,
                left: 0,
                width: "100%",
                borderBottom: border,
                height,
            };
        case "left":
            return {
                left: 0,
                top: 0,
                height: "100%",
                borderRight: border,
                width,
            };
        case "right":
            return {
                right: 0,
                top: 0,
                height: "100%",
                borderLeft: border,
                width,
            };
        case "bottom":
        default:
            return {
                bottom: 0,
                left: 0,
                width: "100%",
                borderTop: border,
                height,
            };
    }
};

const flexRow: React.CSSProperties = { display: "flex", flexDirection: "row" };
const flexCol: React.CSSProperties = { display: "flex", flexDirection: "column" };
const text: React.CSSProperties = { fontSize: "17px" };
const bg = { background: "#f6f6f6" };
const truncate: React.CSSProperties = { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const longText: React.CSSProperties = { whiteSpace: "normal", overflow: "visible", textOverflow: "clip", wordBreak: "break-all" };

// Component

const maxLabelWidth = 180;

interface ReactConsoleProps {
    title?: string;
    /** controlled - Disables key combination open! */
    open?: boolean;
    onClose?: () => void;
    style?: React.CSSProperties;
    className?: string;
    defaultPosition?: "top" | "left" | "right" | "bottom";
    label?: string;
    disableInput?: boolean;
    onInput?: () => void;
    /** @default 650 */
    maxEntries?: number;
}

function Arrow(props: { rotate: number; onClick?: React.MouseEventHandler }) {
    return (
        <svg
            onClick={props.onClick}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            style={{ rotate: props.rotate + "deg", cursor: "pointer" }}
            strokeWidth={1.5}
            stroke="currentColor"
            height={18}
            width={18}
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
        </svg>
    );
}

const ReactCosole = React.forwardRef<HTMLDivElement, ReactConsoleProps>((props, ref) => {
    const isControlled = props.open !== undefined;
    const [open, setOpen] = React.useState(false);
    const root = React.useRef<HTMLDivElement | null>(null);
    const [position, setPosition] = React.useState<string>("bottom");
    const cons = useReactConsoleContext();
    const [logs, setLogs] = React.useState<{ options: LogOptions; nodes: React.ReactNode[]; id: string }[]>([]);
    const [inpValue, setInpVal] = React.useState("");
    const inp = React.useRef<HTMLInputElement>(null);

    // defaults (local storage must be used in effect, because of SSR)
    React.useEffect(() => {
        setOpen(props.open ?? localStorage.getItem(storagePre + "open") === "true");
        setPosition(localStorage.getItem(storagePre + "position") ?? props.defaultPosition ?? "bottom");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    React.useEffect(() => {
        if (props.open !== undefined) _open(props.open);
    }, [props.open]);

    React.useEffect(() => {
        if (isControlled) return;

        const listener = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && (e.key === "c" || e.key === "C")) {
                _open(!open);
            }
        };
        document.addEventListener("keydown", listener);
        return () => {
            document.removeEventListener("keydown", listener);
        };
    }, [open]);

    React.useEffect(() => {
        let listener: Logger;
        const c = cons;
        c.addListener(
            (listener = (options, ...args: any[]) => {
                setLogs(logs => [
                    ...logs,
                    {
                        options,
                        nodes: args.flat(1).map(arg => {
                            if (isReactNode(arg)) return arg;
                            return arg ? arg.toString?.() : arg + "";
                        }),
                        id: Math.random().toString(36).substring(2, 11),
                    },
                ]);

                setTimeout(() => {
                    root.current?.lastElementChild?.scrollIntoView({ behavior: "smooth" });
                }, 100);
            })
        );
        return () => {
            c.removeListener(listener);
        };
    }, []);

    const label = props.label ?? "Console";

    function _open(open: boolean) {
        setOpen(open);
        localStorage.setItem(storagePre + "open", open + "");
        if (!open) props.onClose?.();
    }

    function _setPosition(pos: ReactConsoleProps["defaultPosition"]) {
        pos = pos || "bottom";
        localStorage.setItem(storagePre + "position", pos);
        setPosition(pos);
    }

    if (!open) return null;

    return (
        <div
            onClick={() => inp.current?.focus()}
            style={{
                ...flexCol,
                ...bg,
                overflowY: "auto",
                minHeight: 0,
                display: "flex",
                minWidth: 0,
                position: "fixed",
                cursor: "text",
                boxShadow: "rgba(0, 0, 0, 0.16) 0px 1px 4px",
                zIndex: 100,
                overflow: "hidden",
                ...getPositionStyle(position as any),
                ...props.style,
            }}
            className={props.className}
            ref={div => {
                root.current = div;
                if (ref) {
                    if (typeof ref === "function") ref(div);
                    else ref.current = div;
                }
            }}
        >
            {/* Header */}
            <header onClick={e => e.stopPropagation()} style={{ flexShrink: 0, position: "sticky", gap: 5, top: 0, ...flexRow }}>
                <span style={{ ...bg, ...truncate, borderBottomRightRadius: 5, padding: 3, color: "lightgrey", fontSize: 14 }}>
                    {props.title ?? "ReactConsole"} <i style={{ paddingLeft: 5 }}>{logs.length} Logs</i>
                </span>
                <nav style={{ ...flexRow, gap: 5, marginLeft: "auto", padding: 5 }}>
                    {/* Position */}
                    <Arrow rotate={90} onClick={() => _setPosition("left")} />
                    <Arrow rotate={180} onClick={() => _setPosition("top")} />
                    <Arrow rotate={270} onClick={() => _setPosition("right")} />
                    <Arrow rotate={0} onClick={() => _setPosition("bottom")} />
                    {/* Close */}
                    <svg
                        style={{ rotate: "45deg", cursor: "pointer" }}
                        onClick={() => {
                            if (!isControlled) _open(false);
                        }}
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 100 100"
                    >
                        <line x1="0" y1="50" x2="100" y2="50" stroke="black" strokeWidth="7" />
                        <line x1="50" y1="0" x2="50" y2="100" stroke="black" strokeWidth="7" />
                    </svg>
                </nav>
            </header>
            {/* Logs List */}
            <ol style={{ ...flexCol, maxWidth: "100%", flexShrink: 0, padding: 0, margin: 0, listStyleType: "none" }}>
                {logs.map(log => {
                    return (
                        <li style={{ ...flexRow, flexShrink: 0, flexDirection: "row" }} key={log.id}>
                            <span
                                style={{
                                    ...text,
                                    ...truncate,
                                    maxWidth: maxLabelWidth,
                                    flexShrink: 0,
                                    paddingLeft: 2,
                                    color: "gray",
                                    paddingRight: 10,
                                }}
                            >
                                {label}
                            </span>
                            <div
                                style={{ ...text, ...longText, color: getTypeColor(log.options.type), ...log.options.style }}
                                className={props.className}
                            >
                                {log.nodes}
                            </div>
                        </li>
                    );
                })}
            </ol>
            {/* Input */}
            {!props.disableInput && (
                <div style={{ ...flexRow, ...bg, flexShrink: 0, background: "inherit", position: "sticky", bottom: 0 }}>
                    <label
                        style={{
                            ...text,
                            margin: 0,
                            flexShrink: 0,
                            maxWidth: maxLabelWidth,
                            ...truncate,
                            paddingLeft: 2,
                            color: "gray",
                            paddingRight: 10,
                        }}
                    >
                        {label}
                    </label>
                    <input
                        value={inpValue}
                        ref={inp}
                        onChange={e => setInpVal(e.target.value)}
                        style={{ ...text, ...bg, padding: 0, margin: 0, fontFamily: "inherit", flexGrow: 1, outline: "none", border: "0px" }}
                        onKeyDown={e => {
                            const value = e.currentTarget.value;

                            if (e.key === "Enter") {
                                const endCommand = value.indexOf(" ");
                                const hasArgs = endCommand !== -1;
                                const command = value.substring(0, hasArgs ? endCommand : value.length);
                                cons.exec(command, ...parseArgs(hasArgs ? value.substring(endCommand + 1) : ""));

                                setInpVal("");
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
});

ReactCosole.displayName = "ReactCosole";

export default ReactCosole;
