const EventEmitter = require('node:events')
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

  describe('constructor', () => {
    it('should extend EventEmitter', () => {
      expect(dumper).toBeInstanceOf(EventEmitter)
    })

    it('should initialize with session', () => {
      expect(dumper).toBeInstanceOf(Dumper)
    })
  })
})
