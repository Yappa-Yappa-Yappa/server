# Server Documentation

Backend documentation for the Yappa API and database services.

## Documents

- [API reference](./API.md) - endpoints, authentication, request formats, and response shapes

## Documentation guidelines

- Update `API.md` when an endpoint, request body, response, or authentication requirement changes.
- Keep secrets, tokens, passwords, and personal data out of examples.
- Use `/api` as the API base path unless the server configuration says otherwise.
- Document protected routes as requiring `Authorization: Bearer <access-token>`.

## Related guides

- [Server setup](../README.md)
- [Project setup](../../README.md)
