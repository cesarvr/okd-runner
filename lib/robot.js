const { Project }       = require('./okd/project')
const { ImageDeployer } = require('./okd/deployer')
const { Workspace }     = require('./workspace')
const tracker    = require('./okd/tracker')
const { login }  = require('okd-api')
const {setup, progress} = require('./helper/progress')
const namespace  = require('./okd/namespaces')
const _          = require('lodash')
const byebye     = require('./helper/util').byebye

let wks = new Workspace()

function auth_error(err) {
  let resp = err.resp
  if(resp.statusCode === 401)
    byebye(`💥  Authentication error, check your credentials...`)
  else
    byebye(`💥  Authentication error status: ${resp.statusCode}, body: ${resp.body}`)
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
    let project = new Project(api, wks.name)
    project.on('removed', () => project.kill_rs())
    project.on('removed', () => project.kill_pods())
    project.on('pod:killed', () => console.log('Pods removed'))
    project.on('rs:killed',  () => console.log('Replicas removed'))

    project.remove()
}

let follow_order = {
    'deploy': deploy,
    'remove': remove,
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
