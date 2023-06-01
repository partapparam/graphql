import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./App"
import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  gql,
  createHttpLink,
  split,
} from "@apollo/client"
import { setContext } from "@apollo/client/link/context"
import { getMainDefinition } from "@apollo/client/utilities"
import { GraphQLWsLink } from "@apollo/client/link/subscriptions"
import { createClient } from "graphql-ws"

// the application must have an HTTP connection as well as a WebSocket connection to the GraphQL server.
const httpLink = createHttpLink({
  uri: "http://localhost:4000",
})

const wsLink = new GraphQLWsLink(createClient({ uri: "ws://localhost:4000" }))

// Define a context header object so that a possible token in localstorage is set to header auth. for each request to the server.
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("users-token-phonenumbers")
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : null,
    },
  }
})

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    )
  },
  wsLink,
  authLink.concat(httpLink)
)

//
const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: splitLink,
})

const query = gql`
  query {
    allPersons {
      name
      phone
      address {
        street
        city
      }
      id
    }
  }
`

client.query({ query }).then((response) => {
  console.log(response.data)
})

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>
)
