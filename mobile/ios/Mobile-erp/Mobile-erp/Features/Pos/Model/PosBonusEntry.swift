import Foundation

/// Extension on `PosViewModel` providing loyalty bonus points calculation and state (ADR 0043, ADR 0047).
extension PosViewModel {
    /// Bonus points plan over current cart lines and trade-ins.
    var bonusRedeemPlan: BonusRedeemPlan { planCartBonus() }

    /// Total bonus points spent on this cart.
    var bonusRedeemTotal: Decimal { bonusRedeemPlan.total }

    /// Calculates the bonus redemption plan for the cart.
    func planCartBonus() -> BonusRedeemPlan {
        guard let bonus = customerBonus, bonus.enabled, (container?.storeFlags.bonusEnabled ?? false) else {
            return BonusRedeemPlan(max: 0, total: 0, byLine: [:], payableByLine: [:])
        }
        let tradeInPlan = planCartTradeIns()
        let lines = cart.lines.map { line in
            let price = cart.finalTotal(line)
            let due = tradeInPlan.payableByLine[line.id] ?? price
            return BonusRedeemLine(lineId: line.id, price: price, due: due)
        }
        let balance = Decimal(string: bonus.balance) ?? 0
        let maxPct = Decimal(string: bonus.maxRedeemPercent) ?? 0
        return BonusRedeemPlanner.plan(lines: lines, requested: bonusRequested, balance: balance, maxPercent: maxPct)
    }

    /// Loads the attached customer's bonus points when bonus is on, customer has an id, and online.
    func loadCustomerBonus() {
        guard let container,
              container.storeFlags.bonusEnabled,
              let id = cart.customer?.id,
              container.connectivity.isOnline else {
            clearBonus()
            return
        }
        Task {
            let repo = CustomersRepository(api: container.api)
            if let b = try? await repo.bonus(id), b.enabled {
                self.customerBonus = b
                let plan = self.planCartBonus()
                if self.bonusRequested > plan.max {
                    self.bonusRequested = plan.max
                }
            } else {
                self.customerBonus = nil
                self.bonusRequested = 0
            }
        }
    }

    /// Clears any loaded bonus view and requested points.
    func clearBonus() {
        customerBonus = nil
        bonusRequested = 0
    }
}
