
const fs = require('fs')


class CodeCacheCompiler {
    compile(srcPath, distPathBasename) {
        let srcPath = path.join(process.cwd(),srcPath);
        let srcPathBasename = path.basename(srcPath);
        if(!distPathBasename) {
            distPathBasename = `${path.basename(srcPath,'.js')}.bc`
        }
        let distPath = path.join(process.cwd(),distPathBasename);
        let res = await require('@zeit/ncc')(srcPath, {
            filterAssetBase: process.cwd(),
            minify: false, 
            sourceMapRegister: true, 
            watch: false, 
            v8cache: true, 
            quiet: false, 
            debugLog: false 
          });
        let { code, map, assets } = res;
        let cacheName = `${srcPathBasename}.cache`;
        let cacheNameJs = `${cacheName}.js`;
        let outputJson = {
            'cacheBuf':assets[cacheName].source.toJSON(),
            sourceLength:assets[cacheNameJs].source.length
        }
        fs.writeFileSync(distPath,JSON.stringify(outputJson));
    }
    run (distPath) {
        let ccDataJson = fs.readFileSync(path.join(process.cwd(),distPath));
        let ccData = JSON.parse(ccDataJson);
        let cacheBuf = Buffer.from(ccData.cacheBuf);
        const { Script } = require('vm'), { wrap } = require('module');
        const cachedData = !process.pkg && require('process').platform !== 'win32' && cacheBuf;
        const script = new Script(wrap(Array(ccData.sourceLength).fill(' ').join('')), cachedData ? { cachedData } : {});
        (script.runInThisContext())(exports, require, module, __filename, __dirname);
    }
}
module.exports = new CodeCacheCompiler()
