import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import glsl from "vite-plugin-glsl"
import react from "@vitejs/plugin-react-swc"
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        port: 3000,
    },
    assetsInclude: ["**/*.glb"],
    resolve: {
        alias: {
            "@components": path.resolve(__dirname, "src/components"),
            "@data": path.resolve(__dirname, "src/data"),
            "@assets": path.resolve(__dirname, "assets"),
        },
    },
    plugins: [
        react(),
        glsl(),
        VitePWA({
            registerType: "prompt", 
            includeAssets: ["fonts/*.woff", "**/*.glb", "textures/*.png"],
            manifest: {
                name: "Ivar",
                short_name: "Ivar",
                display: "fullscreen",
                description: "Untitled Furniture Game",
                orientation: "landscape",
                theme_color: "#0026ff",
                icons: [
                    {
                        "src": "/icons/pwa-icon.png",
                        "sizes": "512x512",
                        "type": "image/png",
                        "purpose": "any maskable"
                    },
                ]
            }
        })
    ],
})