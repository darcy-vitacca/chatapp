const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env.json");

module.exports = (context) => {
  if (context.req && context.req.headers.authorization) {
    //this extracts the token from the header and takes the bearer part out the use jwt to compare the token and see if it was issued usinng our signature
    const token = context.req.headers.authorization.split("Bearer ")[1];
    // console.log(token);
    jwt.verify(token, JWT_SECRET, (err, decodedToken) => {
      // console.log(user);
      context.user = decodedToken;
    });
  }

  return context;
};
