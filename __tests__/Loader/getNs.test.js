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

  describe('getNs', () => {
    it('should return namespace at specified index', () => {
      const mockNs = { addVariable: jest.fn() }
      const mockNamespaceArray = ['http://opcfoundation.org/UA/', mockNs]
      mockAddressSpace.getNamespaceArray.mockReturnValue(mockNamespaceArray)

      const result = loader.getNs({ ns: 1 })
      expect(result).toBe(mockNs)
    })
  })
})
