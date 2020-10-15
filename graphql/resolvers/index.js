const userResolvers = require("./users");
const messageResolvers = require("./messages");
const {User, Message} =require('../../models')

// You can perform changes like in message here because it isn't top level from the resolvers it's getting passed down so we can access value within the parent
// Subscriptions of messages get's spread
module.exports = {
  Message: {
    createdAt: (parent) => parent.createdAt.toISOString(),
  },
  Reaction: {
    createdAt: (parent) => parent.createdAt.toISOString(),
    message: async (parent) => await Message.findByPk(parent.messageId),
    //this allows us to only get certain attribute 
    user: async (parent) => await User.findByPk(parent.userId, { attributes : ['username' , 'imageUrl', 'createdAt']})
  },
  User: {
    createdAt: (parent) => parent.createdAt.toISOString(),
  },

  Query: {
    ...userResolvers.Query,
    ...messageResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...messageResolvers.Mutation,
  },
  Subscription: {
    ...messageResolvers.Subscription,
  },
};
