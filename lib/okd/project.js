const Event = require('events')
const _     = require('lodash')
const Store = require('../store')

const store = new Store()

const dbg = (obs) => {
    console.log('===============================')
    console.log('debug: ', obs)
    console.log('===============================')
    return obs
}

let runningPods = (pods) => pods
    .items
    .filter(pod =>
        pod.status.phase === 'Running')

function template_path(template){
    let path = `${__dirname}/../../tmpl/${template}`
    return path
}

function get_names(name, rsets) {
    let rss = rsets.filter(rs => rs.metadata.labels.app === name)
    return rss.map(rs => rs.metadata.name )
}

class Project extends Event {
    constructor(api, appName) {
        super()
        this.api = api
        this.appName = appName

        let props = {name: this.appName}
        let is     = api.from_template(props, template_path('imagestream.yml'))
        let bc     = api.from_template(props, template_path('build.yml'))
        let deploy = api.from_template(props, template_path('kube-deploy.yml'))
        let svc    = api.from_template(props, template_path('service.yml'))
        let route  = this.api.from_template(props, template_path('route.yml'))

        this.components = [is, bc, deploy, svc, route]
    }

    _handle(title,promises) {
        return promises
            .then( ok  => {
                this.emit(title, ok)
            })
            .catch(err => this.emit(`error`, err) )
    }

    _make(title, cb) {
        this._handle(title,
            Promise.all(
                this.components.map(cb)
            )
        )
    }
    get name() { return this.appName}

    remove() {
        this._make('removed', p => p.remove(this.appName))
    }

    getURL(cb) {
        this.api.route.by_name(this.appName)
                     .then(route => cb(`http://${route.spec.host}`))
                     .catch(err => this.emit('error', err))
    }


    kill_pods() {
        this.api.pod.all()
            .then(runningPods)
            .then(pods => get_names(this.appName, pods) )
            .then(pods => pods.map( pod =>  this.api.pod.remove(pod) ))
            .then(promises => Promise.all(promises))
            .then(ok => this.emit('pod:killed'))
            .catch(err => this.emit(`error`, err) )
    }

    kill_rs(){
        this.api.rs
            .all()
            .then(rss  => get_names(this.appName, rss.items ))
            .then(rss => rss.map( rs => this.api.rs.remove(rs) ))
            .then(promises => Promise.all(promises))
            .then(ok   => this.emit('rs:killed'))
            .catch(err => this.emit(`error`, err) )
    }

    create() {
        this._make('created', p => p.post())
    }

    package(archive_name) {
        this._handle('uploaded', this.api
            .bc.binary(archive_name, this.appName) )
    }
}



module.exports = { Project }
