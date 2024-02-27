import React from "react";
import { logOptions, useReactConsole } from "../..";

export default function Input() {
    const [inputValue, setInputValue] = React.useState("");
    const { log, exec } = useReactConsole();

    const info = () => {
        log(logOptions({ type: "info" }), "This is info");
    };
    const warn = () => {
        log(logOptions({ type: "warn" }), "This is a warning");
    };
    const error = () => {
        log(logOptions({ type: "error" }), "This is an error", new Error("Error message"));
    };
    const l = () => {
        log(
            <div>
                <button>Button</button>
                <br />
                <span>ascsdc<br/>asxasc</span>
            </div>
        );
    };
    const e = () => {
        exec("alert", "this", "sssss");
    };

    return (
        <div>
            <textarea value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="Type something..." />
            <button onClick={info}>info</button>
            <button onClick={error}>error</button>
            <button onClick={warn}>warn</button>
            <button onClick={l}>log</button>
            <button onClick={e}>exec</button>
        </div>
    );
}
