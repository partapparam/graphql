import logo from "./logo.svg"
import React, { useState } from "react"
import "./App.css"
import { gql, useQuery } from "@apollo/client"
import { AddPerson } from "./components/addPerson"
import { ALL_PERSONS, FIND_PERSON } from "./queries/queries"
import { EditNumber } from "./components/editNumber"

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
    </div>
  )
}

const Notify = ({ errorMessage }) => {
  if (!errorMessage) {
    return null
  }
  return <div style={{ color: "red" }}>{errorMessage}</div>
}

function App() {
  const result = useQuery(ALL_PERSONS)
  const [errorMessage, setErrorMessage] = useState(null)
  if (result.loading) {
    console.log(result)
    return <div>Loading........</div>
  }

  const notify = (message) => {
    setErrorMessage(message)
    setTimeout(() => {
      setErrorMessage(null)
    }, 5000)
  }
  return (
    <div className="App">
      <Notify errorMessage={errorMessage} />
      <Persons persons={result.data.allPersons} />
      <AddPerson setError={notify} />
      <EditNumber setError={notify} />
    </div>
  )
}

export default App
