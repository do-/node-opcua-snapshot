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

  describe('setValue', () => {
    it('should set value on node using setValueFromSource', () => {
      const mockNode = {
        setValueFromSource: jest.fn(),
        dataType: { value: 11 }
      }
      mockAddressSpace.findNode.mockReturnValue(mockNode)

      loader.setValue('ns=1;i=123', 'testValue', '2023-01-01T00:00:00Z', 'Good')

      expect(mockNode.setValueFromSource).toHaveBeenCalled()
    })
  })
})
