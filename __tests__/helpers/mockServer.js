function createMockAddressSpace() {
  return {
    getNamespaceArray: jest.fn(),
    findNode: jest.fn().mockImplementation((nodeId) => {
      return {
        nodeId,
        setValueFromSource: jest.fn(),
        dataType: { value: 11 }
      }
    }),
    registerNamespace: jest.fn(),
    rootFolder: {
      objects: { nodeId: 'ns=0;i=85' }
    },
    installHistoricalDataNode: jest.fn()
  }
}

function createMockServer(addressSpace) {
  return {
    engine: {
      addressSpace: addressSpace || createMockAddressSpace()
    }
  }
}

module.exports = { createMockAddressSpace, createMockServer }
