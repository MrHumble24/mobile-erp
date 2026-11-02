import Foundation
import SwiftData

/// The offline-capable consignment lifecycle — the only place this slice
/// writes. The three server-registered mutation types
/// (`consignment.create|settle|return`) go straight to REST when online, else
/// to the outbox for the push drain; a *network* failure mid-call also falls
/// back to the outbox so a money-path write is never lost, while a validation /
/// credit-limit / conflict error is surfaced to the caller.
///
/// `baseVersion` is the consigned device's cached version (the optimistic lock
/// the server enforces on replay). Settle/return queue payloads carry
/// `consignmentId` because the push queue has no path param. On a queued write
/// the cached device status is advanced optimistically so inventory reflects
/// it at once; the next `/sync/changes` pull reconciles to the server truth.
@MainActor
struct ConsignmentWriter {
    let repo: ConsignmentRepository
    let context: ModelContext
    let isOnline: () -> Bool
    let syncNow: () -> Void

    enum Outcome { case applied, queued }

    func create(imei: String, partnerId: String, agreedPrice: Double,
                dueDate: Date, notes: String?) async throws -> Outcome {
        let iso = ISO8601DateFormatter().string(from: dueDate)
        let version = deviceVersion(imei)
        return try await dispatch(
            online: {
                try await repo.create(CreateConsignmentDto(
                    imei: imei, partnerId: partnerId, agreedPrice: agreedPrice,
                    dueDate: iso, notes: notes, clientMutationId: newUUID()))
            },
            queue: { try $0.enqueue(.consignmentCreate, payload: CreateQueue(
                imei: imei, partnerId: partnerId, agreedPrice: agreedPrice,
                dueDate: iso, notes: notes), baseVersion: version) },
            optimistic: { setDeviceStatus(imei, to: "CONSIGNED") })
    }

    func settle(consignmentId: String, imei: String,
                salePrice: Double?, notes: String?) async throws -> Outcome {
        let version = deviceVersion(imei)
        return try await dispatch(
            online: { try await repo.settle(consignmentId,
                SettleConsignmentDto(salePrice: salePrice, notes: notes)) },
            queue: { try $0.enqueue(.consignmentSettle, payload: SettleQueue(
                consignmentId: consignmentId, salePrice: salePrice, notes: notes),
                baseVersion: version) },
            optimistic: { setDeviceStatus(imei, to: "SOLD") })
    }

    func returnToStock(consignmentId: String, imei: String,
                       reason: String?, condition: String?) async throws -> Outcome {
        let version = deviceVersion(imei)
        return try await dispatch(
            online: { try await repo.returnToStock(consignmentId,
                ReturnConsignmentDto(reason: reason, condition: condition)) },
            queue: { try $0.enqueue(.consignmentReturn, payload: ReturnQueue(
                consignmentId: consignmentId, reason: reason, condition: condition),
                baseVersion: version) },
            optimistic: { setDeviceStatus(imei, to: condition ?? "IN_STOCK") })
    }

    // MARK: - Dispatch

    private func dispatch(
        online: () async throws -> Void,
        queue: (Outbox) throws -> Void,
        optimistic: () -> Void
    ) async throws -> Outcome {
        if isOnline() {
            do {
                try await online()
                syncNow()
                return .applied
            } catch let e as AppError where e.isNetwork {
                // lost connection mid-call → fall through and queue it
            }
        }
        try queue(Outbox(context: context))   // enqueue saves the context
        optimistic()
        try? context.save()
        syncNow()                              // best-effort drain
        return .queued
    }

    // MARK: - Local cache

    private func deviceVersion(_ imei: String) -> Int? { device(imei)?.version }

    private func setDeviceStatus(_ imei: String, to code: String) {
        device(imei)?.statusCode = code
    }

    private func device(_ imei: String) -> DeviceEntity? {
        try? context.fetch(
            FetchDescriptor<DeviceEntity>(predicate: #Predicate { $0.imei == imei })
        ).first
    }

    // MARK: - Queue payloads (what `/sync/push` validates per type)

    private struct CreateQueue: Encodable {
        let imei: String
        let partnerId: String
        let agreedPrice: Double
        let dueDate: String
        let notes: String?
    }
    private struct SettleQueue: Encodable {
        let consignmentId: String
        let salePrice: Double?
        let notes: String?
    }
    private struct ReturnQueue: Encodable {
        let consignmentId: String
        let reason: String?
        let condition: String?
    }
}
