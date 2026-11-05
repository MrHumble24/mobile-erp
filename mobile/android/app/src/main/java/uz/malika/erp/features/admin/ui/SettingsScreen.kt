package uz.malika.erp.features.admin.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import kotlinx.coroutines.launch
import uz.malika.erp.AppContainer
import uz.malika.erp.core.AppException
import uz.malika.erp.features.admin.data.SettingsForm
import uz.malika.erp.features.admin.data.StoreSettingsDto
import uz.malika.erp.features.admin.model.SettingsViewModel
import uz.malika.erp.features.admin.model.adminViewModelFactory
import uz.malika.erp.features.admin.model.validateSettings
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens
import androidx.compose.foundation.layout.Arrangement

/** Mutable state for the settings form, seeded from the server copy. */
class SettingsFormState(s: StoreSettingsDto) {
    var storeName by mutableStateOf(s.storeName ?: "")
    var storeAddress by mutableStateOf(s.storeAddress ?: "")
    var storePhone by mutableStateOf(s.storePhone ?: "")
    var receiptFooter by mutableStateOf(s.receiptFooter ?: "")
    var telegramChatId by mutableStateOf(s.telegramChatId ?: "")
    var closingTime by mutableStateOf(s.closingTime)
    var defaultWarrantyDays by mutableStateOf(s.defaultWarrantyDays.toString())
    var minMarginPercent by mutableStateOf(s.minMarginPercentStr)
    var lowStockThreshold by mutableStateOf(s.lowStockThreshold.toString())
    var defaultNasiyaDueDays by mutableStateOf(s.defaultNasiyaDueDays.toString())
    var overdueReminderDays by mutableStateOf(s.overdueReminderDays.toString())
    var discountsEnabled by mutableStateOf(s.discountsEnabled)
    var discountPercentAllowed by mutableStateOf(s.discountPercentAllowed)
    var discountAmountAllowed by mutableStateOf(s.discountAmountAllowed)
    var discountPresetsPercent by mutableStateOf(s.discountPresetsPercent.joinToString(", ") { trimNum(it) })
    var discountPresetsAmount by mutableStateOf(s.discountPresetsAmount.joinToString(", ") { trimNum(it) })
    var maxDiscountPercent by mutableStateOf(s.maxDiscountPercentStr)
    var customerCreditEnabled by mutableStateOf(s.customerCreditEnabled)
    var defaultCreditLimit by mutableStateOf(s.defaultCreditLimitStr)
    var shiftsEnabled by mutableStateOf(s.shiftsEnabled)

    fun toForm() = SettingsForm(
        storeName, storeAddress, storePhone, receiptFooter, telegramChatId,
        closingTime, defaultWarrantyDays, minMarginPercent, lowStockThreshold,
        defaultNasiyaDueDays, overdueReminderDays,
        discountsEnabled, discountPercentAllowed, discountAmountAllowed,
        discountPresetsPercent, discountPresetsAmount, maxDiscountPercent,
        customerCreditEnabled, defaultCreditLimit, shiftsEnabled,
    )
}

/** `5.0` → `5`, `7.5` → `7.5` for a tidy preset field. */
private fun trimNum(v: Double): String = if (v % 1.0 == 0.0) v.toInt().toString() else v.toString()

/** Store-settings screen: one form → `PUT /settings`. Online-only write. */
@Composable
fun SettingsScreen(container: AppContainer) {
    val factory = remember(container) { adminViewModelFactory(container) }
    val vm: SettingsViewModel = viewModel(factory = factory)
    val state by vm.state.collectAsStateWithLifecycle()
    val online by container.connectivity.online.collectAsStateWithLifecycle()

    AsyncContent(state, onRetry = vm::load) { settings ->
        SettingsForm(vm, settings, online)
    }
}

@Composable
private fun SettingsForm(vm: SettingsViewModel, settings: StoreSettingsDto, online: Boolean) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    val form = remember(settings) { SettingsFormState(settings) }
    val errors = validateSettings(form.toForm())
    var busy by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }
    var isError by remember { mutableStateOf(false) }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState())
            .padding(start = Tokens.Space.screenH, end = Tokens.Space.screenH, top = Tokens.Space.md, bottom = Tokens.Space.lg),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Column(Modifier.widthIn(max = 640.dp).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(Tokens.Space.lg)) {
            if (!online) Text(t("common.offline", null), style = MaterialTheme.typography.bodySmall, color = Tokens.warning)
            StoreIdentitySection(form)
            SalesSection(form, errors)
            DiscountsSection(form)
            CreditSettingsSection(form)
            ShiftsSettingsSection(form)
            NasiyaSection(form, errors)
            TelegramSection(form, errors)
            if (message != null) {
                Text(message!!, style = MaterialTheme.typography.bodySmall, color = if (isError) Tokens.danger else Tokens.success)
            }
            PillButton(
                text = if (busy) t("settings.saving", null) else t("common.save", null),
                enabled = online && !busy && !errors.hasError,
                modifier = Modifier.fillMaxWidth(),
                onClick = {
                    busy = true; message = null
                    scope.launch {
                        try {
                            vm.save(form.toForm())
                            isError = false; message = t("settings.settingsSaved", null)
                        } catch (e: AppException) {
                            isError = true; message = e.message
                        } finally {
                            busy = false
                        }
                    }
                },
            )
        }
    }
}
