const Loader = require('../../lib/Loader')
const { createMockAddressSpace, createMockServer } = require('../helpers/mockServer')

jest.mock('../../lib/Snapshot')
const Snapshot = require('../../lib/Snapshot')

describe('Loader', () => {
  let mockAddressSpace
  let mockServer
  let loader
  let mockNamespace

  beforeEach(() => {
    mockAddressSpace = createMockAddressSpace()
    mockServer = createMockServer(mockAddressSpace)
    loader = new Loader(mockServer)

    mockNamespace = {
      addObject: jest.fn().mockReturnValue({ nodeId: 'ns=1;o=123' }),
      addVariable: jest.fn().mockReturnValue({
        nodeId: 'ns=1;i=456',
        dataType: { value: 11 }
      }),
      addMethod: jest.fn().mockReturnValue({ nodeId: 'ns=1;m=789' })
    }
    mockAddressSpace.getNamespaceArray.mockReturnValue([
      'http://opcfoundation.org/UA/',
      mockNamespace
    ])

    Snapshot.mockImplementation(() => {})
    Snapshot.nodeId = jest.fn().mockImplementation(({ns, id}) => `ns=${ns};${id || 'o=123'}`)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('addObject', () => {
    it('should add object and organize child objects', () => {
      const organizedBy = { nodeId: 'ns=0;i=85' }
      const objectDef = {
        ns: 1,
        name: 'TestObject',
        Organizes: [
          { ns: 1, name: 'ChildObject', Organizes: [], HasComponent: [] }
        ],
        HasComponent: []
      }

      loader.addObject(organizedBy, objectDef)

      expect(mockNamespace.addObject).toHaveBeenCalled()
    })

    it('should emit var event when adding variable components', (done) => {
      const organizedBy = { nodeId: 'ns=0;i=85' }
      const objectDef = {
        ns: 1,
        name: 'TestObject',
        Organizes: [],
        HasComponent: [
          {
            class: 'Variable',
            ns: 1,
            name: 'TestVariable',
            dataType: 11,
            type: 'BaseDataVariableType',
            value: 'test'
          }
        ]
      }

      loader.on('var', (variable) => {
        expect(variable).toBeDefined()
        done()
      })

      loader.addObject(organizedBy, objectDef)
    })

    it('should emit method event when adding method components', (done) => {
      const organizedBy = { nodeId: 'ns=0;i=85' }
      const objectDef = {
        ns: 1,
        name: 'TestObject',
        Organizes: [],
        HasComponent: [
          {
            class: 'Method',
            ns: 1,
            name: 'TestMethod',
            inputArguments: [],
            outputArguments: []
          }
        ]
      }

      loader.on('method', (method) => {
        expect(method).toBeDefined()
        done()
      })

      loader.addObject(organizedBy, objectDef)
    })
  })
})
