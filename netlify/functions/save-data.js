const faunadb = require('faunadb');
const q = faunadb.query;

const client = new faunadb.Client({ // Initialize client outside the handler
  secret: process.env.FAUNADB_SERVER_KEY,
});

exports.handler = async (event) => {
  try {
    if (!client) {
      console.error("FaunaDB client not initialized.");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Server error. Please try again later." }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing request body." }),
      };
    }

    const data = JSON.parse(event.body);

    if (!data || !data.type || !data.payload) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid request body. Missing 'type' or 'payload'." }),
      };
    }

    if (data.type === 'response') {
      try {
        await client.query(q.Create(q.Collection('responses'), { data: data.payload }));
      } catch (faunaError) {
        console.error("FaunaDB error creating response:", faunaError);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "Database error saving response. Please try again later." }),
        };
      }
    } else if (data.type === 'participant') {
      try {
        const participantExists = await client.query(
          q.Exists(q.Match(q.Index('participants_by_participant_number'), data.payload.participant_number))
        );

        if (!participantExists) {
          await client.query(q.Create(q.Collection('participants'), { data: data.payload }));
        } else {
          console.log("Participant already exists.");
        }
      } catch (faunaError) {
        console.error("FaunaDB error creating participant:", faunaError);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "Database error saving participant. Please try again later." }),
        };
      }
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid data type." }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Data submitted successfully' }),
    };
  } catch (error) {
    console.error('General server error:', error); // Catch any unexpected server errors
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "A server error occurred. Please try again later." }),
    };
  }
};