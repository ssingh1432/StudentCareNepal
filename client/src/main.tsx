import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add Cloudinary widget script
const cloudinaryScript = document.createElement("script");
cloudinaryScript.src = "https://upload-widget.cloudinary.com/global/all.js";
cloudinaryScript.async = true;
document.head.appendChild(cloudinaryScript);

createRoot(document.getElementById("root")!).render(<App />);
