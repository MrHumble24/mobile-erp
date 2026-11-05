package uz.malika.erp.shared.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Image
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import coil3.request.ImageRequest
import coil3.request.crossfade
import coil3.compose.LocalPlatformContext
import uz.malika.erp.ui.theme.Tokens

/**
 * Draws a product's picture from its server [imageUrl] against the current API
 * [baseUrl]. The one place pictures are rendered (DRY): the till grid, the
 * product list and the product form all call it. Coil's default singleton loader
 * gives memory + disk caching, so the grid scrolls smoothly and a picture already
 * seen shows while offline. A null/blank url (or any load failure) draws a neutral
 * placeholder, never a broken image. The `/uploads` path is served without a
 * token (ADR 0031), so no auth header is attached.
 */
@Composable
fun ProductImage(
    imageUrl: String?,
    baseUrl: String,
    modifier: Modifier = Modifier,
    contentDescription: String? = null,
    cornerRadius: androidx.compose.ui.unit.Dp = Tokens.Radius.controls,
) {
    val shape = RoundedCornerShape(cornerRadius)
    val absolute = absoluteImageUrl(baseUrl, imageUrl)
    // The neutral placeholder sits behind: it shows when there is no picture and
    // stays visible while loading or if the load fails (the image covers it on
    // success). This avoids the stateful content slot and is robust offline.
    Box(modifier.clip(shape).background(Tokens.surface2), contentAlignment = Alignment.Center) {
        Icon(
            Icons.Outlined.Image,
            contentDescription = null,
            tint = Tokens.muted,
            modifier = Modifier.size(28.dp),
        )
        if (absolute != null) {
            val request = ImageRequest.Builder(LocalPlatformContext.current)
                .data(absolute)
                .crossfade(true)
                .build()
            AsyncImage(
                model = request,
                contentDescription = contentDescription,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop,
            )
        }
    }
}

/**
 * The absolute URL to fetch, or null when there is nothing to draw. An already
 * absolute `http(s)` url is returned as is; a server path such as
 * `/uploads/x.png` is joined onto [baseUrl]. Pure — unit-tested.
 */
fun absoluteImageUrl(baseUrl: String, imageUrl: String?): String? {
    val path = imageUrl?.trim().orEmpty()
    if (path.isEmpty()) return null
    if (path.startsWith("http://") || path.startsWith("https://")) return path
    val base = baseUrl.trim().trimEnd('/')
    if (base.isEmpty()) return null
    return base + (if (path.startsWith("/")) path else "/$path")
}
