const { ApolloServer } = require("@apollo/server")
const { startStandaloneServer } = require("@apollo/server/standalone")
const { GraphQLError } = require("graphql")
const mongoose = require("mongoose")
mongoose.set("strictQuery", false)
const Person = require("./models/person")
const User = require("./models/user")
const jwt = require("jsonwebtoken")

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

const typeDefs = `
    enum YesNo {
      YES
      NO
    }

    type Address {
      street: String!
      city: String!
    }
    type Person {
        name: String!
        phone: String
        address: Address!
        id: ID!
    }

    type User {
      username: String!
      friends: [Person!]!
      id: ID!
    }

    type Token {
      value: String!
    }

    type Query {
        personCount: Int!
        allPersons(phone: YesNo): [Person!]!
        findPerson(name: String!): Person
        me: User
    }

    type Mutation {
      createUser(
        username: String!
      ): User
      
      login(
        username: String!
        password: String!
      ):Token

      addPerson(
        name: String!
        phone: String
        street: String!
        city: String
      ): Person

      editNumber(
        name: String!
        phone: String!
      ): Person
    }
`
const resolvers = {
  Query: {
    personCount: () => Person.collection.countDocuments(),
    allPersons: (root, args) => {
      if (!args.phone) {
        return Person.find({})
      }
      return Person.find({ phone: { $exists: args.phone === "YES" } })
      // args.phone === 'YES' will be TRUE or FALSE
    },
    findPerson: (root, args) => Person.findOne({ name: args.name }),
    me: (root, args, context) => context.currentUser,
  },
  Mutation: {
    createUser: async (root, args) => {
      const user = await new User({ ...args })
      try {
        user.save()
      } catch (error) {
        throw new GraphQLError("Username not createed", {
          extensions: {
            code: "BAD_USER_INPUT",
            invalidArgs: args.name,
          },
        })
      }
      return user
    },
    login: async (root, args, context) => {
      console.log("Here is the context value", context.currentUser.username)
      const user = await User.findOne({ username: args.username })
      if (!user || args.password !== "secret") {
        throw new GraphQLError("user does not exist", {
          extensions: {
            code: "BAD_USER_INPUT",
            invalidArgs: args.name,
          },
        })
      }
      const userForToken = {
        username: user.username,
        id: user._id,
      }
      return { value: jwt.sign(userForToken, process.env.JWT_SECRET) }
    },
    addPerson: async (root, args, context) => {
      const person = await new Person({ ...args })
      const currentUser = context.currentUser

      if (!currentUser) {
        throw new GraphQLError("Action not allowed, requires login", {
          extensions: {
            code: "BAD_USER_INPUT",
          },
        })
      }
      try {
        await person.save()
        // We are able to update MongoDB by updating the User then Save()
        // Do not need to
        currentUser.friends = currentUser.friends.concat(person)
        currentUser.save()
        console.log(currentUser)
      } catch (error) {
        throw new GraphQLError(error, {
          extensions: {
            code: "BAD_USER_INPUT",
            invalidArgs: args.name,
          },
        })
      }
      return person.save()
    },
    editNumber: async (root, args) => {
      const person = await Person.findOne({ name: args.name })
      person.phone = args.phone

      try {
        await person.save()
      } catch (error) {
        throw new GraphQLError("saving number failed", {
          extensions: {
            code: "BAD_USER_INPUT",
            invalidArgs: args.name,
          },
        })
      }
      return person
    },
  },

  Person: {
    address: (root) => {
      return {
        street: root.street,
        city: root.city,
      }
    },
  },
}

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
startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req, res }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.startsWith("Bearer ")) {
      const decodedToken = jwt.verify(auth.substring(7), process.env.JWT_SECRET)

      const currentUser = await User.findById(decodedToken.id).populate(
        "friends"
      )
      // console.log("here is the current user", currentUser)
      return { currentUser }
    }
  },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`)
})
