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

  describe('browse', () => {
    it('should emit start and finish events and return references on success', async () => {
      const mockReferences = [
        { isForward: true, nodeId: 'ns=1;i=123' }
      ]
      mockSession.browse.mockResolvedValue({
        statusCode: { isGoodish: () => true },
        references: mockReferences
      })

      const startSpy = jest.fn()
      const finishSpy = jest.fn()
      dumper.on('start', startSpy)
      dumper.on('finish', finishSpy)

      const result = await dumper.browse('ns=0;i=85')

      expect(startSpy).toHaveBeenCalledWith('ns=0;i=85')
      expect(finishSpy).toHaveBeenCalled()
      expect(result).toBe(mockReferences)
      expect(mockSession.browse).toHaveBeenCalledWith('ns=0;i=85')
    })

    it('should emit warning and return empty array on bad status code', async () => {
      const mockStatusCode = {
        isGoodish: () => false,
        toString: () => 'BadStatus'
      }
      mockSession.browse.mockResolvedValue({
        statusCode: mockStatusCode,
        references: []
      })

      const warningSpy = jest.fn()
      const startSpy = jest.fn()
      const finishSpy = jest.fn()
      dumper.on('warning', warningSpy)
      dumper.on('start', startSpy)
      dumper.on('finish', finishSpy)

      const result = await dumper.browse('ns=0;i=85')

      expect(startSpy).toHaveBeenCalledWith('ns=0;i=85')
      expect(warningSpy).toHaveBeenCalledWith(mockStatusCode)
      expect(finishSpy).toHaveBeenCalled()
      expect(result).toEqual([])
    })

    it('should emit finish even when browse throws an error', async () => {
      mockSession.browse.mockRejectedValue(new Error('Browse failed'))

      const startSpy = jest.fn()
      const finishSpy = jest.fn()
      dumper.on('start', startSpy)
      dumper.on('finish', finishSpy)

      await expect(dumper.browse('ns=0;i=85')).rejects.toThrow('Browse failed')
      expect(startSpy).toHaveBeenCalledWith('ns=0;i=85')
      expect(finishSpy).toHaveBeenCalled()
    })
  })
})
