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

module.exports = class extends EventEmitter {

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

        for (const reference of references) if (reference.isForward) {

            const {referenceTypeId, nodeClass, nodeId, browseName: {namespaceIndex, name}, typeDefinition} = reference.toJSON (), dst = {
                class: nodeClass,
                ns: namespaceIndex,
                id: nodeId.substring (1 + nodeId.indexOf (';')),
                name
            }

            dst.type = ns0id (nodeClass, typeDefinition)

            if (dst.class === 'Variable') vars.push (dst)

            await this.loadObject (dst)

            {

                const ref = ns0id ('Reference', referenceTypeId)

                if (!(ref in parent)) parent [ref] = []; parent [ref].push (dst)

            }
            
        }

        {

            const {length} = vars; if (length !== 0) {

                const vals = await this.read (vars.map (nodeId))

                for (let i = 0; i < length; i ++) {

                    const v = vars [i], {dataType, value} = vals [i].value

                    v.dataType = dataType

                    if (value != null) v.value = value

                }

            }

        }

    }

    toRootObject (arg = {}) {

        if (typeof arg !== 'object') throw Error (`Not an object: ${arg}`)

        if (arg.class != null && arg.class !== 'Object') throw Error (`root.class must be 'Object', found ${root.class}`)

        const {ns, id, name, type} = {...DEFAUT_ROOT, ...arg}

        return {
            class: 'Object',
            ns,
            id,
            name: name ?? ns0id ('Object', nodeId ({ns, id}), 'Ids'),
            type
        }

    }

    async dump (arg) {

        const root = this.toRootObject (arg)

        await this.loadObject (root)

        return root

    }

}