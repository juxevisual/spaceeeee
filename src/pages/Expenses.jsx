import { ExpenseDashboard } from '../components/expenses/ExpenseDashboard'

export function Expenses({ user }) {
  return (
    <>
      <h1 className="sr-only">Expenses</h1>
      <ExpenseDashboard user={user} />
    </>
  )
}
