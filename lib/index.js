var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const { Command } = require('commander');
const chalk = require('chalk');
const semver = require('semver');
const path = require('path');
const validateProjectName = require('validate-npm-package-name');
const fs = require('fs-extra');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const spawn = require('cross-spawn');
const packageJson = require('../package.json');
let projectName;
const templeUrls = {
    'react-starter': 'https://github.com/webpack/react-starter.git',
};
// check the app name is valid
function checkAppName(appName) {
    const validationResult = validateProjectName(appName);
    if (!validationResult.validForNewPackages) {
        console.error(chalk.red(`Cannot create a project named ${chalk.green(`"${appName}"`)} because of npm naming restrictions:\n`));
        [
            ...(validationResult.errors || []),
            ...(validationResult.warnings || []),
        ].forEach((error) => {
            console.error(chalk.red(`  * ${error}`));
        });
        console.error(chalk.red('\nPlease choose a different project name.'));
        process.exit(1);
    }
}
// install dependencies packages
function install(root, useYarn, usePnp, dependencies = [], isOnline) {
    return new Promise((resolve, reject) => {
        let command;
        let args;
        command = 'npm';
        args = ['install', '--save', '--loglevel', 'error'].concat(dependencies);
        const child = spawn(command, args, { cwd: `./${root}`, stdio: 'inherit' });
        console.log();
        console.log(chalk.green('Install dependencies....'));
        child.on('close', (code) => {
            if (code !== 0) {
                reject({
                    command: `${command} ${args.join(' ')}`,
                });
                return;
            }
            resolve();
        });
        // we can support Yarn or pnp
        // if (useYarn) {
        //   command = 'yarnpkg'
        //   args = ['add', '--exact']
        //   if (!isOnline) {
        //     args.push('--offline')
        //   }
        // }
    });
}
function creatApp(name, templateName, templateUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        // check node version
        const unSupportedNodeVersion = !semver.satisfies(process.version, '>=10');
        if (unSupportedNodeVersion) {
            console.log(chalk.yellow(`You are using Node ${process.version} so the project will be bootstrapped with an old unsupported version of tools.\n\n` +
                `Please update to Node 10 or higher for a better, fully supported experience.\n`));
        }
        // first judged to be a valid npm name, then try create the directory
        const root = path.resolve(name);
        const appName = path.basename(root);
        checkAppName(appName);
        fs.ensureDirSync(name);
        console.log();
        console.log(`Creating a new React app in ${chalk.green(root)}.`);
        const { stdout, stderr } = yield exec('git --version');
        if (stderr) {
            console.error(stderr);
        }
        if (stdout && stdout.includes('git version')) {
            console.log(stdout.trim());
            console.log();
            console.log(chalk.blue(`now clone the template in ${chalk.green(name)}....`));
            fs.emptyDirSync(name);
            console.log();
            console.log(chalk.magenta('Find folder successfully!'));
            console.log(templateUrl, templateName);
            // async exec download and git commit
            try {
                yield exec(`git clone ${templateUrl}`, { cwd: `./${name}` });
                console.log();
                console.log(chalk.blue('Downloading success!!!'));
                console.log();
                const stats = yield fs.stat(process.cwd() + `/${name}/${templateName}`);
                if (stats.isDirectory()) {
                    yield exec(`rm -rf .git && git init && git add . && git commit -m \"create front-end app\"`, { cwd: `./${name}/${templateName}` });
                }
                console.log(chalk.blue('Delete the origin git and add new git commit first time!!!'));
                yield install(`${name}/${templateName}`);
            }
            catch (err) {
                console.error(err);
            }
        }
    });
}
function init() {
    // config arguments and options
    const program = new Command(packageJson.name)
        .version(packageJson.version)
        .arguments('[project-directory]')
        .usage(`${chalk.green('[project-directory]')} [options]`)
        .action((name) => {
        projectName = name;
    })
        .option('-t --template <template>', 'choose the template you have options: [micro-starter]', 'react-starter')
        .on('--help', () => {
        console.log();
        console.log(`Only ${chalk.green('[project-directory]')} is ${chalk.red('required')}.`);
        console.log();
        console.log(`And default option template is: ${chalk.green('<react-starter>')}`);
    })
        .description('react-starter-cli command', {
        projectName: 'You set the root of your project directory',
    })
        .parse(process.argv);
    // warning and show example how to add projectName follow the CLI
    if (typeof projectName === 'undefined') {
        console.error('Please specify the project directory:');
        console.log(`  ${chalk.cyan(program.name())} ${chalk.green('<project-directory>')}`);
        console.log();
        console.log('For example:');
        console.log(`  ${chalk.cyan(program.name())} ${chalk.green(`Ceridian-project`)}`);
        console.log();
        console.log(`Run ${chalk.cyan(`${program.name()} --help`)} to see all options.`);
        process.exit();
    }
    const options = program.opts();
    let templeName = options.template;
    let templateUrl = templeUrls[options.template];
    creatApp(projectName, templeName, templateUrl);
}
// module.exports === export default
module.exports = init;
//# sourceMappingURL=index.js.map