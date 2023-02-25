/* eslint-disable no-restricted-syntax */
import { ApolloServer, BaseContext, ContextFunction, HeaderMap } from '@apollo/server';
import type { VercelRequest, VercelResponse, VercelApiHandler } from '@vercel/node';
import type { WithRequired } from '@apollo/utils.withrequired';
import { parse } from 'url';

interface Options<Context extends BaseContext> {
  context?: ContextFunction<Parameters<VercelApiHandler>, Context>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const defaultContext: ContextFunction<[], any> = async () => ({});

function startServerAndCreateVercelHandler(
  server: ApolloServer<BaseContext>,
  options?: Options<BaseContext>
): VercelApiHandler;
function startServerAndCreateVercelHandler<Context extends BaseContext>(
  server: ApolloServer<Context>,
  options: WithRequired<Options<Context>, 'context'>
): VercelApiHandler;

function startServerAndCreateVercelHandler<Context extends BaseContext>(
  server: ApolloServer<Context>,
  options?: Options<Context>
) {
  server.startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests();

  const contextFunction = options?.context || defaultContext;

  const handler = async (req: VercelRequest, res: VercelResponse) => {
    const headers = new HeaderMap();

    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') {
        headers.set(key, value);
      }
    }

    const httpGraphQLResponse = await server.executeHTTPGraphQLRequest({
      context: () => contextFunction(req, res),
      httpGraphQLRequest: {
        body: req.body,
        headers,
        method: req.method || 'POST',
        search: req.url ? parse(req.url).search || '' : ''
      }
    });

    for (const [key, value] of httpGraphQLResponse.headers) {
      res.setHeader(key, value);
    }

    res.statusCode = httpGraphQLResponse.status || 200;

    if (httpGraphQLResponse.body.kind === 'complete') {
      res.send(httpGraphQLResponse.body.string);
    } else {
      for await (const chunk of httpGraphQLResponse.body.asyncIterator) {
        res.write(chunk);
      }

      res.end();
    }
  };

  return handler;
}

export { startServerAndCreateVercelHandler };
