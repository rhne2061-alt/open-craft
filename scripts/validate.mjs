import { readCatalog } from './catalog.mjs';
const items = await readCatalog();
console.log(`Validated ${items.length} resources, licenses and local source files.`);
