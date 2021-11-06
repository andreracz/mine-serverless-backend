import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { TableClient } from "@azure/data-tables"
import { DefaultAzureCredential } from "@azure/identity"

const account = "mineserverless";


const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    
    context.log('HTTP trigger function processed a request.');
    const credential = new DefaultAzureCredential();
    const tableClient = new TableClient(
        `https://${account}.table.core.windows.net`,
        'servers',
        credential
      );

      let entitiesIter = tableClient.listEntities()
      let i = 1;
      const resp = [];
      for await (const entity of entitiesIter) {
        resp.push(entity);
      }

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: resp
    };

};

export default httpTrigger;