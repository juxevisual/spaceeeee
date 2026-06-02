import { PortfolioDashboard } from '../components/portfolio/PortfolioDashboard'
import { usePortfolio } from '../hooks/usePortfolio'

export function Portfolio({ user }) {
  const portfolio = usePortfolio(user)

  return (
    <>
      <h1 className="sr-only">Portfolio</h1>
      <PortfolioDashboard
        {...portfolio}
        error={portfolio.error}
        onAdd={portfolio.addHolding}
        onEdit={portfolio.updateHolding}
        onDelete={portfolio.deleteHolding}
        onUpdateUsdRate={portfolio.updateUsdRate}
        customAssetTypes={portfolio.customAssetTypes}
        onAddAssetType={portfolio.addAssetType}
      />
    </>
  )
}
