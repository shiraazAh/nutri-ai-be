require("dotenv").config();
const express = require("express");
const OpenAI = require("openai");
const axios = require("axios");
const cors = require('cors')

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors())
app.use(express.json());
console.log(process.env)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/calories", async (req, res) => {
    const userQuery = req.body.query;

    if (!userQuery) {
        return res.status(400).json({ error: "Please provide a query." });
    }

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
                {
                    "role": "system",
                    content: "You are a nutrition assistant. You ONLY provide calorie and nutritional information. If the user asks anything unrelated to food, nutrition, or calories, politely refuse to answer. Return the response in JSON format with two fields: 'calories' (an object with each items calorie count) and 'content' (detailed nutrition info). Example format: { 'calories': {'rice': 300, 'curry': 200, 'mango juice': 100 }, 'content': 'Rice contains approximately 300 kcal, the curry contains about 200 kcal, and a mango juice has about 100 kcal. This meal provides a mix of carbohydrates from the rice, protein from the curry, and sugar from the mango juice.' }"
                }, 
                { role: "user", content: userQuery }
            ],
            max_tokens: 200
        });

        // Parse GPT response as JSON
        const aiResponse = response.choices[0].message.content;
        
        let calorieData;
        try {
            calorieData = JSON.parse(aiResponse); // Try parsing as JSON
        } catch (error) {
            console.error("Failed to parse AI response as JSON. Raw response:", aiResponse);
            return res.status(500).json({ error: "Failed to extract structured calorie data." });
        }

        // Ensure response has the expected fields
        if (!calorieData.calories || !calorieData.content) {
            return res.status(500).json({ error: "Invalid AI response format." });
        }

        // Send structured response
        res.json({
            calories: calorieData.calories,
            content: calorieData.content
        });

    } catch (error) {
        console.error("Error with OpenAI API:", error);
        res.status(500).json({ error: "Something went wrong with AI processing." });
    }
});

app.put("/calories", async (req, res) => {
    const id = req.body.id;
    const userId = req.body.userId;
    const totalCalories = req.body.totalCalories;
    const name = req.body.name;

    const url = "https://5k61f45u1b.execute-api.eu-west-1.amazonaws.com/calories";
    const data = {
        userId,
        totalCalories,
        name
    };

    try {
        const response = await axios.put(url, data);
        res.send(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error updating calories" });
    }
});

app.get("/calories/:id", async (req, res) => {
    const id = req.params.id;
    const url = `https://5k61f45u1b.execute-api.eu-west-1.amazonaws.com/calories/${id}`;

    try {
        const response = await axios(url);;
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error fetching calories" });
    }
});

/**
 * Start the server
 */
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});