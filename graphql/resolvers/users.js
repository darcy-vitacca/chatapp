const bcrypt = require("bcryptjs");
const { User, Message } = require("../../models");
const { UserInputError, AuthenticationError } = require("apollo-server");
const jwt = require("jsonwebtoken");

const { Op } = require("sequelize");

// A map of functions which return data for the schema.
// We only tell graphql fields we are interested in getting so if it isn't in our query it won't show up its' an extra layer of scuirty
//parent is the object that is passed from the above resolver, args are the arguments passed into the resolver
//Whenever you have a successful repsonse in graphql it returns a data object eith the key being the same name of the mutation
//When sql is looking up unqiue it will stop after the first thing fails
module.exports = {
  Query: {
    getUsers: async (_, __, { user }) => {
      try {
        if (!user) throw new AuthenticationError("Unauthenticated");

        //this gets all the users besides our authenticated user
        let users = await User.findAll({
          attributes: ["username", "imageUrl", "createdAt"],
          where: { username: { [Op.ne]: user.username } },
        });

        const allUserMessages = await Message.findAll({
          where: {
            [Op.or]: [{ from: user.username }, { to: user.username }],
          },
          order: [["createdAt", "DESC"]],
        });
        //This goes over all the messages isntead of using many sql queries and goes over using js to find the latest message of each person
        users = users.map(otherUser => {
          const latestMessage = allUserMessages.find(
            (m) => m.from === otherUser.username || m.to === otherUser.username
          );
          otherUser.latestMessage = latestMessage;

          return otherUser;
        });
        return users;
      } catch (err) {
        console.log(err);
        throw err;
      }
    },

    login: async (_, args) => {
      const { username, password } = args;
      let errors = {};
      try {
        if (username.trim() === "")
          errors.username = "Username must not be empty";
        if (password === "") errors.password = "Password must not be empty";

        if (Object.keys(errors).length > 0) {
          throw new UserInputError("Bad Input", { errors });
        }

        const user = await User.findOne({
          where: { username },
        });

        if (!user) {
          errors.username = "User not found";
          throw new UserInputError("User not found", { errors });
        }

        //the graphql schema won't expose the password becuase we aren't calling it
        const correctPassword = await bcrypt.compare(password, user.password);
        if (!correctPassword) {
          errors.password = "password is incorrect";
          throw new UserInputError("Password is incorrect", { errors });
        }
        const token = jwt.sign({ username }, process.env.JWT_SECRET, {
          expiresIn: 60 * 60,
        });

        return {
          ...user.toJSON(),
          token: token,
        };

        return user;
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
  },

  Mutation: {
    //REGISTER USE
    register: async (_, args) => {
      let { username, email, password, confirmPassword } = args;
      let errors = {};
      try {
        //Validate input data
        if (email.trim() === "") errors.email = "Email must not be empty";
        if (username.trim() === "")
          errors.username = "Username must not be empty";
        if (password.trim() === "")
          errors.password = "Password must not be empty";
        if (confirmPassword.trim() === "")
          errors.confirmPassword = "Repeat password must not be empty";

        if (password !== confirmPassword)
          errors.confirmPassword = "Passwords do not match";

        //Check user / email exists
        // const userByUsername = await User.findOne({where: {username}})
        // const userByEmail = await User.findOne({where: {email}})
        // if (userByUsername) errors.username= "Username is taken"
        // if (userByEmail) errors.email= "Email is taken"

        if (Object.keys(errors).length > 0) {
          throw errors;
        }
        //TODO: create user

        //TODO: hash password

        password = await bcrypt.hash(password, 6);

        const user = await User.create({
          username,
          email,
          password,
        });
        //TODO: return user to client. With sequelize when you return it automatically turn it into json data
        return user;
      } catch (err) {
        // console.log(err.errors);
        if (err.name === "SequelizeUniqueConstraintError") {
          // console.log(err.errors);
          err.errors.forEach(
            (e) =>
              (errors[e.path.split(".")[1]] = `${
                e.path.split(".")[1]
              } is already taken`)
          );
        } else if (err.name === "SequelizeValidationError") {
          err.errors.forEach((e) => (errors[e.path] = e.message));
        }
        throw new UserInputError("Bad Input", { errors });
      }
    },
  },
};
