import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';
import { searchResources, getResource } from '../scripts/agent-api.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
test('search supports case-insensitive query, category and pagination',async()=>{
 const result=await searchResources(root,{query:'CSS',limit:1});assert.equal(result.items.length,1);assert.ok(result.total>=2);
 const next=await searchResources(root,{query:'CSS',offset:1,limit:1});assert.notEqual(result.items[0].slug,next.items[0].slug);
 assert.equal((await searchResources(root,{query:'nonexistent-res-73918'})).total,0);
 assert.ok((await searchResources(root,{category:'component'})).items.every(x=>x.category==='component'));
 await assert.rejects(getResource(root,'../../private'),/not found/);
});
test('real stdio MCP handshake, discovery, input validation and source read', {timeout:15000}, async()=>{
 const transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('../mcp/server.mjs',import.meta.url))],cwd:'/tmp',stderr:'pipe'});
 const client=new Client({name:'opencraft-test',version:'1.0.0'});
 try{
  await client.connect(transport);
  const tools=await client.listTools();assert.deepEqual(tools.tools.map(t=>t.name).sort(),['get_contribution_guide','get_resource','search_resources']);
  assert.ok(tools.tools.every(t=>t.annotations.readOnlyHint));
  const result=await client.callTool({name:'search_resources',arguments:{query:'Paper',limit:1}});assert.equal(JSON.parse(result.content[0].text).items[0].slug,'paper-studio');
  const resource=await client.callTool({name:'get_resource',arguments:{slug:'paper-studio'}});assert.match(JSON.parse(resource.content[0].text).source,/SPDX-License-Identifier/);
  const missing=await client.callTool({name:'get_resource',arguments:{slug:'does-not-exist'}});assert.equal(missing.isError,true);
  const invalid=await client.callTool({name:'search_resources',arguments:{limit:1000}});assert.equal(invalid.isError,true);
  const guide=await client.callTool({name:'get_contribution_guide',arguments:{}});assert.match(guide.content[0].text,/--allow-publish/);
 }finally{await client.close();}
});
