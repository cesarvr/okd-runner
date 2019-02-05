'use strict';
const Workspace = require('./workspace')
const {Project, ImageDeployer} = require('./api')
const {login} = require('okd-api')

let wks = new Workspace()

function init(api) {
    let project = new Project(api, 'hello-x', 'micro-x')
    let watch = new ImageDeployer(api)

    project.on('created', () => watch.deployTo('micro-x')
                                     .watch({imagestream: 'micro-x'}) )

    project.on('created', () => project.package(wks.compress()) )
    project.on('created', () => console.log('created...'))
    project.on('uploaded',() => console.log('the tar was pushed') )
    project.on('uploaded',() => wks.clean() )
    project.on('error', err => console.log('error: ', err) )

    project.create()
}

process.on('message', (configuration) => {
  console.log('Message from parent:', configuration)
  login(configuration)
  .then(api =>  {
    init(api)
  })
  .catch(err => console.log ('bad error :( ', err ) )

  process.send({ msg: 'this shit is deployed' })
});


module.exports = init
