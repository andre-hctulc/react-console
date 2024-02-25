import { useReactConsoleContext } from "./ReactConsoleContext";
import React from "react";

export default function useReactConsole() {
    const { log, exec } = useReactConsoleContext();

    const _log = React.useCallback(
        (...args: any) => {
            log(...args);
        },
        [log]
    );

    const _exec = React.useCallback(
        (command: string, ...args: any) => {
            exec(command, ...args);
        },
        [exec]
    );

    return { log: _log, exec: _exec };
}
