import type { LocalImageService } from 'astro';
import sharp from 'astro/assets/services/sharp';

// GIF teaching diagrams must keep their original animation and bytes.
// All other images continue through Astro's standard Sharp service.
export default {
  ...sharp,
  validateOptions(options, config, logger) {
    if (typeof options.src === 'object' && options.src.format === 'gif') {
      options.format = 'gif';
    }
    return sharp.validateOptions!(options, config, logger);
  },
  transform(input, options, config, logger) {
    const signature = new TextDecoder().decode(input.subarray(0, 6));
    if (signature === 'GIF87a' || signature === 'GIF89a') {
      return Promise.resolve({ data: input, format: 'gif' });
    }
    return sharp.transform(input, options, config, logger);
  },
} satisfies LocalImageService;
