export function createClient() {
      return {
        auth: {
          async getSession() {
            return { data: { session: { access_token: "test-token" } } };
          }
        }
      };
    }
