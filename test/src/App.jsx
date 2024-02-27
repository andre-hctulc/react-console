import { ReactConsoleProvider, ReactConsole } from "../..";
import Input from "./Input";
const commands = {
    alert: (...args) => {
        alert(args.join(";") + args.length);
    },
};
function App() {
    return (<ReactConsoleProvider options={{ commands }}>
            <Input />
            <ReactConsole />
        </ReactConsoleProvider>);
}
export default App;
