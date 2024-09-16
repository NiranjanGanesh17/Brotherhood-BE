import { ConversationChain,LLMChain } from "langchain/chains";
import { OpenAI } from 'openai';
import axios from "axios"
import { HfInference } from "@huggingface/inference";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ChatOpenAI } from "@langchain/openai";
// import {HumanChatMessage} from "@langchain/schema"
import { StringOutputParser } from "@langchain/core/output_parsers";
import { HumanMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import Kinds from "../models/kinds.model.js";


// Initialize Hugging Face Inference with your API key
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);


const getWeather = async (place) => {

    const forecast = await axios.get(`https://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API_KEY}&q=${place}&days=1&aqi=no&alerts=no`)

    return forecast
}

export const  postKinds = async (req,res)=>{
  const kindsData = req.body.kindsData
  Kinds.insertMany(kindsData.map(kind => ({ ...kind, selectionCount: 0 })))
  .then(() => {
    console.log("Kinds inserted successfully!");
    res.json({message:"Kinds inserted successfully"})
  })
  .catch(error => {
    console.error("Error inserting kinds:", error);
    res.status(500).json({error:error.message})
  });
}

export const getKinds = async (req,res)=>{
    const kinds = await Kinds.find()
    res.json({kinds})
}

const getPlace = async (lat,lon,kinds)=>{
    const places = await axios.get(`https://api.opentripmap.com/0.1/en/places/radius?radius=5000000&lon=77.58554024958353&lat=12.98992282187093&kinds=historic%2Ccultural&apikey=${process.env.OPENTRIPMAP_API_KEY}`)
    return places
}

export const askQuestion = async (req, res) => {
  try {
    const userPrompt = req.body.prompt || "Plan a two-day trip to Madurai";
    console.log(userPrompt, "userPrompt");

 

    // Send back the generated response
    const weather = await getWeather("Bengaluru")
    const places = await getPlace()
    const genAI = new GoogleGenerativeAI(process.env.GEN_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Plan a trip based on this weather data Temperature: ${weather.data.forecast.forecastday[0].day.avgtemp_f},Conditions :${weather.data.forecast.forecastday[0].day.condition.text},Humidity: ${weather.data.forecast.forecastday[0].day.avghumidity},Wind Speed: ${weather.data.forecast.forecastday[0].day.maxwind_kph} for today in this city ${weather.data.location.name}`;
    console.log(prompt, "prompt")
    const result = await model.generateContent(prompt);
    console.log(result.response.text());



   const LmodelResponse = await hf.textGeneration({
      model: 'google/flan-t5-large',
      inputs: `Give me a hourly condition analysis in a friendly manner based on this weather information: ${weather.data.forecast.forecastday[0]}`,
    });

    console.log(LmodelResponse, "LmodelResponse");


    res.json({ answer: result.response.text()});
  } catch (error) {
    console.log(error, "err");
    res.status(500).json({ error: error.message });
  }
};
