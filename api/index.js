const { ApolloServer } = require("@apollo/server")
const { startStandaloneServer } = require("@apollo/server/standalone")
const { GraphQLError } = require("graphql")
const mongoose = require("mongoose")
mongoose.set("strictQuery", false)
const Person = require("./models/person")

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

    type Query {
        personCount: Int!
        allPersons(phone: YesNo): [Person!]!
        findPerson(name: String!): Person
    }

    type Mutation {
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
  },
  Mutation: {
    addPerson: async (root, args) => {
      const person = await new Person({ ...args })
      try {
        await person.save()
      } catch (error) {
        throw new GraphQLError("Name must be unique", {
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

startStandaloneServer(server, {
  listen: { port: 4000 },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`)
})
