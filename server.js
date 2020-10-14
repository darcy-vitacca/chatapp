const { ApolloServer } = require("apollo-server");

const {sequelize} = require('./models')



const typeDefs = require('./graphql/typeDefs')
const resolvers = require('./graphql/resolvers')

//We will use this as middleware and want to use it before we use anything on any request to fetch the token of the user then forward it to be used from the context
const contextMiddleware = require('./util/contextMiddleware')

//nodemon watches for changes and restarts the server
//This starts a new server, typedefs are routes and resolvers are handlers of the routes
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context : contextMiddleware,
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
  sequelize.authenticate()
  .then(() => {
      console.log("Database conencted!")
  })
  .catch((err) =>{
      console.log(err)
  })
});
