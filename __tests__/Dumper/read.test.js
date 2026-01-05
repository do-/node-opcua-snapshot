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

  describe('read', () => {
    it('should emit start and finish events and return read results', async () => {
      const mockReadResults = [
        { value: { dataType: 11, value: 'test' } }
      ]
      mockSession.read.mockResolvedValue(mockReadResults)

      const startSpy = jest.fn()
      const finishSpy = jest.fn()
      dumper.on('start', startSpy)
      dumper.on('finish', finishSpy)

      const nodeIds = ['ns=1;i=123', 'ns=1;i=456']
      const result = await dumper.read(nodeIds)

      expect(startSpy).toHaveBeenCalledWith(nodeIds)
      expect(finishSpy).toHaveBeenCalled()
      expect(result).toBe(mockReadResults)
      expect(mockSession.read).toHaveBeenCalledWith([
        { nodeId: 'ns=1;i=123' },
        { nodeId: 'ns=1;i=456' }
      ])
    })

    it('should emit finish even when read throws an error', async () => {
      mockSession.read.mockRejectedValue(new Error('Read failed'))

      const startSpy = jest.fn()
      const finishSpy = jest.fn()
      dumper.on('start', startSpy)
      dumper.on('finish', finishSpy)

      const nodeIds = ['ns=1;i=123']
      await expect(dumper.read(nodeIds)).rejects.toThrow('Read failed')
      expect(startSpy).toHaveBeenCalledWith(nodeIds)
      expect(finishSpy).toHaveBeenCalled()
    })
  })
})
