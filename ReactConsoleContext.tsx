"use client";

import React from "react";

// Context

const ReactConsoleContext = React.createContext<ReactConsoleContext | null>(null);

interface ReactConsoleContext {
    log(...args: any[]): void;
    addListener(listener: Logger): void;
    removeListener(listener: Logger): void;
    exec(command: string, ...args: string[]): void;
    options: ReactConsoleOptions;
}

export function useReactConsoleContext() {
    const ctx = React.useContext(ReactConsoleContext);
    if (!ctx) throw new Error("No ReactConsoleContext found!");
    return ctx;
}

// Util

const optionsSymbol = Symbol("__$ReactConsoleOptions$__");

export function logOptions(opts: LogOptions) {
    return { ...opts, [optionsSymbol]: true };
}

// Types

export interface LogOptions {
    style?: React.CSSProperties;
    className?: string;
    type?: "warn" | "error" | "info";
}

export type Logger = (options: LogOptions, ...args: any[]) => void;

type ServerOptions = {
    url: string;
    /** The method defaults to "POST" */
    requestInit?: Omit<RequestInit, "body">;
};

export type ReactConsoleOptions = {
    /**
     * Log to default console (`console.log|error|warn|info`)
     * @default false
     * */
    defaultLogs?: boolean;
    serverOptions?: ServerOptions;
    server?: ServerOptions;
    /**
     * Default commands: `echo`
     */
    commands?: Record<string, (...args: any[]) => void>;
    onLog?: (options: LogOptions, ...args: any[]) => void;
    colors?: { warn?: string; error?: string; info?: string };
    disableDefaultCommands?: boolean;
};

// Provider

interface ReactConsoleProviderProps {
    options: ReactConsoleOptions;
    children?: React.ReactNode;
}

export default function ReactConsoleProvider({ options, ...props }: ReactConsoleProviderProps) {
    const logListeners = React.useMemo<Set<(...args: any[]) => void>>(() => new Set(), []);
    const log = React.useCallback(
        (...args: any[]) => {
            // get log options
            const foundLogOptions: LogOptions[] = [];
            const _args: any[] = [];

            args.forEach(arg => {
                if (arg[optionsSymbol]) foundLogOptions.push(arg);
                else _args.push(arg);
            });

            const _logOptions = foundLogOptions.reduce((allOptions, opts) => ({ ...allOptions, ...opts }), {});

            options.onLog?.(_logOptions, ..._args);

            // real console log
            if (options.defaultLogs) {
                switch (_logOptions.type) {
                    case "error":
                        console.log(_args);
                        break;
                    case "warn":
                        console.warn(_args);
                        break;
                    case "info":
                        console.info(_args);
                        break;
                    default:
                        console.log(_args);
                        break;
                }
            }

            // server log
            if (options.server) {
                fetch(options.server.url, {
                    ...options.server.requestInit,
                    method: options.server.requestInit?.method ?? "POST",
                    body: JSON.stringify({ args: _args, options: { type: _logOptions.type } }),
                })
                    .then()
                    .catch(err => {
                        log(logOptions({ type: "error" }), "Server log failed: ", err instanceof Error ? err.message : err.toString());
                    });
            }

            // raect console log
            logListeners.forEach(listener => listener(_logOptions, ..._args));
        },
        [logListeners, options.defaultLogs]
    );
    const exec = React.useCallback(
        async (command: string, ...args: string[]) => {
            const comm = options.commands?.[command];

            if (comm) {
                try {
                    await comm(...args);
                } catch (err) {
                    log(logOptions({ type: "error", style: { fontStyle: "italic" } }), `Command '${command}' failed: ${err instanceof Error ? err.message : err + ""}`);
                }
            } else {
                if (!options.disableDefaultCommands) {
                    // default commands
                    switch (command) {
                        case "echo":
                            return log(args.join(" "));
                    }
                }

                log(logOptions({ type: "warn", style: { fontStyle: "italic" } }), `Command '${command}' not found`);
            }
        },
        [options.commands]
    );
    const addListener = React.useCallback((listener: (...args: any[]) => void) => logListeners.add(listener), [logListeners]);
    const removeListener = React.useCallback((listener: (...args: any[]) => void) => logListeners.delete(listener), [logListeners]);

    return <ReactConsoleContext.Provider value={{ log, exec, addListener, removeListener, options }}>{props.children}</ReactConsoleContext.Provider>;
}
