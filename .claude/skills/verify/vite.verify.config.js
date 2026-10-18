// Same as the repo config but proxies /api to this worktree's throwaway wrangler instead of :8788.
import { mergeConfig } from 'vite';
import base from '../../../vite.config.js';

export default mergeConfig(base, {
  root: new URL('../../../', import.meta.url).pathname,
  server: { proxy: { '/api': { target: `http://localhost:${process.env.VERIFY_API_PORT}`, changeOrigin: true } } },
});
