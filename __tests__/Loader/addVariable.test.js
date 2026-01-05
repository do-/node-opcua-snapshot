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
      addVariable: jest.fn().mockReturnValue({
        nodeId: 'ns=1;i=123',
        dataType: { value: 11 }
      }),
      addAnalogDataItem: jest.fn().mockReturnValue({
        nodeId: 'ns=1;i=456',
        dataType: { value: 11 }
      })
    }
    mockAddressSpace.getNamespaceArray.mockReturnValue([
      'http://opcfoundation.org/UA/',
      mockNamespace
    ])

    Snapshot.mockImplementation(() => {})
    Snapshot.nodeId = jest.fn().mockImplementation(({ns, id}) => `ns=${ns};${id || 'i=123'}`)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('addVariable', () => {
    it('should add BaseDataVariableType', () => {
      const componentOf = { nodeId: 'ns=0;i=85' }
      const variableDef = {
        ns: 1,
        name: 'TestVariable',
        dataType: 11,
        type: 'BaseDataVariableType',
        value: 'test'
      }

      const result = loader.addVariable(componentOf, variableDef)

      expect(mockNamespace.addVariable).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('should handle dataType 0 as Boolean (dataType 11)', () => {
      const componentOf = { nodeId: 'ns=0;i=85' }
      const variableDef = {
        ns: 1,
        name: 'BooleanVariable',
        dataType: 0,
        type: 'BaseDataVariableType',
        value: true
      }

      loader.addVariable(componentOf, variableDef)

      expect(mockNamespace.addVariable).toHaveBeenCalledWith(
        expect.objectContaining({
          dataType: 11
        })
      )
    })

    it('should handle Date dataType (13)', () => {
      const componentOf = { nodeId: 'ns=0;i=85' }
      const variableDef = {
        ns: 1,
        name: 'DateVariable',
        dataType: 13,
        type: 'BaseDataVariableType',
        value: '2023-01-01T00:00:00Z'
      }

      loader.addVariable(componentOf, variableDef)

      const callArgs = mockNamespace.addVariable.mock.calls[0][0]
      expect(callArgs.value.value).toBeInstanceOf(Date)
    })

    it('should add AnalogItemType with properties', () => {
      const componentOf = { nodeId: 'ns=0;i=85' }
      const variableDef = {
        ns: 1,
        name: 'AnalogVariable',
        dataType: 11,
        type: 'AnalogItemType',
        HasProperty: [
          { name: 'EURange', value: { low: 0, high: 100 } },
          { name: 'EngineeringUnits', value: 'Celsius' }
        ]
      }

      loader.addVariable(componentOf, variableDef)

      expect(mockNamespace.addAnalogDataItem).toHaveBeenCalled()
    })
  })
})
