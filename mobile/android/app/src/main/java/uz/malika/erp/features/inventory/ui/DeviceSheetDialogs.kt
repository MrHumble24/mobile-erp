package uz.malika.erp.features.inventory.ui

import androidx.compose.runtime.Composable
import uz.malika.erp.features.inventory.data.DeviceDetail
import uz.malika.erp.features.inventory.data.PricingRepository
import uz.malika.erp.features.inventory.model.CatalogViewModel
import uz.malika.erp.features.inventory.model.DevicesViewModel
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.Toaster

/**
 * The device-sheet's modal editors (edit, unit expense, customs fee, prices),
 * split out of [DeviceSheet] to keep it under the 300-line limit. [onDismiss]
 * closes whichever one is open; [onChanged] reloads the detail after a save.
 */
@Composable
fun DeviceSheetDialogs(
    device: DeviceDetail,
    devicesVm: DevicesViewModel,
    catalogVm: CatalogViewModel,
    online: Boolean,
    toaster: Toaster,
    pricingRepo: PricingRepository,
    showEdit: Boolean,
    showExpense: Boolean,
    showCustomsFee: Boolean,
    showPrices: Boolean,
    onDismiss: () -> Unit,
    onChanged: () -> Unit,
) {
    if (showEdit) {
        AppBottomSheet(onDismiss = onDismiss) {
            EditDeviceSheet(
                device = device,
                devicesVm = devicesVm,
                catalogVm = catalogVm,
                online = online,
                onSaved = { onDismiss(); onChanged() },
            )
        }
    }
    if (showExpense) {
        AppBottomSheet(onDismiss = onDismiss) {
            EditExpenseSheet(
                device = device,
                devicesVm = devicesVm,
                online = online,
                toaster = toaster,
                onSaved = { onDismiss(); onChanged() },
            )
        }
    }
    if (showCustomsFee) {
        AppBottomSheet(onDismiss = onDismiss) {
            EditCustomsFeeSheet(
                device = device,
                devicesVm = devicesVm,
                online = online,
                toaster = toaster,
                onSaved = { onDismiss(); onChanged() },
            )
        }
    }
    if (showPrices) {
        AppBottomSheet(onDismiss = onDismiss) {
            UnitPricesSheet(
                deviceId = device.id,
                resolvedPrices = device.prices,
                repo = pricingRepo,
                online = online,
                onToast = { toaster.success(it) },
                onDismiss = { onDismiss(); onChanged() },
            )
        }
    }
}
