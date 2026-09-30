import { z } from 'zod';
import { readdir, readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
export const resourceSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(2).max(80),
  description: z.string().min(12).max(240),
  category: z.enum(['section', 'component', 'background']),
  tags: z.array(z.string().min(1).max(30)).min(1).max(8),
  author: z.string().min(1).max(80),
  license: z.enum(['MIT', 'Apache-2.0', 'BSD-3-Clause', 'CC0-1.0']),
  source: z.string().regex(/^examples\/[a-z0-9-]+\.html$/),
  prompt: z.string().min(80).max(12000),
}).strict();
export async function readCatalog(root = process.cwd()) {
  const files = (await readdir(resolve(root, 'resources'))).filter(f => f.endsWith('.json')).sort();
  const items = [];
  for (const file of files) {
    const item = resourceSchema.parse(JSON.parse(await readFile(resolve(root, 'resources', file), 'utf8')));
    if (file !== `${item.slug}.json`) throw new Error(`File name must match slug: ${file}`);
    if (items.some(entry => entry.slug === item.slug)) throw new Error(`Duplicate slug: ${item.slug}`);
    await access(resolve(root, 'public', item.source));
    const source = await readFile(resolve(root, 'public', item.source), 'utf8');
    // A narrow v0.1 collection: self-contained, script-free HTML/CSS only.
    // This is an early rejection rule, not an HTML sanitizer; review remains mandatory.
    if (/<script\b|\bon\w+\s*=|javascript:|<iframe\b|<object\b|<embed\b|<base\b|<form\b|url\s*\(|@import|\b(?:src|href)\s*=\s*["']?\s*(?:https?:|\/\/|data:)/i.test(source)) {
      throw new Error(`Unsupported active or remote content in ${item.source}`);
    }
    if (/<meta[^>]+http-equiv\s*=\s*["']?refresh/i.test(source)) throw new Error(`Unsupported redirect in ${item.source}`);
    if (!source.includes('SPDX-License-Identifier: ' + item.license)) throw new Error(`Missing matching SPDX notice: ${item.source}`);
    items.push(item);
  }
  if (!items.length) throw new Error('Catalog cannot be empty');
  return items;
}
