const { gql } = require("apollo-server");

// The GraphQL schema
//The ! tells graphql that a user has to have a username and email
//We then pu the type into the query [] and write that even if we don't return a user return and empty array
//the User under mutaiton is what you are getting back

module.exports = gql`
  type User {
    username: String!
    email: String
    createdAt: String!
    token: String
    latestMessage: Message
    imageUrl: String
  }
  type Message {
    uuid: String!
    content: String!
    from: String!
    to: String!
    createdAt: String!
  }
  type Query {
    getUsers: [User]!
    login(username: String!, password: String!): User!
    getMessages(from: String!): [Message]!
  }
  type Mutation {
    register(
      username: String!
      email: String!
      password: String!
      confirmPassword: String!
    ): User!
    sendMessage(to:String! content:String!): Message!
  }
`;
