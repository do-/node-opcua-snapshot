const {OPCUAClient, OPCUAServer} = require ('node-opcua')
const Dumper = require ('../lib/Dumper')
const dump = require ('./data/dump.json')
const init = require ('./lib/init')

const port = 4840, enpointUrl = `opc.tcp://localhost:${port}/`
const server = new OPCUAServer ({endpoints: [{port}]})
const client = OPCUAClient.create ({endpointMustExist: false})

let dumper

describe ('Dumper', () => {

  beforeAll (async () => {
    await server.initialize ()    
    init (server)
    await server.start ()
  })

  beforeEach (async () => {
    await client.connect (enpointUrl)
    dumper = new Dumper (await client.createSession ())
  })

  afterEach (async () => {
    dumper = undefined
    await client.disconnect ()
  })

  afterAll (async () => {
    await server.shutdown ()
  })  

  describe ('dump', () => {
    
    it ('should fetch the equivalent of the pre recorded dump', async () => {
      const snapshot = await dumper.dump ({ns: 1, id: 'i=5001'})
      expect (snapshot.Organizes [0]).toEqual (dump)
    })

    it ('should carp and find nothing', async () => {
      const a = []; dumper.on ('warning', _ => a.push (String (_)))
      const snapshot = await dumper.dump ({ns: 1, id: 'i=5002'})
      expect (snapshot.Organizes).toBeUndefined ()
      expect (a).toEqual (['BadNodeIdUnknown (0x80340000)'])
    })

  })

})