# Example of using LiteAPI to create a webapp

## Install

1. Install Node.js from https://nodejs.org/en/download/
2. Run `npm install` to install the dependencies.

## Run

1. Create a `.env` file in the root directory with your API keys:
   ```
   SAND_API_KEY=your_sandbox_api_key_here
   PROD_API_KEY=your_production_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```
2. Run `npm run start` to start the server.
3. Access http://localhost:3000/ in your browser.

## Environment Variables

The application uses the following environment variables:

- `SAND_API_KEY`: LiteAPI sandbox key for testing
- `PROD_API_KEY`: LiteAPI production key for live bookings
- `OPENAI_API_KEY`: OpenAI API key for AI-powered features (optional)

If no API keys are provided, the application will run in demo mode with sample data.

---

## Documentation

Access the [LiteAPI documentation](https://docs.liteapi.travel/reference/overview) to learn more about the API.
