const userResolvers = require("./users");
const messageResolvers = require("./messages");

// You can perform changes like in message here because it isn't top level from the resolvers it's getting passed down so we can access value within the parent
module.exports = {
Message : {
    createdAt: (parent) => parent.createdAt.toISOString()
},

  Query: {
    ...userResolvers.Query,
    ...messageResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...messageResolvers.Mutation,
  },
};
