const { GraphQLError } = require("graphql")
const jwt = require("jsonwebtoken")
const Person = require("./models/person")
const User = require("./models/person")
// With subscriptions, the communication happens using the Publish-Subscribe principle
const { PubSub } = require("graphql-subscriptions")
const pubsub = new PubSub()

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
      console.log("creating user called", args)
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
      // console.log("Here is the context value", context.currentUser.username)
      const user = await User.findOne({ username: args.username })
      console.log(args, user)
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
      // adding a new person publishes a notification about the operation to all subscribers.
      // pubsub.publish("PERSON_ADDED", { personAdded: person })
      return person
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
    addAsFriend: async (root, args, { currentUser }) => {
      // Function to confirm Person is not already friend of user. Take in person, convert id to string and compare it friends ID for current user
      // could also use filter()
      const isFriend = (person) =>
        currentUser.friends
          .map((f) => f._id.toString())
          .includes(person._id.toString())
      if (!currentUser) {
        throw new GraphQLError("User does not exist", {
          extensions: { code: "BAD_USER_INPUT" },
        })
      }
      const person = await User.findOne({ name: args.name })
      if (!isFriend(person)) {
        currentUser.friends = currentUser.friends.concat(person)
      }
      await currentUser.save()
      return currentUser
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

  Subscription: {
    personAdded: {
      subscribe: () => pubsub.asyncIterator("PERSON_ADDED"),
    },
  },
}

module.exports = resolvers
