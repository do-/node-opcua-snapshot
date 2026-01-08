module.exports = class {

    static nodeId = ({ns, id}) => `ns=${ns};${id}`

    #root

    static from (namespaceArray, ...objects) {

        return {
            "class": "Object",
            "ns": 0,
            "id": "i=84",
            "name": "RootFolder",
            "type": "FolderType",
            "Organizes": [
                {
                    "class": "Object",
                    "ns": 0,
                    "id": "i=85",
                    "name": "Objects",
                    "Organizes": [
                        ...objects,
                        {
                            "class": "Object",
                            "ns": 0,
                            "id": "i=2253",
                            "name": "Server",
                            "HasProperty": [
                                {
                                    "class": "Variable",
                                    "ns": 0,
                                    "id": "i=2255",
                                    "name": "NamespaceArray",
                                    "type": "PropertyType",
                                    "dataType": 12,
                                    "value": namespaceArray
                                },
                            ],
                        },
                    ],
                }
            ]
        }

    }

    constructor (root) {

        this.#root = root

    }

    get objectsFolder () {

        return this.#root
            .Organizes.find (i => i.name === 'Objects')
            .Organizes

    }

    get namespaceArray () {

        return this.objectsFolder
            .find (i => i.name === 'Server')
            .HasProperty.find (i => i.name === 'NamespaceArray')
                .value

    }

}