import Foundation

extension PosViewModel {
    /// Check out every cart line (unit or quantity product). One request per line;
    /// the cart's single Cash/Card/Split choice is allocated across each line's
    /// payable amount — its price minus trade-ins minus points (ADR 0039, ADR 0043)
    /// — so each sale's payments sum to `salePrice − trade-ins − bonusRedeem`.
    /// A sale with a trade-in or bonus points is online only and is never queued.
    /// After each sold line, lower the requested points by that line's points.
    func checkout() {
        guard let container, !cart.isEmpty, !busy else { return }
        let online = container.connectivity.isOnline
        // Trade-ins and points are online only — never queued.
        if cart.hasTradeIns && !online { errorKey = "purchases.tradeInOffline"; return }
        let tradeInPlan = planCartTradeIns()
        guard tradeInPlan.ok else { errorKey = "purchases.tradeInExceedsLine"; return }
        let bonusPlan = planCartBonus()
        if bonusPlan.total > 0 && !online { errorKey = "pos.bonusErrorOffline"; return }

        // Shifts (ADR 0036): online, selling needs an open shift; offline is let
        // through (the server trusts replays). Keep the cart and prompt to open.
        guard !shift.blocksSale(online: online) else { errorKey = "shifts.shiftRequired"; return }
        busy = true
        errorKey = nil
        let cashier = container.session.user?.displayName ?? ""
        let customer = cart.customer
        let lines = cart.lines
        let perLinePayments = allocateSalePayments(
            breakdown: payment.breakdown(total: amountToPay),
            linePrices: lines.map { bonusPlan.payableByLine[$0.id] ?? (tradeInPlan.payableByLine[$0.id] ?? cart.finalTotal($0)) })

        Task {
            var results: [CompletedSale] = []
            for (index, line) in lines.enumerated() {
                let tradeIns = tradeInPosts(for: line.id, plan: tradeInPlan)
                let lineBonus = bonusPlan.byLine[line.id] ?? 0
                let bonusRedeemDouble = lineBonus > 0 ? NSDecimalNumber(decimal: lineBonus).doubleValue : nil
                let payload = payload(for: line, customer: customer,
                                      payments: perLinePayments[index], tradeIns: tradeIns,
                                      bonusRedeem: bonusRedeemDouble)
                let now = Date()
                var receiptId = line.clientMutationId
                var pending = !online
                if online {
                    do {
                        let id = try await repo.postSale(payload)
                        if !id.isEmpty { receiptId = id }
                        // Sold with its trade-ins — drop them so a retry never resends them.
                        for t in tradeInPlan.itemsByLine[line.id] ?? [] { cart.removeTradeIn(t) }
                        // After each sold line, lower requested points by that line's points.
                        if lineBonus > 0 {
                            bonusRequested = max(0, bonusRequested - lineBonus)
                        }
                    } catch {
                        let appError = error as? AppError
                        if appError?.statusCode == nil {
                            // A trade-in sale or points sale must never queue offline.
                            if tradeIns == nil && lineBonus == 0 {
                                try? repo.enqueueSale(payload, baseVersion: line.device?.version)
                                pending = true
                            } else {
                                busy = false
                                errorKey = lineBonus > 0 ? "pos.bonusErrorOffline" : "purchases.tradeInOffline"
                                break
                            }
                        } else if appError?.statusCode == 409, appError?.code == "NO_OPEN_SHIFT" {
                            busy = false; errorKey = "shifts.shiftRequired"
                            await shift.refresh(); break   // keep the cart
                        } else {
                            busy = false
                            errorKey = PosCheckoutError.resolve(code: appError?.code, serverMessage: appError?.message ?? "common.error")
                            break
                        }
                    }
                } else {
                    if lineBonus > 0 || tradeIns != nil {
                        busy = false
                        errorKey = lineBonus > 0 ? "pos.bonusErrorOffline" : "purchases.tradeInOffline"
                        break
                    }
                    try? repo.enqueueSale(payload, baseVersion: line.device?.version)
                }
                results.append(completedSale(line, receiptId: receiptId, cashier: cashier,
                                             customer: customer, at: now, pending: pending))
                cart.remove(line.id)
            }
            busy = false
            if !results.isEmpty {
                container.toasts.success(container.i18n.t("pos.saleSuccess", ["count": String(results.count)]))
                showCart = false   // close the catalog cart sheet before the receipt
                completed = results
                payment.method = .cash
                payment.splitAmounts = [:]
                if cart.isEmpty {
                    clearBonus()
                }
            }
        }
    }
}
