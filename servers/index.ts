import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { TableClient } from "@azure/data-tables"
import { DefaultAzureCredential } from "@azure/identity"

const account = "mineserverless";


const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    
    context.log('HTTP trigger function processed a request, ' + req.url);
    context.log('Route', context.bindingData);
    context.log('Route', context.bindingData.serverName);
    context.log('Route', context.bindingData.command);
    const credential = new DefaultAzureCredential();
    const tableClient = new TableClient(
        `https://${account}.table.core.windows.net`,
        'servers',
        credential
      );
    const partitionKey = 'fixed';

      if(req.method == 'GET') {
        let filter = null;
        if (context.bindingData.serverName) {
          filter = `RowKey eq '${context.bindingData.serverName}'`;
        }
        context.log(filter);
        let entitiesIter = tableClient.listEntities({ queryOptions: { filter: filter }});
        let resp:any = [];
        for await (const entity of entitiesIter) {
          resp.push({ serverName: entity.rowKey, size: entity.size });
        }
        if (filter) {
          resp = resp[0];
          // GET STATUS
        }
        context.res = {
          // status: 200, /* Defaults to 200 */
          body: resp
        };
      } else if (req.method == 'POST') {
        if (context.bindingData.serverName && context.bindingData.command) {
          const server = await getServerFromTable(tableClient, context.bindingData.serverName);
          if (!server) {
            context.res = {
              status: 500,
              body: 'Server not found for issuing command'
            };
            return;
          }
          switch(context.bindingData.command) {
            case "start":
              break;
            case "stop":
              break;
            default:
              context.res = {
                status: 500,
                body: 'Wrong command'
              };
          }
        } else if (context.bindingData.serverName) {
          context.res = {
            status: 500,
            body: 'Missing command'
          };
        } else {
          const body = req.body;
          const server = await getServerFromTable(tableClient, body.serverName);
          if (server) {
            context.res = {
              status: 500,
              body: 'Server alread exists:' + JSON.stringify(server);
            };
          } else {
            await tableClient.createEntity({ partitionKey, rowKey: body.serverName, size: body.size });
            // CREATE SERVER
            context.res = {
              // status: 200, /* Defaults to 200 */
              boby: body
            };
          }
        }
      }

};

async function  getServerFromTable(tableClient: TableClient, serverName: string) {
  let entitiesIter = await tableClient.listEntities( { queryOptions: { filter: `RowKey eq '${serverName}'` }});
  for await (const entity of entitiesIter) {
    return { serverName: entity.rowKey, size: entity.size }
  }
  return null;
}

export default httpTrigger;