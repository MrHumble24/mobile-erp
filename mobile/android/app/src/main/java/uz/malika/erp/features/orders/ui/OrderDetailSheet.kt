package uz.malika.erp.features.orders.ui

import android.content.Intent
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
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
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.core.net.toUri
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import uz.malika.erp.AppContainer
import uz.malika.erp.app.LocalCan
import uz.malika.erp.features.orders.data.OrdersRepository
import uz.malika.erp.features.orders.data.StorefrontOrderDetail
import uz.malika.erp.features.orders.data.StorefrontOrderStatusHistoryView
import uz.malika.erp.features.orders.lib.OrderRules
import uz.malika.erp.features.orders.lib.OrderStatusAction
import uz.malika.erp.features.orders.lib.orderSpecLine
import uz.malika.erp.features.orders.model.OrderDetailViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatDateTime
import uz.malika.erp.shared.ui.AppConfirmDialog
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/** One storefront order in full: header, customer note, who handled it, status
 *  history, and the status actions the server rules allow (`order.manage`). */
@Composable
fun OrderDetailSheet(container: AppContainer, repo: OrdersRepository, id: String, onClosed: () -> Unit) {
    val t = LocalT.current
    val vm: OrderDetailViewModel = viewModel(key = "order-$id", factory = viewModelFactory { initializer { OrderDetailViewModel(repo, id) } })
    val state by vm.state.collectAsState()
    val canManage = LocalCan.current("order.manage")
    var pending by remember { mutableStateOf<OrderStatusAction?>(null) }

    LaunchedEffect(state.notFound) {
        if (state.notFound) {
            container.toaster.error(t("orders.notFoundMessage", null))
            onClosed()
        }
    }

    val order = state.order
    Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(Tokens.Space.gutter)) {
        when {
            state.loading -> Loading()
            order == null -> Text(state.error ?: t("common.error", null), color = Tokens.danger)
            else -> {
                OrderHeader(order, onPhoneCopied = { container.toaster.info(t("orders.phoneCopied", null)) })
                order.note?.takeIf { it.isNotBlank() }?.let {
                    Spacer(Modifier.height(Tokens.Space.md))
                    Labelled(t("orders.note", null), it)
                }
                order.handledByName?.let {
                    Spacer(Modifier.height(Tokens.Space.md))
                    Labelled(t("orders.handledBy", null), it + (order.handledAt?.let { at -> " · ${formatDateTime(at)}" } ?: ""))
                }
                if (canManage) {
                    val actions = OrderRules.allowedActions(order.statusCode, true)
                    if (actions.isNotEmpty()) {
                        Spacer(Modifier.height(Tokens.Space.md))
                        StatusActions(actions, enabled = !state.busy) { pending = it }
                    }
                }
                Spacer(Modifier.height(Tokens.Space.md))
                Text(t("orders.history", null), style = MaterialTheme.typography.titleMedium, color = Tokens.text)
                Spacer(Modifier.height(Tokens.Space.sm))
                order.history.forEach { HistoryRow(it) }
                state.error?.takeIf { !state.notFound }?.let {
                    Spacer(Modifier.height(Tokens.Space.sm))
                    Text(it, color = Tokens.danger, style = MaterialTheme.typography.bodySmall)
                }
            }
        }
    }

    pending?.let { action ->
        AppConfirmDialog(
            title = t(actionLabelKey(action), null),
            message = t(actionConfirmKey(action), null),
            confirmLabel = t(actionLabelKey(action), null),
            cancelLabel = t("common.cancel", null),
            destructive = action == OrderStatusAction.CANCEL,
            onConfirm = {
                val target = OrderRules.targetStatus(action)
                pending = null
                vm.changeStatus(target) { container.toaster.success(t("orders.statusUpdated", null)) }
            },
            onDismiss = { pending = null },
        )
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun OrderHeader(order: StorefrontOrderDetail, onPhoneCopied: () -> Unit) {
    val t = LocalT.current
    val context = LocalContext.current
    val clipboard = LocalClipboardManager.current
    Text(order.customerName, style = MaterialTheme.typography.titleLarge, color = Tokens.text)
    Spacer(Modifier.height(Tokens.Space.rowV))
    StatusChip(t(orderStatusLabelKey(order.statusCode), null), color = orderStatusColor(order.statusCode))
    Spacer(Modifier.height(Tokens.Space.sm))
    Text(
        order.customerPhone,
        style = MaterialTheme.typography.bodyLarge.copy(fontFamily = MonoFamily, fontWeight = FontWeight.SemiBold),
        color = Tokens.info,
        modifier = Modifier.combinedClickable(
            onClick = { context.startActivity(Intent(Intent.ACTION_DIAL, "tel:${order.customerPhone}".toUri())) },
            onLongClick = {
                clipboard.setText(AnnotatedString(order.customerPhone))
                onPhoneCopied()
            },
        ),
    )
    Spacer(Modifier.height(Tokens.Space.xs))
    Text("${order.brand} ${order.productName.ifBlank { order.modelName }}".trim(), style = MaterialTheme.typography.bodyMedium, color = Tokens.text)
    orderSpecLine(order.specs)?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.muted) }
    Text(order.storeName, style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
    Text(formatDateTime(order.createdAt), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
}

@Composable
private fun StatusActions(actions: List<OrderStatusAction>, enabled: Boolean, onPick: (OrderStatusAction) -> Unit) {
    val t = LocalT.current
    Column(Modifier.fillMaxWidth()) {
        actions.forEach { action ->
            PillButton(
                t(actionLabelKey(action), null),
                { onPick(action) },
                Modifier.fillMaxWidth(),
                variant = if (action == OrderStatusAction.CANCEL) ButtonVariant.DESTRUCTIVE else ButtonVariant.DEFAULT,
                enabled = enabled,
            )
            Spacer(Modifier.height(Tokens.Space.rowV))
        }
    }
}

@Composable
private fun HistoryRow(h: StorefrontOrderStatusHistoryView) {
    Column(Modifier.fillMaxWidth().padding(vertical = Tokens.Space.xs)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            StatusChip(h.toStatusLabel, color = orderStatusColor(h.toStatusCode))
            Text(formatDateTime(h.changedAt), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
        }
        h.changedByName?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.muted) }
        h.note?.takeIf { it.isNotBlank() }?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.text) }
    }
}

@Composable
private fun Labelled(label: String, value: String) {
    Column(Modifier.fillMaxWidth()) {
        Text(label, style = MaterialTheme.typography.labelSmall, color = Tokens.muted)
        Text(value, style = MaterialTheme.typography.bodyMedium, color = Tokens.text)
    }
}

private fun actionLabelKey(action: OrderStatusAction): String = when (action) {
    OrderStatusAction.MARK_CONTACTED -> "orders.actionMarkContacted"
    OrderStatusAction.MARK_DONE -> "orders.actionMarkDone"
    OrderStatusAction.CANCEL -> "orders.cancelOrder"
}

private fun actionConfirmKey(action: OrderStatusAction): String = when (action) {
    OrderStatusAction.MARK_CONTACTED -> "orders.confirmContacted"
    OrderStatusAction.MARK_DONE -> "orders.confirmDone"
    OrderStatusAction.CANCEL -> "orders.confirmCancel"
}
