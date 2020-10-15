const { ApolloServer } = require("apollo-server");

const { sequelize } = require("./models");

//this looks for a dotenv in the same directory
require("dotenv").config();

const typeDefs = require("./graphql/typeDefs");
const resolvers = require("./graphql/resolvers");

//We will use this as middleware and want to use it before we use anything on any request to fetch the token of the user then forward it to be used from the context
const contextMiddleware = require("./util/contextMiddleware");

//nodemon watches for changes and restarts the server
//This starts a new server, typedefs are routes and resolvers are handlers of the routes
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: contextMiddleware,
  subscriptions: { path: "/" },
});

server.listen().then(({ url, subscriptionsUrl }) => {
  console.log(`🚀 Server ready at ${url}`);
  console.log(`🚀 Subscriptions ready at ${subscriptionsUrl}`);
  sequelize
    .authenticate()
    .then(() => {
      console.log("Database conencted!");
    })
    .catch((err) => {
      console.log(err);
    });
});
