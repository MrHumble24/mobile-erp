package uz.malika.erp.features.repairs.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import uz.malika.erp.AppContainer
import uz.malika.erp.features.inventory.data.CatalogRepository
import uz.malika.erp.features.inventory.data.DeviceModelView
import uz.malika.erp.features.inventory.data.InventoryApi
import uz.malika.erp.features.repairs.data.RepairRepository
import uz.malika.erp.features.repairs.model.CreateRepairViewModel
import uz.malika.erp.features.sales.data.CustomersRepository
import uz.malika.erp.features.sales.data.SalesApi
import uz.malika.erp.features.sales.data.SalesRepository
import uz.malika.erp.features.sales.data.UserOption
import uz.malika.erp.features.sales.ui.CustomerPicker
import uz.malika.erp.features.sales.ui.CustomerSelection
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.UnitCode
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.AppSelect
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.ui.theme.Tokens

private enum class MasterMode { OWN, OUTSIDE }

/**
 * New repair ticket (ADR 0040): customer, device (free text + optional model +
 * IMEI/serial), problem, agreed price, warranty days typed on the ticket, and one
 * master — our own (a user) or an outside one (name/phone/cost). No passcode,
 * pattern or ID-document field, by design.
 */
@Composable
fun CreateRepairSheet(container: AppContainer, repo: RepairRepository, onCreated: () -> Unit) {
    val t = LocalT.current
    val vm: CreateRepairViewModel = viewModel(factory = viewModelFactory { initializer { CreateRepairViewModel(repo) } })
    val state by vm.state.collectAsState()
    val salesApi = remember { container.retrofit.create(SalesApi::class.java) }
    val lookupRepo = remember { CustomersRepository(salesApi) }
    val salesRepo = remember { SalesRepository(salesApi, container.db, uz.malika.erp.data.remote.HttpClient.json) }
    val catalog = remember { CatalogRepository(container.retrofit.create(InventoryApi::class.java)) }
    val models by produceState(emptyList<DeviceModelView>()) { value = runCatching { catalog.list() }.getOrDefault(emptyList()) }
    val masters by produceState(emptyList<UserOption>()) { value = runCatching { salesRepo.cashiers() }.getOrDefault(emptyList()) }

    var customer by remember { mutableStateOf(CustomerSelection()) }
    var deviceName by remember { mutableStateOf("") }
    var model by remember { mutableStateOf<DeviceModelView?>(null) }
    var code by remember { mutableStateOf("") }
    var problem by remember { mutableStateOf("") }
    var price by remember { mutableStateOf("") }
    var warranty by remember { mutableStateOf("0") }
    var notes by remember { mutableStateOf("") }
    var masterMode by remember { mutableStateOf(MasterMode.OWN) }
    var masterUser by remember { mutableStateOf<UserOption?>(null) }
    var outName by remember { mutableStateOf("") }
    var outPhone by remember { mutableStateOf("") }
    var outCost by remember { mutableStateOf("") }

    LaunchedEffect(state.result) { if (state.result != null) onCreated() }

    val customerChosen = !customer.customerId.isNullOrBlank() || !customer.newName.isNullOrBlank()
    val ready = customerChosen && deviceName.isNotBlank() && problem.isNotBlank() && !state.submitting

    Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(Tokens.Space.gutter)) {
        Text(t("repairs.newTicket", null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)
        Spacer(Modifier.height(Tokens.Space.lg))
        Text(t("repairs.customer", null), style = MaterialTheme.typography.labelLarge, color = Tokens.muted)
        Spacer(Modifier.height(Tokens.Space.rowV))
        CustomerPicker(selection = customer, onChange = { customer = it }, lookup = { lookupRepo.lookup(it) }, enabled = !state.submitting)
        Spacer(Modifier.height(Tokens.Space.md))
        AppFormField(t("repairs.deviceName", null), deviceName, { deviceName = it }, enabled = !state.submitting)
        Spacer(Modifier.height(Tokens.Space.md))
        AppSelect(value = model, options = models, optionLabel = { it.label }, onSelect = { model = it }, label = t("repairs.modelOptional", null), nullOption = "—")
        Spacer(Modifier.height(Tokens.Space.md))
        AppFormField(t("repairs.imeiOptional", null), code, { code = it }, enabled = !state.submitting)
        Spacer(Modifier.height(Tokens.Space.md))
        AppFormField(t("repairs.problem", null), problem, { problem = it }, enabled = !state.submitting)
        Spacer(Modifier.height(Tokens.Space.md))
        AppFormField(t("repairs.agreedPrice", null), price, { price = it }, keyboardType = KeyboardType.Decimal, enabled = !state.submitting)
        Spacer(Modifier.height(Tokens.Space.md))
        AppFormField(t("repairs.warrantyDays", null), warranty, { warranty = it }, keyboardType = KeyboardType.Number, enabled = !state.submitting)
        Spacer(Modifier.height(Tokens.Space.md))

        Text(t("repairs.master", null), style = MaterialTheme.typography.labelLarge, color = Tokens.muted)
        Spacer(Modifier.height(Tokens.Space.rowV))
        SegmentedControl(
            options = listOf(SegmentOption(MasterMode.OWN, t("repairs.ownMaster", null)), SegmentOption(MasterMode.OUTSIDE, t("repairs.outsideMaster", null))),
            selected = masterMode,
            onSelect = { masterMode = it },
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(Tokens.Space.rowV))
        if (masterMode == MasterMode.OWN) {
            AppSelect(value = masterUser, options = masters, optionLabel = { it.name }, onSelect = { masterUser = it }, label = t("repairs.selectMaster", null), nullOption = "—")
        } else {
            AppFormField(t("repairs.outsideMasterName", null), outName, { outName = it }, enabled = !state.submitting)
            Spacer(Modifier.height(Tokens.Space.sm))
            AppFormField(t("repairs.outsideMasterPhone", null), outPhone, { outPhone = it }, keyboardType = KeyboardType.Phone, enabled = !state.submitting)
            Spacer(Modifier.height(Tokens.Space.sm))
            AppFormField(t("repairs.outsideCost", null), outCost, { outCost = it }, keyboardType = KeyboardType.Decimal, enabled = !state.submitting)
        }
        Spacer(Modifier.height(Tokens.Space.md))
        AppFormField(t("repairs.notes", null), notes, { notes = it }, enabled = !state.submitting)
        Spacer(Modifier.height(Tokens.Space.lg))

        state.error?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.danger); Spacer(Modifier.height(Tokens.Space.sm)) }
        PillButton(
            text = if (state.submitting) t("common.loading", null) else t("repairs.create", null),
            onClick = {
                vm.submit(
                    buildCreateBody(customer, deviceName, model?.id, code, problem, price, warranty, notes, masterMode, masterUser?.id, outName, outPhone, outCost),
                )
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = ready,
        )
        Spacer(Modifier.height(Tokens.Space.md))
    }
}

/** Build the `POST /repairs` body; an identifier splits into imei or serialNumber (ADR 0029). */
@Suppress("LongParameterList")
private fun buildCreateBody(
    customer: CustomerSelection,
    deviceName: String,
    modelId: String?,
    code: String,
    problem: String,
    price: String,
    warranty: String,
    notes: String,
    masterMode: MasterMode,
    masterUserId: String?,
    outName: String,
    outPhone: String,
    outCost: String,
) = buildJsonObject {
    val id = customer.customerId?.takeIf { it.isNotBlank() }
    if (id != null) {
        put("customerId", id)
    } else {
        put("customer", buildJsonObject { put("name", (customer.newName ?: "").trim()); customer.newPhone?.trim()?.takeIf { it.isNotEmpty() }?.let { put("phone", it) } })
    }
    put("deviceName", deviceName.trim())
    modelId?.let { put("modelId", it) }
    code.trim().takeIf { it.isNotEmpty() }?.let { c ->
        val uc = UnitCode.identify(c)
        if (uc.imei != null) put("imei", uc.imei) else uc.serialNumber?.let { put("serialNumber", it) }
    }
    put("problem", problem.trim())
    put("agreedPrice", JsonPrimitive(parseMoney(price)))
    put("warrantyDays", warranty.trim().toIntOrNull() ?: 0)
    notes.trim().takeIf { it.isNotEmpty() }?.let { put("notes", it) }
    if (masterMode == MasterMode.OWN) {
        masterUserId?.let { put("masterUserId", it) }
    } else if (outName.isNotBlank()) {
        put("outsideMasterName", outName.trim())
        outPhone.trim().takeIf { it.isNotEmpty() }?.let { put("outsideMasterPhone", it) }
        outCost.trim().toBigDecimalOrNull()?.let { put("outsideCost", JsonPrimitive(it)) }
    }
}
