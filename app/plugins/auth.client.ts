import { defineNuxtPlugin } from '#app'
import { useFirebaseApp } from 'vuefire'
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth'

export default defineNuxtPlugin(async () => {
  const app = useFirebaseApp()
  const auth = getAuth(app)
  await setPersistence(auth, browserLocalPersistence)

  const user = useState<{
    uid: string
    displayName: string | null
    photoURL: string | null
  } | null>('user', () => null)

  await new Promise<void>((resolve) => {
    onAuthStateChanged(auth, (newUser) => {
      user.value = newUser
        ? {
            uid: newUser.uid,
            displayName: newUser.displayName,
            photoURL: newUser.photoURL
          }
        : null
      resolve()
    })
  })
})
