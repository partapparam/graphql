const { ApolloServer } = require("@apollo/server")
const { startStandaloneServer } = require("@apollo/server/standalone")

let persons = [
  {
    name: "Arto Hellas",
    phone: "040-123543",
    street: "Tapiolankatu 5 A",
    city: "Espoo",
    id: "3d594650-3436-11e9-bc57-8b80ba54c431",
  },
  {
    name: "Matti Luukkainen",
    phone: "040-432342",
    street: "Malminkaari 10 A",
    city: "Helsinki",
    id: "3d599470-3436-11e9-bc57-8b80ba54c431",
  },
  {
    name: "Venla Ruuska",
    street: "Nallemäentie 22 C",
    city: "Helsinki",
    id: "3d599471-3436-11e9-bc57-8b80ba54c431",
  },
]

const typeDefs = `
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
        allPersons: [Person!]!
        findPerson(name: String!): Person
    }
`
// resolvers return the data, essentially how the query actually gives us thhe data we ask for.
const resolvers = {
  Query: {
    personCount: () => persons.length,
    allPersons: () => persons,
    findPerson: (root, args) => persons.find((p) => p.name === args.name),
  },
  // gql server must define resolvers for each field of each Type in the schema.
  // so far we only defined resolvers for fields of the type Query
  // this is defualt resolvers, which Apollo defines if we dont
  // they return the value of the field of thhe object
  // if the default is enough we don't need to define out own.
  Person: {
    name: (root) => root.name,
    phone: (root) => root.phone,
    id: (root) => root.id,
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
