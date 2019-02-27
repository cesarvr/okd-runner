function elastic(okd, types) {
  let self = {}
  const supported = [{
      type: okd.dc,
      name: 'deploymentconfigs',
  },
  {
    type: okd.deploy,
    name: 'deployments'
  }]

  if(okd === undefined) throw 'Missing OKD API'
  self.all = () => {
    let futures = types.map(type => okd[type].all())

    return Promise.all(futures)
      .then(collections => {
        return collections.reduce((acc, next) => acc.concat(next.items), [])
      })
  }

  self.by_name = (name) => {
    let futures = types.map(type => okd[type].by_name(name))

    return Promise.all(futures)
      .then(collections => collections
                            .filter(obj => !obj.hasOwnProperty('code'))
                            .pop())
  }

  self.replace = (body) => {
    if(!body.hasOwnProperty('metadata') || body.metadata.selfLink === null)
      throw 'Missing selfLink in Kubernetes/OpenShift Object'

    let selfLink = body.metadata.selfLink
    let deploy   = supported.find( support =>
                            selfLink.split('/').indexOf(support.name) !== -1 )

    return deploy.type.replace(body.metadata.name, body)
  }


  return self
}


module.exports = elastic
