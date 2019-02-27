const Events = require('events')
const { byebye, fail, response } = require('../helper/util').byebye
const templates  = require('../helper/templates')


function handle_response(resp) {
    console.log('response->', resp)

    return resp
}

function project(okd, application_name, components) {
    let self = {}
    let build_template = templates(okd, {name: application_name})
    let build = build_template(components)

    self.event = new Events()

    function make_event(title, promises) {
        return promises
            .then( response  => self.event.emit(title, response))
            .catch(err => self.event.emit(`error`, err))
    }

    self.create = () => {
        let promises = build.map(obj => obj.post() )
         make_event('created', Promise.all(promises))
        return self
    }

    self.build = (file) => {
      console.log('file->',file, 'app->',application_name)
      let promise = okd.bc.binary(file, application_name)
      make_event('uploaded', promise)
    }

    return self
}

module.exports = project
