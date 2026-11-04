package uz.malika.erp.shared.ui

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.DatePickerColors
import androidx.compose.material3.DatePickerDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Shape
import uz.malika.erp.ui.theme.Tokens

/**
 * One Warm Card palette for every Material date picker (DESIGN.md): white card
 * container, the selected day in the action orange with white text, today marked
 * by an action-orange ring, headline/weekday/year text from the neutral tokens,
 * the selected year chip in surface-2. Built once here and passed to all four
 * date-picker sites so none shows a stock Material calendar.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun warmDatePickerColors(): DatePickerColors = DatePickerDefaults.colors(
    containerColor = Tokens.card,
    titleContentColor = Tokens.muted,
    headlineContentColor = Tokens.text,
    weekdayContentColor = Tokens.muted,
    subheadContentColor = Tokens.muted,
    navigationContentColor = Tokens.text,
    yearContentColor = Tokens.text,
    currentYearContentColor = Tokens.action,
    selectedYearContentColor = Tokens.text,
    selectedYearContainerColor = Tokens.surface2,
    dayContentColor = Tokens.text,
    selectedDayContentColor = Tokens.onAction,
    selectedDayContainerColor = Tokens.action,
    todayContentColor = Tokens.action,
    todayDateBorderColor = Tokens.action,
    dayInSelectionRangeContentColor = Tokens.text,
    dayInSelectionRangeContainerColor = Tokens.surface2,
)

/** Shape for a date-picker dialog surface (DESIGN.md large radius). */
val DatePickerDialogShape: Shape = RoundedCornerShape(Tokens.Radius.large)
