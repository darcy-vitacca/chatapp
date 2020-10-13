const { ApolloServer } = require("apollo-server");
const {sequelize} = require('./models')

const typeDefs = require('./graphql/typeDefs')
const resolvers = require('./graphql/resolvers')


//nodemon watches for changes and restarts the server
//This starts a new server, typedefs are routes and resolvers are handlers of the routes
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context : ctx => ctx,
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
