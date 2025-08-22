import { defineNuxtPlugin } from '#app'
import { useFirebaseApp } from 'vuefire'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

export default defineNuxtPlugin(() => {
  const app = useFirebaseApp()
  const auth = getAuth(app)
  const user = useState<{uid:string;displayName:string|null;photoURL:string|null}|null>('user', () => null)

  const u = auth.currentUser
  user.value = u ? { uid: u.uid, displayName: u.displayName, photoURL: u.photoURL } : null

  onAuthStateChanged(auth, (newUser) => {
    user.value = newUser ? { uid: newUser.uid, displayName: newUser.displayName, photoURL: newUser.photoURL } : null
  })
})
