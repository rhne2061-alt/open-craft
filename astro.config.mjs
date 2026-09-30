import { defineConfig } from 'astro/config';
const repository = process.env.GITHUB_REPOSITORY;
export default defineConfig({
  site: repository ? `https://${repository.split('/')[0]}.github.io` : undefined,
  base: repository ? `/${repository.split('/')[1]}` : '/',
  output: 'static',
  trailingSlash: 'always',
});
