import React from "react";
import { Col, Image } from "react-bootstrap";
import { gql, useQuery } from "@apollo/client";
import { useMessageDispatch, useMessageState } from "../../context/message";
import classNames from "classnames";

const GET_USERS = gql`
  query getUsers {
    getUsers {
      username
      createdAt
      imageUrl
      latestMessage {
        uuid
        from
        to
        content
        createdAt
      }
    }
  }
`;

export default function Users() {
  const dispatch = useMessageDispatch();
  const { users } = useMessageState();
  //this ? mark allows you to run the thing only if users is found if both are not true you get undefined
  const selectedUser = users?.find(u => u.selected === true)?.username
  

  const { loading, data, error } = useQuery(GET_USERS, {
    onCompleted: (data) =>
      dispatch({ type: "SET_USERS", payload: data.getUsers }),
    onError: (err) => console.log(err),
  });

  let usersMarkup;
  if (loading || !users) {
    usersMarkup = <p>Loading..</p>;
  } else if (users.length === 0) {
    usersMarkup = <p>No users have joined yet.</p>;
  } else if (users.length > 0) {
    usersMarkup = users.map((user) => {
      const selected = selectedUser === user.username;
      //classnames allows you to put in a secondary class that is a boolean as to whether it shows up
      return (
        <div
          role="button"
          className={classNames("user-div d-flex justify-content-center justify-content-md-start p-3", {
            "bg-white": selected,
          })}
          key={user.username}
          onClick={() => dispatch({type: 'SET_SELECTED_USER', payload: user.username})}
        >
          <Image
            src={user.imageUrl || 'https://www.pphfoundation.ca/wp-content/uploads/2018/05/default-avatar.png'}
            className="user-image "
          ></Image>

          <div className="d-none d-md-block ml-2">
            <p className="text-success">{user.username}</p>
            <p className="font-weight-light">
              {user.latestMessage
                ? user.latestMessage.content
                : "You are now connected"}
            </p>
          </div>
        </div>
      );
    });
  }
  return (
    <Col xs={2} md={4} className="px-0 bg-secondary">
      {usersMarkup}
    </Col>
  );
}
