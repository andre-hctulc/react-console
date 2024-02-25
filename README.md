# react-console

A simple React console for logging or executing commands

## Usage

```tsx
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

```tsx
const { exec, log } = useReactConsole();
// Commands can also be executed in the console via user input
exec("alert", "Hello world!");
log("Hello world!");
log(logOptions({ type: "error" }), "An error occured:", new Error("error message"));
log("Connected", logOption({ type: "info" }), connection);
```
