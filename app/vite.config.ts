import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

const ReactCompilerConfig = {
    sources: (filename) => {
        return true;
        // return filename.indexOf('src/path/to/dir') !== -1;
    },
};

export default defineConfig({
    esbuild: {
        logOverride: { "this-is-undefined-in-esm": "silent" }
    },
    build: {
        outDir: "./build",
        target: "esnext",
        sourcemap: true
    },
    optimizeDeps: { include: ["react/jsx-runtime"] },
    plugins: [
        react({
            babel: {
                plugins: [
                    ["babel-plugin-react-compiler", ReactCompilerConfig],
                ],
            },
        })
    ]
})
