import React, { useState } from "react"
import { gql, useMutation } from "@apollo/client"
import { CREATE_PERSON, ALL_PERSONS } from "../queries/queries"

export const AddPerson = ({ setError }) => {
  const [name, setName] = useState(null)
  const [phone, setPhone] = useState(null)
  const [street, setStreet] = useState(null)
  const [city, setCity] = useState(null)
  const [createPerson] = useMutation(CREATE_PERSON, {
    /**
     *
     * Refetch queries works but it will send a query request everytime an update is done
     *
     * Using Update Callback - Apollo runs this after the mutation, and is given reference to the existing Cache and data returned by the mutation
     * Cache.UpdateQuery updates the ALL_PERSONS query in cache and adds new person to the cache.
     */
    // refetchQueries: [{ query: ALL_PERSONS }],
    update: (cache, response) => {
      cache.updateQuery({ query: ALL_PERSONS }, ({ allPersons }) => {
        return {
          allPersons: allPersons.concat(response.data.addPerson),
        }
      })
    },
    onError: (error) => {
      const message = error.graphQLErrors[0].message
      setError(message)
    },
  })

  const submit = (event) => {
    event.preventDefault()

    createPerson({
      variables: {
        name,
        street,
        city,
        phone,
      },
    })
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
