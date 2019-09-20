const commander = require('commander');
const npmPackage =  require('../package.json');
const codeCacheCompiler =  require('../index.js');
var isHelp = true;
function command(commandName) {
    return (...arg)=>{
        isHelp = false;
        codeCacheCompiler[commandName](...arg)
    }
}

function help() {
    if(isHelp) {
        commander.help();
    }
    isHelp = true;
}

commander.version(npmPackage.version);
commander
        .option('-c, --compile <src> <dist>', 'compile src to code cache',command('compile'))
        .option('-r, --run <dist>', 'run code cache',command('run'))
        .on('command:*', help)
        .parse(process.argv);