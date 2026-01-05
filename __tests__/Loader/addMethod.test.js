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
      addMethod: jest.fn().mockReturnValue({ nodeId: 'ns=1;m=123' })
    }
    mockAddressSpace.getNamespaceArray.mockReturnValue([
      'http://opcfoundation.org/UA/',
      mockNamespace
    ])

    Snapshot.mockImplementation(() => {})
    Snapshot.nodeId = jest.fn().mockImplementation(({ns, id}) => `ns=${ns};${id || 'm=123'}`)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('addMethod', () => {
    it('should add method to namespace', () => {
      const componentOf = { nodeId: 'ns=0;i=85' }
      const methodDef = {
        ns: 1,
        name: 'TestMethod',
        inputArguments: [],
        outputArguments: []
      }

      const result = loader.addMethod(componentOf, methodDef)

      expect(mockNamespace.addMethod).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
  })
})
