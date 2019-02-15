const _ = require('lodash')

class Store {
  constructor(config){
    try{
      this.file = config || './config.json'

      this.config = require('fs')
                      .readFileSync( this.file )
                      .toString()

      this.empty =  false
      this.config = JSON.parse(this.config)
    } catch(e) {
      this.config = {}
      this.empty = true
    }
  }

  commit(){
    require('fs').writeFileSync(this.file, JSON.stringify( this.config ) )
    this.empty = false
  }

  save(obj) {
    this.config = _.merge(this.config, obj)
    this.commit()
  }

  isEmpty() {
    return this.empty
  }

  credentials(){
    return {user: this.config.user, password: this.config.password}
  }

  get configuration() {
    return this.config
  }
}


module.exports = Store
