import React, { Fragment, useEffect, useState } from "react";
import { Col, Form } from "react-bootstrap";
import { gql, useLazyQuery, useMutation } from "@apollo/client";

import { useMessageDispatch, useMessageState } from "../../context/message";
import Message from "./message";

const SEND_MESSAGE = gql`
  mutation sendMessage($to: String!, $content: String!) {
    sendMessage(to: $to, content: $content) {
      uuid
      from
      to
      content
      createdAt
    }
  }
`;
const GET_MESSAGES = gql`
  query getMessages($from: String!) {
    getMessages(from: $from) {
      uuid
      from
      to
      content
      createdAt
      reactions{
        uuid 
        content
      }
    }
  }
`;

export default function Messages() {
  const { users } = useMessageState();
  const dispatch = useMessageDispatch();
  const [content, setContent] = useState("");

  const selectedUser = users?.find((u) => u.selected === true);
  const messages = selectedUser?.messages;
  const [
    getMessages,
    { loading: messagesLoading, data: messagesData },
  ] = useLazyQuery(GET_MESSAGES);

  const [sendMessage] = useMutation(SEND_MESSAGE, {

    onError: (err) => console.log(err),
  });

  //the dependncy of the useEffect is select user so when it changes it will call use effect, Each time selectedUser is changed the first useEffect is called and then messagesData will be excecuted again and each time there is no selecteduser.messages the second useEffect is called
  useEffect(() => {
    if (selectedUser && !selectedUser.messages) {
      getMessages({ variables: { from: selectedUser.username } });
    }
  }, [selectedUser]);


  useEffect(() => {
    if (messagesData) {
      dispatch({
        type: "SET_USER_MESSAGES",
        payload: {
          username: selectedUser.username,
          messages: messagesData.getMessages,
        },
      });
    }
  }, [messagesData]);

  
  const submitMessage = (e) => {
    e.preventDefault();
    if (content.trim() === "" || !selectedUser) return;
    setContent("");
    sendMessage({ variables: { to: selectedUser.username, content } });
  };

  //   if (messagesData) console.log(messagesData.getMessages);
  let selectedChatMarkup;
  if (!messages && !messagesLoading) {
    selectedChatMarkup = <p className="info-text">Select a friend</p>;
  } else if (messagesLoading) {
    selectedChatMarkup = <p className="info-text">Loading..</p>;
  } else if (messages.length > 0) {
    selectedChatMarkup = messages.map((message, index) => (
      <Fragment key={message.uuid}>
        <Message message={message} />

        {//solves margin disappearing
        index === messages.length - 1 && (
          <div className="invisible">
            <hr className="m-0"></hr>
          </div>
        )}
      </Fragment>
    ));
  } else if (messages.length === 0) {
    selectedChatMarkup = <p>You are now connected! Send your first message</p>;
  }

  //we reverse the order here
  return (
    <Col xs={10} md={8} className="p-0">
      <div className="messages-box d-flex flex-column-reverse p-3">
        {selectedChatMarkup}
      </div>
      <div className="px-3 py-2">
        <Form onSubmit={submitMessage}>
          <Form.Group className="d-flex align-items-center m-0">
            <Form.Control
              type="text"
              className="rounded-pill bg-secondary border-0 message-input p-4"
              placeholder="Type a message..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            ></Form.Control>
            <i
              class="fas fa-paper-plane fa-2x text-primary ml-2"
              onClick={submitMessage}
              role="button"
            ></i>
          </Form.Group>
        </Form>
      </div>
    </Col>
  );
}
