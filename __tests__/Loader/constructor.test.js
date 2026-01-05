const EventEmitter = require('node:events')
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

  describe('constructor', () => {
    it('should extend EventEmitter', () => {
      expect(loader).toBeInstanceOf(EventEmitter)
    })

    it('should initialize with server address space', () => {
      expect(loader).toBeInstanceOf(Loader)
    })
  })
})
