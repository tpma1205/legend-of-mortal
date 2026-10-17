import "@shuimo-design/react/style.css";
import { createInkEngine, preloadStampFont } from "@shuimo-design/react/ink";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

createInkEngine();
void preloadStampFont({ text: "活俠" });

createRoot(document.getElementById("root")!).render(<App />);
