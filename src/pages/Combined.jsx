import { CombinedSummary } from '../components/expenses/CombinedSummary'

export function Combined({ user }) {
  return (
    <>
      <h1 className="sr-only">Together</h1>
      <CombinedSummary user={user} />
    </>
  )
}
