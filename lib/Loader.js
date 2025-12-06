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

const setValueFromSource = (node, value, status, date) => {

    const dataType = node.dataType.value

    if (dataType === 13) value = new Date (value)

    if (date) date = new Date (date)

    node.setValueFromSource ({dataType, value}, status, date)

}

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

    getNode (nodeOrId) {

        if (typeof nodeOrId === 'object' && nodeOrId.nodeId) return nodeOrId

        return this.#addressSpace.findNode (nodeOrId)

    }

    setNamespaceArray (namespaceArray) {

        this.NS.splice (1, 1)

        for (let i = 1; i < namespaceArray.length; i++)  this.#addressSpace.registerNamespace (namespaceArray [i])

    }

    setValue (nodeOrId, value, date, status = StatusCodes.Good) {

        setValueFromSource (this.getNode (nodeOrId), value, status, date)

    }

    setValues (nodeOrId, values, dates, status = StatusCodes.Good) {

        const node = this.getNode (nodeOrId)

        for (let i = 0; i < dates.length; i ++) 
            
            setValueFromSource (node, values [i], status, dates [i])

    }


    addVariable (componentOf, o) {

        let {dataType, value, HasHistoricalConfiguration} = o; if (dataType === 13) value = new Date (value)

        const ns = this.getNs (o), options = {...idName (o), componentOf, dataType, minimumSamplingInterval: 1000}

        if (!HasHistoricalConfiguration) options.value = {dataType, value}

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