import { readCatalog } from '../../scripts/catalog.mjs';
import { z } from 'zod';
import { resourceSchema } from '../../scripts/catalog.mjs';
export type Resource = z.infer<typeof resourceSchema>;
export const resources: Resource[] = await readCatalog();
export const categories = { section: '页面区块', component: '交互组件', background: '视觉背景' };
export const repo = 'https://github.com/rhne2061-alt/open-craft';
export const url = (path = '') => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path}`;
