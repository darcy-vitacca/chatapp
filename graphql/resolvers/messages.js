const { UserInputError, AuthenticationError } = require("apollo-server");
const { Op } = require("sequelize");

const { Message, User } = require("../../models");

module.exports = {
  Query: {
    getMessages: async (parent, { from }, { user }) => {
      try {
        if (!user) throw new AuthenticationError("Unauthenticated");
        const otherUser = await User.findOne({
          where: { username: from },
        });

        if (!otherUser) {
          throw new UserInputError("User not found");
        }
        const usernames = [user.username, otherUser.username];

        //what this does is use findAll in sequelize and searches the Message table through message model and use op.in 
        //to search for either user name in the to and from column and order them by created at in descinding mode it will map automatically into json
        const messages = await Message.findAll({
          where: {
            from: { [Op.in]: usernames },
            to: { [Op.in]: usernames },
          },
          order: [["createdAt", "DESC"]],
        });
        return messages
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
  },

  Mutation: {
    //SEND MESSAGE
    sendMessage: async (parent, { to, content }, { user }) => {
      try {
        //if we get past this it means they are logged in according to the context
        if (!user) throw new AuthenticationError("Unauthenticated");
        const recipient = await User.findOne({ where: { username: to } });

        //Check if there is a recipent and content
        if (!recipient) {
          throw new UserInputError("User not found");
        } else if (recipient.username === user.username) {
          throw new UserInputError("Can't message yourself");
        }
        if (content.trim() === "") {
          throw new UserInputError("Message is empty");
        }
        //send message in the database
        const message = await Message.create({
          from: user.username,
          to,
          content,
        });

        return message;
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
  },
};
