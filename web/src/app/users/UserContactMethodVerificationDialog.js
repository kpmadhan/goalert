import React, { useState } from 'react'
import p from 'prop-types'
import FormDialog from '../dialogs/FormDialog'
import gql from 'graphql-tag'
import { Mutation } from 'react-apollo'
import Query from '../util/Query'
import { fieldErrors, nonFieldErrors } from '../util/errutil'
import UserContactMethodVerificationForm from './UserContactMethodVerificationForm'
import { graphql2Client } from '../apollo'
import { formatPhoneNumber } from './util'

/*
 * Reactivates a cm if disabled and the verification code matches
 */
const verifyContactMethodMutation = gql`
  mutation verifyContactMethod($input: VerifyContactMethodInput!) {
    verifyContactMethod(input: $input)
  }
`

/*
 * Get cm data so this component isn't dependent on parent props
 */
const contactMethodQuery = gql`
  query($id: ID!) {
    userContactMethod(id: $id) {
      id
      name
      type
      value
    }
  }
`

export default function UserContactMethodVerificationDialog(props) {
  const [value, setValue] = useState({
    code: '',
  })
  const [sendError, setSendError] = useState('')
  const [sendAttempted, setSendAttempted] = useState(false)

  // dialog rendered that handles rendering the verification form
  function renderDialog(commit, status, cm) {
    const { loading, error } = status
    const fieldErrs = fieldErrors(error)

    return (
      <FormDialog
        title='Verify Contact Method'
        subTitle={`Send the verification code to ${formatPhoneNumber(
          cm.value,
        )} (${cm.type})`}
        loading={loading}
        errors={nonFieldErrors(error) || [{ message: sendError }]}
        onClose={props.onClose}
        onSubmit={() =>
          commit({
            variables: {
              input: {
                contactMethodID: cm.id,
                code: value.code,
              },
            },
          })
        }
        submitDisabled={!sendAttempted}
        form={
          <UserContactMethodVerificationForm
            contactMethodID={cm.id}
            errors={fieldErrs}
            setSendError={setSendError}
            sendAttempted={sendAttempted}
            setSendAttempted={setSendAttempted}
            disabled={loading}
            value={value}
            onChange={value => setValue(value)}
          />
        }
      />
    )
  }

  // wraps the dialog with the mutation
  function renderMutation(cm) {
    return (
      <Mutation
        client={graphql2Client}
        mutation={verifyContactMethodMutation}
        awaitRefetchQueries
        refetchQueries={['cmList']}
        onCompleted={props.onClose}
      >
        {(commit, status) => renderDialog(commit, status, cm)}
      </Mutation>
    )
  }

  // queries for cm data for the dialog subtitle
  return (
    <Query
      query={contactMethodQuery}
      variables={{ id: props.contactMethodID }}
      render={({ data }) => renderMutation(data.userContactMethod)}
      noPoll
    />
  )
}

UserContactMethodVerificationDialog.propTypes = {
  onClose: p.func.isRequired,
  contactMethodID: p.string.isRequired,
}
