import fs from "node:fs";
import * as nodeOpcua from "node-opcua";
import { Dumper, Loader } from "./index.mjs";
const { OPCUAClient, OPCUAServer, StatusCodes } = nodeOpcua;
////////////////////////////////////////////////////////////////////////////////
async function main() {
//    await dump('opcua.json', 'opc.tcp://localhost:4840/', { ns: 0, id: 'i=84' });
    await run('opcua.json', 4841);
}
////////////////////////////////////////////////////////////////////////////////
async function dump(filePath, endpointUrl, rootNode) {
    const client = OPCUAClient.create({ endpointMustExist: false });
    try {
        await client.connect(endpointUrl);
        const session = await client.createSession();
        const dumper = new Dumper(session);
        // dumper.on ('start',   _ => console.log (_))
        // dumper.on ('warning', _ => console.log (_))
        // dumper.on ('finish', _  => console.log ('finish'))
        const snapshot = await dumper.dump(rootNode);
        fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2));
    }
    finally {
        await client.disconnect();
    }
}
////////////////////////////////////////////////////////////////////////////////
async function run(fn, port) {
    const server = new OPCUAServer({ endpoints: [{ port }] });
    await server.initialize();
    const loader = new Loader(server);
    {
        const MS_IN_DAY = 1000 * 60 * 60 * 24, values = [0.0], dates = [(new Date(new Date().toJSON().substring(0, 10) + 'T00:00:00')).getTime()];
        for (let i = 0; i < 10; i++) {
            values.push(values[i] + Math.random());
            dates.unshift(dates[0] - MS_IN_DAY);
        }
        loader.on('var', varNode => {
            if (!varNode.historizing) return
            varNode.accessLevel = 4
// console.log (varNode.dataType.toString ())
            loader.setValues(varNode, values, dates)
        });
        loader.on('method', varMethod => {
            varMethod.bindMethod((args, _, callback) => {
                console.log(args);
                callback(null, { statusCode: StatusCodes.Good });
            });
        });
    }
    loader.load(JSON.parse(fs.readFileSync(fn)));
    await server.start();
    loader.setValue('ns=2;s=GIUSController.ActiveChannel', 'TELEPATHY');
}
////////////////////////////////////////////////////////////////////////////////
main().then(_ => _, _ => console.log(_));
