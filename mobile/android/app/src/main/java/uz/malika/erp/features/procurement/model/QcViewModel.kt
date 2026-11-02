package uz.malika.erp.features.procurement.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import uz.malika.erp.features.procurement.data.DeviceRowDto
import uz.malika.erp.features.procurement.data.LookupDto
import uz.malika.erp.features.procurement.data.ProcurementRepository
import uz.malika.erp.features.procurement.data.QcInspectionDto
import uz.malika.erp.features.procurement.data.QcStatsDto
import uz.malika.erp.features.procurement.lib.millisToInstant
import uz.malika.erp.features.procurement.lib.startOfTodayMillis
import uz.malika.erp.shared.lib.PageState

/** The date-range presets the stats tab offers; CUSTOM uses [QcViewModel.statsRange]. */
enum class StatsPreset { TODAY, SEVEN_DAYS, THIRTY_DAYS, CUSTOM }

/** The pass/fail selector on the inspections tab. */
enum class ResultFilter(val query: String?) { ALL(null), PASSED("true"), FAILED("false") }

/**
 * State for the QC screen (queue, inspections, stats, lookups). Queue and
 * inspections paginate (load-more) via [PageState]; inspections also filter by
 * pass/fail. Grade and lookup sheets call the relevant refresh after a
 * successful online-only write. Device-model names for the queue come from the
 * shipments slice's own catalog read (QC has no device-model nav of its own).
 */
class QcViewModel(private val repo: ProcurementRepository) : ViewModel() {

    private val _queue = MutableStateFlow<AsyncValue<PageState<DeviceRowDto>>>(AsyncValue.Loading)
    val queue: StateFlow<AsyncValue<PageState<DeviceRowDto>>> = _queue.asStateFlow()

    private val _inspections = MutableStateFlow<AsyncValue<PageState<QcInspectionDto>>>(AsyncValue.Loading)
    val inspections: StateFlow<AsyncValue<PageState<QcInspectionDto>>> = _inspections.asStateFlow()

    private val _stats = MutableStateFlow<AsyncValue<QcStatsDto>>(AsyncValue.Loading)
    val stats: StateFlow<AsyncValue<QcStatsDto>> = _stats.asStateFlow()

    private val _grades = MutableStateFlow<AsyncValue<List<LookupDto>>>(AsyncValue.Loading)
    val grades: StateFlow<AsyncValue<List<LookupDto>>> = _grades.asStateFlow()

    private val _defects = MutableStateFlow<AsyncValue<List<LookupDto>>>(AsyncValue.Loading)
    val defects: StateFlow<AsyncValue<List<LookupDto>>> = _defects.asStateFlow()

    var includeInactive: Boolean = false
        private set

    var resultFilter: ResultFilter = ResultFilter.ALL
        private set

    /** The from/to passed to [refreshStats] when the preset is CUSTOM. */
    var statsRange: Pair<String?, String?> = null to null
        private set

    init {
        refreshQueue()
        refreshInspections()
        refreshStats(StatsPreset.SEVEN_DAYS)
        refreshLookups()
    }

    fun refreshQueue() = _queue.reloadPaged(viewModelScope) { page ->
        repo.devices(inspected = "false", page = page).let { it.items to it.total }
    }

    fun loadMoreQueue() = _queue.loadMore(viewModelScope) { page ->
        repo.devices(inspected = "false", page = page).let { it.items to it.total }
    }

    fun refreshInspections() = _inspections.reloadPaged(viewModelScope) { page ->
        repo.inspections(passed = resultFilter.query, page = page).let { it.items to it.total }
    }

    fun loadMoreInspections() = _inspections.loadMore(viewModelScope) { page ->
        repo.inspections(passed = resultFilter.query, page = page).let { it.items to it.total }
    }

    fun setResultFilter(filter: ResultFilter) {
        resultFilter = filter
        refreshInspections()
    }

    fun refreshStats(preset: StatsPreset) {
        val range = presetRange(preset)
        statsRange = range
        _stats.reload(viewModelScope) { repo.stats(range.first, range.second) }
    }

    /** Custom stats range from the date-range picker (epoch-ms, UTC). */
    fun setStatsRange(fromMillis: Long?, toMillis: Long?) {
        statsRange = fromMillis?.let(::millisToInstant) to toMillis?.let(::millisToInstant)
        _stats.reload(viewModelScope) { repo.stats(statsRange.first, statsRange.second) }
    }

    fun setIncludeInactive(value: Boolean) {
        includeInactive = value
        refreshLookups()
    }

    /** Reloads both lookup lists (manage tab, grade picker, defects checklist). */
    fun refreshLookups() {
        _grades.reload(viewModelScope) { repo.lookups("grades", includeInactive) }
        _defects.reload(viewModelScope) { repo.lookups("defect-types", includeInactive) }
    }

    /** Active-only lookups for the grade sheet pickers (never the manage view). */
    suspend fun activeGrades(): List<LookupDto> = repo.lookups("grades", false)
    suspend fun activeDefects(): List<LookupDto> = repo.lookups("defect-types", false)

    val repository: ProcurementRepository get() = repo
}

private const val DAY_MS = 86_400_000L

private fun presetRange(preset: StatsPreset): Pair<String?, String?> {
    if (preset == StatsPreset.CUSTOM) return null to null
    val now = System.currentTimeMillis()
    val from = when (preset) {
        StatsPreset.TODAY -> startOfTodayMillis()
        StatsPreset.SEVEN_DAYS -> now - 7 * DAY_MS
        StatsPreset.THIRTY_DAYS -> now - 30 * DAY_MS
        StatsPreset.CUSTOM -> now
    }
    return millisToInstant(from) to millisToInstant(now)
}
