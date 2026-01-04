// __tests__/Loader.test.js
const EventEmitter = require('node:events');
const Loader = require('../lib/Loader');

// Mock the entire Snapshot module
jest.mock('../lib/Snapshot');

describe('Loader', () => {
  let mockServer;
  let mockAddressSpace;
  let loader;
  let Snapshot;

  beforeEach(() => {
    // Get the mocked Snapshot constructor
    Snapshot = require('../lib/Snapshot');
    
    // Mock address space methods
    mockAddressSpace = {
      getNamespaceArray: jest.fn(),
      findNode: jest.fn().mockImplementation((nodeId) => {
        return { 
          nodeId, 
          setValueFromSource: jest.fn(),
          dataType: { value: 11 }
        };
      }),
      registerNamespace: jest.fn(),
      rootFolder: {
        objects: { nodeId: 'ns=0;i=85' }
      },
      installHistoricalDataNode: jest.fn()
    };

    // Mock server with engine
    mockServer = {
      engine: {
        addressSpace: mockAddressSpace
      }
    };

    loader = new Loader(mockServer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should extend EventEmitter', () => {
      expect(loader).toBeInstanceOf(EventEmitter);
    });

    it('should initialize with server address space', () => {
      expect(loader).toBeInstanceOf(Loader);
    });
  });

  describe('NS getter', () => {
    it('should return namespace array from address space', () => {
      const mockNamespaceArray = ['http://opcfoundation.org/UA/'];
      mockAddressSpace.getNamespaceArray.mockReturnValue(mockNamespaceArray);
      
      const result = loader.NS;
      expect(result).toBe(mockNamespaceArray);
      expect(mockAddressSpace.getNamespaceArray).toHaveBeenCalled();
    });
  });

  describe('getNs', () => {
    it('should return namespace at specified index', () => {
      const mockNs = { addVariable: jest.fn() };
      const mockNamespaceArray = ['http://opcfoundation.org/UA/', mockNs];
      mockAddressSpace.getNamespaceArray.mockReturnValue(mockNamespaceArray);
      
      const result = loader.getNs({ ns: 1 });
      expect(result).toBe(mockNs);
    });
  });

  describe('getNode', () => {
    it('should return node directly if it has nodeId property', () => {
      const mockNode = { nodeId: 'ns=1;i=123', dataType: { value: 11 } };
      const result = loader.getNode(mockNode);
      expect(result).toBe(mockNode);
    });

    it('should find node by ID using address space', () => {
      const nodeId = 'ns=1;i=123';
      const mockFoundNode = { nodeId, dataType: { value: 11 } };
      mockAddressSpace.findNode.mockReturnValue(mockFoundNode);
      
      const result = loader.getNode(nodeId);
      expect(result).toBe(mockFoundNode);
      expect(mockAddressSpace.findNode).toHaveBeenCalledWith(nodeId);
    });
  });

  describe('setNamespaceArray', () => {
    it('should register new namespaces and update namespace array', () => {
      const mockNamespaceArray = ['http://opcfoundation.org/UA/'];
      mockAddressSpace.getNamespaceArray.mockReturnValue(mockNamespaceArray);
      
      const newNamespaceArray = [
        'http://opcfoundation.org/UA/',
        'http://newnamespace.com/ns1',
        'http://newnamespace.com/ns2'
      ];
      
      loader.setNamespaceArray(newNamespaceArray);
      
      expect(mockAddressSpace.getNamespaceArray).toHaveBeenCalled();
      expect(mockAddressSpace.registerNamespace).toHaveBeenCalledTimes(2);
      expect(mockAddressSpace.registerNamespace).toHaveBeenCalledWith('http://newnamespace.com/ns1');
      expect(mockAddressSpace.registerNamespace).toHaveBeenCalledWith('http://newnamespace.com/ns2');
    });

    it('should handle empty namespace array', () => {
      const mockNamespaceArray = ['http://opcfoundation.org/UA/'];
      mockAddressSpace.getNamespaceArray.mockReturnValue(mockNamespaceArray);
      
      loader.setNamespaceArray(['http://opcfoundation.org/UA/']);
      expect(mockAddressSpace.registerNamespace).not.toHaveBeenCalled();
    });
  });

  describe('setValue', () => {
    it('should set value on node using setValueFromSource', () => {
      const mockNode = { 
        setValueFromSource: jest.fn(),
        dataType: { value: 11 }
      };
      mockAddressSpace.findNode.mockReturnValue(mockNode);
      
      loader.setValue('ns=1;i=123', 'testValue', '2023-01-01T00:00:00Z', 'Good');
      
      expect(mockNode.setValueFromSource).toHaveBeenCalled();
    });
  });

  describe('setValues', () => {
    it('should set multiple values on node', () => {
      const mockNode = { 
        setValueFromSource: jest.fn(),
        dataType: { value: 11 }
      };
      mockAddressSpace.findNode.mockReturnValue(mockNode);
      const values = ['value1', 'value2'];
      const dates = ['2023-01-01T00:00:00Z', '2023-01-02T00:00:00Z'];
      
      loader.setValues('ns=1;i=123', values, dates, 'Good');
      
      expect(mockNode.setValueFromSource).toHaveBeenCalledTimes(2);
    });
  });

  describe('addVariable', () => {
    let mockNamespace;
    
    beforeEach(() => {
      mockNamespace = {
        addVariable: jest.fn().mockReturnValue({ 
          nodeId: 'ns=1;i=123',
          dataType: { value: 11 }
        }),
        addAnalogDataItem: jest.fn().mockReturnValue({ 
          nodeId: 'ns=1;i=456',
          dataType: { value: 11 }
        })
      };
      mockAddressSpace.getNamespaceArray.mockReturnValue([
        'http://opcfoundation.org/UA/',
        mockNamespace
      ]);
      
      // Mock the static nodeId method
      Snapshot.mockImplementation(() => {});
      Snapshot.nodeId = jest.fn().mockImplementation(({ns, id}) => `ns=${ns};${id || 'i=123'}`);
    });

    it('should add BaseDataVariableType', () => {
      const componentOf = { nodeId: 'ns=0;i=85' };
      const variableDef = {
        ns: 1,
        name: 'TestVariable',
        dataType: 11,
        type: 'BaseDataVariableType',
        value: 'test'
      };
      
      const result = loader.addVariable(componentOf, variableDef);
      
      expect(mockNamespace.addVariable).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should handle dataType 0 as Boolean (dataType 11)', () => {
      const componentOf = { nodeId: 'ns=0;i=85' };
      const variableDef = {
        ns: 1,
        name: 'BooleanVariable',
        dataType: 0,
        type: 'BaseDataVariableType',
        value: true
      };
      
      loader.addVariable(componentOf, variableDef);
      
      expect(mockNamespace.addVariable).toHaveBeenCalledWith(
        expect.objectContaining({
          dataType: 11
        })
      );
    });

    it('should handle Date dataType (13)', () => {
      const componentOf = { nodeId: 'ns=0;i=85' };
      const variableDef = {
        ns: 1,
        name: 'DateVariable',
        dataType: 13,
        type: 'BaseDataVariableType',
        value: '2023-01-01T00:00:00Z'
      };
      
      loader.addVariable(componentOf, variableDef);
      
      // Check that the value is properly converted to a Date object
      const callArgs = mockNamespace.addVariable.mock.calls[0][0];
      expect(callArgs.value.value).toBeInstanceOf(Date);
    });

    it('should add AnalogItemType with properties', () => {
      const componentOf = { nodeId: 'ns=0;i=85' };
      const variableDef = {
        ns: 1,
        name: 'AnalogVariable',
        dataType: 11,
        type: 'AnalogItemType',
        HasProperty: [
          { name: 'EURange', value: { low: 0, high: 100 } },
          { name: 'EngineeringUnits', value: 'Celsius' }
        ]
      };
      
      loader.addVariable(componentOf, variableDef);
      
      expect(mockNamespace.addAnalogDataItem).toHaveBeenCalled();
    });
  });

  describe('addMethod', () => {
    let mockNamespace;
    
    beforeEach(() => {
      mockNamespace = { 
        addMethod: jest.fn().mockReturnValue({ nodeId: 'ns=1;m=123' })
      };
      mockAddressSpace.getNamespaceArray.mockReturnValue([
        'http://opcfoundation.org/UA/',
        mockNamespace
      ]);
      
      // Mock the static nodeId method
      Snapshot.mockImplementation(() => {});
      Snapshot.nodeId = jest.fn().mockImplementation(({ns, id}) => `ns=${ns};${id || 'm=123'}`);
    });

    it('should add method to namespace', () => {
      const componentOf = { nodeId: 'ns=0;i=85' };
      const methodDef = {
        ns: 1,
        name: 'TestMethod',
        inputArguments: [],
        outputArguments: []
      };
      
      const result = loader.addMethod(componentOf, methodDef);
      
      expect(mockNamespace.addMethod).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('addObject', () => {
    let mockNamespace;
    
    beforeEach(() => {
      mockNamespace = {
        addObject: jest.fn().mockReturnValue({ nodeId: 'ns=1;o=123' }),
        addVariable: jest.fn().mockReturnValue({ 
          nodeId: 'ns=1;i=456',
          dataType: { value: 11 }
        }),
        addMethod: jest.fn().mockReturnValue({ nodeId: 'ns=1;m=789' })
      };
      mockAddressSpace.getNamespaceArray.mockReturnValue([
        'http://opcfoundation.org/UA/',
        mockNamespace
      ]);
      
      // Mock the static nodeId method
      Snapshot.mockImplementation(() => {});
      Snapshot.nodeId = jest.fn().mockImplementation(({ns, id}) => `ns=${ns};${id || 'o=123'}`);
    });

    it('should add object and organize child objects', () => {
      const organizedBy = { nodeId: 'ns=0;i=85' };
      const objectDef = {
        ns: 1,
        name: 'TestObject',
        Organizes: [
          { ns: 1, name: 'ChildObject', Organizes: [], HasComponent: [] }
        ],
        HasComponent: []
      };
      
      loader.addObject(organizedBy, objectDef);
      
      expect(mockNamespace.addObject).toHaveBeenCalled();
    });

    it('should emit var event when adding variable components', (done) => {
      const organizedBy = { nodeId: 'ns=0;i=85' };
      const objectDef = {
        ns: 1,
        name: 'TestObject',
        Organizes: [],
        HasComponent: [
          {
            class: 'Variable',
            ns: 1,
            name: 'TestVariable',
            dataType: 11,
            type: 'BaseDataVariableType',
            value: 'test'
          }
        ]
      };
      
      loader.on('var', (variable) => {
        expect(variable).toBeDefined();
        done();
      });
      
      loader.addObject(organizedBy, objectDef);
    });

    it('should emit method event when adding method components', (done) => {
      const organizedBy = { nodeId: 'ns=0;i=85' };
      const objectDef = {
        ns: 1,
        name: 'TestObject',
        Organizes: [],
        HasComponent: [
          {
            class: 'Method',
            ns: 1,
            name: 'TestMethod',
            inputArguments: [],
            outputArguments: []
          }
        ]
      };
      
      loader.on('method', (method) => {
        expect(method).toBeDefined();
        done();
      });
      
      loader.addObject(organizedBy, objectDef);
    });
  });

  // describe('load', () => {
  //   it('should load snapshot and create objects', () => {
  //     // Set up mocks specifically for this test
  //     const mockNamespace = {
  //       addObject: jest.fn().mockReturnValue({ nodeId: 'ns=1;o=123' }),
  //       addVariable: jest.fn().mockReturnValue({ 
  //         nodeId: 'ns=1;i=456',
  //         dataType: { value: 11 }
  //       })
  //     };
      
  //     mockAddressSpace.getNamespaceArray.mockReturnValue([
  //       'http://opcfoundation.org/UA/',
  //       mockNamespace
  //     ]);
      
  //     // Mock the static nodeId method
  //     Snapshot.mockImplementation(() => {});
  //     Snapshot.nodeId = jest.fn().mockImplementation(({ns, id}) => `ns=${ns};${id || 'o=123'}`);
      
  //     // Mock the Snapshot constructor to return specific data
  //     const MockSnapshot = require('../lib/Snapshot');
  //     MockSnapshot.mockImplementation(() => {
  //       return {
  //         namespaceArray: ['http://opcfoundation.org/UA/', 'http://test.com/ns'],
  //         objectsFolder: [
  //           {
  //             ns: 1,
  //             name: 'TestObject',
  //             Organizes: [],
  //             HasComponent: []
  //           },
  //           {
  //             ns: 0,
  //             name: 'IgnoredSystemObject',
  //             Organizes: [],
  //             HasComponent: []
  //           }
  //         ]
  //       };
  //     });
      
  //     const root = {};
      
  //     loader.load(root);
      
  //     expect(mockAddressSpace.registerNamespace).toHaveBeenCalledWith('http://test.com/ns');
  //     expect(mockNamespace.addObject).toHaveBeenCalled();
  //   });
  // });
});
