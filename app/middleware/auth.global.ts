export default defineNuxtRouteMiddleware((to) => {
  const user = useState<{uid:string}|null>('user')
  if (to.path.startsWith('/share')) return
  if (!user.value && to.path !== '/login') {
    return navigateTo('/login')
  }
  if (user.value && to.path === '/login') {
    return navigateTo('/')
  }
})
