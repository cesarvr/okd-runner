const Event = require('events')

class ImageDeployer extends Event {
    constructor(api, name) {
        super()
        this.appName = name
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
        this.api.is.watch(this.appName, (event) => {
            if(event.type === 'MODIFIED') {
                let _img = this.retrieve_last_image(event)
                this.emit('image:created'. _img)
                this.api
                    .deploy.patch(this.deploy, this.preparing_patch(_img))
                    .then( ok => this.emit('image:deployed', ok) )
                    .catch(error => console.log('updating image error: ' , error))
            }
        })
    }

    deployTo(deployment) {
        this.deploy = deployment
        return this
    }
}


module.exports = { ImageDeployer }
