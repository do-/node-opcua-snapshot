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

  describe('setValues', () => {
    it('should set multiple values on node', () => {
      const mockNode = {
        setValueFromSource: jest.fn(),
        dataType: { value: 11 }
      }
      mockAddressSpace.findNode.mockReturnValue(mockNode)
      const values = ['value1', 'value2']
      const dates = ['2023-01-01T00:00:00Z', '2023-01-02T00:00:00Z']

      loader.setValues('ns=1;i=123', values, dates, 'Good')

      expect(mockNode.setValueFromSource).toHaveBeenCalledTimes(2)
    })
  })
})
