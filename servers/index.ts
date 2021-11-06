import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { TableClient } from "@azure/data-tables"
import { DefaultAzureCredential } from "@azure/identity"

const account = "mineserverless";


const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    
    context.log('HTTP trigger function processed a request, ' + req.url);
    const credential = new DefaultAzureCredential();
    const tableClient = new TableClient(
        `https://${account}.table.core.windows.net`,
        'servers',
        credential
      );
    const partitionKey = 'fixed';

      if(req.method == 'GET') {
        let entitiesIter = tableClient.listEntities();
        let i = 1;
        const resp = [];
        for await (const entity of entitiesIter) {
          resp.push({ serverName: entity.rowKey, size: entity.size });
        }
        context.res = {
          // status: 200, /* Defaults to 200 */
          body: resp
        };
  
      } else if (req.method == 'POST') {
        const body = req.body;
        let entitiesIter = await tableClient.listEntities( { queryOptions: { filter: `rowKey='${body.serverName}'` }});
        let found = false;
        for await (const entity of entitiesIter) {
          found = true;
          break;
        }
        
        if (found) {
          context.res = {
            status: 500,
            body: 'Server alread exists'
          };
        } else {
          await tableClient.createEntity({ partitionKey, rowKey: body.serverName, size: body.size });
          context.res = {
            // status: 200, /* Defaults to 200 */
            boby: body
          };
        }
      }



};

export default httpTrigger;