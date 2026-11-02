package uz.malika.erp.features.procurement.model

import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import uz.malika.erp.AppContainer
import uz.malika.erp.features.procurement.data.ProcurementRepository
import uz.malika.erp.features.procurement.data.ProcurementService

/** One repository per screen entry, wired to the shared Retrofit. */
@Composable
fun rememberProcurementRepository(container: AppContainer): ProcurementRepository =
    remember(container) {
        ProcurementRepository(container.retrofit.create(ProcurementService::class.java))
    }

/** `viewModel(factory = …)` sugar so each screen builds its own ViewModel. */
inline fun <reified VM : ViewModel> procurementVmFactory(
    crossinline create: () -> VM,
): ViewModelProvider.Factory = viewModelFactory { initializer { create() } }
