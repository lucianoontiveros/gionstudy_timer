import imagemin from 'imagemin';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminPngquant from 'imagemin-pngquant';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const optimizeImages = async () => {
  try {
    console.log('Optimizando imágenes...');
    
    const files = await imagemin(['public/img/*.{jpg,jpeg,png}'], {
      destination: 'public/img/optimized',
      plugins: [
        imageminMozjpeg({ quality: 80 }),
        imageminPngquant({
          quality: [0.6, 0.8]
        })
      ]
    });

    console.log('Imágenes optimizadas:');
    files.forEach(file => {
      const originalPath = path.join('public/img', path.basename(file.sourcePath));
      console.log(`${originalPath} -> ${file.dataPath} (${Math.round((1 - file.data.length / file.source.length) * 100)}% reducción)`);
    });

  } catch (error) {
    console.error('Error optimizando imágenes:', error);
  }
};

optimizeImages();
