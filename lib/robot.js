const { Project }       = require('./okd/project')
const { ImageDeployer } = require('./okd/deployer')
const Attach            = require('./okd/attach')

const okd               = require('okd-api')
const Store             = require('./store')
const { Workspace }     = require('./workspace')
const {setup, progress} = require('./helper/progress')

const tracker    = require('./okd/tracker')
const namespace  = require('./okd/namespaces')
const _          = require('lodash')
const byebye     = require('./helper/util').byebye
const menu       = require('./helper/menu')
const templates  = require('./helper/templates')

let wks = new Workspace()
let store = new Store()

function okd_new_app(api, name) {
    const templates = require('./helper/templates')
    const tmpl = templates(api, {name})

    let project = tmpl(['imagestream',
                        'build',
                        'deploy',
                        'route',
                        'service'])

    proj.event.on('created',   res =>  proj.build('./test/workspace.tar.gz') )
    proj.event.on('image:new', img => image = img)


    proj.watch_new_images()
    proj.create(full_project)
}

function getDeploymentParameters(message) {
    let memory = message.find(msg => msg.cmd === 'memory')
    let ret = {memory: 200}

    if(memory)
       ret = {'memory': memory.value}

    console.log('container memory: ', ret.memory)
    return ret
}


function deploy(api, message) {
    let project    = new Project(api, wks.name, getDeploymentParameters( message ))
    let deployer   = new ImageDeployer(api, wks.name)

    wks.fix_entry().save()
    deployer.deployTo(wks.name)

    tracker({
        okd: api,
        podname: wks.name,
        delegate: pod_name => {
            project.getURL(url => console.log('\n  \x1b[0;37;31m URL: ', url , '\n \x1b[37;40m'))
            api.pod.stream_logs(pod_name, (logs) => process.stdout.write(logs))
        }
    })

    setup(project, deployer)
    project.on('created', () => deployer.watch({ imagestream: wks.name }) )
    project.on('created', () => project.package(wks.compress()) )
    project.on('uploaded',() => wks.clean() )
    project.on('error', err => console.log('Error: ', err) )

    project.create()
}

function remove(api) {
    let clean = progress()
    clean.start('cleaning...')
    let project = new Project(api, wks.name)
    project.on('removed', () => project.kill_rs())
    project.on('removed', () => project.kill_pods())
    project.on('rs:killed',  () => clean.done('done'))
    project.on('rs:killed',  () => byebye(''))

    project.remove()
}

function attach(api) { 
    menu(api, ['deploy','dc'], 'Where do you want to attach this container ?')
        .then(target => {
            let attach = new Attach({okd:api, name:wks.name, target}) 
            attach.on('created',  ()=>console.log('build/is created'))
            attach.on('buidling', (file)=>console.log('building-> ', file))
            attach.on('attached', ()=> wks.clean())
            attach.on('attached', ()=> console.log('attached'))
            attach.make(wks.compress())
        }).catch(err => byebye(`${err}`))
}

function detach(api, target) { 
    menu(api, ['deploy','dc'], 'Where do you want to attach this container ?')
        .then(target => {
            console.log('targeting->', target)
            let attach = new Attach({okd:api, name:wks.name, target}) 

            attach.on('removed',() => console.log('removed'))
            attach.on('removed',() => byebye(''))
            attach.remove()
        }).catch(err => byebye(`${err}`))
}

let follow_order = {
    'cloud': deploy,
    'deploy': deploy,
    'remove': remove,
    'attach': attach,
    'detach': detach,
}


function execute(message, api) {
    let actions = Object.keys(follow_order)
    let cmd     = message.filter( msg =>  
                            actions.indexOf(msg.cmd) !== -1)
                         .pop()

    follow_order[cmd.cmd](api, message)
}

function validate(api) {
    if(_.isUndefined(api))
        throw `Failing to communicate with the server, API status: ${api}`

    return api
}

process.on('message', (message) => {
    let config = store.configuration
    let ns = progress()
    ns.start('starting')

    okd(config)
        .then(validate)
        .then(api => api.namespace(config.namespace))
        .then(api => {
            ns.done('ok')
            store.save(api.get_config())
            execute(message, api)
        })
        .catch(error => {
            ns.done('fail')
            console.log('Error:', error)
            byebye(`💥  ${JSON.stringify(error,null, 2)}`)
        })

    process.on('SIGINT', function() {
        process.exit()
    })
})
