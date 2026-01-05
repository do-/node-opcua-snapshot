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

  describe('setNamespaceArray', () => {
    it('should register new namespaces and update namespace array', () => {
      const mockNamespaceArray = ['http://opcfoundation.org/UA/']
      mockAddressSpace.getNamespaceArray.mockReturnValue(mockNamespaceArray)

      const newNamespaceArray = [
        'http://opcfoundation.org/UA/',
        'http://newnamespace.com/ns1',
        'http://newnamespace.com/ns2'
      ]

      loader.setNamespaceArray(newNamespaceArray)

      expect(mockAddressSpace.getNamespaceArray).toHaveBeenCalled()
      expect(mockAddressSpace.registerNamespace).toHaveBeenCalledTimes(2)
      expect(mockAddressSpace.registerNamespace).toHaveBeenCalledWith('http://newnamespace.com/ns1')
      expect(mockAddressSpace.registerNamespace).toHaveBeenCalledWith('http://newnamespace.com/ns2')
    })

    it('should handle empty namespace array', () => {
      const mockNamespaceArray = ['http://opcfoundation.org/UA/']
      mockAddressSpace.getNamespaceArray.mockReturnValue(mockNamespaceArray)

      loader.setNamespaceArray(['http://opcfoundation.org/UA/'])
      expect(mockAddressSpace.registerNamespace).not.toHaveBeenCalled()
    })
  })
})
