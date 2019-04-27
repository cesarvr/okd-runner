const Events = require('events')

const dbg = (obj) => {
    let src = JSON.stringify(obj, null, 2)
    console.log('deploy => ', src)
}

function fail(response) {
    return {
        fail: (cb) => {
            if(response === undefined )
                cb()
        }}
}
function response(response) {
    return {
        ok: (cb) => {
            if(response !== undefined)
                cb(response)
            return fail(response)
        }
    }
}

function deploy(deployment) {
    let self = {}
    let name = deployment.metadata.name
    let containers = deployment.spec.template.spec.containers

    self.event = new Events()

    self.get_containers = () => {
        return containers
    }

    self.find_container = (name) => {
        let item = self.get_containers()
            .find(container => container.name === name)
        return response(item)
    }

    self.update = (name, content) => {
      self.find_container(name).ok(container => {
        Object.keys(content).forEach(key =>  container[key] = content[key])
      }).fail(() => {
        throw `container not found ${name}`
      })
      return self
    }

    self.remove_container = (name) => {
        containers = self.get_containers()
            .filter(container => container.name !== name)
        return self
    }

    self.add_container = (container) => {
        containers.push(container)
        return self
    }

    self.val = () => {
        deployment.spec.template.spec.containers = containers
        return deployment
    }


    return self
}



module.exports = deploy
