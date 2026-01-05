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

  describe('NS getter', () => {
    it('should return namespace array from address space', () => {
      const mockNamespaceArray = ['http://opcfoundation.org/UA/']
      mockAddressSpace.getNamespaceArray.mockReturnValue(mockNamespaceArray)

      const result = loader.NS
      expect(result).toBe(mockNamespaceArray)
      expect(mockAddressSpace.getNamespaceArray).toHaveBeenCalled()
    })
  })
})
