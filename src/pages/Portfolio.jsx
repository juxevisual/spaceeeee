import { PortfolioDashboard } from '../components/portfolio/PortfolioDashboard'
import { usePortfolio } from '../hooks/usePortfolio'
import { useToast } from '../components/shared/Toast'

export function Portfolio({ user }) {
  const portfolio = usePortfolio(user)
  const toast = useToast()

  const handleDelete = async (id) => {
    const result = await portfolio.deleteHolding(id)
    if (!result?.error) toast('Holding removed', { color: 'oklch(0.60 0.26 280)' })
    return result
  }

  const handleClose = async (id, proceeds) => {
    const result = await portfolio.closeHolding(id, proceeds)
    if (!result?.error) toast('Position closed, proceeds moved to cash', { color: 'oklch(0.60 0.26 280)' })
    return result
  }

  return (
    <>
      <h1 className="sr-only">Portfolio</h1>
      <PortfolioDashboard
        {...portfolio}
        error={portfolio.error}
        onAdd={portfolio.addHolding}
        onEdit={portfolio.updateHolding}
        onDelete={handleDelete}
        onClose={handleClose}
        onUpdateUsdRate={portfolio.updateUsdRate}
        customAssetTypes={portfolio.customAssetTypes}
        onAddAssetType={portfolio.addAssetType}
        userId={portfolio.userId}
        exchangeRates={portfolio.exchangeRates}
        ratesUpdatedAt={portfolio.ratesUpdatedAt}
        onRefreshRates={portfolio.refreshRates}
        refreshingRates={portfolio.refreshingRates}
        onAddCurrencyRate={portfolio.addCurrencyRate}
      />
    </>
  )
}
