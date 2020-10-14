"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  User.init(
    {
      //this is for identifying

      username: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate :{
          isEmail: {
            //if this validation rule isn't met we will receive the message
            args: true,
            msg: 'Must be a valid email address'
          } 
        }
        
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      imageUrl: DataTypes.STRING,
      //this is the options for this model
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
    }
  );
  return User;
};