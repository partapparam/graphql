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
} from "@apollo/client"
import { setContext } from "@apollo/client/link/context"

// We reaplce the ApolloClient URI with createHTTPLink
// defines in a more complicated case how Apollo is connected to the server
const httpLink = createHttpLink({
  uri: "http://localhost:4000",
})
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
//
const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: authLink.concat(httpLink),
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
