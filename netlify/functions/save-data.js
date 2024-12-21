const { getStore } = require('@netlify/blobs');

exports.handler = async function(event, context) {
    // CORS Headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Handle OPTIONS request for CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers
        };
    }

    // Only allow POST
    if (event.httpMethod !== "POST") {
        return { 
            statusCode: 405, 
            headers,
            body: "Method Not Allowed" 
        };
    }

    try {

        

        const data = JSON.parse(event.body);
        
        // Validate Prolific data
        if (!data.prolific_pid || !data.study_id || !data.session_id) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: "Missing Prolific parameters",
                    details: "Required: prolific_pid, study_id, session_id"
                })
            };
        }

        // Get store for your experiment
        const store = getStore({
            siteID: process.env.WEBSITE_ID,
            token: process.env.MYPERSONALKEY
        });
        
        // Create unique key for this participant's data
        const key = `${data.prolific_pid}_${Date.now()}`;
        
        // Add server timestamp and metadata
        const dataToStore = {
            ...data,
            server_timestamp: new Date().toISOString(),
            netlify_context: {
                function_version: context.functionVersion,
                deploy_id: context.deployId
            }
        };
        
        // Store the data
        await store.set(key, dataToStore);

        // Return success
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true,
                message: "Data saved successfully",
                key: key
            })
        };
    } catch (error) {
        console.error('Error saving data:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: "Error saving data",
                message: error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
};