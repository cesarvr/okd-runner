const templates = require('../helper/templates')
const project   = require('./proj')

function create(okd){

    return (components, project_file) => {
        let project = tmpl(components)
        proj.event.on('created',   res =>  proj.build(project_file) )
        proj.event.on('image:new', img => )

        proj.watch_new_images()
        proj.create(project)
    }
}

module.export =
