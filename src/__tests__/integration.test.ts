import { startServerAndCreateVercelHandler } from '@apollo-server-integration-next/startServerAndCreateVercelHandler';
import { ApolloServer, ApolloServerOptions, BaseContext } from '@apollo/server';
import {
  CreateServerForIntegrationTestsOptions,
  defineIntegrationTestSuite
} from '@apollo/server-integration-testsuite';
import { createServer, RequestListener } from 'http';
import { AddressInfo } from 'net';
import { apiResolver } from 'next/dist/server/api-utils/node';

describe('vercelHandler', () => {
  defineIntegrationTestSuite(
    async (
      serverOptions: ApolloServerOptions<BaseContext>,
      testOptions?: CreateServerForIntegrationTestsOptions
    ) => {
      // @ts-ignore
      const server = new ApolloServer<BaseContext>(serverOptions);
      const handler = startServerAndCreateVercelHandler(server, testOptions) as RequestListener;
      const httpServer = createServer((req, res) =>
        apiResolver(req, res, '', handler, {} as Parameters<typeof apiResolver>[4], false)
      );

      await new Promise<void>(resolve => {
        httpServer.listen({ port: 0 }, resolve);
      });

      const { port } = httpServer.address() as AddressInfo;

      return {
        async extraCleanup() {
          await new Promise<void>(resolve => {
            httpServer.close(() => resolve());
          });
        },
        server,
        url: `http://localhost:${port}`
      };
    },
    {
      noIncrementalDelivery: true,
      serverIsStartedInBackground: true
    }
  );
});
