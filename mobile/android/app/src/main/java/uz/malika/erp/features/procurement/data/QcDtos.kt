package uz.malika.erp.features.procurement.data

import kotlinx.serialization.Serializable

/**
 * Transport + domain shapes for QC: lookups (grades / defect types), stats,
 * the by-IMEI device lookup used for grading, and inspection rows. Cost fields
 * (`repairCostEstimate`) are redaction-nullable and only sent back when the
 * grader has `device.cost.view`.
 */

@Serializable
data class LookupDto(
    val code: String,
    val label: String,
    val sortOrder: Int = 0,
    val isActive: Boolean = true,
)

/** Create or edit a grade / defect type; nulls dropped by the Json config. */
@Serializable
data class LookupBody(
    val code: String? = null,
    val label: String? = null,
    val sortOrder: Int? = null,
    val isActive: Boolean? = null,
)

@Serializable
data class GradeCountDto(val gradeCode: String, val count: Int)

@Serializable
data class DefectCountDto(val defectCode: String, val label: String? = null, val count: Int) {
    val display: String get() = label ?: defectCode
}

@Serializable
data class QcStatsDto(
    val inspected: Int = 0,
    val passed: Int = 0,
    val failed: Int = 0,
    val passRate: Double = 0.0,
    val awaitingInspection: Int = 0,
    val avgBatteryHealth: Int? = null,
    val byGrade: List<GradeCountDto> = emptyList(),
    val topDefects: List<DefectCountDto> = emptyList(),
)

@Serializable
data class QcModelRef(val brand: String = "", val name: String = "") {
    val label: String get() = "$brand $name".trim()
}

@Serializable
data class QcLatestInspection(val passed: Boolean = false)

@Serializable
data class QcDeviceDto(
    val id: String,
    val imei: String? = null,
    val serialNumber: String? = null,
    val statusCode: String,
    val modelId: String = "",
    val model: QcModelRef? = null,
    val latestInspection: QcLatestInspection? = null,
) {
    val modelLabel: String get() = model?.label?.takeIf { it.isNotBlank() } ?: modelId

    /** The unit's identifier — IMEI or serial number (ADR 0029). */
    val code: String get() = imei ?: serialNumber ?: ""
}

@Serializable
data class InspectionDeviceDto(
    val imei: String? = null,
    val serialNumber: String? = null,
    val model: QcModelRef? = null,
) {
    val code: String get() = imei ?: serialNumber ?: ""
}

@Serializable
data class InspectorDto(val name: String = "")

@Serializable
data class InspectionDefectDto(val defectCode: String)

@Serializable
data class QcInspectionDto(
    val id: String,
    val passed: Boolean = false,
    val gradeCode: String? = null,
    val batteryHealth: Int? = null,
    val inspectedAt: String,
    val device: InspectionDeviceDto = InspectionDeviceDto(),
    val inspectedBy: InspectorDto = InspectorDto(),
    val defects: List<InspectionDefectDto> = emptyList(),
) {
    val code: String get() = device.code
    val modelLabel: String get() = device.model?.label ?: ""
    val inspectorName: String get() = inspectedBy.name
}

@Serializable
data class PaginatedInspectionsDto(
    val items: List<QcInspectionDto> = emptyList(),
    val total: Int = 0,
)

@Serializable
data class CreateInspectionBody(
    val deviceId: String,
    val passed: Boolean,
    val gradeCode: String? = null,
    val batteryHealth: Int? = null,
    val repairCostEstimate: Double? = null,
    val notes: String? = null,
    val defects: List<InspectionDefectBody> = emptyList(),
)

@Serializable
data class InspectionDefectBody(val defectCode: String, val notes: String? = null)
