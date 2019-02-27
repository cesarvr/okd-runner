const Events = require('events')
const { byebye, fail, response } = require('../helper/util').byebye

function get_last_image(event) {
    let tag = event.object.status.tags.shift()
    return tag.items.shift().dockerImageReference
}

function project(okd, application_name) {
    let self = {}
    self.event = new Events()

    function make_event(title, promises) {
        return promises
            .then( response  => self.event.emit(title, response))
            .catch(      err => self.event.emit(`error`, err))
    }

    self.create = (okd_objects) => {
        let promises = okd_objects.map(obj => obj.post() )
         make_event('created', Promise.all(promises))
        return self
    }

    self.build = (file) => {
      let promise = okd.bc.binary(file, application_name)
      make_event('uploaded', promise)
    }

    self.watch_new_images = () => {
      okd.is.watch(application_name, (event) => {
          if(event.type === 'MODIFIED') {
           let img = get_last_image(event)
           self.event.emit('image:new', img)
          }
      })
    }

    return self
}

module.exports = project
