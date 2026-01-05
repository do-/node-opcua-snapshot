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

  describe('dump', () => {
    it('should create root object and load it', async () => {
      mockSession.browse.mockResolvedValue({
        statusCode: { isGoodish: () => true },
        references: []
      })

      const result = await dumper.dump()

      expect(result).toEqual({
        class: 'Object',
        ns: 0,
        id: 'i=85',
        name: 'Objects',
        type: 'FolderType'
      })
    })

    it('should accept custom root arguments', async () => {
      mockSession.browse.mockResolvedValue({
        statusCode: { isGoodish: () => true },
        references: []
      })

      const customArg = {
        ns: 1,
        id: 'i=123',
        name: 'CustomRoot'
      }

      const result = await dumper.dump(customArg)

      expect(result).toEqual({
        class: 'Object',
        ns: 1,
        id: 'i=123',
        name: 'CustomRoot',
        type: 'FolderType'
      })
    })
  })
})
