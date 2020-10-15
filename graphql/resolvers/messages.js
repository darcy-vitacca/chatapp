const {
  UserInputError,
  AuthenticationError,
  withFilter,
  ForbiddenError,
} = require("apollo-server");
const { Op } = require("sequelize");

const { Message, User, Reaction } = require("../../models");

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
          //This includes any reacitons with corresponding message id's so out of the id's match up the same with the reactions id
          include: [{model: Reaction, as : 'reactions'}]
        });
        return messages;
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
  },
  Mutation: {
    //SEND MESSAGE
    sendMessage: async (parent, { to, content }, { user, pubsub }) => {
      try {
        //if we get past this it means they are logged in according to the context
        if (!user) throw new AuthenticationError("Unauthenticated");

        const recipient = await User.findOne({ where: { username: to } });
        //Check if there is a recipent and content
        if (!recipient) {
          throw new UserInputError("User not found");
        } else if (recipient.username === user.username) {
          throw new UserInputError("You can't message yourself");
        }
        //send message in the database
        if (content.trim() === "") {
          throw new UserInputError("Message is empty");
        }

        const message = await Message.create({
          from: user.username,
          to,
          content,
        });
        //the payload is the new message
        pubsub.publish("NEW_MESSAGE", { newMessage: message });

        return message;
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
    reactToMessage: async (_, { uuid, content }, { user, pubsub }) => {
      const reactions = ["❤️", "😆", "😯", "😢", "😡", "👍", "👎"];
      console.log("here");
      try {
        // Validate reaction content
        if (!reactions.includes(content)) {
          throw new UserInputError("Invalid reaction");
        }

        // Get user
        const username = user ? user.username : "";
        user = await User.findOne({ where: { username } });
        if (!user) throw new AuthenticationError("Unauthenticated");

        // Get message
        const message = await Message.findOne({ where: { uuid } });
        if (!message) throw new UserInputError("message not found");

        if (message.from !== user.username && message.to !== user.username) {
          throw new ForbiddenError("Unauthorized");
        }

        let reaction = await Reaction.findOne({
          where: { messageId: message.id, userId: user.id },
        });

        if (reaction) {
          // Reaction exists, update it
          reaction.content = content;
          await reaction.save();
        } else {
          // Reaction doesnt exists, create it
          reaction = await Reaction.create({
            messageId: message.id,
            userId: user.id,
            content,
          });
        }

        pubsub.publish('NEW_REACTION', { newReaction: reaction })

        return reaction;
      } catch (err) {
        throw err;
      }
    },
  },
  //pubsub is basically like a radio so anyone who is listening can recieve the messages each time we fire this event our subscription recieves it to anyone who is listening. subscritpions need to passed in an object. It will always be listening so once something passes through the channel that is listening to it it will show a new message
  Subscription: {
    newMessage: {
      subscribe: withFilter(
        (_, __, { pubsub, user }) => {
          //because we attached the token to the context we can check it using the user
          if (!user) throw new AuthenticationError("Unauthenticated");

          //We have to check only for the subscription that is relevant to the autenticated  user , this checks for all users so we have to filter the filter taken the resolver as first arg and thena s second arg it takes a filter
          return pubsub.asyncIterator("NEW_MESSAGE");
          //This is taking newMessage from the pubsub in the send message section
        },
        ({ newMessage }, _, { user }) => {
          //here we check if the username is the same as the from or to of the message we are broadcasting if not we don't fetch it return true will send it return false skips it. This protects users from other messages
          console.log(newMessage);
          if (
            newMessage.from === user.username ||
            newMessage.to === user.username
          ) {
            return true;
          }

          return false;
        }
      ),
    },
    newReaction: {
      subscribe: withFilter(
        (_, __, { pubsub, user }) => {
          if (!user) throw new AuthenticationError("Unauthenticated");
          return pubsub.asyncIterator("NEW_REACTION");
        },
        async ({ newReaction }, _, { user }) => {
          const message = await newReaction.getMessage();
          if (message.from === user.username || message.to === user.username) {
            return true;
          }

          return false;
        }
      ),
    },
  },
};
