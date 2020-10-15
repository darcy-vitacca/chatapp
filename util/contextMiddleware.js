const jwt = require("jsonwebtoken");

const { PubSub } = require("apollo-server");
const pubsub = new PubSub();

///if we are getting it via http requests we go through this method but through subscriptions we go through connects
module.exports = (context) => {
  let token;
  if (context.req && context.req.headers.authorization) {
    //this extracts the token from the header and takes the bearer part out the use jwt to compare the token and see if it was issued usinng our signature
    token = context.req.headers.authorization.split("Bearer ")[1];
    // console.log(token);

    //check if we are recieving a web socket then we check in that connection if there is a token and verify it
  } else if (context.connection && context.connection.context.Authorization) {
    token = context.connection.context.Authorization.split("Bearer ")[1];
  }
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      // console.log(user);
      context.user = decodedToken;
    });
  }

  //this add pubsub to the context so each time we go to a different resolver we don't need to add it
  context.pubsub = pubsub;

  return context;
};

// const server = new ApolloServer({
//   schema,
//   context: async ({ req, connection }) => {
//     if (connection) {
//       // check connection for metadata
//       return connection.context;
//     } else {
//       // check from req
//       const token = req.headers.authorization || "";

//       return { token };
//     }
//   },
// });
