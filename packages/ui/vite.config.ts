import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
	root: path.resolve(__dirname, 'pages'),
	plugins: [react()],
	build: {
		outDir: path.resolve(__dirname, 'dist'),
		rollupOptions: {
			input: {
				login: fileURLToPath(new URL('./pages/login.html', import.meta.url)),
				404: fileURLToPath(new URL('./pages/404.html', import.meta.url))
			}
		}
	}
})
