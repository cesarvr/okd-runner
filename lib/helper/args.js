const command = [ 
    { arg: '--attach', short:'-a',  cmd: 'attach' },
    { arg: '--cloud',  short:'-c',  cmd: 'cloud'  },
    { arg: '--deploy', short:'-d',  cmd: 'deploy' },
    { arg: '--detach', short:'-rc', cmd: 'detach' },
    { arg: '--remove', short:'-rm', cmd: 'remove' },
    { arg: '--memory', short:'-m',  cmd: 'memory', require_value: true, example: '--memory 80; this will create a pod with 80MiB limit' }
]

const isToken = (token) => token.includes('-') 

const getCommandFor = (token) => { 
    let scan = command.filter(cmd => cmd.arg === token || cmd.short === token)
        .pop() 

    if ( scan === undefined ) {
        throw `Unknown flag: ${token}`
    }

    return scan
}

const makeCommand = (command , value) => {
    if(command.require_value && value === null) 
        throw `The argument ${command.cmd} requires a value argument. \n For example: ${command.example}`

    return { 
        cmd: command.cmd, 
        value: value 
    }
} 


module.exports = function handleArguments(args) {
    let value = null
    let message = [] 

    while(args.length > 1) {
        let token = args.pop()

        if(!isToken(token)) {
            value = token
        } else {
            let cmd   = getCommandFor(token)
            message.push( makeCommand(cmd, value) ) 
            value = null
        }
    }

    return message
} 

