const fs            = require ('node:fs')
const {
    OPCUAClient,
    OPCUAServer,
}                   = require ('node-opcua')
const {
    Dumper, 
    Loader
}                   = require ('.')

////////////////////////////////////////////////////////////////////////////////

async function main () {

    // await dump (
    //     'opcua.json'
    //     , 'opc.tcp://localhost:4840/'
    //     , {ns: 0, id: 'i=84'}
    // )

    await run (
        'opcua.json'
        , 4841
    )

}

////////////////////////////////////////////////////////////////////////////////

async function dump (to, from, root) {

    const client = OPCUAClient.create ({endpointMustExist: false})

    try {

        await client.connect (from)

        const session = await client.createSession ()

        const dumper = new Dumper (session)

        // dumper.on ('start',   _   => console.log (_))
        // dumper.on ('warning', _ => console.log (_))
        // dumper.on ('finish', _  => console.log ('finish'))

        const snapshot = await dumper.dump (root)

        fs.writeFileSync (to, JSON.stringify (snapshot, null, 2))

    }
    finally {

        await client.disconnect ()

    }

}

////////////////////////////////////////////////////////////////////////////////

async function run (fn, port) {

    const server = new OPCUAServer ({endpoints: [{port}]})

    await server.initialize ()

    const loader = new Loader (server)

    loader.on ('var', v => {

        if (!v.historizing) return

        v.accessLevel = 4

        const dt = new Date ()
        dt.setHours (0)
        dt.setMinutes (0)
        dt.setSeconds (0)
        dt.setMilliseconds (0)

        dt.setDate (dt.getDate () - 1)
        loader.setValue (v.nodeId, 1.1, dt) 

        dt.setDate (dt.getDate () + 1)
        loader.setValue (v.nodeId, 1.2, dt)

    })
    
    loader.load (JSON.parse (fs.readFileSync (fn)))

    await server.start ()

    // loader.setValue ('ns=2;s=GIUSController.ActiveChannel', 'TELEPATHY')

}

////////////////////////////////////////////////////////////////////////////////

main ().then (_ => _, _ => console.log (_))