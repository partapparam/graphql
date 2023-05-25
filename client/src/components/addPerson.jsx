import React, { useState } from "react"
import { gql, useMutation } from "@apollo/client"
import { CREATE_PERSON, ALL_PERSONS } from "../queries/queries"

export const AddPerson = ({ setError }) => {
  const [name, setName] = useState(null)
  const [phone, setPhone] = useState(null)
  const [street, setStreet] = useState(null)
  const [city, setCity] = useState(null)
  const [createPerson] = useMutation(CREATE_PERSON, {
    refetchQueries: [{ query: ALL_PERSONS }],
    onError: (error) => {
      const message = error.graphQLErrors[0].message
      setError(message)
    },
  })

  const submit = (event) => {
    event.preventDefault()

    createPerson({ variables: { name, phone, street, city } })
    setName(null)
    setPhone(null)
    setStreet(null)
    setCity(null)
  }

  return (
    <div>
      <h2>create new</h2>
      <form onSubmit={submit}>
        <div>
          name{" "}
          <input
            value={name}
            onChange={({ target }) => setName(target.value)}
          />
        </div>
        <div>
          phone{" "}
          <input
            value={phone}
            onChange={({ target }) => setPhone(target.value)}
          />
        </div>
        <div>
          street{" "}
          <input
            value={street}
            onChange={({ target }) => setStreet(target.value)}
          />
        </div>
        <div>
          city{" "}
          <input
            value={city}
            onChange={({ target }) => setCity(target.value)}
          />
        </div>
        <button type="submit">add!</button>
      </form>
    </div>
  )
}
