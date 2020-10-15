import React, { useReducer } from 'react'
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider as Provider,
  createHttpLink,
  split
} from "@apollo/client";
import { HttpLink } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { WebSocketLink } from '@apollo/client/link/ws';
//on each operation we use through graphql this take the headers and sets a header if you want it do do that
import { setContext } from '@apollo/client/link/context';




//This handles the http requests
let httpLink = createHttpLink({
  uri: '/graphql/',
});



//this checks everytime a query is run or mutation for the token
const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  const token = localStorage.getItem('token');
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

httpLink = authLink.concat(httpLink)

//because websockets initiate from client host we can use that
const host = window.location.host


//This handles websocket connections and needs to include graphql because that's where our webtoken is we also check for a token 
const wsLink = new WebSocketLink({
  uri: `ws://${host}/graphql/`,
  options: {
    reconnect: true,
    connectionParams:{
      Authorization : `Bearer ${localStorage.getItem('token')}`,
    }
  }
});
//What this does is checks if it's a query or mutation and if it a subscription it uses the web socket link and if it's a query or mutation it will use the httplink
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink,
);

// this passes the splitLink of whether it is a http or subscription into the server
const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

export default function ApolloProvider(props) {
  return <Provider client={client} {...props} />
}
  
