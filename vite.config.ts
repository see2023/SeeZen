import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import fs from 'fs';
import path from 'path';

// Read manifest.json
const manifestFile = fs.readFileSync('./src/manifest.json', 'utf-8');
const manifest = JSON.parse(manifestFile);

// 自定义插件：复制音频文件到dist/sounds
function copyAudioFiles() {
  return {
    name: 'copy-audio-files',
    buildEnd() {
      const srcDir = path.resolve(__dirname, 'src/public/sounds');
      const destDir = path.resolve(__dirname, 'dist/sounds');
      
      // 确保目标目录存在
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      // 复制所有音频文件
      try {
        const files = fs.readdirSync(srcDir);
        files.forEach(file => {
          if (file.endsWith('.mp3')) {
            fs.copyFileSync(
              path.resolve(srcDir, file),
              path.resolve(destDir, file)
            );
            console.log(`Copied: ${file} to dist/sounds`);
          }
        });
      } catch (error) {
        console.error('Error copying audio files:', error);
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    crx({ 
      manifest,
    }),
    copyAudioFiles(),
  ],

  build: {
    target: 'es2015', // 确保兼容性
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, 'src/pages/popup/index.html'),
        options: path.resolve(__dirname, 'src/pages/options/index.html'),
        blocked: path.resolve(__dirname, 'src/pages/blocked/index.html'),
      },
    },
    chunkSizeWarningLimit: 1500, // 增加警告限制
  },

  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      host: 'localhost',
      port: 5173,
      protocol: 'ws',
    },
    cors: true,
  },
}); 