
const fs = require('fs')
const path = require('path')
const ncc = require('@zeit/ncc');


class CodeCacheCompiler {
    async compile(srcPath, distPath) {
        if(!path.isAbsolute(srcPath)) {
            srcPath = path.join(process.cwd(),srcPath);
        }
        if (!distPath) {
            distPath = `${srcPath}.bc`
        }
        if(!path.isAbsolute(distPath)) {
            distPath = path.join(process.cwd(),distPath);
        }
        let res = await ncc(srcPath, {
            filterAssetBase: process.cwd(),
            minify: false, 
            sourceMapRegister: true, 
            watch: false, 
            v8cache: true, 
            quiet: false, 
            debugLog: false 
          });
        let { code, map, assets } = res;
        let cacheName = `index.js.cache`;
        let cacheNameJs = `index.js.cache.js`;
        let outputJson = {
            'cacheBuf':assets[cacheName].source.toJSON(),
            sourceLength:assets[cacheNameJs].source.length,
            source:assets[cacheNameJs].source
        }
        fs.writeFileSync(distPath,JSON.stringify(outputJson));
    }
    run (distPath) {
        if(!path.isAbsolute(distPath)) {
            distPath = path.join(process.cwd(),distPath);
        }
        let ccDataJson = fs.readFileSync(distPath);
        let ccData = JSON.parse(ccDataJson);
        let cacheBuf = Buffer.from(ccData.cacheBuf);
        const { Script } = require('vm'), { wrap } = require('module');
        const cachedData = !process.pkg && require('process').platform !== 'win32' && cacheBuf;
        const script = new Script(wrap(ccData.source), cachedData ? { cachedData } : {});
        (script.runInThisContext())(exports, require, module, __filename, __dirname);
    }
}
module.exports = new CodeCacheCompiler()
