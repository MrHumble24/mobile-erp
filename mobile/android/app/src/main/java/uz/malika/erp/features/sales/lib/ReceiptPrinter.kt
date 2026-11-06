package uz.malika.erp.features.sales.lib

import android.content.Context
import android.print.PrintAttributes
import android.print.PrintManager
import android.webkit.WebView
import android.webkit.WebViewClient

/** One printed line: a left label with an optional right-aligned value. */
data class PrintRow(val left: String, val right: String? = null, val bold: Boolean = false)

/**
 * Sends a 58mm thermal-style receipt to the Android print framework (system
 * dialog → thermal printer or Save-as-PDF). Renders the receipt as narrow
 * monospace HTML in an offscreen [WebView] and prints it once laid out.
 *
 * ponytail: WebView + system print over raw ESC-POS bytes + Bluetooth pairing.
 * Upgrade to byte-level control (cut, drawer kick) only when a dedicated thermal
 * printer needs it.
 */
fun printReceipt(
    context: Context,
    jobName: String,
    title: String,
    header: List<String>,
    rows: List<PrintRow>,
    footer: List<String>,
    paperWidthMm: Int,
) {
    val width = if (paperWidthMm == 80) 80 else 58
    val html = buildHtml(title, header, rows, footer, width)
    val webView = WebView(context)
    webView.webViewClient = object : WebViewClient() {
        override fun onPageFinished(view: WebView, url: String) {
            val printManager = context.getSystemService(Context.PRINT_SERVICE) as? PrintManager ?: return
            val adapter = view.createPrintDocumentAdapter(jobName)
            printManager.print(
                jobName,
                adapter,
                PrintAttributes.Builder()
                    .setMediaSize(PrintAttributes.MediaSize.ISO_A6)
                    .build(),
            )
        }
    }
    webView.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null)
}

private fun buildHtml(
    title: String,
    header: List<String>,
    rows: List<PrintRow>,
    footer: List<String>,
    paperWidthMm: Int = 58,
): String {
    val body = StringBuilder()
    body.append("<div class='c b big'>").append(esc(title)).append("</div>")
    header.forEach { body.append("<div class='c'>").append(esc(it)).append("</div>") }
    body.append("<hr/>")
    rows.forEach { row ->
        val cls = if (row.bold) "row b" else "row"
        if (row.right == null) {
            body.append("<div class='$cls'>").append(esc(row.left)).append("</div>")
        } else {
            body.append("<div class='$cls kv'><span>").append(esc(row.left))
                .append("</span><span>").append(esc(row.right)).append("</span></div>")
        }
    }
    body.append("<hr/>")
    footer.forEach { body.append("<div class='c'>").append(esc(it)).append("</div>") }
    return """
        <!doctype html><html><head><meta charset="utf-8"/>
        <style>
          @page { size: ${paperWidthMm}mm auto; margin: 2mm; }
          body { font-family: monospace; font-size: 9pt; width: ${paperWidthMm - 4}mm; margin: 0; }
          .c { text-align: center; }
          .b { font-weight: bold; }
          .big { font-size: 11pt; }
          .row { padding: 1px 0; }
          .kv { display: flex; justify-content: space-between; }
          hr { border: none; border-top: 1px dashed #000; margin: 4px 0; }
        </style></head><body>$body</body></html>
    """.trimIndent()
}

private fun esc(s: String): String = s
    .replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
