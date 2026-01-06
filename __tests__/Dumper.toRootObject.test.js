const {toRootObject} = require ('../lib/Dumper')

describe ('Dumper.toRootObject', () => {

  it ('should throw error when argument is not an object', () => {
    expect (() => toRootObject ('not-an-object')).toThrow ('Not an object: not-an-object')
  })

  it ('should throw error when argument is not a plain object', () => {
    expect (() => toRootObject (new Date ())).toThrow (`root.class must be 'Object', found Date`)
  })

  it ('checks the default value', () => {
    expect (toRootObject ()).toEqual ({
        class: 'Object',
        ns: 0,
        id: 'i=85',
        name: 'ObjectsFolder',
        type: 'FolderType'
    })
  })

  it ('checks merging', () => {
    expect (toRootObject ({
      ns: 1,
      id: 'i=123',
      name: 'CustomObject',
      type: 'CustomType'
    }))
    .toEqual ({
      class: 'Object',
      ns: 1,
      id: 'i=123',
      name: 'CustomObject',
      type: 'CustomType'
    })
  })

})