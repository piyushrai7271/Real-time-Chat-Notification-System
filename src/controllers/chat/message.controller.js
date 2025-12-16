import Message from "../../models/chat/message.model.js";


const createConversation = async (req,res) =>{
    try {
        
    } catch (error) {
        console.error("Error in creating conversation :",error.Message);
        return res.status(500).json({
            success:false,
            Message:"Internal server Error"
        })
    }
}
const sendMessage = async (req,res) =>{}
const deleteMessage = async (req,res) =>{}
const updateMessage = async (req,res) =>{}
const fetchMessages = async (req,res) =>{}

export {
    createConversation,
    sendMessage,
    deleteMessage,
    updateMessage,
    fetchMessages
}