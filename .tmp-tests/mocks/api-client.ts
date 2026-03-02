export class ApiError extends Error {
      constructor({ status, message }) {
        super(message);
        this.status = status;
      }
    }

    export async function apiFetchJson(_operation, path, init = {}) {
      const response = await fetch(path, init);
      return JSON.parse(await response.text());
    }
