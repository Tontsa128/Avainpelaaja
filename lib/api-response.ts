export function jsonError(message: string, status = 400, details?: unknown) {
  return Response.json(
    { ok: false, error: message, ...(details === undefined ? {} : { details }) },
    { status },
  );
}

export function handleApiError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "ORGANIZATION_REQUIRED") return jsonError("Organization scope is required.", 401);
    if (error.message === "ORGANIZATION_NOT_FOUND") return jsonError("Organization not found.", 404);
  }
  console.error(error);
  return jsonError("Internal server error.", 500);
}
