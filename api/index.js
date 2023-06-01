const { ApolloServer } = require("@apollo/server")
// const { startStandaloneServer } = require("@apollo/server/standalone")
const { GraphQLError } = require("graphql")

// setup for Subscriptions using Websockets
const { expressMiddleware } = require("@apollo/server/express4")
const {
  ApolloServerPluginDrainHttpServer,
} = require("@apollo/server/plugin/drainHttpServer")
const { makeExecutableSchema } = require("@graphql-tools/schema")
const express = require("express")
const cors = require("cors")
const http = require("http")
const { WebSocketServer } = require("ws")
const { useServer } = require("graphql-ws/lib/use/ws")

const mongoose = require("mongoose")
mongoose.set("strictQuery", false)
const Person = require("./models/person")
const User = require("./models/user")
const jwt = require("jsonwebtoken")
const typeDefs = require("./schema")
const resolvers = require("./resolvers")

require("dotenv").config()

const MONGO_DB_URI = process.env.MONGO_DB_URI

console.log("connection to ", MONGO_DB_URI)

mongoose
  .connect(MONGO_DB_URI)
  .then(() => {
    console.log("connected to mongodb")
  })
  .catch((error) => {
    console.log("failed to connect, ", error)
  })

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

/**
 * CONTEXT: the context function is used to pass useful things any resolver might need, like Auth Scope
 * Server calls CONTEXT once for each request
 *
 * Should be Async and return an Object
 * The returned Object is then accessible to resolvers via ContextValue
 */
// startStandaloneServer(server, {
//   listen: { port: 4000 },
//   context: async ({ req, res }) => {
//     const auth = req ? req.headers.authorization : null
//     if (auth && auth.startsWith("Bearer ")) {
//       const decodedToken = jwt.verify(auth.substring(7), process.env.JWT_SECRET)

//       const currentUser = await User.findById(decodedToken.id).populate(
//         "friends"
//       )
//       // console.log("here is the current user", currentUser)
//       return { currentUser }
//     }
//   },
// }).then(({ url }) => {
//   console.log(`Server ready at ${url}`)
// })

/**
 * For Subscriptions to be setup correctly, we setup the WebSocket Server with a function
 * When Queries and Mutations are made, it will use the HTTP server.
 */

const start = async () => {
  const app = express()
  const httpServer = http.createServer(app)

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/",
  })

  const schema = makeExecutableSchema({ typeDefs, resolvers })
  // WSServer Object is registered to listen to WS connections, besides the usual HTTP connections
  const serverCleanup = useServer({ schema }, wsServer)

  const server = new ApolloServer({
    schema,
    // this plugin is recommended to ensure the server shuts down correctly
    // Function will close WS connection on server shutdown
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose()
            },
          }
        },
      },
    ],
  })
  // The Graphql server has to start first, so we use Await
  await server.start()

  app.use(
    "/",
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const auth = req ? req.headers.authorization : null
        if (auth && auth.startsWith("Bearer ")) {
          const decodedToken = jwt.verify(
            auth.substring(7),
            process.env.JWT_SECRET
          )
          const currentUser = await User.findById(decodedToken.id).populate(
            "friends"
          )
          return { currentUser }
        }
      },
    })
  )

  const PORT = 4000

  httpServer.listen(PORT, () => {
    console.log("Server is now running at http://localhost:4000")
  })
}
start()
