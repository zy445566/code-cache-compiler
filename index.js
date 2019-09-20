const vm = require('vm');
const webpack = require('webpack');
const MemoryFS = require("memory-fs");
const fs = require("fs");
const mfs = new MemoryFS();
const path = require('path');
const webpackConfig = require('./webpack.config.js');



class CodeCacheCompiler {
    compile(srcPath, distPath) {
        if(!distPath) {distPath = `${path.basename(srcPath,'.js')}.bc`}
        webpackConfig.entry = path.join(process.cwd(),srcPath);
        webpackConfig.output.path = process.cwd();
        webpackConfig.output.filename = distPath;
        const compiler = webpack(webpackConfig);
        compiler.outputFileSystem = mfs;
        compiler.run((err, stats)=>{
            process.stdout.write(stats.toString({
            errors: true,
            warnings: true,
            modules: false,
            chunks: false,
            colors: true
            }));
            process.stdout.write(`\nCompile...\n`)
            const content = mfs.readFileSync(path.join(process.cwd(),distPath));
            let scriptObj = new vm.Script(content,{produceCachedData: true});
            console.log(content.toString().length)
            let cacheBuf = scriptObj.cachedData;
            process.stdout.write(`outPut...\n`)
            let outPutPath = path.join(process.cwd(),distPath);
            fs.writeFileSync(path.join(process.cwd(),distPath),cacheBuf);
            process.stdout.write(`Success Complete\n`)
            process.stdout.write(`outPutPath:${outPutPath}\n`)
        })
    }
    run (distPath) {
        let codeBuffer = Buffer.alloc(3687);// 这里的长度要和原代码长度保持一致来欺骗使用cachedData
        const scriptObj = new vm.Script(codeBuffer,{cachedData:fs.readFileSync(path.join(process.cwd(),distPath))})
        const sandbox={require,console};
        const context = vm.createContext(sandbox);
        scriptObj.runInContext(context);
    }
}
module.exports = new CodeCacheCompiler()
