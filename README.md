# apollo-server-integration-vercel

An Apollo Server integration for use with Vercel.

## Getting started

First create a Vercel API route by creating a file in the api directory `api/graphql.ts`.  
This route will be accessible at `/api/graphql`.

Next create an Apollo Server instance and pass it to `startServerAndCreateVercelHandler`:

```js
import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/vercel';
import { gql } from 'graphql-tag';

const resolvers = {
  Query: {
    hello: () => 'world',
  },
};

const typeDefs = gql`
  type Query {
    hello: String
  }
`;

const server = new ApolloServer({
  resolvers,
  typeDefs,
});

export default startServerAndCreateVercelHandler(server);
```

You may also pass a context function to `startServerAndCreateVercelHandler` as such:

```js
export default startServerAndCreateVercelHandler(server, {
  context: async (req, res) => ({ req, res, user: await getLoggedInUser(req) }),
});
```

The Vercel `req` and `res` objects are passed along to the context function.
