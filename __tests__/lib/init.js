module.exports = function (server) {

  const {addressSpace} = server.engine, ns = addressSpace.getNamespace (1)

  ns.addObject ({
    nodeId: 'ns=1;i=5001',
    browseName: {namespaceIndex: 1, name: 'BaseObject'},
    organizedBy: 'ns=0;i=85',
    typeDefinition: "FolderType",
  })

  const myDeviceNode = ns.addObject ({
    nodeId: 'ns=1;s=MyDevice',
    browseName: {namespaceIndex: 1, name: 'MyDevice'},
    organizedBy: 'ns=1;i=5001'
  })

  ns.addMethod (myDeviceNode, {
    nodeId: 'ns=1;s=MyDevice.M1',
    browseName: {namespaceIndex: 1, name: 'M1'},
  })

  {

    const dataType = 12

    ns.addVariable ({
      nodeId: 'ns=1;s=MyDevice.V1',
      browseName: {namespaceIndex: 1, name: 'V1'},
      componentOf: 'ns=1;s=MyDevice',
      dataType,
      value: {dataType, value: 'String value'},
      minimumSamplingInterval: 1000,
    })

  }

  {

    const dataType = 11

    ns.addVariable ({
      nodeId: 'ns=1;s=MyDevice.H1',
      browseName: {namespaceIndex: 1, name: 'H1'},
      componentOf: 'ns=1;s=MyDevice',
      dataType,
      minimumSamplingInterval: 1000,
    })

  }

}