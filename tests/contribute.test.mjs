import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { prepareContribution, submitContribution } from '../scripts/contribute.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
test('preview scopes exactly three resource files and is deterministic',async()=>{
 const plan=await prepareContribution(root,'paper-studio');
 assert.deepEqual(plan.files.map(f=>f.path),['resources/paper-studio.json','public/examples/paper-studio.html','public/examples/paper-studio.LICENSE.txt']);
 assert.equal(plan.branch,(await prepareContribution(root,'paper-studio')).branch);
 await assert.rejects(prepareContribution(root,'../secret'),/valid/);
});
test('refuses symlink license and obvious credentials',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'opencraft-input-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const plan=await prepareContribution(root,'paper-studio');
 for(const f of plan.files){await mkdir(join(dir,f.path,'..'),{recursive:true});await writeFile(join(dir,f.path),f.content);}
 const license=join(dir,plan.files[2].path);await rm(license);await symlink(join(root,'LICENSE'),license);
 await assert.rejects(prepareContribution(dir,'paper-studio'),/Unsafe/);
 await rm(license);await writeFile(license,'-----BEGIN PRIVATE KEY-----');
 await assert.rejects(prepareContribution(dir,'paper-studio'),/credential/);
});
test('submission creates a scoped draft PR in a verified contributor fork',async()=>{
 const plan=await prepareContribution(root,'paper-studio');const calls=[];
 const run=(cmd,args)=>{calls.push([cmd,args]);
  if(cmd==='gh'&&args.join(' ')==='api user')return JSON.stringify({login:'contributor',id:123});
  if(cmd==='gh'&&args[0]==='api'&&args[1].endsWith('/pulls'))return '[]';
  if(cmd==='gh'&&args[0]==='api')return JSON.stringify({parent:{full_name:'rhne2061-alt/open-craft'}});
  if(cmd==='gh'&&args[0]==='pr'&&args[1]==='create')return 'https://github.com/rhne2061-alt/open-craft/pull/42';
  if(cmd==='git'&&args[0]==='diff')return 'resources/paper-studio.json';
  return '';
 };
 const result=await submitContribution(plan,run);assert.match(result.url,/pull\/42$/);
 const stage=calls.find(([cmd,args])=>cmd==='git'&&args[0]==='add')[1];assert.deepEqual(stage.slice(2),plan.files.map(f=>f.path));
 assert.ok(calls.some(([cmd,args])=>cmd==='gh'&&args.includes('--draft')));
 const push=calls.find(([cmd,args])=>cmd==='git'&&args.includes('push'))[1];assert.ok(push.includes('https://github.com/contributor/open-craft.git'));assert.ok(!push.includes('main'));
});
test('reuses prior PR without creating commits or pushing',async()=>{
 const plan=await prepareContribution(root,'paper-studio');const calls=[];
 const result=await submitContribution(plan,(cmd,args)=>{calls.push(cmd);if(args.join(' ')==='api user')return JSON.stringify({login:'rhne2061-alt',id:123});return JSON.stringify([{html_url:'https://github.com/rhne2061-alt/open-craft/pull/42'}]);});
 assert.equal(result.reused,true);assert.ok(!calls.includes('git'));
});
test('does not upload to an unrelated same-name repository',async()=>{
 const plan=await prepareContribution(root,'paper-studio');
 await assert.rejects(submitContribution(plan,(_cmd,args)=>{if(args.join(' ')==='api user')return JSON.stringify({login:'contributor',id:123});if(args[0]==='api')return JSON.stringify({parent:{full_name:'someone/other'}});return '';}),/not a fork/);
});
