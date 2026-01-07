const EventEmitter = require ('node:events')
const opcua = require ('node-opcua')

const DEFAUT_ROOT = {
    ns   :  0,
    id   : 'i=85',
    type : 'FolderType',
}

const nodeId = ({ns, id}) => `ns=${ns};${id}`

const NS0 = 'ns=0;i=', ns0id = (name, s, postfix = 'TypeIds') => {

    const k = name + postfix; if (!(k in opcua)) return undefined

    if (typeof s !== 'string' || !s.startsWith (NS0)) return undefined

    return opcua [k] [parseInt (s.substring (NS0.length))]
    
}

const toRootObject = (arg = {}) => {

    if (typeof arg !== 'object') throw Error (`Not an object: ${arg}`)

    if (arg.constructor !== {}.constructor) throw Error (`root.class must be 'Object', found ${arg.constructor.name}`)

    const {ns, id, name, type} = {...DEFAUT_ROOT, ...arg}

    return {
        class: 'Object',
        ns,
        id,
        name: name ?? ns0id ('Object', nodeId ({ns, id}), 'Ids'),
        type
    }

}

module.exports = class extends EventEmitter {

    static ns0id        = ns0id
    static toRootObject = toRootObject

    #session

    constructor (session) {

        super ()

        this.#session = session

    }

    async browse (nodeId) {

        this.emit ('start', nodeId)

        try {

            const {statusCode, references} = await this.#session.browse (nodeId); if (statusCode.isGoodish ()) return references

            this.emit ('warning', statusCode); return []

        }
        finally {

            this.emit ('finish')

        }

    }

    async read (nodeIds) {

        this.emit ('start', nodeIds)

        try {

            return await this.#session.read (nodeIds.map (nodeId => ({nodeId})))

        }
        finally {

            this.emit ('finish')

        }

    }

    async loadObject (parent) {

        const references = await this.browse (nodeId (parent)), vars = []

        for (const reference of references) {

            const {referenceTypeId, nodeClass, nodeId, browseName: {namespaceIndex, name}, typeDefinition} = reference.toJSON (), referenceType = ns0id ('Reference', referenceTypeId)
            
            const child = await this.loadReference (nodeClass, namespaceIndex, nodeId, name, referenceType, reference, typeDefinition, vars)

            if (child) (parent [referenceType] = parent [referenceType] ?? []).push (child)
            
        }

        await this.loadValues (vars)

        return parent

    }

    async loadReference (nodeClass, namespaceIndex, nodeId, name, referenceType, reference, typeDefinition, vars) {

        const child = {
            class: nodeClass,
            ns: namespaceIndex,
            id: nodeId.substring (1 + nodeId.indexOf (';')),
            name
        }

        switch (referenceType) {
            case 'HasComponent' : return this.loadReferenceHasComponent (child, nodeClass, reference.nodeId, typeDefinition, vars)
            case 'Organizes'    : return this.loadReferenceOrganizes    (child, nodeClass)
            default: return undefined
        }

    }

    async loadReferenceHasComponent (child, nodeClass, nodeId, typeDefinition, vars) {

        switch (nodeClass) {

            case 'Method':
                const arg = await this.#session.getArgumentDefinition (nodeId)
                for (const k in arg) child [k] = arg [k]
                return child

            case 'Variable':
                child.type = ns0id (nodeClass, typeDefinition)
                vars.push (child)
                return this.loadObject (child)

            default: return undefined

        }

    }

    async loadReferenceOrganizes (child, nodeClass) {

        switch (nodeClass) {

            case 'Object': return this.loadObject (child)

            default: return undefined

        }

    }

    async loadValues (vars) {

        const {length} = vars; if (length === 0) return

        const vals = await this.read (vars.map (nodeId))

        for (let i = 0; i < length; i ++) {

            const v = vars [i], {dataType, value} = vals [i].value

            v.dataType = dataType

            if (value != null) v.value = value

        }

    }

    async dump (arg) {

        const root = toRootObject (arg)

        await this.loadObject (root)

        return root

    }

}