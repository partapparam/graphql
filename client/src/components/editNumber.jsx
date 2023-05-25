import { useState, useEffect } from "react"
import React from "react"
import { useMutation } from "@apollo/client"
import { EDIT_NUMBER } from "../queries/queries"

export const EditNumber = ({ setError }) => {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")

  const [changeNumber, result] = useMutation(EDIT_NUMBER)

  const submit = (e) => {
    e.preventDefault()
    changeNumber({ variables: { name, phone } })
    setName("")
    setPhone("")
  }

  useEffect(() => {
    if (result.data && result.data.EditNumber === null) {
      setError("Person does not exist. ")
    }
  }, [result.data])

  return (
    <div>
      <h2>change number</h2>

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
        <button type="submit">change number</button>
      </form>
    </div>
  )
}
