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
const border = "1px solid gray";

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
                width: "100%",
                borderBottom: border,
                height,
                maxHeight: height,
            };
        case "left":
            return {
                left: 0,
                height: "100%",
                borderRight: border,
                maxWidth: width,
            };
        case "right":
            return {
                right: 0,
                height: "100%",
                borderLeft: border,
                width,
                maxWidth: width,
            };
        case "bottom":
            return {
                bottom: 0,
                width: "100%",
                borderTop: border,
                height,
                //maxHeight: height,
            };
    }
};

const flexRow: React.CSSProperties = { display: "flex", flexDirection: "row" };
const flexCol: React.CSSProperties = { display: "flex", flexDirection: "column" };
const text: React.CSSProperties = { fontSize: "17px" };
const bg = { background: "#f6f6f6" };
const truncate: React.CSSProperties = { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const longText: React.CSSProperties = { whiteSpace: "normal", overflow: "visible", textOverflow: "clip" };

// Component

const maxLabelWidth = 180;

interface ReactConsoleProps {
    title?: string;
    /** controlled */
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

export default function ReactCosole(props: ReactConsoleProps) {
    const [open, setOpen] = React.useState(() => props.open ?? localStorage.getItem(storagePre + "open") === "true");
    const root = React.useRef<HTMLDivElement>(null);
    const [position, setPosition] = React.useState(props.defaultPosition || "bottom");
    const cons = useReactConsoleContext();
    const [logs, setLogs] = React.useState<{ options: LogOptions; nodes: React.ReactNode[]; id: string }[]>([]);
    const leftRight = position === "left" || position === "right";
    const [inpValue, setInpVal] = React.useState("");
    const inp = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (props.open !== undefined) _open(props.open);
    }, [props.open]);

    React.useEffect(() => {
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

    function handleClick(e: React.MouseEvent) {
        inp.current?.focus();
    }

    function _open(open: boolean) {
        setOpen(open);
        localStorage.setItem(storagePre + "open", open + "");
    }

    if (!open) return null;

    return (
        <div
            onClick={handleClick}
            style={{
                ...flexCol,
                ...bg,
                overflowY: "auto",
                minHeight: 0,
                minWidth: 0,
                position: "fixed",
                cursor: "text",
                boxShadow: "10px",
                ...getPositionStyle(position),
                ...props.style,
            }}
            className={props.className}
            ref={root}
        >
            <div style={{ flexShrink: 0, position: "sticky", top: 0, ...flexRow }}>
                <span style={{ ...bg, borderBottomRightRadius: 5, padding: 3, color: "lightgrey", fontSize: 14 }}>
                    {props.title ?? "ReactConsole"} <i style={{ paddingLeft: 5 }}>{logs.length} Logs</i>
                </span>
                <svg
                    style={{ rotate: "45deg", marginLeft: "auto", marginTop: 4, marginRight: 4, cursor: "pointer" }}
                    onClick={() => setOpen(false)}
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 100 100"
                >
                    <line x1="0" y1="50" x2="100" y2="50" stroke="black" stroke-width="7" />
                    <line x1="50" y1="0" x2="50" y2="100" stroke="black" stroke-width="7" />
                </svg>
            </div>
            <ol style={{ ...flexCol, flexShrink: 0, padding: 0, margin: 0, listStyleType: "none" }}>
                {logs.map(log => {
                    return (
                        <li style={{ ...flexRow, flexShrink: 0, flexDirection: leftRight ? "column" : "row" }} key={log.id}>
                            <span style={{ ...text, ...truncate, maxWidth: maxLabelWidth, flexShrink: 0, paddingLeft: 2, color: "gray", paddingRight: 10 }}>{label}</span>
                            <div style={{ ...text, color: getTypeColor(log.options.type), ...log.options.style }} className={props.className}>
                                {log.nodes}
                            </div>
                        </li>
                    );
                })}
            </ol>
            {!props.disableInput && (
                <div style={{ ...flexRow, ...bg, flexShrink: 0, background: "inherit", position: "sticky", bottom: 0 }}>
                    <label style={{ ...text, flexShrink: 0, maxWidth: maxLabelWidth, ...truncate, paddingLeft: 2, color: "gray", paddingRight: 10 }}>{label}</label>
                    <input
                        value={inpValue}
                        ref={inp}
                        onChange={e => setInpVal(e.target.value)}
                        style={{ ...text, ...bg, fontFamily: "inherit", flexGrow: 1, outline: "none", border: "0px" }}
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
}
