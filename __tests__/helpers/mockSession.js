function createMockSession() {
  return {
    browse: jest.fn(),
    read: jest.fn(),
    getArgumentDefinition: jest.fn()
  }
}

module.exports = { createMockSession }
