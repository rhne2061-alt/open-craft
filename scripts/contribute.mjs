import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir, mkdtemp, rm, lstat, realpath } from 'node:fs/promises';
import { resolve, dirname, relative, isAbsolute, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { parseArgs } from 'node:util';
import { readCatalog } from './catalog.mjs';
import { UPSTREAM } from './agent-api.mjs';
const defaultRoot = fileURLToPath(new URL('../',import.meta.url));
export async function prepareContribution(root, slug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || '')) throw new Error('Provide a valid --slug.');
  const resource = (await readCatalog(root)).find(item => item.slug === slug);
  if (!resource) throw new Error(`Resource not found: ${slug}`);
  if (resource.source !== `examples/${slug}.html`) throw new Error('Contribution source filename must match slug.');
  const paths = [`resources/${slug}.json`, `public/${resource.source}`, `public/examples/${slug}.LICENSE.txt`];
  const canonicalRoot = await realpath(root);
  const files = [];
  for (const path of paths) {
    const full = resolve(root,path);
    const info = await lstat(full); // A complete independent license file is required.
    const rel = relative(canonicalRoot,await realpath(full));
    if (info.isSymbolicLink() || !info.isFile() || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error(`Unsafe contribution file: ${path}`);
    if (info.size > 256_000) throw new Error(`File exceeds 256 KB: ${path}`);
    const content = await readFile(full,'utf8');
    if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{20,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b/.test(content)) throw new Error(`Potential credential in ${path}`);
    files.push({path,content});
  }
  const hash=createHash('sha256').update(JSON.stringify(files)).digest('hex').slice(0,16);
  return {upstream:UPSTREAM,slug,title:`resource: ${resource.title}`,branch:`contribute/${slug}-${hash}`,files,body:`## Resource contribution\n\n${resource.description}\n\n- Resource: ${slug}\n- Author: ${resource.author}\n- License: ${resource.license}\n- Scope: metadata, HTML/CSS source and resource license only\n- Local catalog validation passed. Full build, browser behavior and provenance require CI/reviewer verification.\n\nPrepared by the OpenCraft contribution CLI with the contributor's explicit publish authorization.\n\nPlease review attribution, license, rendering and content before merging.\n`};
}
const runDefault=(command,args,options={})=>execFileSync(command,args,{encoding:'utf8',maxBuffer:4*1024*1024,stdio:['ignore','pipe','pipe'],...options}).trim();
export async function submitContribution(plan, run=runDefault) {
  const user=JSON.parse(run('gh',['api','user']));
  const owner=UPSTREAM.split('/')[0],name=UPSTREAM.split('/')[1];
  if (!/^[A-Za-z0-9-]+$/.test(user.login)) throw new Error('Invalid GitHub identity.');
  const target=`${user.login}/${name}`;
  if(user.login !== owner) {
    run('gh',['repo','fork',UPSTREAM,'--clone=false','--remote=false']);
    const fork=JSON.parse(run('gh',['api',`repos/${target}`]));
    if(fork.parent?.full_name?.toLowerCase() !== UPSTREAM.toLowerCase()) throw new Error('The destination is not a fork of OpenCraft.');
  }
  const head=`${user.login}:${plan.branch}`;
  const existing=JSON.parse(run('gh',['api',`repos/${UPSTREAM}/pulls`,'--method','GET','-f',`head=${head}`,'-f','state=all']));
  if(existing.length) return {url:existing[0].html_url,reused:true};
  const dir=await mkdtemp(resolve(tmpdir(),'opencraft-contribution-'));
  try {
    run('git',['clone','--depth','1','--branch','main',`https://github.com/${UPSTREAM}.git`,dir]);
    run('git',['switch','-c',plan.branch],{cwd:dir});
    for(const file of plan.files){const full=resolve(dir,file.path);await mkdir(dirname(full),{recursive:true});await writeFile(full,file.content);}
    run('git',['add','--',...plan.files.map(file=>file.path)],{cwd:dir});
    const diff=run('git',['diff','--cached','--name-only'],{cwd:dir});
    if(!diff) throw new Error('No changes compared with upstream main; no PR created.');
    run('git',['-c',`user.name=${user.login}`,'-c',`user.email=${user.id}+${user.login}@users.noreply.github.com`,'commit','-m',plan.title],{cwd:dir});
    const destination=`https://github.com/${target}.git`;
    const remote=run('git',['ls-remote',destination,`refs/heads/${plan.branch}`],{cwd:dir});
    if(remote) {
      run('git',['fetch','--depth','1',destination,plan.branch],{cwd:dir});
      for(const file of plan.files)if(run('git',['show',`FETCH_HEAD:${file.path}`],{cwd:dir})!==file.content.trim())throw new Error('Existing branch content differs; refusing to overwrite it.');
    } else {
      run('git',['-c','credential.helper=','-c','credential.helper=!gh auth git-credential','push',destination,`HEAD:refs/heads/${plan.branch}`],{cwd:dir});
    }
    const bodyFile=resolve(dir,'.opencraft-pr-body.md');await writeFile(bodyFile,plan.body);
    const url=run('gh',['pr','create','--repo',UPSTREAM,'--base','main','--head',head,'--draft','--title',plan.title,'--body-file',bodyFile],{cwd:dir});
    return {url,reused:false};
  } finally {await rm(dir,{recursive:true,force:true});}
}
async function main(){
  const {values}=parseArgs({options:{slug:{type:'string'},submit:{type:'boolean',default:false},'allow-publish':{type:'boolean',default:false}},strict:true});
  if(values.submit&&!values['allow-publish'])throw new Error('Publishing requires --allow-publish and prior user authorization for these resource files.');
  const plan=await prepareContribution(defaultRoot,values.slug);
  if(values.submit)console.log(JSON.stringify(await submitContribution(plan),null,2));
  else console.log(JSON.stringify({mode:'preview',upstream:plan.upstream,branch:plan.branch,title:plan.title,files:plan.files.map(f=>({path:f.path,bytes:Buffer.byteLength(f.content)})),body:plan.body,next:`npm run contribute -- --slug ${plan.slug} --submit --allow-publish`,notice:'Preview does not publish. Inspect these files and confirm sharing rights before authorizing submission.'},null,2));
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(error=>{console.error(error.message);process.exitCode=1;});
