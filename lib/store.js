const _ = require('lodash')
const fs = require('fs')

class Store {
  constructor(config){
    try{
      this.file = config || './._cfg.conf'

      this.config = fs.readFileSync( this.file )
                      .toString()

      this.empty =  false
      this.config = JSON.parse(this.config)
    } catch(e) {
      this.config = {}
      this.empty = true
    }
  }

  commit(){
    fs.writeFileSync(this.file, JSON.stringify( this.config, undefined, 4 ) )
    this.empty = false
  }

  hide() {
      if (fs.existsSync('./.gitignore')) {
          let ignored = fs.readFileSync('./.gitignore')
                          .toString()
                          .split('\n')
                        
          let entry = ignored.find(line => `./${line}`  === this.file)

          if (_.isEmpty(entry)) {
              ignored.push('# okd-runner config file')
              ignored.push(this.file.replace('./',''))
              fs.writeFileSync('./.gitignore', ignored.join('\n') )
          }
      }

      return this
  }

  save(obj) {
    this.config = _.merge(this.config, obj)
    this.commit()
  }

  isEmpty() {
    return this.empty
  }

  get token(){
      return this.config.token
  }

  credentials(){
    return {user: this.config.user, password: this.config.password}
  }

  get configuration() {
    return this.config
  }
}


module.exports = Store
