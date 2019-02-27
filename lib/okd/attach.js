const Event = require('events')
const templates  = require('../helper/templates')
const Project = require('../okd/projectv2')
const {byebye} = require('../helper/util')
const Deployment = require('./deployment')
const Elastic    = require('../helper/elastic')
const SVC        = require('../helper/svc')
const tracker    = require('./tracker')

const PREFIX = '-ambz'
const CONTAINER_PORT = 8084
const INITIAL_PORT = 8080

class Attach extends Event {
    constructor({okd, name, target}){
        super()
        this.name   = name + PREFIX
        this.okd    = okd
        this.target = target
        this.imageRegistry = okd.is
        this.deploy = okd.deploy


        this.elastic = new Elastic(okd, ['dc', 'deploy'])
        this.svc     = new SVC(okd)
        this.project = new Project(okd, this.name, ['build', 'imagestream'])

        this.on('attached', ()=> this.svc.change_port(this.target, CONTAINER_PORT) )

        tracker({
            okd,
            podname: this.target,
            delegate: pod_name => {
                console.log(`logs for ${this.target} -> container [ ${this.name} ] \n`)
                okd.pod.container(this.name).stream_logs(pod_name, logs => process.stdout.write(logs)) 
            }
        })

        this.on('removed',  ()=> this.svc.change_port(this.target, INITIAL_PORT) )
    }

    remove(){
        this.elastic.by_name(this.target)
            .then(descriptor => {
                let _deploy = new Deployment(descriptor)
                _deploy.remove_container(this.name)

                return this.elastic
                    .replace(_deploy.val())
                    .then(ok => this.emit('removed'))
            })
            .catch(err => this.emit('error', err))
        return this
    }

    make(file){
        this.emit('building', file)
        this.imageRegistry.on_new(this.name,  img  => this.editTargetDeployment(img))
        this.project.event.on('created', resp => this.project.build(file))
        this.project.event.on('created', resp => this.emit('created', resp))
        this.project.event.on('error',   err  => this.emit('error', err))
        this.project.event.on('error',   err  => console.log('error', err))

        this.project.create()
        return this
    }

    addContainerImage(image, deployment){
        let container = {
            name: this.name,
            image,
            env: [{name: 'TARGET_PORT', value: '8080'}, {name: 'PORT', value: '8084' }],
            ports: [{containerPort: CONTAINER_PORT, protocol: 'TCP' }]
        }

        deployment
            .find_container(this.name)
            .ok(   () => deployment.update(this.name, container) )
            .fail( () => deployment.add_container(container) )

        return deployment
    }

    editTargetDeployment(image) {
        this.elastic
            .by_name(this.target)
            .then(deploy_object => new Deployment(deploy_object))
            .then(deploy     => this.addContainerImage(image, deploy))
            .then(deployment =>  this.elastic.replace(deployment.val()))
            .then(ok => this.emit('attached', ok))
            .catch(err => byebye(`Target deployment not found ${this.target}`) )
    }
}

module.exports = Attach
