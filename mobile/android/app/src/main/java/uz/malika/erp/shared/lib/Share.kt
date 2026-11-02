package uz.malika.erp.shared.lib

import android.content.Context
import android.content.Intent
import androidx.core.content.FileProvider
import java.io.File

/**
 * Writes [content] to a cache file and fires the system share sheet for it.
 * Used for CSV export (pair with [Csv]). The file lands in `cacheDir/exports`,
 * exposed through the app's `FileProvider` (authority `<appId>.fileprovider`,
 * see the manifest + `res/xml/file_paths.xml`), with a one-shot read grant.
 */
fun shareTextFile(
    context: Context,
    fileName: String,
    content: String,
    mimeType: String = "text/csv",
    chooserTitle: String = "",
) {
    val dir = File(context.cacheDir, "exports").apply { mkdirs() }
    val file = File(dir, fileName).apply { writeText(content) }
    val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)

    val send = Intent(Intent.ACTION_SEND).apply {
        type = mimeType
        putExtra(Intent.EXTRA_STREAM, uri)
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }
    context.startActivity(
        Intent.createChooser(send, chooserTitle).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
    )
}
