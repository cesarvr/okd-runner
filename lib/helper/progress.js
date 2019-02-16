function progress() {
    let self = {}
    self.start = (msg) => {
        let index = 0
        let roller = ['-', '\\', '|',  '/', '-', '\\', '|', '/', '-']
        self.msg = msg
        self.id = setInterval(() => {
            if(index > roller.length -1)
                index = 1

            process.stdout.write(`${msg} \x1b[0;37;31m${roller[index++]}\r`)
        },100)
    },

    self.done = (stop_msg) => {
        clearInterval(self.id)
        console.log(`${self.msg}  \x1b[40m${stop_msg}`)
    }

    return self
}


function setup(project, deployer) {
    let setup   = progress()
    let binary  = progress()
    let worksp  = progress()

    setup.start('creating objects')

    project.on('created', () => setup.done('ok'))
    project.on('created', () => worksp.start('building'))

    deployer.on('image:created', img => worksp.done(`ok`) )
    deployer.on('image:created', img =>  {
        let cut = img.lastIndexOf('/')
        img = img.substr(cut + 1)
        binary.start(`deploying ${img}`)

    })
    deployer.on('image:deployed', img => binary.done(`ok`) )
}

/*
let p = Object.create(progress)
p.load('building container')
setTimeout(() => p.done('[ok]'), 3000 )
setTimeout(() => {
    let deploy = Object.create(progress)
    deploy.load('deploying container')

    setTimeout(()=> deploy.done('[ok]'), 3000)
} , 3600)
*/

module.exports = { setup, progress }
