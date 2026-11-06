package uz.malika.erp.features.sales.ui

import android.widget.Toast
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.sales.data.ReceiptData
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton

@Composable
internal fun PosReceiptSheet(data: ReceiptData, printEnabled: Boolean, paperWidthMm: Int, onNewSale: () -> Unit) {
    val t = LocalT.current
    val context = LocalContext.current
    val clipboard = LocalClipboardManager.current
    Column(Modifier.fillMaxWidth().padding(20.dp)) {
        ReceiptPaper(data, t)
        Spacer(Modifier.height(16.dp))
        PillButton(
            text = t("pos.copyCheque", null),
            onClick = {
                clipboard.setText(AnnotatedString(buildReceiptText(t, data)))
                Toast.makeText(context, t("pos.chequeCopied", null), Toast.LENGTH_SHORT).show()
            },
            modifier = Modifier.fillMaxWidth(),
            variant = ButtonVariant.OUTLINE,
        )
        if (printEnabled) {
            Spacer(Modifier.height(8.dp))
            PillButton(
                text = t("pos.printCheque", null),
                onClick = { printReceiptData(context, t, data, paperWidthMm) },
                modifier = Modifier.fillMaxWidth(),
                variant = ButtonVariant.OUTLINE,
            )
        }
        Spacer(Modifier.height(8.dp))
        PillButton(t("pos.newSale", null), onNewSale, Modifier.fillMaxWidth())
    }
}
