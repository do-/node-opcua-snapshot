const Dumper = require('../../lib/Dumper')
const { createMockSession } = require('../helpers/mockSession')

jest.mock('node-opcua', () => require('../helpers/mockOpcua'))

describe('Dumper', () => {
  let mockSession
  let dumper

  beforeEach(() => {
    mockSession = createMockSession()
    dumper = new Dumper(mockSession)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('loadObject', () => {
    it('should process object with forward references', async () => {
      const mockReference = {
        isForward: true,
        referenceTypeId: 'ns=0;i=35',
        nodeClass: 'Object',
        nodeId: 'ns=1;o=123',
        browseName: { namespaceIndex: 1, name: 'ChildObject' },
        typeDefinition: 'ns=0;i=61',
        toJSON: function() {
          return {
            referenceTypeId: this.referenceTypeId,
            nodeClass: this.nodeClass,
            nodeId: this.nodeId,
            browseName: this.browseName,
            typeDefinition: this.typeDefinition
          }
        }
      }

      mockSession.browse.mockResolvedValueOnce({
        statusCode: { isGoodish: () => true },
        references: [mockReference]
      }).mockResolvedValueOnce({
        statusCode: { isGoodish: () => true },
        references: []
      })

      const parent = {
        ns: 0,
        id: 'i=85',
        name: 'Root'
      }

      await dumper.loadObject(parent)

      expect(mockSession.browse).toHaveBeenCalledWith('ns=0;i=85')
      expect(parent.Organizes).toBeDefined()
      expect(parent.Organizes).toHaveLength(1)
    })

    it('should process methods and get argument definitions (lines 86-92)', async () => {
      const mockReference = {
        isForward: true,
        referenceTypeId: 'ns=0;i=47',
        nodeClass: 'Method',
        nodeId: 'ns=1;m=789',
        browseName: { namespaceIndex: 1, name: 'TestMethod' },
        typeDefinition: 'ns=0;i=0',
        toJSON: function() {
          return {
            referenceTypeId: this.referenceTypeId,
            nodeClass: this.nodeClass,
            nodeId: this.nodeId,
            browseName: this.browseName,
            typeDefinition: this.typeDefinition
          }
        }
      }

      mockSession.browse.mockResolvedValueOnce({
        statusCode: { isGoodish: () => true },
        references: [mockReference]
      }).mockResolvedValueOnce({
        statusCode: { isGoodish: () => true },
        references: []
      })

      mockSession.getArgumentDefinition.mockResolvedValue({
        inputArguments: [{ name: 'input1', dataType: 11 }],
        outputArguments: [{ name: 'output1', dataType: 11 }]
      })

      const parent = {
        ns: 0,
        id: 'i=85',
        name: 'Root'
      }

      await dumper.loadObject(parent)

      expect(mockSession.browse).toHaveBeenCalledWith('ns=0;i=85')
      expect(mockSession.getArgumentDefinition).toHaveBeenCalled()
      expect(parent.HasComponent).toBeDefined()
      expect(parent.HasComponent[0]).toEqual(
        expect.objectContaining({
          class: 'Method',
          name: 'TestMethod',
          inputArguments: [{ name: 'input1', dataType: 11 }],
          outputArguments: [{ name: 'output1', dataType: 11 }]
        })
      )
    })

    it('should process variables and read their values (lines 113-121)', async () => {
      const mockReference = {
        isForward: true,
        referenceTypeId: 'ns=0;i=47',
        nodeClass: 'Variable',
        nodeId: 'ns=1;i=456',
        browseName: { namespaceIndex: 1, name: 'TestVariable' },
        typeDefinition: 'ns=0;i=63',
        toJSON: function() {
          return {
            referenceTypeId: this.referenceTypeId,
            nodeClass: this.nodeClass,
            nodeId: this.nodeId,
            browseName: this.browseName,
            typeDefinition: this.typeDefinition
          }
        }
      }

      mockSession.browse.mockResolvedValueOnce({
        statusCode: { isGoodish: () => true },
        references: [mockReference]
      }).mockResolvedValueOnce({
        statusCode: { isGoodish: () => true },
        references: []
      })

      mockSession.read.mockResolvedValue([
        { value: { dataType: 11, value: 'testValue' } }
      ])

      const parent = {
        ns: 0,
        id: 'i=85',
        name: 'Root'
      }

      await dumper.loadObject(parent)

      expect(mockSession.browse).toHaveBeenCalledWith('ns=0;i=85')
      expect(mockSession.read).toHaveBeenCalledWith([{ nodeId: 'ns=1;i=456' }])
      expect(parent.HasComponent).toBeDefined()
      expect(parent.HasComponent[0]).toEqual(
        expect.objectContaining({
          class: 'Variable',
          name: 'TestVariable',
          dataType: 11,
          value: 'testValue'
        })
      )
    })

    it('should process variables with null values (line 103 false branch)', async () => {
      const mockReference = {
        isForward: true,
        referenceTypeId: 'ns=0;i=47',
        nodeClass: 'Variable',
        nodeId: 'ns=1;i=456',
        browseName: { namespaceIndex: 1, name: 'TestVariable' },
        typeDefinition: 'ns=0;i=63',
        toJSON: function() {
          return {
            referenceTypeId: this.referenceTypeId,
            nodeClass: this.nodeClass,
            nodeId: this.nodeId,
            browseName: this.browseName,
            typeDefinition: this.typeDefinition
          }
        }
      }

      mockSession.browse.mockResolvedValueOnce({
        statusCode: { isGoodish: () => true },
        references: [mockReference]
      }).mockResolvedValueOnce({
        statusCode: { isGoodish: () => true },
        references: []
      })

      mockSession.read.mockResolvedValue([
        { value: { dataType: 11, value: null } }
      ])

      const parent = {
        ns: 0,
        id: 'i=85',
        name: 'Root'
      }

      await dumper.loadObject(parent)

      expect(mockSession.browse).toHaveBeenCalledWith('ns=0;i=85')
      expect(mockSession.read).toHaveBeenCalledWith([{ nodeId: 'ns=1;i=456' }])
      expect(parent.HasComponent).toBeDefined()
      expect(parent.HasComponent[0]).toEqual(
        expect.objectContaining({
          class: 'Variable',
          name: 'TestVariable',
          dataType: 11
        })
      )
      expect(parent.HasComponent[0]).not.toHaveProperty('value')
    })

    it('should process variables with undefined values (line 103 false branch)', async () => {
      const mockReference = {
        isForward: true,
        referenceTypeId: 'ns=0;i=47',
        nodeClass: 'Variable',
        nodeId: 'ns=1;i=456',
        browseName: { namespaceIndex: 1, name: 'TestVariable' },
        typeDefinition: 'ns=0;i=63',
        toJSON: function() {
          return {
            referenceTypeId: this.referenceTypeId,
            nodeClass: this.nodeClass,
            nodeId: this.nodeId,
            browseName: this.browseName,
            typeDefinition: this.typeDefinition
          }
        }
      }

      mockSession.browse.mockResolvedValueOnce({
        statusCode: { isGoodish: () => true },
        references: [mockReference]
      }).mockResolvedValueOnce({
        statusCode: { isGoodish: () => true },
        references: []
      })

      mockSession.read.mockResolvedValue([
        { value: { dataType: 11, value: undefined } }
      ])

      const parent = {
        ns: 0,
        id: 'i=85',
        name: 'Root'
      }

      await dumper.loadObject(parent)

      expect(mockSession.browse).toHaveBeenCalledWith('ns=0;i=85')
      expect(mockSession.read).toHaveBeenCalledWith([{ nodeId: 'ns=1;i=456' }])
      expect(parent.HasComponent).toBeDefined()
      expect(parent.HasComponent[0]).toEqual(
        expect.objectContaining({
          class: 'Variable',
          name: 'TestVariable',
          dataType: 11
        })
      )
      expect(parent.HasComponent[0]).not.toHaveProperty('value')
    })

    it('should ignore backward references', async () => {
      const mockReference = {
        isForward: false,
        referenceTypeId: 'ns=0;i=35',
        nodeClass: 'Object',
        nodeId: 'ns=0;i=84',
        browseName: { namespaceIndex: 0, name: 'Parent' },
        typeDefinition: 'ns=0;i=61',
        toJSON: function() {
          return {
            referenceTypeId: this.referenceTypeId,
            nodeClass: this.nodeClass,
            nodeId: this.nodeId,
            browseName: this.browseName,
            typeDefinition: this.typeDefinition
          }
        }
      }

      mockSession.browse.mockResolvedValueOnce({
        statusCode: { isGoodish: () => true },
        references: [mockReference]
      }).mockResolvedValueOnce({
        statusCode: { isGoodish: () => true },
        references: []
      })

      const parent = {
        ns: 0,
        id: 'i=85',
        name: 'Root'
      }

      await dumper.loadObject(parent)

      expect(mockSession.browse).toHaveBeenCalledWith('ns=0;i=85')
      expect(parent.Organizes).toBeUndefined()
    })
  })
})
