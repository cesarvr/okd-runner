const Event = require('events')
const _     = require('lodash')
const Store = require('./store')

const store = new Store()

function template_path(template){
    let path = `${__dirname}/../tmpl/${template}`
    return path
}

class Project extends Event {
    constructor(api, namespace, appName) {
        super()
        this.api = api
        this.api.namespace('hello')

        this.appName = appName


        let is     = api.from_template(this.appName, template_path('imagestream.yml'))
        let bc     = api.from_template(this.appName, template_path('build.yml'))
        let deploy = api.from_template(this.appName, template_path('kube-deploy.yml'))
        let svc    = api.from_template(this.appName, template_path('service.yml'))
        let route  = api.from_template('micro-x',    template_path('route.yml'))

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

    remove() {
        this._make('removed', p => p.remove())
    }

    create() {
        this._make('created', p => p.post())
    }

    package(archive_name) {
       this._handle('uploaded', this.api
                               .bc.binary(archive_name, 'micro-x') )
    }
}



class ImageDeployer {
    constructor(api) {
        this.api = api
    }

    preparing_patch (image) {
        let patch_image = [{op:'replace', path:'/spec/template/spec/containers/0/image', value: image }]
        return JSON.stringify(patch_image)
    }

    retrieve_last_image(event) {
        let tag = event.object.status.tags.shift()
        return tag.items.shift().dockerImageReference
    }

    watch({imagestream}) {
        console.log('watch....')
        this.api.is.watch('micro-x', (event) => {
            if(event.type === 'MODIFIED') {
                let _img = this.retrieve_last_image(event)
                this.api
                    .deploy.patch(this.deploy, this.preparing_patch(_img))
                      .then( ok => console.log('deployment updated: ', ok.metadata.name))
                      .catch(error => console.log('updating image error: ' , error))
            }
        })
    }

    deployTo(deployment) {
        this.deploy = deployment
        return this
    }
}




module.exports = { ImageDeployer, Project }
