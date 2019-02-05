let fs  = require('fs')
var spawn = require('child_process').spawnSync

class File {
    constructor(){}
}

class Workspace {
    constructor(){
        this.files = fs.readdirSync('./') 
    }

    exclude(_rules) {
        this.files = this.files.filter(file => _rules.indexOf(file) === -1)

        return this 
    }

    debug(){
        console.log(this.files)
        return this
    }

    compress(name){
        let exclude = `${__dirname}/../build/`
        this.tmp_file = name || './okd.tar.gz'
        let args = ['-czf', this.tmp_file, `--exclude='${exclude}'`, '-C', '.', '.']
        console.log('tar: args->', args)
        let ret = spawn('tar', args) 
          
        return this.tmp_file 
    }

    clean(){
        fs.unlinkSync(this.tmp_file)
    }
}

module.exports = Workspace
