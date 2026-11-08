# Spec Delta

## ADDED Requirements

### Requirement: Password reset request

The system SHALL accept `POST /api/v1/auth/password-reset` with an email and CSRF. When the email matches a user, it MUST store only a hash of a one-use token that expires in one hour and send exactly one email containing the raw token or a reset link. Known and unknown emails MUST return the same success response shape. An unknown email MUST NOT send mail.

#### Scenario: Known email receives a reset message

- **WHEN** a client posts a registered email to `POST /api/v1/auth/password-reset` with CSRF
- **THEN** the response is HTTP 200 with the same body shape used for unknown emails
- **AND** the mailer is invoked once to that address
- **AND** the message contains a reset token or link

#### Scenario: Unknown email is indistinguishable

- **WHEN** a client posts an unregistered email to `POST /api/v1/auth/password-reset` with CSRF
- **THEN** the response is HTTP 200 with the same body shape as a known email
- **AND** the mailer is not invoked

### Requirement: Password reset completion

The system SHALL accept a one-use token and a new password (minimum 12 characters) on `POST /api/v1/auth/password-reset/confirm` with CSRF. A valid token MUST update the password, mark the token used, revoke existing sessions for that user, and issue a new session so the user is signed in. A reused or expired token MUST return 410 or 400.

#### Scenario: Successful reset signs the user in

- **WHEN** a client confirms a valid unused token with a new password of at least 12 characters
- **THEN** the response is HTTP 200
- **AND** the user can authenticate with the new password
- **AND** a prior session cookie is rejected

#### Scenario: Reused or expired token is rejected

- **WHEN** a client submits a token that was already used or is past its expiry
- **THEN** the system responds with 410 or 400
- **AND** the password is unchanged
