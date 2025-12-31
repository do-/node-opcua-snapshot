[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/do-/node-opcua-snapshot)

`node-opcua-snapshot` is a Node.js library that enables snapshot-based management of [OPC UA](https://opcfoundation.org/about/opc-technologies/opc-ua/) server address spaces. It provides two primary capabilities:

* **Extraction**: Connect to an existing OPC UA server and capture its address space structure, node configurations, and relationships into a portable JSON format
* **Recreation**: Load a JSON snapshot and populate a new OPC UA server with the captured configuration

The library acts as a configuration management layer on top of the [node-opcua](https://node-opcua.github.io/) protocol implementation, enabling use cases such as:

* Creating test servers with production-like configurations
* Version-controlling OPC UA server structures
* Cloning servers across different environments
* Building mock servers for offline development

# Installation

```sh
npm install opcua-snapshot
```

# Usage
## Taking a Snapshot from an Existing Server

```js
const fs            = require ('node:fs')
const {OPCUAClient} = require ('node-opcua')
const {Dumper}      = require ('opcua-snapshot')

async function dump (filePath, endpointUrl, rootNode) {

    const client = OPCUAClient.create ({endpointMustExist: false})

    try {

        await client.connect (endpointUrl)

        const session = await client.createSession ()

        const dumper = new Dumper (session)

        // dumper.on ('start',   _ => console.log (_))
        // dumper.on ('warning', _ => console.log (_))
        // dumper.on ('finish', _  => console.log ('finish'))

        const snapshot = await dumper.dump (rootNode /* ?? {ns: 0, i: 85}*/) // `Objects` by default

        fs.writeFileSync (filePath, JSON.stringify (snapshot, null, 2))

    }
    finally {

        await client.disconnect ()

    }

}
```

## Using a Saved Snapshot to run a New Server

```js

const fs                         = require ('node:fs')
const {OPCUAServer, StatusCodes} = require ('node-opcua')
const {Loader}                   = require ('opcua-snapshot')

// mock history data
const MS_IN_DAY     = 1000 * 60 * 60 * 24
const values = [0.0], dates = [(new Date (new Date ().toJSON ().substring (0, 10) + 'T00:00:00')).getTime ()]
for (let i = 0; i < 10; i ++) {
    values.push (values [i] + Math.random ())
    dates.unshift (dates [0] - MS_IN_DAY)
}

async function run (fn, port) {

    const server = new OPCUAServer ({endpoints: [{port}]})

    await server.initialize ()                      // prior to creating the Loader

    const loader = new Loader (server)

    loader.on ('var', varNode => {                  // will adjust variables upon creation:
        if (!varNode.historizing) return            // for historical ones (in this example)...
        varNode.accessLevel = 4                     // ... only allow HistoryRead
        loader.setValues (varNode, values, dates)   // ... and set the generated values
    })

    loader.on ('method', varMethod => {
        varMethod.bindMethod ((args, _, callback) => {
            console.log (args)
            callback (null, {statusCode: StatusCodes.Good})
        })
    })
    
    loader.load (JSON.parse (fs.readFileSync (fn))) // actually load the configuration

    await server.start ()

    loader.setValue ('ns=1;s=MyObj.MyProp', '1234') // at run time

}
```

# See Also

More documentaion available at https://deepwiki.com/do-/node-opcua-snapshot
