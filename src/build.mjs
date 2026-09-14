import {mkdir,cp,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist');
for(const p of ['src','public','package.json'])await cp(p,`dist/${p}`,{recursive:true});
console.log('Built First Light from source.');
