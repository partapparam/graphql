import React, { useState } from "react"
import "./App.css"
import {
  useQuery,
  useApolloClient,
  useMutation,
  useSubscription,
} from "@apollo/client"
import { AddPerson } from "./components/addPerson"
import { ALL_PERSONS, FIND_PERSON, PERSON_ADDED } from "./queries/queries"
import { EditNumber } from "./components/editNumber"
import { LoginForm } from "./components/LoginForm"

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
  const [token, setToken] = useState(null)
  const result = useQuery(ALL_PERSONS)
  const [errorMessage, setErrorMessage] = useState(null)
  const client = useApolloClient()
  useSubscription(PERSON_ADDED, {
    onData: ({ data }) => {
      console.log(data)
    },
  })

  const notify = (message) => {
    setErrorMessage(message)
    setTimeout(() => {
      setErrorMessage(null)
    }, 5000)
  }
  if (result.loading) {
    console.log(result)
    return <div>Loading........</div>
  }
  const logout = () => {
    client.resetStore()
  }

  if (!token) {
    return (
      <div>
        <Notify errorMessage={errorMessage} />
        <h2>Login</h2>
        <LoginForm setToken={setToken} setError={notify} />
      </div>
    )
  }
  return (
    <div className="App">
      <Notify errorMessage={errorMessage} />
      <button onClick={logout}>Logout</button>
      <Persons persons={result.data.allPersons} />
      <AddPerson setError={notify} />
      <EditNumber setError={notify} />
    </div>
  )
}

export default App
