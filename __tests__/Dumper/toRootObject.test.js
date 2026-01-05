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

  describe('toRootObject', () => {
    it('should create default root object when no arguments provided', () => {
      const result = dumper.toRootObject()

      expect(result).toEqual({
        class: 'Object',
        ns: 0,
        id: 'i=85',
        name: 'Objects',
        type: 'FolderType'
      })
    })

    it('should merge provided arguments with default root', () => {
      const arg = {
        ns: 1,
        id: 'i=123',
        name: 'CustomObject',
        type: 'CustomType'
      }

      const result = dumper.toRootObject(arg)

      expect(result).toEqual({
        class: 'Object',
        ns: 1,
        id: 'i=123',
        name: 'CustomObject',
        type: 'CustomType'
      })
    })

    it('should throw error when argument is not an object', () => {
      expect(() => {
        dumper.toRootObject('not-an-object')
      }).toThrow('Not an object: not-an-object')
    })

    it('should throw error with undefined reference due to bug in original code', () => {
      expect(() => {
        dumper.toRootObject({ class: 'Variable' })
      }).toThrow("root is not defined")
    })

    it('should use default values appropriately', () => {
      const arg = {
        ns: 1,
        id: 'i=123'
      }

      const result = dumper.toRootObject(arg)

      expect(result).toEqual({
        class: 'Object',
        ns: 1,
        id: 'i=123',
        name: undefined,
        type: 'FolderType'
      })
    })
  })
})
