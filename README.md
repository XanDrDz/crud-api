## CRUD API

This is a simple CRUD (Create, Read, Update, Delete) API built with Node.js and TypeScript. It allows you to manage users by performing various operations such as creating a new user, retrieving user information, updating user details, and deleting a user.

### Prerequisites

Make sure you have the following installed on your system:

- Node.js
- npm (Node Package Manager)

### Installation

1. Clone the repository or download the source code.
2. Navigate to the project directory in your terminal.
3. Run the following command to install the dependencies:

```shell
npm install
```

### Configuration

1. Create a `.env` file in the project root directory.
2. Set the `PORT` variable in the `.env` file to specify the desired server port (e.g., `PORT=3000`).

### Usage

To start the API server, run the following command:

```shell
npm run start:dev - dev mode
npm run start:prod - prod mode
npm run start:multi - mode with balancer
```

The server will start running on the specified port, and you will see a console log message indicating the port number.

#### API Endpoints

- **GET /api/users**: Retrieve a list of all users.
- **GET /api/users/{id}**: Retrieve user information by ID.
- **POST /api/users**: Create a new user. Provide the user details (username, age, and optional hobbies) in the request body.
- **PUT /api/users/{id}**: Update user details by ID. Provide the updated user details (username, age, and/or hobbies) in the request body.
- **DELETE /api/users/{id}**: Delete a user by ID.

Note: Replace `{id}` with the actual ID of the user.

### Testing

To run the tests, use the following command:

```shell
npm test
```

### License

This project is licensed under the ISC License.