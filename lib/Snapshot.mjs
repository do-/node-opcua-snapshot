export default (class {

    static nodeId = ({ ns, id }) => `ns=${ns};${id}`;

    #root;

    constructor (root) {
        this.#root = root;
    }

    get objectsFolder () {
        return this.#root
            .Organizes.find(i => i.name === 'Objects')
            .Organizes;
    }

    get namespaceArray () {
        return this.objectsFolder
            .find(i => i.name === 'Server')
            .HasProperty.find(i => i.name === 'NamespaceArray')
            .value;
    }

})