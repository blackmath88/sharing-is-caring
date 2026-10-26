import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' + hash routing = läuft auf GitHub Pages unter jedem Repo-Pfad
export default defineConfig({ base: './', plugins: [react()] })
