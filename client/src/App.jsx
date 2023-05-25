import logo from "./logo.svg"
import React, { useState } from "react"
import "./App.css"
import { gql, useQuery } from "@apollo/client"
import { AddPerson } from "./components/addPerson"

export const ALL_PERSONS = gql`
  query {
    allPersons {
      name
      phone
      id
    }
  }
`

const FIND_PERSON = gql`
  query findPersonByName($nameToSearch: String!) {
    findPerson(name: $nameToSearch) {
      name
      phone
      id
      address {
        street
        city
      }
    }
  }
`

const Person = ({ person, onClose }) => {
  return (
    <div>
      <h2>{person.name}</h2>
      <div>
        {person.address.street} {person.address.city}
      </div>
      <div>{person.phone}</div>
      <button onClick={onClose}>close</button>
    </div>
  )
}

const Persons = ({ persons }) => {
  const [nameToSearch, setNameToSearch] = useState(null)
  const result = useQuery(FIND_PERSON, {
    variables: { nameToSearch },
    skip: !nameToSearch,
  })

  if (nameToSearch && result.data) {
    return (
      <Person
        person={result.data.findPerson}
        onClose={() => setNameToSearch(null)}
      ></Person>
    )
  }
  return (
    <div>
      <h2>Persons</h2>
      {persons.map((p) => (
        <div key={p.name}>
          {p.name}
          <button onClick={() => setNameToSearch(p.name)}>show address</button>
        </div>
      ))}
      <AddPerson />
    </div>
  )
}

function App() {
  const result = useQuery(ALL_PERSONS)
  if (result.loading) {
    console.log(result)
    return <div>Loading........</div>
  }
  return (
    <div className="App">
      <Persons persons={result.data.allPersons} />
    </div>
  )
}

export default App
