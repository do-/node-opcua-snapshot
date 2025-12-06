const EventEmitter  = require ('node:events')
const {StatusCodes} = require ('node-opcua')

const Snapshot     = require('./Snapshot')
    , {nodeId}    = Snapshot
    ,  browseName = o => ({namespaceIndex : o.ns         , name   : o.name})
    ,  idName     = o => ({browseName     : browseName(o), nodeId : nodeId (o)})

const PROP = new Map ([
    ['EngineeringUnits', 'engineeringUnits'],
    ['EURange',          'engineeringUnitsRange'],
    ['InstrumentRange',  'instrumentRange'],
])

module.exports = class extends EventEmitter {

    #addressSpace

    constructor (server) {

        super ()

        this.#addressSpace = server.engine.addressSpace

    }

    get NS () {

        return this.#addressSpace.getNamespaceArray()

    }

    getNs (o) {

        return this.NS [o.ns]

    }

    setNamespaceArray (namespaceArray) {

        this.NS.splice (1, 1)

        for (let i = 1; i < namespaceArray.length; i++)  this.#addressSpace.registerNamespace (namespaceArray [i])

    }

    setValue (nodeId, value, date, status = StatusCodes.Good) {

        const node = this.#addressSpace.findNode (nodeId)

        node.setValueFromSource ({dataType: node.dataType.value, value}, status, date)

    }

    addVariable (componentOf, o) {

        let {dataType, value, HasHistoricalConfiguration} = o; if (dataType === 13) value = new Date (value)

        const ns = this.getNs (o), options = {...idName (o), componentOf, value: {dataType, value}, dataType, minimumSamplingInterval: 1000}

        switch (o.type) {
            case 'BaseDataVariableType': return ns.addVariable (options)
            case 'AnalogItemType'      : break  // see below
            default                    : return // unsupported
        }

        if (Array.isArray (o.HasProperty)) for (const i of o.HasProperty) options [PROP.get (i.name)] = i.value

        const node = ns.addAnalogDataItem (options)
        
        if (HasHistoricalConfiguration) this.#addressSpace.installHistoricalDataNode (node)

        return node

    }

    addObject (organizedBy, o) {

        const {Organizes, HasComponent} = o

        const node = this.getNs (o).addObject ({...idName(o), organizedBy})

        if (Array.isArray (Organizes)) for (const i of Organizes) this.addObject (node, i)

        if (Array.isArray (HasComponent)) for (const i of HasComponent) switch (i.class) {

            case 'Variable':
                this.emit ('var', this.addVariable (node, i))
                break

        }

    }

    load (root) {

        const snapshot = new Snapshot (root)

        this.setNamespaceArray (snapshot.namespaceArray)

        for (const i of snapshot.objectsFolder) if (i.ns != 0) this.addObject (this.#addressSpace.rootFolder.objects, i)

    }

}