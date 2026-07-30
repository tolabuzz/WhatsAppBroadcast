import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isValidEmail, normalizeEmail } from "./db.js";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getOwnerEmail(req: VercelRequest): string {
  const header = req.headers["x-account-email"];
  const raw = Array.isArray(header) ? header[0] : header;
  if (!raw || !isValidEmail(raw)) {
    throw new ApiError(401, "Missing or invalid x-account-email header.");
  }
  return normalizeEmail(raw);
}

export function getIdParam(req: VercelRequest): string {
  const id = req.query.id;
  const value = Array.isArray(id) ? id[0] : id;
  if (!value) throw new ApiError(400, "Missing id parameter.");
  return value;
}

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void>;

export function withErrorHandling(handler: Handler): Handler {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      if (err instanceof ApiError) {
        res.status(err.status).json({ error: err.message });
        return;
      }
      console.error(err);
      res.status(500).json({ error: "Internal server error." });
    }
  };
}
