let fs  = require('fs')
let _   = require('lodash')
var spawn = require('child_process').spawnSync

class File {
    constructor(){}
}

class Workspace {
    constructor(){
        this.files = fs.readdirSync('./')
        this.package = fs.readFileSync('./package.json').toString()
        this.package = JSON.parse(this.package)
    }

    fix_entry(){
      if( _.isEmpty(this.package.scripts.start) ) {
        this.package.scripts.start = `node ${this.package.main}`
        console.log(`can't find any start entry, adding this one ... ${this.package.scripts.start} `)
      }

      return this
    }

    save() {
      fs.writeFileSync('./package.json', JSON.stringify(this.package))
      return this
    }

    get name() { return this.package.name }

    exclude(_rules) {
        this.files = this.files.filter(file => _rules.indexOf(file) === -1)
        return this
    }

    debug(){
        console.log(this.files)
        return this
    }

    compress(name){
        this.tmp_file = name || './okd.tar.gz'
        let args = ['-czf', this.tmp_file, '-C', '.', '.']
        let ret = spawn('tar', args)

        return this.tmp_file
    }

    clean(){
        fs.unlinkSync(this.tmp_file)
    }
}

module.exports = Workspace
