import { computed } from 'vue'
import { textColor } from '../utils/color'

/** Theme of the general list (no category selected), stored as `defaultTheme` on the `users/{uid}` doc. */
export interface ListTheme {
  background?: string | null
  /** Firebase Storage path of the background image. */
  image?: string | null
}

/**
 * The page theme: the selected category's background and image, or the general list's
 * `defaultTheme` when no category is selected.
 */
export function useTheme() {
  const categories = useState<{ id?: string, background?: string, image?: string }[]>('categories', () => [])
  const activeCategoryId = useState<string>('activeCategoryId', () => '')
  const defaultTheme = useState<ListTheme>('defaultTheme', () => ({}))

  const theme = computed<ListTheme>(() => {
    const category = categories.value.find(c => c.id === activeCategoryId.value)
    return category ? { background: category.background, image: category.image } : defaultTheme.value
  })
  // Text drawn straight on the page background: white over a photo, otherwise contrasted with the color.
  const themeTextColor = computed(() => {
    const { background, image } = theme.value
    return image ? '#fff' : background ? textColor(background) : undefined
  })

  return { theme, themeTextColor }
}
