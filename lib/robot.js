const { Project }       = require('./okd/project')
const { ImageDeployer } = require('./okd/deployer')
const Attach            = require('./okd/attach')

const { login }  = require('okd-api')
const { Workspace }     = require('./workspace')
const {setup, progress} = require('./helper/progress')

const tracker    = require('./okd/tracker')
const namespace  = require('./okd/namespaces')
const _          = require('lodash')
const byebye     = require('./helper/util').byebye
const menu       = require('./helper/menu')
const templates  = require('./helper/templates')

let wks = new Workspace()

function auth_error(err) {
  let resp = err.resp
  if(resp.statusCode === 401)
    byebye(`💥  Authentication error, check your credentials...`)
  else
    byebye(`💥  Authentication error status: ${resp.statusCode}, body: ${resp.body}`)
}

function okd_new_app(api, name) {
    const templates = require('./helper/templates')
    const project   = require('./okd/proj')
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

function deploy(api) {

    let project    = new Project(api, wks.name)
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
            attach.on('created', ()=>console.log('build/is created'))
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
    'deploy': deploy,
    'remove': remove,
    'attach': attach,
    'detach': detach,
}

function validate(api) {
    if(_.isUndefined(api))
        throw `Failing to communicate with the server, API status: ${api}`

    return api
}

process.on('message', (msg) => {
    let config = msg.configuration
    let ns = progress()
    ns.start('Initializing...')
    namespace.choose(config)
        .then(validate)
        .then(api => {
            ns.done('ok')
            follow_order[msg.action](api)
        })
        .catch(err => {
            ns.done('fail')
            if(!_.isUndefined(err.resp))
                auth(err)
            else{
                byebye(`💥 Error: ${err}`)
            }
        })

    process.on('SIGINT', function() {
        process.exit()
    })
})
