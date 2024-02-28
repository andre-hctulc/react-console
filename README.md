# react-console

A simple React console for logging and executing commands

## Usage

```tsx
import { ReactConsole, ReactConsoleProvider } from "@react-console";

...

const options: ReactConsoleOptions = {
    // define commands
    commands: {
        alert: (...args: string[]) => alert(args.join(""))
    },
    // enable serever logging
    server: {
        url: "https://example.com/api/log"
    },
    // override default colors
    colors: {
        info: "#5c7ffe"
    }
    ...
}

<ReactConsoleProvider options={options}>
    <ReactConsole title="My Console" className="ConsoleTheme" />
</ReactConsoleProvider>
```

Now press `Ctrl + Shift + C` to toggle the open state of the console or use `ReactConsole.open` prop to control
the open state yourself. Use the input to execute commands. Default commands (_echo_) are available by default and can be overridden.

### useReactConsole

```tsx
import { logOptions } from "@react-console";

...

const { exec, log } = useReactConsole();

// logs
log("Hello world!");
log(<span>Hello</span>, "world!);
log(logOptions({ type: "error" }), "An error occured:", new Error("error message"));
log("Connected", logOption({ type: "info", style: { color: "violet", fontStyle: "italic" } }), connection);

// Execute commands programatically
exec("alert", "Hello world!");
exec("echo", "Echo", "Echoo")
```
