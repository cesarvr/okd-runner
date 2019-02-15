const Workspace = require('./workspace')
const { Project } = require('./okd/project')
const { ImageDeployer } = require('./okd/deployer')
const tracker = require('./okd/tracker')
const { login } = require('okd-api')
const mount_progress_ui = require('./helper/progress')

let wks = new Workspace()


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

    mount_progress_ui(project, deployer)
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

process.on('message', (msg) => {
    let config = msg.configuration
    login(config)
        .then(api =>  {
            api.namespace(config.namespace)
            follow_order[msg.action](api)
        })
        .catch(err => console.log ('bad error :( ', err ) )

    process.on('SIGINT', function() {
        process.exit()
    })
})
