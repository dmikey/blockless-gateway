import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vitejs.dev/config/
export default defineConfig({
	root: path.resolve(__dirname, 'pages'),
	plugins: [react(), viteSingleFile()],
	build: {
		outDir: path.resolve(__dirname, 'dist'),
		rollupOptions: {
			input: {
				404: fileURLToPath(new URL('./pages/404.html', import.meta.url))
			}
		}
	}
})
