import { onScopeDispose, ref, watch } from 'vue'
import { useFirebaseApp } from 'vuefire'
import { collection, getFirestore, onSnapshot } from 'firebase/firestore'
import type { Preset } from '../utils/presets'

/** Error text for a failed preset read/write; a permission error means the Firestore rules lack the presets rule (see README). */
export function presetError(cause: unknown, action: string) {
  return (cause as { code?: string } | null)?.code === 'permission-denied'
    ? `${action} Firestore security rules don't allow the presets collection yet.`
    : `${action} Please try again.`
}

/** Live list of the signed-in user's presets (`users/{uid}/presets`), sorted by title. */
export function usePresets() {
  const user = useState<{ uid: string } | null>('user', () => null)
  const db = getFirestore(useFirebaseApp())
  const presets = ref<Preset[]>([])
  const loaded = ref(false)
  const error = ref('')
  let off: (() => void) | undefined
  const stop = () => { off?.(); off = undefined }

  watch(user, u => {
    stop()
    presets.value = []
    loaded.value = false
    error.value = ''
    if (!u) return
    off = onSnapshot(collection(db, 'users', u.uid, 'presets'), snap => {
      presets.value = snap.docs
        .map(d => {
          const data = d.data()
          return { id: d.id, title: String(data.title ?? ''), tasks: Array.isArray(data.tasks) ? data.tasks : [] }
        })
        .sort((a, b) => a.title.localeCompare(b.title))
      loaded.value = true
    }, cause => {
      error.value = presetError(cause, 'Could not load presets.')
      loaded.value = true
    })
  }, { immediate: true })
  onScopeDispose(stop)

  return { presets, loaded, error, db }
}
