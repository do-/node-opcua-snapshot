const Loader = require('../../lib/Loader')
const { createMockAddressSpace, createMockServer } = require('../helpers/mockServer')

jest.mock('../../lib/Snapshot')

describe('Loader', () => {
  let mockAddressSpace
  let mockServer
  let loader

  beforeEach(() => {
    mockAddressSpace = createMockAddressSpace()
    mockServer = createMockServer(mockAddressSpace)
    loader = new Loader(mockServer)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getNode', () => {
    it('should return node directly if it has nodeId property', () => {
      const mockNode = { nodeId: 'ns=1;i=123', dataType: { value: 11 } }
      const result = loader.getNode(mockNode)
      expect(result).toBe(mockNode)
    })

    it('should find node by ID using address space', () => {
      const nodeId = 'ns=1;i=123'
      const mockFoundNode = { nodeId, dataType: { value: 11 } }
      mockAddressSpace.findNode.mockReturnValue(mockFoundNode)

      const result = loader.getNode(nodeId)
      expect(result).toBe(mockFoundNode)
      expect(mockAddressSpace.findNode).toHaveBeenCalledWith(nodeId)
    })
  })
})
