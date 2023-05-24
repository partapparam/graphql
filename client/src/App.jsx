import logo from "./logo.svg"
import React from "react"
import "./App.css"
import { gql, useQuery } from "@apollo/client"

const ALL_PERSONS = gql`
  query {
    allPersons {
      name
      phone
      id
    }
  }
`

const Persons = ({ persons }) => {
  return (
    <div>
      <h2>Persons</h2>
      {persons.map((p) => (
        <div key={p.name}>{p.name}</div>
      ))}
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
