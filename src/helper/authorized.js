export function isAuthorized(auth, env) {
	return auth === `Bearer ${env.INTERNAL_SECRET}`;
}
