const { Command } = require('commander')
const chalk = require('chalk')
const semver = require('semver')
const path = require('path')
const validateProjectName = require('validate-npm-package-name')
const fs = require('fs-extra')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const spawn = require('cross-spawn')
const input = require('@inquirer/input')
const select = require('@inquirer/select')

const packageJson = require('../package.json')

let projectName: string
type Url = {
  'react-starter': string
  'react-material-admin-template': string
  'react-frame-application': string
}
const templateUrls: Url = {
  'react-starter': 'https://github.com/webpack/react-starter.git',
  'react-material-admin-template':
    'https://github.com/rafaelhz/react-material-admin-template.git',
  'react-frame-application':
    'https://github.com/zwlzwt/react-frame-application.git',
}

// check the app name is valid
function checkAppName(appName: string) {
  const validationResult = validateProjectName(appName)
  if (!validationResult.validForNewPackages) {
    console.error(
      chalk.red(
        `Cannot create a project named ${chalk.green(
          `"${appName}"`
        )} because of npm naming restrictions:\n`
      )
    )
    ;[
      ...(validationResult.errors || []),
      ...(validationResult.warnings || []),
    ].forEach((error) => {
      console.error(chalk.red(`  * ${error}`))
    })
    console.error(chalk.red('\nPlease choose a different project name.'))
    process.exit(1)
  }
}

// install dependencies packages
function install(
  root: string,
  useYarn?: Boolean,
  usePnp?: Boolean,
  dependencies = [],
  isOnline?: Boolean
) {
  return new Promise<void>((resolve, reject) => {
    let command
    let args

    command = 'npm'
    args = ['install', '--save', '--loglevel', 'error'].concat(dependencies)

    const child = spawn(command, args, { cwd: `./${root}`, stdio: 'inherit' })
    console.log()
    console.log(chalk.green('Install dependencies....'))
    child.on('close', (code) => {
      if (code !== 0) {
        reject({
          command: `${command} ${args.join(' ')}`,
        })
        return
      }
      resolve()
    })

    // we can support Yarn or pnp
    // if (useYarn) {
    //   command = 'yarnpkg'
    //   args = ['add', '--exact']
    //   if (!isOnline) {
    //     args.push('--offline')
    //   }
    // }
  })
}

async function creatApp(
  name: string,
  templateName: string,
  templateUrl: string
) {
  // check node version
  const unSupportedNodeVersion = !semver.satisfies(process.version, '>=10')
  if (unSupportedNodeVersion) {
    console.log(
      chalk.yellow(
        `You are using Node ${process.version} so the project will be bootstrapped with an old unsupported version of tools.\n\n` +
          `Please update to Node 10 or higher for a better, fully supported experience.\n`
      )
    )
  }

  // first judged to be a valid npm name, then try create the directory
  const root: string = path.resolve(name)
  const appName: string = path.basename(root)
  checkAppName(appName)

  fs.ensureDirSync(name)
  console.log()
  console.log(`Creating a new React app in ${chalk.green(root)}.`)

  const { stdout, stderr } = await exec('git --version')
  if (stderr) {
    console.error(stderr)
  }
  if (stdout && stdout.includes('git version')) {
    console.log(stdout.trim())
    console.log()
    console.log(
      chalk.blue(`now clone the template in ${chalk.green(name)}....`)
    )

    fs.emptyDirSync(name)
    console.log()
    console.log(chalk.magenta('Find folder successfully!'))
    console.log(templateUrl, templateName)
    // async exec download and git commit
    try {
      await exec(`git clone ${templateUrl}`, { cwd: `./${name}` })
      console.log()
      console.log(chalk.blue('Downloading success!!!'))
      console.log()
      const stats = await fs.stat(process.cwd() + `/${name}/${templateName}`)
      if (stats.isDirectory()) {
        await exec(
          `rm -rf .git && git init && git add . && git commit -m \"create front-end app\"`,
          { cwd: `./${name}/${templateName}` }
        )
      }
      console.log(
        chalk.blue('Delete the origin git and add new git commit first time!!!')
      )
      await install(`${name}/${templateName}`)
    } catch (err) {
      console.error(err)
    }
  }
}

// question for choose the template
const templateSelectQuestion = {
  type: 'list',
  message: 'Which template you want choice?',
  name: 'templateChoice',
  choices: [
    {
      name: 'react-starter',
      value: 'react-starter',
      description: 'webpack official template for react',
    },
    {
      name: 'react-material-admin-template',
      value: 'react-material-admin-template',
      description:
        'This is a simple responsive admin template using React and Material-UI components.',
    },
    {
      name: 'react-frame-application',
      value: 'react-frame-application',
      description: 'A React + Redux application without server render.',
    },
    {
      name: 'custom template',
      value: 'custom',
    },
  ],
}

const templateNameQuestion = {
  type: 'input',
  message: 'Please input your own template git name:',
  name: 'templateName',
}

const templateUrlQuestion = {
  type: 'input',
  message: 'Please input your own template git url:',
  name: 'templateUrl',
}

async function qa(): Promise<string[]> {
  const selectName = await select(templateSelectQuestion)
  if (selectName === 'custom') {
    const cusName = await input(templateNameQuestion)
    const cusUrl = await input(templateUrlQuestion)
    return [selectName, cusName, cusUrl]
  } else {
    return [selectName]
  }
}

async function init(): Promise<void> {
  // config arguments and options
  const program = new Command(packageJson.name)
    .version(packageJson.version)
    .arguments('[project-directory]')
    .usage(`${chalk.green('[project-directory]')} [options]`)
    .action((name) => {
      projectName = name
    })
    .on('--help', () => {
      console.log()
      console.log(
        `Only ${chalk.green('[project-directory]')} is ${chalk.red(
          'required'
        )}.`
      )
      console.log()
      console.log(
        `And default option template is: ${chalk.green('<react-starter>')}`
      )
    })
    .description('react-starter-cli command', {
      projectName: 'You set the root of your project directory',
    })
    .parse(process.argv)
  // warning and show example how to add projectName follow the CLI
  if (typeof projectName === 'undefined') {
    console.error('Please specify the project directory:')
    console.log(
      `  ${chalk.cyan(program.name())} ${chalk.green('<project-directory>')}`
    )
    console.log()
    console.log('For example:')
    console.log(
      `  ${chalk.cyan(program.name())} ${chalk.green('Custom-react-project')}`
    )
    console.log()
    console.log(
      `Run ${chalk.cyan(`${program.name()} --help`)} to see all options.`
    )
    process.exit()
  }

  const [selectAnswer, cusName, cusUrl] = await qa()
  let templateUrl: string
  let templateName: string
  if (selectAnswer === 'custom' && (!cusName || !cusUrl)) {
    console.log()
    console.log(`${chalk.cyan('You must input your own template!!!')}`)
    console.log()
    process.exit()
  } else if (selectAnswer === 'custom') {
    templateName = cusName
    templateUrl = cusUrl
    await creatApp(projectName, templateName, templateUrl)
  } else {
    templateName = selectAnswer
    templateUrl = templateUrls[selectAnswer]
    await creatApp(projectName, templateName, templateUrl)
  }
}
// module.exports === export default
module.exports = init
