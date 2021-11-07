import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { TableClient } from "@azure/data-tables"
import { DefaultAzureCredential } from "@azure/identity"
import { ResourceManagementClient } from "@azure/arm-resources";
import { ContainerInstanceManagementClient } from "@azure/arm-containerinstance";

const account = "mineserverless";
const subscriptionId = process.env["SUBSCRIPTION_ID"];
const resourceGroupName = process.env["RESOURCE_GROUP"];
const issuer = process.env["ISSUER"];
const audience = process.env["AUDIENCE"];
import { Jwt, Secret, decode } from "jsonwebtoken";




const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    
    context.log('HTTP trigger function processed a request, ' + req.url);
    context.log('Route', context.bindingData);
    context.log('Route', context.bindingData.serverName);
    context.log('Route', context.bindingData.command);
    context.log('Auth', req.headers['authorization']); 
    let token = req.headers['authorization'];
    if(!token) {
      context.res = {
        status: 403,
        body: `"Missing authentication"`
      };      
      return;
    } 
    if (!token.startsWith("Bearer ")) {
      context.res = {
        status: 403,
        body: `"Wrong token type"`
      };      
      return;
    }
    token =token.substring("Bearer ".length).trim();
    try {
      const jwt:Jwt = await decode(token, { complete: true});
      if (jwt.payload.aud != audience || jwt.payload.iss != issuer) {
        context.res = {
          status: 403,
          body: `"Wrong isser or audience"`
        };      
        return;
      }
    } catch(error) {
      context.res = {
        status: 403,
        body: `"${error.message}"`
      };      
      return;
    }
    
    
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
          resp.push(await getServerInfo(entity));
        }
        if (filter) {
          // if filter, means we searched for one
          resp = resp[0];
        }
        context.res = {
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
              context.res = {
                status: await start(context.bindingData.serverName),
                body: '"Starting"'
              };
              break;
            case "stop":
              context.res = {
                status: await stop(context.bindingData.serverName),
                body: '"Stoping"'
              };
              break;
            default:
              context.res = {
                status: 500,
                body: '"Wrong command"'
              };
          }
          return;
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
              body: 'Server alread exists:' + JSON.stringify(server)
            };
          } else {
            await tableClient.createEntity({ partitionKey, rowKey: body.serverName, size: body.size , whitelist: body.whitelist, ops: body.ops, motd: body.motd, maxPlayers: body.maxPlayers});
            const retVal = await createServer(body.serverName, body.size, body.whitelist, body.ops, body.motd, body.maxPlayers);
            body.status = "Creating";
            context.res = {
              status: retVal,
              body: body
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

async function stop(serverName: string) {
  const credential = new DefaultAzureCredential();
  const aciClient = new ContainerInstanceManagementClient(credential, subscriptionId);
  const response = await aciClient.containerGroups.stop(resourceGroupName, serverName);
  return response._response.status;
}

async function start(serverName: string) {
  const credential = new DefaultAzureCredential();
  const aciClient = new ContainerInstanceManagementClient(credential, subscriptionId);
  const response = await aciClient.containerGroups.start(resourceGroupName, serverName);
  return response._response.status;
}


async function getServerInfo(serverInfo) {
  const credential = new DefaultAzureCredential();
  const aciClient = new ContainerInstanceManagementClient(credential, subscriptionId);
  try {
    const group = await aciClient.containerGroups.get(resourceGroupName, serverInfo.rowKey);
    return { 
      serverName: serverInfo.rowKey, size: serverInfo.size, status: group.instanceView.state,  whitelist: serverInfo.whitelist, ops: serverInfo.ops, motd: serverInfo.motd,
      dns: group.ipAddress.fqdn, maxPlayers: serverInfo.maxPlayers
    };
  } catch(error) {
    console.log(error);
    return { serverName: serverInfo.rowKey, size: serverInfo.size, status: "NotFound",  whitelist: serverInfo.whitelist, ops: serverInfo.ops, motd: serverInfo.motd, maxPlayers: serverInfo.maxPlayers};
  }
}

async function createServer(serverName:string, size:string, whitelist: string, ops:string, motd: string, maxPlayers: number) {
  let memory = 2;
  let cpu = 1;
  switch(size) {
    case "medium":
      memory = 8;
      cpu = 2;
      break;
    case "large":
      memory = 16;
      cpu = 4;
      break;
    case "small":
    default:
      memory = 4;
      cpu = 1;
      break;
  }
  const credential = new DefaultAzureCredential();
  const resourceClient = new ResourceManagementClient(credential, subscriptionId);
  const createResult = await resourceClient.deployments.beginCreateOrUpdate(resourceGroupName, serverName, { 
    location: "", 
    properties: { 
      mode: "Incremental", 
      templateLink: { 
        uri: "https://raw.githubusercontent.com/andreracz/minecraft-on-azure/master/vanilla-aci.json" 
      },
      parameters: ({
        serverName: {
          "value": serverName
        },
        whitelist: {
          "value": whitelist
        },
        ops: {
          "value": ops
        },
        eula: {
          "value": true
        },
        motd: {
          "value": motd
        },
        memory: {
          value: memory
        },
        numberCpuCores: {
          value: cpu
        },
        maxPlayers: {
          value: maxPlayers
        }
      })
    } 
  });
  return createResult.getInitialResponse().status;
}

export default httpTrigger;