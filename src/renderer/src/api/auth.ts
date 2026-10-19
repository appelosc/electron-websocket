// alla api filer som fanns på frontend finns nu i denna fil där jag exporterar dem och kopplar till de som finns i preload
// gör på detta viss så Pages har så små ändringar som möjligt och kan använda samma funktionsnamn

export const loginUser = (username: string, password: string) =>
  window.api.loginUser(username, password)
export const logout = () => window.api.logOut()
export const refreshUser = () => window.api.refreshUser()
export const clearSession = () => window.api.clearSession()
export const hasToken = () => window.api.hasToken()
