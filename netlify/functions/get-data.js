const { getStore } = require('@netlify/blobs');

exports.handler = async function(event, context) {
    // Only allow GET
    if (event.httpMethod !== "GET") {
        return { 
            statusCode: 405, 
            body: "Method Not Allowed" 
        };
    }

    try {
        const store = getStore("brief-rc-responses");
        
        // List all keys (participant data files)
        const keys = await store.list();
        
        // Get all data
        const allData = await Promise.all(
            keys.map(async (key) => {
                try {
                    const data = await store.get(key);
                    return {
                        key,
                        ...data,
                        retrieval_success: true
                    };
                } catch (error) {
                    console.error(`Error retrieving data for key ${key}:`, error);
                    return {
                        key,
                        retrieval_success: false,
                        error: error.message
                    };
                }
            })
        );

        // Count successful retrievals
        const successCount = allData.filter(d => d.retrieval_success).length;

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: allData,
                metadata: {
                    total_records: allData.length,
                    successful_retrievals: successCount,
                    timestamp: new Date().toISOString()
                }
            })
        };
    } catch (error) {
        console.error('Error retrieving data:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: "Error retrieving data",
                message: error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
};