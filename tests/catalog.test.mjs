import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readCatalog, resourceSchema } from '../scripts/catalog.mjs';
const sample = {slug:'example',title:'Example',description:'A useful example for a community catalog.',category:'section',tags:['CSS'],author:'A contributor',license:'MIT',source:'examples/example.html',prompt:'Create a self-contained responsive HTML and CSS hero with a clear title, body and one call to action. No external assets.'};
async function fixture(t, data=sample, html='<!-- SPDX-License-Identifier: MIT --><h1>Hello</h1>') {
  const root = await mkdtemp(join(tmpdir(),'opencraft-'));
  t.after(() => rm(root,{recursive:true,force:true}));
  await mkdir(join(root,'resources'));
  await mkdir(join(root,'public/examples'),{recursive:true});
  await writeFile(join(root,'resources/example.json'),JSON.stringify(data));
  if(html!==null) await writeFile(join(root,'public/examples/example.html'),html);
  return root;
}
test('catalog contains real resources with unique slugs',async()=>{const items=await readCatalog();assert.ok(items.length>=3);assert.equal(new Set(items.map(i=>i.slug)).size,items.length);});
test('rejects path traversal and unknown licenses',()=>{assert.equal(resourceSchema.safeParse({...sample,source:'../../secret.html'}).success,false);assert.equal(resourceSchema.safeParse({...sample,license:'Proprietary'}).success,false);});
test('rejects missing preview file',async t=>{await assert.rejects(readCatalog(await fixture(t,sample,null)),/ENOENT/);});
test('rejects executable and remote preview content',async t=>{for(const html of ['<script>alert(1)</script>','<img src="https://example.com/a.png">','<p onclick="alert(1)">x</p>','<style>@import "remote.css";</style>'])await assert.rejects(readCatalog(await fixture(t,sample,html)),/Unsupported/);});
test('rejects mismatched SPDX license',async t=>{await assert.rejects(readCatalog(await fixture(t,sample,'<!-- SPDX-License-Identifier: Apache-2.0 -->')),/SPDX/);});
test('rejects file and slug mismatch',async t=>{await assert.rejects(readCatalog(await fixture(t,{...sample,slug:'other'})),/File name/);});
test('accepts a valid independently authored resource',async t=>{const result=await readCatalog(await fixture(t));assert.equal(result[0].title,'Example');});
