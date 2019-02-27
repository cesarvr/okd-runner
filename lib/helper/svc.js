function SVC(okd) {
    let self = {}
    self.change_port = (target, port_number) => {
        return okd.svc.by_name(target)
            .then(svc => {
                if(svc.hasOwnProperty('status') && svc.status === 'Failure'){
                    console.warn('Service not found')
                    return Promise.resolve(1)
                }

                if(svc.spec.ports.length > 2) 
                    console.warn('This service contains multiple ports, refusing to make any change.')

                svc.spec.ports[0].targetPort = port_number

                return okd.svc.replace(target, svc).then(resp => {
                    return resp
                })
            })
    }

    return self
}


module.exports = SVC
