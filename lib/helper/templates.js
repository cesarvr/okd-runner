const fs = require('fs')

function template_path(template){
    let path = `${__dirname}/../../tmpl/${template}.yml`
    return path
}

const templates = (okd, opts) => {
    return (names) => {
      return names.map(name => template_path(name))
                  .map(address => okd.from_template(opts, address))
    }
}

module.exports = templates
