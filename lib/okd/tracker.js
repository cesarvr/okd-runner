function track_initating_pods(okd, name, _delegate) {
    let pending = {}
    return function(events) {
        if(events[0].object === undefined ) throw `error reading events: ${JSON.stringify(events)}`
        let annotations = events[0].object.metadata.annotations
        let labels      = events[0].object.metadata.labels
        let phase       = events[0].object.status.phase
        let pod_name    = events[0].object.metadata.name

        // Ignore builds in OKD
        if(!( 'openshift.io/build.name' in annotations  ) && labels.app === name ) {

            // Capture pods transitioning from Pending to Running.
            // It means they are being deployed...
            if(phase === 'Pending') {
                pending[pod_name] = true
            }

            // Once running get the logs...
            if(phase === 'Running' && pending[pod_name]) {
                _delegate(pod_name, events)
                pending[pod_name] = false
            }
        }
    }
}

const tracker = ({okd, podname, delegate}) => {
  okd.pod.watch_all(track_initating_pods(okd, podname, delegate))
}

module.exports = tracker
